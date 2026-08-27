import { GoogleGenAI, Type } from "@google/genai";

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

export interface AnalyzeMultimodalVisionOptions {
  imageBase64: string;
  mimeType?: string;
  sourceType?: "camera" | "screen" | "image" | "document" | "diagram" | "code" | "video" | "webpage";
  prompt?: string;
  mode?: "general" | "ocr" | "ui_design" | "code_debug" | "document_summary" | "educational" | "chart_analysis";
  intelligenceLevel?: string;
  language?: string;
}

export interface VisionAnalysisResponse {
  success: boolean;
  sourceType: string;
  summary: string;
  ocrText?: string;
  detectedObjects?: string[];
  uiElements?: Array<{ type: string; label: string; coordinates?: string; description?: string }>;
  designEvaluation?: {
    typography?: string;
    layout?: string;
    contrast?: string;
    hierarchy?: string;
    alignment?: string;
    score?: number;
    recommendations?: string[];
  };
  codeInspection?: {
    language?: string;
    errorsFound?: string[];
    suggestedFix?: string;
  };
  educationalBreakdown?: {
    subject?: string;
    keyFormulas?: string[];
    explanationSteps?: string[];
  };
  documentStructure?: {
    title?: string;
    sections?: Array<{ heading: string; summary: string }>;
    keyMetrics?: Record<string, string>;
    detectedLanguage?: string;
  };
  suggestedActions?: Array<{ id: string; label: string; integrationId?: string; prompt: string }>;
  rawResponse: string;
  latencyMs: number;
  isOffline: boolean;
  error?: string;
}

const VISION_MODEL_CHAIN = [
  "gemini-3.7-flash",
  "gemini-3.1-flash-lite",
  "gemini-flash-latest",
];

function sanitizeBase64(data: string): { cleanData: string; mimeType: string } {
  let mimeType = "image/png";
  let cleanData = data;

  if (data.startsWith("data:")) {
    const commaIndex = data.indexOf(",");
    if (commaIndex !== -1) {
      const header = data.substring(5, commaIndex);
      const mimeMatch = header.match(/^([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
      cleanData = data.substring(commaIndex + 1);
    }
  }

  // Normalize common types
  if (mimeType.includes("pdf")) {
    mimeType = "application/pdf";
  } else if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
    mimeType = "image/jpeg";
  } else if (mimeType.includes("webp")) {
    mimeType = "image/webp";
  } else if (!mimeType.startsWith("image/") && !mimeType.includes("pdf")) {
    mimeType = "image/png";
  }

  return { cleanData, mimeType };
}

/**
 * Executes high-precision multimodal vision & document intelligence
 */
export async function analyzeMultimodalVision(
  options: AnalyzeMultimodalVisionOptions
): Promise<VisionAnalysisResponse> {
  const startTime = Date.now();
  const sourceType = options.sourceType || "image";
  const mode = options.mode || "general";
  const userPrompt = options.prompt || "Analyze this visual input comprehensively and explain what you see.";
  const language = options.language || "en";

  const { cleanData, mimeType } = sanitizeBase64(options.imageBase64);

  // Construct domain-specific instructions for Angel
  let systemInstruction = `You are Angel, an exceptionally intelligent, perceptive, and empathetic personal AI agent with advanced multimodal vision and document reasoning.
Your task is to analyze the provided visual material (source: ${sourceType.toUpperCase()}, mode: ${mode.toUpperCase()}) with utmost accuracy, structured clarity, and helpfulness.

Guidelines:
1. Grounded & Honest: Never hallucinate or overstate certainty. If text is blurry or elements are partially occluded, state what is clearly discernible versus ambiguous.
2. Source Awareness:
   - CAMERA: You are observing the physical world / environment. Identify physical objects, surroundings, signs, labels, or real-life materials naturally.
   - SCREEN: You are observing a digital device screen, active app, web browser, or OS desktop. Identify UI elements, menus, error messages, code, or layouts.
   - DOCUMENT/PDF: Extract structured OCR text (preserving tables, sections, numbers, headers), summarize the core takeaways, and highlight critical metrics.
   - DIAGRAM/EDUCATIONAL: Teach the underlying concept step-by-step (physics, math formulas, circuit schematics, graphs).
   - DESIGN/CREATIVE: Provide structured critique on typography, layout alignment, contrast, visual hierarchy, and actionable design improvements.
3. Language: Respond in ${language} or the primary language of the visual content if user prompted in that language.
`;

  const structuredPrompt = `
User Query / Request: "${userPrompt}"

Analyze the attached visual content and provide your response formatted as a JSON object adhering to this schema:
{
  "summary": "Clear, concise direct explanation of what you see and the answer to user query",
  "ocrText": "Full or structured extracted text from image/document if readable (or null if none)",
  "detectedObjects": ["list", "of", "salient", "objects", "or", "subjects"],
  "uiElements": [
    { "type": "button | input | modal | menu | error | card", "label": "Text or description", "description": "Purpose/state" }
  ],
  "designEvaluation": {
    "typography": "Analysis of font pairings, legibility, and sizing",
    "layout": "Grid, spacing, alignment, and whitespace review",
    "contrast": "Color contrast and accessibility",
    "hierarchy": "Visual flow and prominence",
    "alignment": "Alignment consistency",
    "score": 85,
    "recommendations": ["Actionable step 1", "Actionable step 2"]
  },
  "codeInspection": {
    "language": "e.g. TypeScript / Python",
    "errorsFound": ["Bug or syntax error description"],
    "suggestedFix": "Corrected code snippet or solution"
  },
  "educationalBreakdown": {
    "subject": "e.g. Physics / Mathematics",
    "keyFormulas": ["Formula or law"],
    "explanationSteps": ["Step 1 explanation", "Step 2 derivation"]
  },
  "documentStructure": {
    "title": "Document title if present",
    "sections": [{ "heading": "Section name", "summary": "Section takeaway" }],
    "keyMetrics": { "Total": "$1,200", "Date": "2026-08-20" },
    "detectedLanguage": "en"
  },
  "suggestedActions": [
    { "id": "action_1", "label": "Short button label", "integrationId": "integration_canva | integration_github | etc or null", "prompt": "Follow-up command to execute" }
  ]
}

Return strictly valid JSON only. Omit non-applicable fields or return null for them.`;

  const ai = getAiClient();
  let lastError: any = null;

  for (let m = 0; m < VISION_MODEL_CHAIN.length; m++) {
    const model = VISION_MODEL_CHAIN[m];

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts: [
              { text: structuredPrompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanData,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      });

      const latencyMs = Date.now() - startTime;
      const rawText = response.text || "{}";

      try {
        const parsed = JSON.parse(rawText);
        return {
          success: true,
          sourceType,
          summary: parsed.summary || "Visual analysis complete.",
          ocrText: parsed.ocrText || undefined,
          detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects : [],
          uiElements: Array.isArray(parsed.uiElements) ? parsed.uiElements : undefined,
          designEvaluation: parsed.designEvaluation || undefined,
          codeInspection: parsed.codeInspection || undefined,
          educationalBreakdown: parsed.educationalBreakdown || undefined,
          documentStructure: parsed.documentStructure || undefined,
          suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions : [],
          rawResponse: rawText,
          latencyMs,
          isOffline: false,
        };
      } catch (jsonErr) {
        // In case model returned plain text despite JSON directive
        return {
          success: true,
          sourceType,
          summary: rawText,
          rawResponse: rawText,
          latencyMs,
          isOffline: false,
        };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[VisionService] Multimodal call with ${model} failed:`, err?.message || err);
    }
  }

  // Graceful failure
  return {
    success: false,
    sourceType,
    summary: "Visual perception service temporarily unavailable.",
    rawResponse: "",
    latencyMs: Date.now() - startTime,
    isOffline: false,
    error: lastError?.message || "Failed to process visual content.",
  };
}
