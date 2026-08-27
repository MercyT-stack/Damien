export interface StreamChatCallbacks {
  onChunk: (chunk: string) => void;
  onDone: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface AngelContextPayload {
  preferredName?: string;
  communicationStyle?: string;
  customInstructions?: string;
  occupation?: string;
  interests?: string[];
  memories?: Array<{ content: string; category?: string; importance?: string }>;
  activeProject?: {
    name: string;
    description?: string;
    goals?: string[];
    memories?: Array<{ content: string; category?: string }>;
  };
  conversationSummary?: {
    summary: string;
    decisions_made?: string[];
    key_facts?: string[];
    user_goals?: string[];
    next_steps?: string[];
  };
}

function cleanErrorMessage(rawMessage: string): string {
  if (!rawMessage) return "Angel is currently unavailable. Please try again in a moment.";

  const lower = typeof rawMessage === "string" ? rawMessage.toLowerCase() : String(rawMessage);

  if (
    lower.includes("503") ||
    lower.includes("high demand") ||
    lower.includes("unavailable") ||
    lower.includes("spikes in demand") ||
    lower.includes("temporarily overloaded")
  ) {
    return "Angel is experiencing high demand right now. Please try sending your message again in just a moment.";
  }

  if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
    return "Angel rate limit reached temporarily. Please pause for a moment before sending another message.";
  }

  // If the error message is raw stringified JSON from the API client
  try {
    if (typeof rawMessage === "string" && rawMessage.includes("{") && rawMessage.includes("}")) {
      const startIdx = rawMessage.indexOf("{");
      const jsonCandidate = rawMessage.slice(startIdx);
      const parsed = JSON.parse(jsonCandidate);
      if (parsed?.error?.message) {
        try {
          const innerParsed = JSON.parse(parsed.error.message);
          if (innerParsed?.error?.message) {
            return cleanErrorMessage(innerParsed.error.message);
          }
        } catch {
          return cleanErrorMessage(parsed.error.message);
        }
      }
    }
  } catch {
    // ignore json parse error
  }

  return rawMessage;
}

export interface ChatMessageRequest {
  role: "user" | "assistant" | "system";
  content: string;
  media?: {
    data: string;
    mimeType?: string;
  };
  imageBase64?: string;
}

export async function sendChatMessageStream(
  messages: ChatMessageRequest[],
  intelligenceLevel = "standard",
  callbacks: StreamChatCallbacks,
  contextOptions?: AngelContextPayload
): Promise<void> {
  try {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages,
        intelligenceLevel,
        contextOptions,
      }),
    });

    if (!response.ok) {
      // If streaming route returned error status, fallback to non-streaming route
      const fallbackResult = await sendChatMessageDirect(messages, intelligenceLevel, contextOptions);
      callbacks.onChunk(fallbackResult);
      callbacks.onDone(fallbackResult);
      return;
    }

    if (!response.body) {
      throw new Error("No response body received from Angel API.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6);
          if (dataStr === "[DONE]") {
            break;
          }
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.chunk) {
              fullText += parsed.chunk;
              callbacks.onChunk(parsed.chunk);
            } else if (parsed.error) {
              throw new Error(cleanErrorMessage(parsed.error));
            }
          } catch (e: any) {
            if (e.message && !e.message.includes("Unexpected token")) {
              throw e;
            }
          }
        }
      }
    }

    callbacks.onDone(fullText);
  } catch (error: any) {
    console.warn("Stream encounter issue, falling back to direct generation:", error);
    try {
      const fallbackText = await sendChatMessageDirect(messages, intelligenceLevel, contextOptions);
      callbacks.onChunk(fallbackText);
      callbacks.onDone(fallbackText);
    } catch (fallbackError: any) {
      const message = cleanErrorMessage(fallbackError?.message || error?.message || "Failed to generate response.");
      callbacks.onError(new Error(message));
    }
  }
}

export async function sendChatMessageDirect(
  messages: ChatMessageRequest[],
  intelligenceLevel = "standard",
  contextOptions?: AngelContextPayload
): Promise<string> {
  const res = await fetch("/api/chat/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages,
      intelligenceLevel,
      contextOptions,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const rawMsg = data.error || `Request failed with status ${res.status}`;
    throw new Error(cleanErrorMessage(rawMsg));
  }

  const data = await res.json();
  return data.reply || "";
}

export async function detectMemoryIntentOnServer(text: string): Promise<{
  isExplicitCommand: boolean;
  action: "remember" | "forget" | "none";
  content?: string;
  category?: string;
  importance?: string;
  confidence?: string;
}> {
  try {
    const res = await fetch("/api/memory/detect-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return { isExplicitCommand: false, action: "none" };
    return await res.json();
  } catch {
    return { isExplicitCommand: false, action: "none" };
  }
}

export async function extractMemoryCandidatesOnServer(
  userText: string,
  assistantReply?: string
): Promise<Array<{ content: string; category: string; importance: any; confidence: any }>> {
  try {
    const res = await fetch("/api/memory/extract-candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userText, assistantReply }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.candidates || [];
  } catch {
    return [];
  }
}

export async function summarizeConversationOnServer(
  messages: Array<{ role: string; content: string }>
): Promise<{
  summary: string;
  user_goals: string[];
  decisions_made: string[];
  unresolved_questions: string[];
  key_facts: string[];
  next_steps: string[];
} | null> {
  try {
    const res = await fetch("/api/memory/summarize-conversation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.summary || null;
  } catch {
    return null;
  }
}

export async function generateEmbeddingOnServer(text: string): Promise<number[]> {
  try {
    const res = await fetch("/api/memory/embed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.embedding || [];
  } catch {
    return [];
  }
}

