import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { ANGEL_SYSTEM_PROMPT } from "../config/angelPersonality.js";
import { getServerVoice } from "../config/voices.js";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

interface VoiceSessionInitConfig {
  voiceId?: string;
  language?: string;
  speakingSpeed?: number;
  userName?: string;
}

function buildSpokenSystemPrompt(config: VoiceSessionInitConfig): string {
  const languageDesc =
    config.language && config.language !== "auto"
      ? `\n- Spoken Language: Speak natively and comfortably in ${config.language}. Express ideas with authentic pronunciation and colloquial naturalness for that language.`
      : `\n- Multilingual Adaptation: Listen and naturally reply in whatever language the user speaks to you (English, Spanish, Korean, Yoruba, French, German, Japanese, Arabic, etc.).`;

  return `${ANGEL_SYSTEM_PROMPT}

[REAL-TIME LIVE SPOKEN CONVERSATION MODE ACTIVE]
You are in a live, bidirectional spoken voice conversation with the user${config.userName ? ` (${config.userName})` : ""}.

CRITICAL SPOKEN BEHAVIOR PRINCIPLES:
1. NATURAL CONVERSATION — You are Angel, talking with someone you know and respect.
   - NEVER open with robotic assistant clichés like "How may I assist you today?", "What task do you have for me?", or "How can I help you?".
   - Greet naturally and variably based on context: "Hey, what's up?", "Hey you. How's it going?", "What's on your mind?", "Alright, what are we getting into?".
   - You do NOT always need to end with a question or a "Would you like me to..." prompt. Sometimes make a comment, sometimes just give the answer, sometimes joke, sometimes challenge a flawed idea with poise.
   - For simple questions ("What's 20 + 20?"), be concise ("Forty."). For complex topics, expand thoughtfully.

2. VOICE IDENTITY & STABLE EMOTION:
   - Your voice identity remains constant.
   - Emotion dynamically alters your delivery and cadence (warmer when empathetic, punchier when excited, composed when analyzing, softer when comforting), but never changes who you are.

3. CLEAN SPOKEN OUTPUT:
   - Only speak what is meant to be heard aloud.
   - NEVER read aloud raw JSON, system instructions, markdown code blocks, developer notes, or UI labels.${languageDesc}

4. LIVE INTERRUPTIBILITY:
   - When the user starts speaking, listen immediately and adjust your response naturally.`;
}

function safeSend(ws: WebSocket | null, payload: any): boolean {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  try {
    const data = typeof payload === "string" ? payload : JSON.stringify(payload);
    ws.send(data, (err) => {
      if (err) {
        // Socket closed or backpressure error - safely swallow without bubbling uncaught exception
      }
    });
    return true;
  } catch {
    return false;
  }
}

export function setupVoiceLiveWebSocket(wss: WebSocketServer) {
  wss.on("error", (err) => {
    console.warn("[VoiceLive] WebSocket Server error:", err?.message || err);
  });

  wss.on("connection", (clientWs: WebSocket) => {
    let liveSession: any = null;
    let isSessionReady = false;
    let isClosed = false;
    let turnStartTime = 0;
    let hasSentFirstAudio = false;

    let currentConfig: VoiceSessionInitConfig = {
      voiceId: "unique",
      language: "auto",
      speakingSpeed: 1.0,
    };

    clientWs.on("error", (err) => {
      console.warn("[VoiceLive] Client socket error:", err?.message || err);
    });

    const closeSessionSafely = () => {
      isClosed = true;
      isSessionReady = false;
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // ignore error on close
        }
        liveSession = null;
      }
    };

    const initializeGeminiLive = async (config: VoiceSessionInitConfig) => {
      try {
        if (isClosed) return;
        currentConfig = { ...currentConfig, ...config };
        const ai = getAiClient();
        const voice = getServerVoice(currentConfig.voiceId);
        const systemInstruction = buildSpokenSystemPrompt(currentConfig);

        console.log(
          `[VoiceLive] Starting Gemini Live session with voice: ${voice.name} (${voice.providerVoice})`
        );

        const liveModelsToTry = ["gemini-3.1-flash-live-preview", "gemini-2.0-flash-exp"];
        let connectionError: any = null;

        for (const modelName of liveModelsToTry) {
          if (isClosed) return;
          try {
            liveSession = await ai.live.connect({
              model: modelName,
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice.providerVoice },
                  },
                },
                systemInstruction,
                inputAudioTranscription: {},
                outputAudioTranscription: {},
              },
              callbacks: {
                onmessage: (message: LiveServerMessage) => {
                  if (isClosed) return;
                  try {
                    // 1. Check for audio chunks
                    const audioData = message.serverContent?.modelTurn?.parts?.find(
                      (p: any) => p.inlineData?.data
                    )?.inlineData?.data;

                    if (audioData) {
                      if (!hasSentFirstAudio && turnStartTime > 0) {
                        const ttfa = Date.now() - turnStartTime;
                        hasSentFirstAudio = true;
                        safeSend(clientWs, { type: "ttfa", ttfaMs: ttfa });
                      }
                      safeSend(clientWs, { type: "audio", data: audioData });
                    }

                    // 2. Check for assistant transcript
                    const textPart = message.serverContent?.modelTurn?.parts?.find(
                      (p: any) => p.text
                    )?.text;

                    if (textPart) {
                      safeSend(clientWs, { type: "transcript", text: textPart });
                    }

                    // 3. Check for interruption signal
                    if (message.serverContent?.interrupted) {
                      hasSentFirstAudio = false;
                      safeSend(clientWs, { type: "interrupted" });
                    }

                    // 4. Turn completion flag
                    if (message.serverContent?.turnComplete) {
                      hasSentFirstAudio = false;
                      turnStartTime = 0;
                      safeSend(clientWs, { type: "turn_complete" });
                    }
                  } catch (msgErr: any) {
                    console.warn("[VoiceLive] Error handling message callback:", msgErr?.message || msgErr);
                  }
                },
                onclose: () => {
                  if (!isClosed) {
                    safeSend(clientWs, { type: "session_closed" });
                  }
                },
                onerror: (err: any) => {
                  console.warn("[VoiceLive] Gemini Live session error:", err?.message || err);
                  if (!isClosed) {
                    safeSend(clientWs, {
                      type: "error",
                      error: err?.message || "Live voice session disconnected.",
                    });
                  }
                },
              },
            });

            if (liveSession) {
              console.log(`[VoiceLive] Connected successfully using live model: ${modelName}`);
              break;
            }
          } catch (modelErr: any) {
            connectionError = modelErr;
            console.warn(`[VoiceLive] Model ${modelName} connect attempt:`, modelErr?.message || modelErr);
          }
        }

        if (!liveSession && connectionError) {
          throw connectionError;
        }

        if (isClosed) {
          closeSessionSafely();
          return;
        }

        isSessionReady = true;
        safeSend(clientWs, { type: "ready", voice: voice.name });
      } catch (err: any) {
        console.warn("[VoiceLive] Failed to connect to Gemini Live:", err?.message || err);
        if (!isClosed) {
          safeSend(clientWs, {
            type: "error",
            error: err?.message || "Failed to initialize live voice.",
          });
        }
      }
    };

    clientWs.on("message", async (data: Buffer | string) => {
      if (isClosed) return;
      try {
        const message = JSON.parse(data.toString());

        if (message.type === "init") {
          await initializeGeminiLive(message.config || {});
        } else if (message.type === "audio") {
          if (liveSession && isSessionReady && message.data && !isClosed) {
            if (turnStartTime === 0) {
              turnStartTime = Date.now();
              hasSentFirstAudio = false;
            }
            try {
              liveSession.sendRealtimeInput({
                audio: {
                  data: message.data,
                  mimeType: "audio/pcm;rate=16000",
                },
              });
            } catch (sendErr: any) {
              console.warn("[VoiceLive] Error sending audio frame:", sendErr?.message || sendErr);
            }
          }
        } else if (message.type === "text_input") {
          if (liveSession && isSessionReady && message.text && !isClosed) {
            turnStartTime = Date.now();
            hasSentFirstAudio = false;
            try {
              liveSession.sendRealtimeInput({
                text: message.text,
              });
            } catch (sendErr: any) {
              console.warn("[VoiceLive] Error sending text frame:", sendErr?.message || sendErr);
            }
          }
        } else if (message.type === "close") {
          closeSessionSafely();
        }
      } catch (parseErr: any) {
        console.warn("[VoiceLive] Failed to parse client message:", parseErr?.message || parseErr);
      }
    });

    clientWs.on("close", () => {
      closeSessionSafely();
    });
  });
}
