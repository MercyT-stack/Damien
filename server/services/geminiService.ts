import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import {
  ANGEL_SYSTEM_PROMPT,
  buildDynamicAngelSystemPrompt,
  AngelContextOptions,
} from "../config/angelPersonality.js";

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

export interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
  media?: {
    data: string;
    mimeType?: string;
  };
  imageBase64?: string;
}

export interface GenerateChatOptions {
  messages: ChatMessagePayload[];
  customSystemInstruction?: string;
  intelligenceLevel?: string;
  contextOptions?: AngelContextOptions;
}

/**
 * Format conversation history into Gemini contents structure with multimodal support
 */
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
          if (mimeMatch) {
            mimeType = mimeMatch[1];
          }
          cleanData = rawMedia.substring(commaIndex + 1);
        }
      }

      if (cleanData.trim().length > 0) {
        parts.push({
          inlineData: {
            mimeType,
            data: cleanData,
          },
        });
      }
    }

    return {
      role: msg.role === "assistant" ? "model" : "user",
      parts,
    };
  });
}

/**
 * Ordered fallback model sequence for chat generation.
 * All models are compliant with Gemini API specifications.
 */
const CHAT_MODEL_FALLBACK_CHAIN = [
  "gemini-3.7-flash",
  "gemini-flash-latest",
  "gemini-3.1-flash-lite",
];

function isTransientOverloadError(error: any): boolean {
  if (!error) return false;
  const status = error.status || error.code || (error.error && error.error.code);
  const rawStr = typeof error === "string" ? error : JSON.stringify(error);
  const message = ((error.message || "") + " " + rawStr).toLowerCase();
  
  return (
    status === 503 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 504 ||
    status === 404 ||
    status === "UNAVAILABLE" ||
    status === "RESOURCE_EXHAUSTED" ||
    status === "NOT_FOUND" ||
    message.includes("503") ||
    message.includes("429") ||
    message.includes("500") ||
    message.includes("502") ||
    message.includes("504") ||
    message.includes("404") ||
    message.includes("high demand") ||
    message.includes("unavailable") ||
    message.includes("service unavailable") ||
    message.includes("spikes in demand") ||
    message.includes("rate limit") ||
    message.includes("overloaded") ||
    message.includes("resource exhausted") ||
    message.includes("not found") ||
    message.includes("no longer available")
  );
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get appropriate model config depending on model version & intelligence level
 * Configured for instant, snappy, active replies
 */
function getModelConfig(model: string, systemInstruction: string, intelligenceLevel?: string) {
  const baseConfig: any = {
    systemInstruction,
    temperature: 0.7,
    topP: 0.95,
  };

  // Thinking configuration only for models that support it:
  if (model === "gemini-3.1-flash-lite") {
    baseConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.MINIMAL };
  } else if (model === "gemini-3.7-flash") {
    if (!intelligenceLevel || intelligenceLevel === "quick" || intelligenceLevel === "standard" || intelligenceLevel === "balanced") {
      baseConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    } else if (intelligenceLevel === "pro" || intelligenceLevel === "deep") {
      baseConfig.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }
  }

  return baseConfig;
}

function resolveSystemInstruction(options: GenerateChatOptions): string {
  if (options.customSystemInstruction) {
    return options.customSystemInstruction;
  }
  if (options.contextOptions) {
    return buildDynamicAngelSystemPrompt(options.contextOptions);
  }
  return ANGEL_SYSTEM_PROMPT;
}

/**
 * Generate a non-streamed response from Angel with automatic retry and overload resilience
 */
export async function generateAngelResponse(options: GenerateChatOptions): Promise<string> {
  const ai = getAiClient();
  const systemInstruction = resolveSystemInstruction(options);
  const contents = buildGeminiContents(options.messages);

  let lastError: any = null;

  for (let m = 0; m < CHAT_MODEL_FALLBACK_CHAIN.length; m++) {
    const model = CHAT_MODEL_FALLBACK_CHAIN[m];
    const config = getModelConfig(model, systemInstruction, options.intelligenceLevel);

    // Attempt generation with up to 1 fast retry on transient demand spike
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config,
        });

        if (response && response.text) {
          return response.text;
        }
      } catch (err: any) {
        lastError = err;
        const isOverload = isTransientOverloadError(err);

        if (isOverload && attempt === 0) {
          // Short backoff before retry on the same model
          await wait(200);
          continue;
        }

        // Move to next model in the fallback chain
        break;
      }
    }
  }

  // Graceful fallback response if all models are experiencing temporary demand spikes
  return "I'm currently right here with you. Please send your message again in a moment.";
}

/**
 * Generate a streamed response from Angel with automatic overload fallback & retry
 */
export async function* streamAngelResponse(options: GenerateChatOptions): AsyncGenerator<string, void, unknown> {
  const ai = getAiClient();
  const systemInstruction = resolveSystemInstruction(options);
  const contents = buildGeminiContents(options.messages);

  let lastError: any = null;
  let hasYieldedAnyChunk = false;

  for (let m = 0; m < CHAT_MODEL_FALLBACK_CHAIN.length; m++) {
    const model = CHAT_MODEL_FALLBACK_CHAIN[m];
    const config = getModelConfig(model, systemInstruction, options.intelligenceLevel);

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config,
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            hasYieldedAnyChunk = true;
            yield chunk.text;
          }
        }

        // Stream completed successfully with this model
        return;
      } catch (err: any) {
        lastError = err;
        const isOverload = isTransientOverloadError(err);

        // If we already started streaming chunks to the user, close gracefully
        if (hasYieldedAnyChunk) {
          return;
        }

        if (isOverload && attempt === 0) {
          // Short jitter before retry on same model
          await wait(180);
          continue;
        }

        // Break to next fallback model
        break;
      }
    }
  }

  // If streaming was unavailable on all models, attempt a quick direct generation
  try {
    const directFallback = await generateAngelResponse(options);
    if (directFallback) {
      yield directFallback;
      return;
    }
  } catch (directErr) {
    // Graceful response
  }

  yield "I'm right here with you. Please try sending your message again in a moment.";
}
