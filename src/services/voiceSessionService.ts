import { VoiceState, UserVoicePreferences } from "../types";
import { VoiceAudioPipeline } from "./voiceAudioPipeline";
import { voiceIdentityService, voiceEngineRegistry } from "./voiceIdentityService";

export interface VoiceSessionCallbacks {
  onStateChange: (state: VoiceState) => void;
  onVolumeChange: (volume: number) => void;
  onTranscriptChunk: (text: string, isModel: boolean) => void;
  onTtfa?: (ttfaMs: number) => void;
  onUserMessageComplete?: (content: string) => void;
  onAssistantMessageComplete?: (content: string) => void;
  onError: (errorMessage: string) => void;
  onCommand?: (command: "end_session" | "pause" | "resume") => void;
  onWakeWordDetected?: () => void;
}

// Wake words that trigger Angel's active attention
const WAKE_WORDS = [
  "hey angel",
  "hi angel",
  "hello angel",
  "ok angel",
  "okay angel",
  "wake up angel",
  "angel wake up",
  "angel",
];

// Sleep and end conversation commands
const SLEEP_WORDS = [
  "angel, end conversation",
  "angel end conversation",
  "end conversation",
  "end the conversation",
  "angel, go to sleep",
  "angel go to sleep",
  "go to sleep angel",
  "go to sleep",
  "angel, sleep",
  "angel sleep",
  "angel, stop listening",
  "angel stop listening",
  "stop listening",
  "angel, end session",
  "angel end session",
  "end session",
  "angel, end section",
  "angel end section",
  "end section",
  "angel, goodbye",
  "angel goodbye",
  "goodbye angel",
  "stop live",
  "end live",
  "exit live",
];

export class VoiceSessionService {
  private ws: WebSocket | null = null;
  private audioPipeline: VoiceAudioPipeline | null = null;
  private speechRecognition: any = null;
  private state: VoiceState = "idle";
  private callbacks: VoiceSessionCallbacks;
  private accumulatedUserTranscript: string = "";
  private accumulatedAssistantTranscript: string = "";
  private isMuted: boolean = false;
  private isPaused: boolean = false;
  private userTurnDebounceTimer: any = null;
  private isProcessingVoiceTurn: boolean = false;

  constructor(callbacks: VoiceSessionCallbacks) {
    this.callbacks = callbacks;
  }

  getState(): VoiceState {
    return this.state;
  }

  private setState(newState: VoiceState) {
    this.state = newState;
    this.callbacks.onStateChange(newState);
  }

  /**
   * Check if text contains a sleep / end conversation command
   */
  private checkSleepCommands(text: string): boolean {
    const clean = text.toLowerCase().trim().replace(/[.,!?;:]/g, "");
    for (const cmd of SLEEP_WORDS) {
      if (clean === cmd || clean.includes(cmd)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Robust regex-based wake word detection
   * Detects "Hey Angel", "Hi Angel", "Hello Angel", "Angel", "Okay Angel", etc.
   */
  private checkWakeWords(text: string): { isWake: boolean; remainingText: string; isSoleWakeWord: boolean } {
    const clean = text.trim();
    if (!clean) return { isWake: false, remainingText: "", isSoleWakeWord: false };

    const lower = clean.toLowerCase();

    // Direct regex matching for wake words at beginning or standalone
    const wakeRegex = /^(?:hey|hi|hello|ok|okay|wake up|yo)?\s*angel\b/i;
    const match = lower.match(wakeRegex);
    if (match) {
      const matchLen = match[0].length;
      const after = clean.slice(matchLen).replace(/^[,\s.!?:;-]+/, "").trim();
      return { isWake: true, remainingText: after, isSoleWakeWord: after.length === 0 };
    }

    // Also detect direct addressing anywhere
    if (/\bangel\b/i.test(lower)) {
      const after = clean.replace(/^(?:.*?)\b(?:hey|hi|hello|ok|okay)?\s*angel[,\s.!?:]*/i, "").trim();
      return { isWake: true, remainingText: after, isSoleWakeWord: after.length === 0 };
    }

    return { isWake: false, remainingText: clean, isSoleWakeWord: false };
  }

  /**
   * Start Live Voice Session
   */
  async start(preferences: UserVoicePreferences, userName?: string): Promise<void> {
    try {
      this.setState("reconnecting");
      this.accumulatedUserTranscript = "";
      this.accumulatedAssistantTranscript = "";
      this.isPaused = false;
      this.isProcessingVoiceTurn = false;

      // 1. Initialize Web Audio Pipeline (16kHz capture, 24kHz playback)
      this.audioPipeline = new VoiceAudioPipeline();
      await this.audioPipeline.startRecording(
        (base64Pcm: string) => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN && !this.isPaused && !this.isMuted) {
            this.ws.send(JSON.stringify({ type: "audio", data: base64Pcm }));
          }
        },
        (volume: number) => {
          this.callbacks.onVolumeChange(volume);
        }
      );

      // 2. Start client-side speech recognition for real-time natural conversational capture
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const rec = new SpeechRecognitionClass();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = preferences.language && preferences.language !== "auto" ? preferences.language : "en-US";

          rec.onresult = (event: any) => {
            if (this.isMuted || this.isPaused || this.state === "speaking") return;

            let interim = "";
            let finalTurn = "";

            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const text = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                finalTurn += text + " ";
              } else {
                interim += text;
              }
            }

            const currentSpoken = (finalTurn + interim).trim();
            if (currentSpoken) {
              this.accumulatedUserTranscript = currentSpoken;
              this.callbacks.onTranscriptChunk(currentSpoken, false);

              // 1. Check for sleep / end conversation commands
              if (this.checkSleepCommands(currentSpoken)) {
                console.log("[VoiceSession] Sleep command detected:", currentSpoken);
                if (this.userTurnDebounceTimer) {
                  clearTimeout(this.userTurnDebounceTimer);
                  this.userTurnDebounceTimer = null;
                }
                this.callbacks.onCommand?.("end_session");
                return;
              }

              // 2. Check for wake word
              const wakeCheck = this.checkWakeWords(currentSpoken);
              if (wakeCheck.isWake) {
                this.callbacks.onWakeWordDetected?.();
                if (wakeCheck.isSoleWakeWord) {
                  // Sole wake word greeted - respond immediately
                  if (this.userTurnDebounceTimer) clearTimeout(this.userTurnDebounceTimer);
                  this.userTurnDebounceTimer = setTimeout(() => {
                    this.callbacks.onAssistantMessageComplete?.("Hey! I'm listening. How can I help you?");
                    this.accumulatedUserTranscript = "";
                  }, 400);
                  return;
                }
              }

              // 3. Debounce natural conversational turn dispatch (750ms of quietness for active, responsive feeling)
              if (this.userTurnDebounceTimer) {
                clearTimeout(this.userTurnDebounceTimer);
              }
              this.userTurnDebounceTimer = setTimeout(async () => {
                if (this.accumulatedUserTranscript.trim() && !this.isProcessingVoiceTurn) {
                  const cleanedText = wakeCheck.remainingText || this.accumulatedUserTranscript.trim();
                  this.isProcessingVoiceTurn = true;

                  // Speaker recognition check
                  const voiceIdentity = voiceIdentityService.getSettings();
                  if (voiceIdentity.respondOnlyToMyVoice) {
                    const rawPcm = this.audioPipeline?.getRecentPcm();
                    const engine = voiceEngineRegistry.getEngine(voiceIdentity.providerId);
                    const characteristics = rawPcm && rawPcm.length > 8000
                      ? await engine.extractVoiceCharacteristics(rawPcm, 16000)
                      : {
                          pitchAvgHz: 165,
                          pitchRange: [120, 220] as [number, number],
                          spectralCentroidAvg: 1500,
                          harmonicRatio: 0.85,
                          mfccVector: [0.5, 0.4, 0.3, 0.2, 0.3, 0.4, 0.2, 0.1, 0.2, 0.1, 0.05, 0.05],
                          sampleDurationMs: 1500,
                          sampleCount: 1,
                        };

                    const verification = await voiceIdentityService.verifySpeaker(characteristics, cleanedText);

                    if (!verification.actionAllowed) {
                      this.accumulatedUserTranscript = "";
                      if (verification.rejectionReason === "unauthorized_sensitive_action") {
                        this.callbacks.onAssistantMessageComplete?.(
                          "Security Alert: This sensitive action requires authentication from the verified owner's voice."
                        );
                      } else if (verification.rejectionReason === "unknown_speaker") {
                        console.log("[VoiceSession] Unknown speaker ignored silently.");
                      } else if (verification.rejectionReason === "guest_mode_disabled") {
                        this.callbacks.onAssistantMessageComplete?.(
                          "I heard a voice, but Angel is currently locked to respond only to verified voices. You can enable Guest Mode in Voice Recognition settings."
                        );
                      }
                      setTimeout(() => {
                        this.isProcessingVoiceTurn = false;
                      }, 1500);
                      return;
                    }
                  }

                  this.callbacks.onUserMessageComplete?.(cleanedText);
                  this.accumulatedUserTranscript = "";
                  setTimeout(() => {
                    this.isProcessingVoiceTurn = false;
                  }, 1500);
                }
              }, 1400);
            }
          };

          rec.onerror = (e: any) => {
            if (e.error !== "no-speech" && e.error !== "aborted") {
              console.warn("[VoiceSession] STT notice:", e.error);
            }
          };

          rec.onend = () => {
            if (this.state !== "idle" && this.state !== "ended" && this.speechRecognition) {
              try {
                this.speechRecognition.start();
              } catch {
                // ignore
              }
            }
          };

          rec.start();
          this.speechRecognition = rec;
        } catch (sttErr) {
          console.warn("[VoiceSession] Speech recognition initialization skipped:", sttErr);
        }
      }

      // 3. Open WebSocket connection to /api/voice/live
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/api/voice/live`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.ws?.send(
          JSON.stringify({
            type: "init",
            config: {
              voiceId: preferences.voice_id,
              language: preferences.language,
              speakingSpeed: preferences.speaking_speed,
              userName,
            },
          })
        );
        this.setState("listening");
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "ready") {
            this.setState("listening");
          } else if (msg.type === "ttfa") {
            if (msg.ttfaMs && this.callbacks.onTtfa) {
              this.callbacks.onTtfa(msg.ttfaMs);
            }
          } else if (msg.type === "audio") {
            this.setState("speaking");
            this.audioPipeline?.playAudioChunk(msg.data);
          } else if (msg.type === "transcript") {
            this.accumulatedAssistantTranscript += msg.text;
            this.callbacks.onTranscriptChunk(this.accumulatedAssistantTranscript, true);
          } else if (msg.type === "turn_complete") {
            if (this.accumulatedAssistantTranscript.trim()) {
              this.callbacks.onAssistantMessageComplete?.(this.accumulatedAssistantTranscript.trim());
              this.accumulatedAssistantTranscript = "";
            }
            this.setState("listening");
          } else if (msg.type === "interrupted") {
            this.audioPipeline?.interruptPlayback();
            if (this.accumulatedAssistantTranscript.trim()) {
              this.callbacks.onAssistantMessageComplete?.(this.accumulatedAssistantTranscript.trim());
              this.accumulatedAssistantTranscript = "";
            }
            this.setState("interrupted");
            setTimeout(() => {
              if (this.state === "interrupted") {
                this.setState("listening");
              }
            }, 250);
          } else if (msg.type === "command") {
            if (msg.command === "end_session") {
              this.callbacks.onCommand?.("end_session");
              this.stop();
            } else if (msg.command === "pause") {
              this.pause();
            } else if (msg.command === "resume") {
              this.resume();
            }
          } else if (msg.type === "error") {
            console.warn("[VoiceSession] Live socket error notice:", msg.error);
            // Don't crash out; live conversation continues via client STT & streaming chat
            this.setState("listening");
          }
        } catch (parseErr) {
          console.error("[VoiceSession] Error parsing socket message:", parseErr);
        }
      };

      this.ws.onerror = (err) => {
        console.warn("[VoiceSession] WebSocket fallback active:", err);
        // Seamless fallback to Web Speech + Streaming Chat
        this.setState("listening");
      };

      this.ws.onclose = () => {
        if (this.state !== "idle" && this.state !== "ended") {
          // Socket closed; keep listening state active on speech recognition
          this.setState("listening");
        }
      };
    } catch (err: any) {
      console.error("[VoiceSession] Failed to start:", err);
      this.setState("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        this.callbacks.onError(
          "Microphone access was denied. Please allow microphone permissions to speak with Angel."
        );
      } else {
        this.callbacks.onError(err.message || "Failed to initialize microphone.");
      }
      this.stop();
    }
  }

  /**
   * Send text prompt into active live voice session
   */
  sendRealtimeText(text: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && text.trim()) {
      this.ws.send(JSON.stringify({ type: "text_input", text: text.trim() }));
      this.setState("processing");
    }
  }

  /**
   * Pause listening
   */
  pause(): void {
    this.isPaused = true;
    this.audioPipeline?.setMuted(true);
    this.setState("paused");
  }

  /**
   * Resume listening
   */
  resume(): void {
    this.isPaused = false;
    this.audioPipeline?.setMuted(this.isMuted);
    this.setState("listening");
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    this.audioPipeline?.setMuted(this.isMuted);
    return this.isMuted;
  }

  getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Cleanly stop voice session and return transcripts
   */
  stop(): { userTranscript: string; assistantTranscript: string } {
    const transcripts = {
      userTranscript: this.accumulatedUserTranscript.trim(),
      assistantTranscript: this.accumulatedAssistantTranscript.trim(),
    };

    if (this.userTurnDebounceTimer) {
      clearTimeout(this.userTurnDebounceTimer);
      this.userTurnDebounceTimer = null;
    }

    if (this.speechRecognition) {
      try {
        this.speechRecognition.stop();
      } catch {
        // ignore
      }
      this.speechRecognition = null;
    }

    if (this.ws) {
      try {
        if (this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: "close" }));
        }
        this.ws.close();
      } catch {
        // ignore
      }
      this.ws = null;
    }

    if (this.audioPipeline) {
      this.audioPipeline.stopRecording();
      this.audioPipeline = null;
    }

    this.setState("idle");
    return transcripts;
  }
}
