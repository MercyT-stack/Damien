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

export interface ExplicitMemoryDetectionResult {
  isExplicitCommand: boolean;
  action: "remember" | "forget" | "none";
  content?: string;
  category?: string;
  importance?: "low" | "normal" | "high" | "critical";
  confidence?: "high" | "medium" | "low";
}

/**
 * Fast regex & pattern-based detection for explicit memory commands
 */
export function detectExplicitMemoryIntent(text: string): ExplicitMemoryDetectionResult {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // 1. FORGET COMMANDS
  const forgetPatterns = [
    /^(?:angel[,.]?\s+)?(?:please\s+)?(?:forget|delete|remove|clear|erase)\s+(?:that|about|my|from\s+memory[:\s]*)\s*(.+)$/i,
    /^(?:angel[,.]?\s+)?(?:don'?t|do\s+not)\s+remember\s+(?:that|this|about)?\s*(.+)$/i,
    /^(?:angel[,.]?\s+)?(?:wipe|remove)\s+(?:that|this)\s+(?:from\s+memory|memory)$/i,
    /^(?:forget\s+everything|clear\s+all\s+memories|reset\s+memory)$/i,
  ];

  for (const pattern of forgetPatterns) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        isExplicitCommand: true,
        action: "forget",
        content: match[1] ? match[1].trim() : trimmed,
      };
    }
  }

  // 2. REMEMBER COMMANDS
  const rememberPatterns = [
    /^(?:angel[,.]?\s+)?(?:please\s+)?(?:remember|keep\s+in\s+mind|never\s+forget|note\s+that|save\s+to\s+memory[:\s]*)\s*(?:that\s+)?(.+)$/i,
    /^(?:always\s+remember\s+that|make\s+sure\s+you\s+remember\s+that)\s*(.+)$/i,
  ];

  for (const pattern of rememberPatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const extractedContent = match[1].trim();
      let category = "preference";
      const extLower = extractedContent.toLowerCase();

      if (extLower.includes("my name is") || extLower.includes("call me") || extLower.includes("i am an") || extLower.includes("i'm a")) {
        category = "identity";
      } else if (extLower.includes("project") || extLower.includes("app") || extLower.includes("repo")) {
        category = "project";
      } else if (extLower.includes("prefer") || extLower.includes("like") || extLower.includes("favorite") || extLower.includes("theme") || extLower.includes("mode")) {
        category = "preference";
      } else if (extLower.includes("work at") || extLower.includes("company") || extLower.includes("job") || extLower.includes("career")) {
        category = "work";
      } else if (extLower.includes("goal") || extLower.includes("target") || extLower.includes("deadline")) {
        category = "goal";
      } else if (extLower.includes("decided") || extLower.includes("decision") || extLower.includes("chose")) {
        category = "decision";
      }

      return {
        isExplicitCommand: true,
        action: "remember",
        content: extractedContent,
        category,
        importance: "high",
        confidence: "high",
      };
    }
  }

  return {
    isExplicitCommand: false,
    action: "none",
  };
}

/**
 * Intelligent Memory Extraction (evaluates implicit long-term facts from a user turn)
 */
export async function extractImplicitMemories(
  userText: string,
  assistantReply?: string
): Promise<
  Array<{
    content: string;
    category: string;
    importance: "low" | "normal" | "high" | "critical";
    confidence: "high" | "medium" | "low";
  }>
> {
  // Quick heuristic filter to avoid calling AI for simple greetings or short queries
  if (!userText || userText.length < 15) return [];
  const lower = userText.toLowerCase();
  const personalSignals = [
    "i am", "i'm", "my name", "i prefer", "i like", "i work", "my project",
    "i need you to always", "call me", "my company", "our stack", "we use",
    "my goal", "i live in", "my email", "i dislike", "i hate", "i love",
    "we decided", "architecture is", "never use", "always use"
  ];

  const hasSignal = personalSignals.some((sig) => lower.includes(sig));
  if (!hasSignal && userText.length < 50) return [];

  try {
    const ai = getAiClient();
    const prompt = `Analyze this user statement and determine if there are any meaningful, long-term personal facts, user preferences, project details, identity attributes, or constraints worth remembering for future sessions.

Ignore transient questions, fleeting remarks, or ephemeral task details.

User statement: "${userText}"
${assistantReply ? `Assistant reply context: "${assistantReply.slice(0, 300)}"` : ""}

Return a JSON array of extracted memories. If nothing is worth remembering long-term, return an empty array [].
Each item should match:
{
  "content": "Clear, concise fact stated in third-person or concise preference, e.g. 'User prefers dark mode' or 'User is building an AI companion called Angel'",
  "category": "identity" | "preference" | "communication" | "project" | "work" | "education" | "interest" | "routine" | "goal" | "decision" | "technical" | "other",
  "importance": "low" | "normal" | "high" | "critical",
  "confidence": "high" | "medium" | "low"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              importance: { type: Type.STRING },
              confidence: { type: Type.STRING },
            },
            required: ["content", "category", "importance", "confidence"],
          },
        },
      },
    });

    if (response.text) {
      const parsed = JSON.parse(response.text);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item.content && item.content.length > 4);
      }
    }
    return [];
  } catch (err) {
    console.warn("[Memory Extractor] Implicit extraction notice:", err);
    return [];
  }
}

/**
 * Summarize long conversation history into a structured summary
 */
export async function summarizeConversationHistory(
  messages: Array<{ role: string; content: string }>
): Promise<{
  summary: string;
  user_goals: string[];
  decisions_made: string[];
  unresolved_questions: string[];
  key_facts: string[];
  next_steps: string[];
} | null> {
  if (!messages || messages.length < 6) return null;

  try {
    const ai = getAiClient();
    const formatted = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.content.slice(0, 500)}`)
      .join("\n\n");

    const prompt = `You are Angel's context summarizer. Provide a concise, highly informative structured summary of this conversation so Angel retains deep continuity across extended turns.

Conversation history:
${formatted}

Produce JSON matching:
{
  "summary": "1-3 sentence holistic summary of what the user and Angel discussed and built",
  "user_goals": ["Goal 1", "Goal 2"],
  "decisions_made": ["Decision 1", "Decision 2"],
  "unresolved_questions": ["Question 1"],
  "key_facts": ["Fact 1", "Fact 2"],
  "next_steps": ["Next Step 1"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            user_goals: { type: Type.ARRAY, items: { type: Type.STRING } },
            decisions_made: { type: Type.ARRAY, items: { type: Type.STRING } },
            unresolved_questions: { type: Type.ARRAY, items: { type: Type.STRING } },
            key_facts: { type: Type.ARRAY, items: { type: Type.STRING } },
            next_steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["summary", "user_goals", "decisions_made", "unresolved_questions", "key_facts", "next_steps"],
        },
      },
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (err) {
    console.warn("[Memory Summarizer] Summarization notice:", err);
    return null;
  }
}

/**
 * Generate semantic text embedding vector using Gemini or fallback tokenizer
 */
export async function generateTextEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) return [];

  try {
    const ai = getAiClient();
    const response = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: text,
    });

    const embeddingValues = (response as any)?.embedding?.values || (response as any)?.embeddings?.[0]?.values;
    if (Array.isArray(embeddingValues) && embeddingValues.length > 0) {
      return embeddingValues;
    }
  } catch (err) {
    // Fallback: Deterministic pseudo-embedding for local offline/free tier resilience
  }

  // Fallback vector representation (128 dimensions)
  const vec = new Array(128).fill(0);
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/);
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    for (let c = 0; c < word.length; c++) {
      const idx = (word.charCodeAt(c) * (c + 1) + i * 7) % 128;
      vec[idx] += 1 / (1 + i * 0.1);
    }
  }
  // Normalize
  const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    return vec.map((v) => v / norm);
  }
  return vec;
}
