import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { VoiceState, UserVoicePreferences, VoiceConfig } from "../types";
import { DEFAULT_USER_VOICE_PREFERENCES, getVoiceById } from "../config/voices";
import { VoiceSessionService } from "../services/voiceSessionService";
import {
  fetchUserVoicePreferences,
  saveUserVoicePreferences,
  playVoiceSample,
  stopVoiceSample,
  speakAngelSpokenResponse,
} from "../services/voiceLibraryService";
import { useAuth } from "./AuthContext";
import { useConversation } from "./ConversationContext";

interface VoiceContextType {
  voiceState: VoiceState;
  isVoiceActive: boolean;
  isMuted: boolean;
  isPaused: boolean;
  currentVolume: number;
  selectedVoice: VoiceConfig;
  voiceSettings: UserVoicePreferences;
  liveTranscript: { user: string; assistant: string };
  error: string | null;
  isPlayingSample: string | null;
  lastTtfaMs: number | null;
  isVoiceLibraryOpen: boolean;
  wakeWordDetected: boolean;
  setIsVoiceLibraryOpen: (open: boolean) => void;
  selectVoice: (voiceId: string) => Promise<void>;
  updateVoiceSettings: (settings: Partial<UserVoicePreferences>) => Promise<void>;
  toggleMute: () => void;
  pauseVoice: () => void;
  resumeVoice: () => void;
  startVoiceSession: () => Promise<void>;
  stopVoiceSession: (withClosingFarewell?: boolean) => Promise<void>;
  sendLiveText: (text: string) => Promise<void>;
  speakResponse: (text: string) => Promise<void>;
  clearVoiceError: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { activeConversationId, startNewConversation, sendMessage, addLiveMessage } = useConversation();

  const [voiceSettings, setVoiceSettings] = useState<UserVoicePreferences>(DEFAULT_USER_VOICE_PREFERENCES);
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentVolume, setCurrentVolume] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<{ user: string; assistant: string }>({
    user: "",
    assistant: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPlayingSample, setIsPlayingSample] = useState<string | null>(null);
  const [lastTtfaMs, setLastTtfaMs] = useState<number | null>(null);
  const [isVoiceLibraryOpen, setIsVoiceLibraryOpen] = useState<boolean>(false);
  const [wakeWordDetected, setWakeWordDetected] = useState<boolean>(false);

  const sessionServiceRef = useRef<VoiceSessionService | null>(null);

  // Load user voice preferences on login / mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await fetchUserVoicePreferences(user?.id);
        setVoiceSettings(prefs);
      } catch (err) {
        console.warn("Failed to load voice preferences:", err);
      }
    };
    loadPreferences();
  }, [user]);

  const selectedVoice = getVoiceById(voiceSettings.voice_id);

  /**
   * Card-based voice selection interaction
   */
  const selectVoice = async (voiceId: string) => {
    const newVoice = getVoiceById(voiceId);
    const updated: UserVoicePreferences = {
      ...voiceSettings,
      voice_id: voiceId,
    };
    setVoiceSettings(updated);

    // Stop any live voice session or sample
    if (sessionServiceRef.current) {
      sessionServiceRef.current.stop();
    }
    stopVoiceSample();

    // Persist selection
    await saveUserVoicePreferences(user?.id, updated);

    // Automatically trigger short natural voice sample
    setIsPlayingSample(newVoice.id);
    try {
      const res = await playVoiceSample(newVoice, voiceSettings.language);
      if (res.ttfaMs > 0) {
        setLastTtfaMs(res.ttfaMs);
      }
    } catch (err) {
      console.warn("Voice sample playback failed:", err);
    } finally {
      setIsPlayingSample(null);
    }
  };

  const updateVoiceSettings = async (partial: Partial<UserVoicePreferences>) => {
    const updated: UserVoicePreferences = {
      ...voiceSettings,
      ...partial,
    };
    setVoiceSettings(updated);
    await saveUserVoicePreferences(user?.id, updated);
  };

  const clearVoiceError = () => setError(null);

  const stopVoiceSession = useCallback(async (withClosingFarewell: boolean = false) => {
    if (withClosingFarewell) {
      const farewellPhrases = [
        "Got it! Ending our conversation. Talk to you soon!",
        "Going to sleep now. Let me know whenever you need me!",
        "Alright, signing off. Have a great one!",
      ];
      const closingLine = farewellPhrases[Math.floor(Math.random() * farewellPhrases.length)];
      await addLiveMessage("assistant", closingLine, {
        modality: "voice",
        voice_id: selectedVoice.id,
      });
      playVoiceSample(selectedVoice, voiceSettings.language).catch(() => {});
    }

    if (sessionServiceRef.current) {
      sessionServiceRef.current.stop();
      sessionServiceRef.current = null;
    }
    stopVoiceSample();
    setVoiceState("idle");
    setIsMuted(false);
    setIsPaused(false);
    setCurrentVolume(0);
    setLiveTranscript({ user: "", assistant: "" });
  }, [addLiveMessage, selectedVoice, voiceSettings.language]);

  const speakResponse = useCallback(
    async (text: string) => {
      if (!text || !text.trim() || isMuted || isPaused) return;
      try {
        setVoiceState("speaking");
        await speakAngelSpokenResponse(
          text,
          selectedVoice,
          voiceSettings.language,
          () => setVoiceState("speaking"),
          (vol) => setCurrentVolume(vol),
          () => {
            setVoiceState("listening");
            setCurrentVolume(0);
          }
        );
      } catch (e) {
        console.warn("Speech response playback failed:", e);
        setVoiceState("listening");
        setCurrentVolume(0);
      }
    },
    [selectedVoice, voiceSettings.language, isMuted, isPaused]
  );

  const startVoiceSession = useCallback(async () => {
    setError(null);
    stopVoiceSample();
    setIsPlayingSample(null);

    // Stop existing session
    if (sessionServiceRef.current) {
      sessionServiceRef.current.stop();
    }

    // Ensure there's an active conversation
    if (!activeConversationId) {
      await startNewConversation();
    }

    setLiveTranscript({ user: "", assistant: "" });

    const session = new VoiceSessionService({
      onStateChange: (state) => {
        setVoiceState(state);
      },
      onVolumeChange: (vol) => {
        setCurrentVolume(vol);
      },
      onTranscriptChunk: (text, isModel) => {
        if (isModel) {
          setLiveTranscript((prev) => ({ ...prev, assistant: text }));
        } else {
          setLiveTranscript((prev) => ({ ...prev, user: text }));
        }
      },
      onWakeWordDetected: () => {
        setWakeWordDetected(true);
        setTimeout(() => setWakeWordDetected(false), 2500);
      },
      onAssistantMessageComplete: async (text) => {
        if (text.trim()) {
          await addLiveMessage("assistant", text.trim(), {
            voice_id: selectedVoice.id,
            modality: "voice",
          });
          setLiveTranscript((prev) => ({ ...prev, assistant: "" }));
          // Speak aloud the assistant turn
          speakResponse(text.trim());
        }
      },
      onUserMessageComplete: async (text) => {
        if (text.trim()) {
          setLiveTranscript((prev) => ({ ...prev, user: "" }));
          // Send spoken turn into conversation pipeline and speak the resulting assistant reply
          await sendMessage(text.trim(), undefined, (replyText) => {
            speakResponse(replyText);
          });
        }
      },
      onTtfa: (ttfa) => {
        setLastTtfaMs(ttfa);
      },
      onError: (errMsg) => {
        setError(errMsg);
      },
      onCommand: async (command) => {
        if (command === "end_session") {
          await stopVoiceSession(true);
        } else if (command === "pause") {
          setIsPaused(true);
        } else if (command === "resume") {
          setIsPaused(false);
        }
      },
    });

    sessionServiceRef.current = session;
    await session.start(voiceSettings, profile?.display_name || profile?.name);
  }, [
    activeConversationId,
    startNewConversation,
    voiceSettings,
    profile,
    stopVoiceSession,
    addLiveMessage,
    sendMessage,
    selectedVoice,
    speakResponse,
  ]);

  const sendLiveText = async (text: string) => {
    if (!text.trim()) return;
    if (sessionServiceRef.current) {
      sessionServiceRef.current.sendRealtimeText(text);
    }
    await sendMessage(text.trim(), undefined, (replyText) => {
      speakResponse(replyText);
    });
  };

  const toggleMute = () => {
    if (sessionServiceRef.current) {
      const muted = sessionServiceRef.current.toggleMute();
      setIsMuted(muted);
      if (muted) stopVoiceSample();
    }
  };

  const pauseVoice = () => {
    if (sessionServiceRef.current) {
      sessionServiceRef.current.pause();
      setIsPaused(true);
      stopVoiceSample();
    }
  };

  const resumeVoice = () => {
    if (sessionServiceRef.current) {
      sessionServiceRef.current.resume();
      setIsPaused(false);
    }
  };

  const isVoiceActive = voiceState !== "idle" && voiceState !== "ended";

  return (
    <VoiceContext.Provider
      value={{
        voiceState,
        isVoiceActive,
        isMuted,
        isPaused,
        currentVolume,
        selectedVoice,
        voiceSettings,
        liveTranscript,
        error,
        isPlayingSample,
        lastTtfaMs,
        isVoiceLibraryOpen,
        wakeWordDetected,
        setIsVoiceLibraryOpen,
        selectVoice,
        updateVoiceSettings,
        toggleMute,
        pauseVoice,
        resumeVoice,
        startVoiceSession,
        stopVoiceSession,
        sendLiveText,
        speakResponse,
        clearVoiceError,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoice must be used within a VoiceProvider");
  }
  return context;
};
