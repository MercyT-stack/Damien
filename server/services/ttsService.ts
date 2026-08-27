import { GoogleGenAI, Modality } from "@google/genai";
import { getServerVoice } from "../config/voices.js";

let aiClient: GoogleGenAI | null = null;

// In-memory cache for voice preview samples to avoid duplicate API requests and save quota
const previewAudioCache = new Map<string, { audioBase64: string; mimeType: string; ttfaMs: number }>();

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

export interface VoicePreviewOptions {
  voiceId: string;
  customText?: string;
  language?: string;
}

export async function generateVoicePreview(options: VoicePreviewOptions): Promise<{
  audioBase64?: string;
  mimeType?: string;
  ttfaMs: number;
  fallback?: boolean;
  message?: string;
}> {
  const startTime = Date.now();
  const voice = getServerVoice(options.voiceId);
  const text = options.customText || voice.defaultSamplePhrase;
  const lang = options.language || "auto";

  // Check cache first
  const cacheKey = `${voice.id}_${lang}_${text}`;
  if (previewAudioCache.has(cacheKey)) {
    const cached = previewAudioCache.get(cacheKey)!;
    return {
      audioBase64: cached.audioBase64,
      mimeType: cached.mimeType,
      ttfaMs: 12,
      fallback: false,
    };
  }

  try {
    const ai = getAiClient();
    const prompt = `You are speaking as Angel with the ${voice.name} voice identity (${voice.styleDescription}).
Deliver this short sample phrase conversationally, naturally, and warmly — like a real person greeting a friend, NOT reading a script:
"${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice.providerVoice },
          },
        },
      },
    });

    let base64Audio: string | undefined;
    let mimeType = "audio/pcm;rate=24000";

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData?.data) {
        base64Audio = part.inlineData.data;
        if (part.inlineData.mimeType) {
          mimeType = part.inlineData.mimeType;
        }
        break;
      }
    }

    if (base64Audio) {
      const ttfaMs = Date.now() - startTime;
      previewAudioCache.set(cacheKey, { audioBase64: base64Audio, mimeType, ttfaMs });
      return {
        audioBase64: base64Audio,
        mimeType,
        ttfaMs,
        fallback: false,
      };
    }
  } catch (error: any) {
    const isQuotaExceeded = error?.message?.includes("429") || error?.message?.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED";
    if (isQuotaExceeded) {
      console.warn(`[TTS Preview] Quota exceeded for Gemini TTS preview. Falling back smoothly to client synthesizer for ${voice.name}.`);
    } else {
      console.warn(`[TTS Preview] TTS preview generation notice for ${voice.name}:`, error?.message || error);
    }
  }

  // Graceful fallback response when TTS API quota is reached
  return {
    fallback: true,
    ttfaMs: Date.now() - startTime,
    message: "Using browser voice synthesis fallback.",
  };
}

