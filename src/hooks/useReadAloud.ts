import { useState, useEffect, useRef, useCallback } from "react";
import { Message } from "../types";
import {
  cleanTextForSpeech,
  splitIntoSpeechChunks,
  getBrowserVoices,
} from "../utils/speechUtils";

export type PlaybackState = "idle" | "playing" | "paused";

export interface ReadAloudOptions {
  rate?: number;
  pitch?: number;
  voiceURI?: string;
  prefixSpeaker?: boolean;
}

export interface UseReadAloudReturn {
  isSupported: boolean;
  playbackState: PlaybackState;
  isPlaying: boolean;
  isPaused: boolean;
  activeMessageId: string | null;
  activeMessageIndex: number;
  totalConversationMessages: number;
  isConversationMode: boolean;
  currentSentence: string;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoiceURI: string | null;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  setSelectedVoiceURI: (uri: string | null) => void;
  speakMessage: (msg: Message, options?: ReadAloudOptions) => void;
  speakConversation: (messages: Message[], startIndex?: number) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  nextMessage: () => void;
  prevMessage: () => void;
}

export function useReadAloud(): UseReadAloudReturn {
  const isSupported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle");
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [activeMessageIndex, setActiveMessageIndex] = useState<number>(-1);
  const [isConversationMode, setIsConversationMode] = useState<boolean>(false);
  const [currentSentence, setCurrentSentence] = useState<string>("");
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(null);
  const [speechRate, setSpeechRate] = useState<number>(1.0);

  // Conversation queue reference
  const conversationQueueRef = useRef<Message[]>([]);
  const currentMsgIndexRef = useRef<number>(-1);

  // Utterance chunk state
  const chunksQueueRef = useRef<string[]>([]);
  const currentChunkIdxRef = useRef<number>(0);
  const keepAliveIntervalRef = useRef<any>(null);
  const isCancelledRef = useRef<boolean>(false);

  // Load available voices on mount
  useEffect(() => {
    if (!isSupported) return;
    let mounted = true;

    getBrowserVoices().then((voices) => {
      if (mounted) {
        setAvailableVoices(voices);
        // Default to high-quality English voice if available
        const defaultVoice =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Samantha") || v.default)) ||
          voices.find((v) => v.lang.startsWith("en")) ||
          voices[0];
        if (defaultVoice) {
          setSelectedVoiceURI(defaultVoice.voiceURI);
        }
      }
    });

    return () => {
      mounted = false;
    };
  }, [isSupported]);

  // Keep-alive timer for Chromium bug (speechSynthesis randomly pauses after 15s)
  const startKeepAlive = useCallback(() => {
    stopKeepAlive();
    keepAliveIntervalRef.current = setInterval(() => {
      if (typeof window !== "undefined" && window.speechSynthesis && window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 10000);
  }, []);

  const stopKeepAlive = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  }, []);

  // Stop everything
  const stop = useCallback(() => {
    isCancelledRef.current = true;
    stopKeepAlive();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {
        // ignore
      }
    }
    setPlaybackState("idle");
    setActiveMessageId(null);
    setActiveMessageIndex(-1);
    setIsConversationMode(false);
    setCurrentSentence("");
    chunksQueueRef.current = [];
    currentChunkIdxRef.current = 0;
  }, [stopKeepAlive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  // Play next chunk of the current message
  const playNextChunk = useCallback(
    (onCompleteMessage?: () => void) => {
      if (isCancelledRef.current) return;

      const chunks = chunksQueueRef.current;
      const index = currentChunkIdxRef.current;

      if (index >= chunks.length) {
        // Finished speaking this message
        if (onCompleteMessage) {
          onCompleteMessage();
        } else {
          stop();
        }
        return;
      }

      const chunkText = chunks[index];
      setCurrentSentence(chunkText);

      const utterance = new SpeechSynthesisUtterance(chunkText);
      utterance.rate = speechRate;
      utterance.pitch = 1.0;

      if (selectedVoiceURI && availableVoices.length > 0) {
        const found = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
        if (found) {
          utterance.voice = found;
          utterance.lang = found.lang;
        }
      }

      utterance.onend = () => {
        if (isCancelledRef.current) return;
        currentChunkIdxRef.current += 1;
        playNextChunk(onCompleteMessage);
      };

      utterance.onerror = (e) => {
        if (e.error === "canceled" || e.error === "interrupted") {
          return;
        }
        console.warn("Speech utterance error:", e);
        currentChunkIdxRef.current += 1;
        playNextChunk(onCompleteMessage);
      };

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Failed to speak utterance:", err);
      }
    },
    [availableVoices, selectedVoiceURI, speechRate, stop]
  );

  // Play a specific message by index in conversation mode
  const playConversationMessageAtIndex = useCallback(
    (idx: number) => {
      const messages = conversationQueueRef.current;
      if (idx < 0 || idx >= messages.length) {
        stop();
        return;
      }

      isCancelledRef.current = false;
      currentMsgIndexRef.current = idx;
      setActiveMessageIndex(idx);

      const msg = messages[idx];
      setActiveMessageId(msg.id);

      // Prepare speech text
      const speakerPrefix = msg.role === "assistant" ? "Angel says: " : "You said: ";
      const cleaned = cleanTextForSpeech(msg.content);
      const textToSpeak = `${speakerPrefix}${cleaned}`;

      const chunks = splitIntoSpeechChunks(textToSpeak);
      chunksQueueRef.current = chunks;
      currentChunkIdxRef.current = 0;

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      setPlaybackState("playing");
      startKeepAlive();

      // Callback when this message completes: advance to next message
      const onMsgDone = () => {
        if (isCancelledRef.current) return;
        const nextIdx = currentMsgIndexRef.current + 1;
        if (nextIdx < conversationQueueRef.current.length) {
          // Short natural pause between messages
          setTimeout(() => {
            if (!isCancelledRef.current) {
              playConversationMessageAtIndex(nextIdx);
            }
          }, 400);
        } else {
          stop();
        }
      };

      playNextChunk(onMsgDone);
    },
    [playNextChunk, startKeepAlive, stop]
  );

  // Read a single chat message
  const speakMessage = useCallback(
    (msg: Message, options?: ReadAloudOptions) => {
      if (!isSupported) {
        console.warn("Web Speech API is not supported in this browser.");
        return;
      }

      // If already playing this message, toggle pause/stop
      if (activeMessageId === msg.id && playbackState === "playing") {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.pause();
          setPlaybackState("paused");
        }
        return;
      }

      if (activeMessageId === msg.id && playbackState === "paused") {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.resume();
          setPlaybackState("playing");
        }
        return;
      }

      // Start fresh playback for this message
      stop();
      isCancelledRef.current = false;
      setIsConversationMode(false);
      setActiveMessageId(msg.id);
      setActiveMessageIndex(-1);

      const cleaned = cleanTextForSpeech(msg.content);
      const prefix = options?.prefixSpeaker
        ? msg.role === "assistant"
          ? "Angel: "
          : "You: "
        : "";
      const textToSpeak = `${prefix}${cleaned}`;

      const chunks = splitIntoSpeechChunks(textToSpeak);
      if (chunks.length === 0) {
        setPlaybackState("idle");
        setActiveMessageId(null);
        return;
      }

      chunksQueueRef.current = chunks;
      currentChunkIdxRef.current = 0;

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      setPlaybackState("playing");
      startKeepAlive();

      playNextChunk(() => {
        stop();
      });
    },
    [activeMessageId, isSupported, playNextChunk, playbackState, startKeepAlive, stop]
  );

  // Read full conversation history
  const speakConversation = useCallback(
    (messages: Message[], startIndex: number = 0) => {
      if (!isSupported || !messages || messages.length === 0) return;

      stop();
      isCancelledRef.current = false;
      conversationQueueRef.current = messages;
      setIsConversationMode(true);

      const validStart = Math.max(0, Math.min(startIndex, messages.length - 1));
      playConversationMessageAtIndex(validStart);
    },
    [isSupported, playConversationMessageAtIndex, stop]
  );

  // Pause playback
  const pause = useCallback(() => {
    if (!isSupported) return;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setPlaybackState("paused");
    }
  }, [isSupported]);

  // Resume playback
  const resume = useCallback(() => {
    if (!isSupported) return;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.resume();
      setPlaybackState("playing");
    }
  }, [isSupported]);

  // Next message in conversation mode
  const nextMessage = useCallback(() => {
    if (!isConversationMode || conversationQueueRef.current.length === 0) return;
    const nextIdx = currentMsgIndexRef.current + 1;
    if (nextIdx < conversationQueueRef.current.length) {
      playConversationMessageAtIndex(nextIdx);
    } else {
      stop();
    }
  }, [isConversationMode, playConversationMessageAtIndex, stop]);

  // Prev message in conversation mode
  const prevMessage = useCallback(() => {
    if (!isConversationMode || conversationQueueRef.current.length === 0) return;
    const prevIdx = Math.max(0, currentMsgIndexRef.current - 1);
    playConversationMessageAtIndex(prevIdx);
  }, [isConversationMode, playConversationMessageAtIndex]);

  return {
    isSupported,
    playbackState,
    isPlaying: playbackState === "playing",
    isPaused: playbackState === "paused",
    activeMessageId,
    activeMessageIndex,
    totalConversationMessages: conversationQueueRef.current.length,
    isConversationMode,
    currentSentence,
    availableVoices,
    selectedVoiceURI,
    speechRate,
    setSpeechRate,
    setSelectedVoiceURI,
    speakMessage,
    speakConversation,
    pause,
    resume,
    stop,
    nextMessage,
    prevMessage,
  };
}
