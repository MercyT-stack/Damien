import { UserVoicePreferences, VoiceConfig } from "../types";
import { getSupabase, isSupabaseConfigured } from "./supabaseClient";
import { DEFAULT_USER_VOICE_PREFERENCES, getVoiceById, getVoiceSamplePhrase } from "../config/voices";

const LOCAL_VOICE_PREFS_KEY = "angel_user_voice_preferences";

/**
 * Fetch user voice preferences from Supabase with localStorage fallback
 */
export async function fetchUserVoicePreferences(userId?: string): Promise<UserVoicePreferences> {
  const supabase = getSupabase();
  if (userId && isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from("user_voice_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (data && !error) {
        return {
          voice_id: data.voice_id || DEFAULT_USER_VOICE_PREFERENCES.voice_id,
          language: data.language || DEFAULT_USER_VOICE_PREFERENCES.language,
          regional_accent: data.regional_accent || DEFAULT_USER_VOICE_PREFERENCES.regional_accent,
          speaking_speed: Number(data.speaking_speed) || DEFAULT_USER_VOICE_PREFERENCES.speaking_speed,
          auto_language_detection: data.auto_language_detection ?? true,
          captions_enabled: data.captions_enabled ?? true,
        };
      }
    } catch (err) {
      console.warn("Could not fetch voice preferences from Supabase, using local fallback:", err);
    }
  }

  // Fallback to localStorage
  try {
    const saved = localStorage.getItem(LOCAL_VOICE_PREFS_KEY);
    if (saved) {
      return { ...DEFAULT_USER_VOICE_PREFERENCES, ...JSON.parse(saved) };
    }
  } catch (e) {
    // ignore
  }

  return DEFAULT_USER_VOICE_PREFERENCES;
}

/**
 * Save user voice preferences to Supabase and localStorage
 */
export async function saveUserVoicePreferences(
  userId: string | undefined,
  preferences: UserVoicePreferences
): Promise<void> {
  // Always update local cache
  try {
    localStorage.setItem(LOCAL_VOICE_PREFS_KEY, JSON.stringify(preferences));
  } catch (e) {
    // ignore
  }

  const supabase = getSupabase();
  if (userId && isSupabaseConfigured() && supabase) {
    try {
      await supabase.from("user_voice_preferences").upsert({
        user_id: userId,
        voice_id: preferences.voice_id,
        language: preferences.language,
        regional_accent: preferences.regional_accent,
        speaking_speed: preferences.speaking_speed,
        auto_language_detection: preferences.auto_language_detection,
        captions_enabled: preferences.captions_enabled,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn("Could not sync voice preferences to Supabase:", err);
    }
  }
}

/**
 * Low-Latency Voice Sample Playback Engine
 * Handles immediate cancellation of existing audio, minimal buffering, and gapless 24kHz PCM playback.
 */
let previewAudioCtx: AudioContext | null = null;
let currentPreviewSource: AudioBufferSourceNode | null = null;
let activeFetchAbortController: AbortController | null = null;

export function stopVoiceSample(): void {
  if (activeFetchAbortController) {
    activeFetchAbortController.abort();
    activeFetchAbortController = null;
  }

  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }

  if (currentPreviewSource) {
    try {
      currentPreviewSource.stop();
      currentPreviewSource.disconnect();
    } catch (e) {
      // ignore
    }
    currentPreviewSource = null;
  }
}

/**
 * Fallback synthesizer using Web Speech API with tailored pitch and rate
 */
function playSpeechSynthesisFallback(voice: VoiceConfig, phrase: string, languageCode: string): Promise<{ ttfaMs: number }> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve({ ttfaMs: 0 });
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(phrase);
    
    if (languageCode && languageCode !== "auto") {
      utterance.lang = languageCode;
    } else {
      utterance.lang = "en-US";
    }

    // Adapt pitch and rate slightly based on voice identity
    const isFeminine = voice.genderPresentation?.toLowerCase().includes("fem");
    const isMasculine = voice.genderPresentation?.toLowerCase().includes("masc");

    if (isFeminine) {
      utterance.pitch = voice.name === "NOVA" ? 1.2 : 1.05;
      utterance.rate = 1.0;
    } else if (isMasculine) {
      utterance.pitch = voice.name === "ONYX" ? 0.8 : 0.95;
      utterance.rate = 0.98;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    // Try finding a matching browser voice
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const match = voices.find(
        (v) => (v.lang.startsWith(utterance.lang.slice(0, 2)) || v.lang === utterance.lang) &&
               (isFeminine ? (v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google US English")) : true)
      );
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onstart = () => {
      resolve({ ttfaMs: 40 });
    };

    utterance.onerror = () => {
      resolve({ ttfaMs: 0 });
    };

    utterance.onend = () => {
      // completed
    };

    window.speechSynthesis.speak(utterance);
    // Timeout fallback in case onstart does not fire immediately
    setTimeout(() => resolve({ ttfaMs: 40 }), 200);
  });
}

export async function playVoiceSample(
  voice: VoiceConfig,
  languageCode: string = "auto"
): Promise<{ ttfaMs: number }> {
  // 1. Immediately cancel any currently playing sample or active fetch
  stopVoiceSample();

  const abortController = new AbortController();
  activeFetchAbortController = abortController;

  const phrase = getVoiceSamplePhrase(voice, languageCode);
  const startTime = Date.now();

  try {
    const response = await fetch("/api/voice/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortController.signal,
      body: JSON.stringify({
        voiceId: voice.id,
        customText: phrase,
        language: languageCode || "auto",
      }),
    });

    if (!response.ok) {
      return await playSpeechSynthesisFallback(voice, phrase, languageCode);
    }

    const data = await response.json();

    if (data.fallback || !data.audioBase64) {
      return await playSpeechSynthesisFallback(voice, phrase, languageCode);
    }

    const base64Audio = data.audioBase64;

    // 2. Decode 24kHz linear PCM with minimal buffering
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!previewAudioCtx || previewAudioCtx.state === "closed") {
      previewAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
    }
    if (previewAudioCtx.state === "suspended") {
      await previewAudioCtx.resume();
    }

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16Array = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16Array.length);
    for (let i = 0; i < int16Array.length; i++) {
      float32[i] = int16Array[i] / 32768.0;
    }

    const buffer = previewAudioCtx.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(float32, 0);

    const source = previewAudioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(previewAudioCtx.destination);
    currentPreviewSource = source;

    source.onended = () => {
      if (currentPreviewSource === source) {
        currentPreviewSource = null;
      }
    };

    source.start(0);

    const clientTtfaMs = Date.now() - startTime;
    return { ttfaMs: clientTtfaMs };
  } catch (err: any) {
    if (err.name === "AbortError") {
      // Normal cancellation
      return { ttfaMs: 0 };
    }
    return await playSpeechSynthesisFallback(voice, phrase, languageCode);
  } finally {
    if (activeFetchAbortController === abortController) {
      activeFetchAbortController = null;
    }
  }
}

/**
 * Clean markdown and artifacts from assistant responses for spoken delivery
 */
export function cleanSpokenText(text: string): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " I have provided the code on your screen. ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/_([^_]+)_/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Speak Angel's live conversation response aloud with volume animation callbacks
 */
export async function speakAngelSpokenResponse(
  rawText: string,
  voice: VoiceConfig,
  languageCode: string = "auto",
  onStart?: () => void,
  onVolume?: (volume: number) => void,
  onEnd?: () => void
): Promise<void> {
  const spokenText = cleanSpokenText(rawText);
  if (!spokenText) {
    onEnd?.();
    return;
  }

  stopVoiceSample();
  onStart?.();

  const abortController = new AbortController();
  activeFetchAbortController = abortController;

  let volumeInterval: any = null;
  const startVolumeSimulation = () => {
    if (onVolume) {
      volumeInterval = setInterval(() => {
        // Natural speech cadence volume fluctuation
        const randVol = 0.25 + Math.random() * 0.45;
        onVolume(randVol);
      }, 100);
    }
  };

  const stopVolumeSimulation = () => {
    if (volumeInterval) {
      clearInterval(volumeInterval);
      volumeInterval = null;
    }
    onVolume?.(0);
  };

  try {
    const response = await fetch("/api/voice/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: abortController.signal,
      body: JSON.stringify({
        voiceId: voice.id,
        customText: spokenText.length > 300 ? spokenText.slice(0, 300) : spokenText,
        language: languageCode || "auto",
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (!data.fallback && data.audioBase64) {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (!previewAudioCtx || previewAudioCtx.state === "closed") {
          previewAudioCtx = new AudioCtxClass({ sampleRate: 24000 });
        }
        if (previewAudioCtx.state === "suspended") {
          await previewAudioCtx.resume();
        }

        const binary = atob(data.audioBase64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const int16Array = new Int16Array(bytes.buffer);
        const float32 = new Float32Array(int16Array.length);
        for (let i = 0; i < int16Array.length; i++) {
          float32[i] = int16Array[i] / 32768.0;
        }

        const buffer = previewAudioCtx.createBuffer(1, float32.length, 24000);
        buffer.copyToChannel(float32, 0);

        const analyser = previewAudioCtx.createAnalyser();
        analyser.fftSize = 128;
        const source = previewAudioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(analyser);
        analyser.connect(previewAudioCtx.destination);
        currentPreviewSource = source;

        let animId: number | null = null;
        if (onVolume) {
          const updateVol = () => {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / (dataArray.length || 1);
            onVolume(Math.min(1, avg / 128));
            if (currentPreviewSource === source) {
              animId = requestAnimationFrame(updateVol);
            }
          };
          animId = requestAnimationFrame(updateVol);
        }

        return new Promise<void>((resolve) => {
          source.onended = () => {
            if (animId) cancelAnimationFrame(animId);
            onVolume?.(0);
            if (currentPreviewSource === source) {
              currentPreviewSource = null;
            }
            onEnd?.();
            resolve();
          };
          source.start(0);
        });
      }
    }
  } catch (err: any) {
    if (err.name === "AbortError") {
      stopVolumeSimulation();
      onEnd?.();
      return;
    }
  }

  // Fallback to browser SpeechSynthesis
  return new Promise<void>((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onEnd?.();
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = languageCode && languageCode !== "auto" ? languageCode : "en-US";

    const isFeminine = voice.genderPresentation?.toLowerCase().includes("fem");
    const isMasculine = voice.genderPresentation?.toLowerCase().includes("masc");

    if (isFeminine) {
      utterance.pitch = voice.name === "NOVA" ? 1.2 : 1.05;
      utterance.rate = 1.02;
    } else if (isMasculine) {
      utterance.pitch = voice.name === "ONYX" ? 0.8 : 0.95;
      utterance.rate = 1.0;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const match = voices.find(
        (v) =>
          (v.lang.startsWith(utterance.lang.slice(0, 2)) || v.lang === utterance.lang) &&
          (isFeminine ? v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Samantha") || v.name.includes("Google") : true)
      );
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onstart = () => {
      startVolumeSimulation();
    };

    utterance.onend = () => {
      stopVolumeSimulation();
      onEnd?.();
      resolve();
    };

    utterance.onerror = () => {
      stopVolumeSimulation();
      onEnd?.();
      resolve();
    };

    window.speechSynthesis.speak(utterance);
  });
}

