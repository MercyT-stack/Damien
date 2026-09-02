import { GoogleGenAI } from "@google/genai";
import {
  ANGEL_SYSTEM_PROMPT,
  buildDynamicAngelSystemPrompt,
  AngelContextOptions,
} from "../config/angelPersonality.js";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is missing.");
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

export interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
  media?: { data: string; mimeType?: string };
  imageBase64?: string;
}

export interface GenerateChatOptions {
  messages: ChatMessagePayload[];
  customSystemInstruction?: string;
  intelligenceLevel?: string;
  contextOptions?: AngelContextOptions;
}

function buildGeminiContents(messages: ChatMessagePayload[]) {
  return messages.map((msg) => {
    const parts: any[] = [{ text: msg.content || "" }];
    const rawMedia = msg.media?.data || msg.imageBase64;

    if (rawMedia && typeof rawMedia === "string") {
      let mimeType = msg.media?.mimeType || "image/png";
      let cleanData = rawMedia;

      if (rawMedia.startsWith("data:")) {
        const commaIndex = rawMedia.indexOf(",");
        if (commaIndex !== -1) {
          const header = rawMedia.substring(5, commaIndex);
          const mimeMatch = header.match(/^([^;]+)/);
          if (mimeMatch) mimeType = mimeMatch[1];
          cleanData = rawMedia.substring(commaIndex + 1);
        }
      }

      if (cleanData.trim()) {
        parts.push({ inlineData: { mimeType, data: cleanData } });
      }
    }

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });
}

// Keep the first request fast and use known-current Gemini 3 models as fallbacks.
const CHAT_MODEL_FALLBACK_CHAIN = [
  "gemini-3.7-flash",
  "gemini-3.6-flash",
  "gemini-3.5-flash-lite",
];

function getThinkingLevel(intelligenceLevel?: string): "low" | "medium" | "high" {
  switch ((intelligenceLevel || "standard").toLowerCase()) {
    case "deep":
    case "pro":
      return "high";
    case "detailed":
      return "medium";
    case "quick":
    case "standard":
    default:
      return "low";
  }
}

function getModelConfig(model: string, systemInstruction: string, intelligenceLevel?: string) {
  const config: any = {
    systemInstruction,
    maxOutputTokens: 2048,
  };

  // Gemini 3.x uses thinkingLevel rather than the older thinkingBudget.
  // Sampling controls such as temperature/topP are intentionally omitted.
  if (model === "gemini-3.7-flash" || model === "gemini-3.6-flash") {
    config.thinkingConfig = { thinkingLevel: getThinkingLevel(intelligenceLevel) };
  }

  return config;
}

function resolveSystemInstruction(options: GenerateChatOptions): string {
  if (options.customSystemInstruction) return options.customSystemInstruction;
  if (options.contextOptions) return buildDynamicAngelSystemPrompt(options.contextOptions);
  return ANGEL_SYSTEM_PROMPT;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function isRetryableError(error: any): boolean {
  const status = error?.status || error?.code || error?.error?.code;
  const message = `${error?.message || ""} ${JSON.stringify(error || {})}`.toLowerCase();
  return [429, 500, 502, 503, 504, "UNAVAILABLE", "RESOURCE_EXHAUSTED", "NOT_FOUND"].includes(status)
    || /429|500|502|503|504|overloaded|unavailable|resource exhausted|timed out|not found/.test(message);
}

/**
 * Non-streamed response used by the normal API and as a final fallback.
 * Every upstream attempt is bounded so a slow provider cannot consume Netlify's
 * entire synchronous-function window.
 */
export async function generateAngelResponse(options: GenerateChatOptions): Promise<string> {
  const ai = getAiClient();
  const systemInstruction = resolveSystemInstruction(options);
  const contents = buildGeminiContents(options.messages);
  let lastError: any = null;

  for (const model of CHAT_MODEL_FALLBACK_CHAIN) {
    const config = getModelConfig(model, systemInstruction, options.intelligenceLevel);

    try {
      const response = await withTimeout(
        ai.models.generateContent({ model, contents, config }),
        model === CHAT_MODEL_FALLBACK_CHAIN[0] ? 18000 : 12000,
        `Gemini ${model}`,
      );

      if (response?.text) return response.text;
    } catch (error: any) {
      lastError = error;
      console.error(`Angel Gemini ${model} failed`, error);
      if (!isRetryableError(error)) break;
    }
  }

  console.error("Angel Gemini generation failed", lastError);
  throw new Error("Angel's AI service is taking too long to respond. Please try again in a moment.");
}

/**
 * Stream response chunks to the Netlify function. The first model gets a bounded
 * startup window; if it cannot start, a faster fallback is attempted.
 */
export async function* streamAngelResponse(options: GenerateChatOptions): AsyncGenerator<string, void, unknown> {
  const ai = getAiClient();
  const systemInstruction = resolveSystemInstruction(options);
  const contents = buildGeminiContents(options.messages);

  for (const model of CHAT_MODEL_FALLBACK_CHAIN) {
    const config = getModelConfig(model, systemInstruction, options.intelligenceLevel);
    try {
      const responseStream = await withTimeout(
        ai.models.generateContentStream({ model, contents, config }),
        model === CHAT_MODEL_FALLBACK_CHAIN[0] ? 18000 : 12000,
        `Gemini ${model} stream startup`,
      );

      let yielded = false;
      for await (const chunk of responseStream) {
        if (chunk.text) {
          yielded = true;
          yield chunk.text;
        }
      }
      if (yielded) return;
    } catch (error: any) {
      console.error(`Angel Gemini stream ${model} failed`, error);
      // If a model already emitted text, do not start another model and duplicate output.
      // Otherwise move to the next fallback.
    }
  }

  // Keep the stream contract even when all streaming attempts fail.
  yield await generateAngelResponse(options);
}
