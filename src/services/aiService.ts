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
  const lower = String(rawMessage).toLowerCase();

  if (lower.includes("503") || lower.includes("high demand") || lower.includes("unavailable") || lower.includes("overloaded")) {
    return "Angel is experiencing high demand right now. Please try again in a moment.";
  }
  if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted")) {
    return "Angel has temporarily reached its AI request limit. Please try again shortly.";
  }

  try {
    if (typeof rawMessage === "string" && rawMessage.includes("{") && rawMessage.includes("}")) {
      const startIdx = rawMessage.indexOf("{");
      const parsed = JSON.parse(rawMessage.slice(startIdx));
      if (parsed?.error?.message) return cleanErrorMessage(parsed.error.message);
    }
  } catch {
    // Keep the original message when it is not JSON.
  }

  return rawMessage;
}

export interface ChatMessageRequest {
  role: "user" | "assistant" | "system";
  content: string;
  media?: { data: string; mimeType?: string };
  imageBase64?: string;
}

export async function sendChatMessageStream(
  messages: ChatMessageRequest[],
  intelligenceLevel = "standard",
  callbacks: StreamChatCallbacks,
  contextOptions?: AngelContextPayload,
): Promise<void> {
  try {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ messages, intelligenceLevel, contextOptions }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Angel API returned HTTP ${response.status}.`);
    }

    if (!response.body) throw new Error("Angel returned no streaming response body.");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullText = "";
    let buffer = "";
    let completed = false;

    while (!completed) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split("\n\n");
      buffer = events.pop() || "";

      for (const event of events) {
        const line = event.split("\n").find((entry) => entry.startsWith("data: "));
        if (!line) continue;

        const dataStr = line.slice(6);
        if (dataStr === "[DONE]") {
          completed = true;
          break;
        }

        try {
          const parsed = JSON.parse(dataStr);
          if (parsed.chunk) {
            fullText += parsed.chunk;
            callbacks.onChunk(parsed.chunk);
          }
          if (parsed.error) throw new Error(cleanErrorMessage(parsed.error));
        } catch (error: any) {
          if (error instanceof Error && error.message) throw error;
        }
      }
    }

    if (!fullText) throw new Error("Angel completed the request without returning any text.");
    callbacks.onDone(fullText);
  } catch (error: any) {
    console.warn("Angel streaming request failed:", error);
    callbacks.onError(new Error(cleanErrorMessage(error?.message || "Failed to generate Angel's response.")));
  }
}

// Kept for callers that explicitly need a non-streamed response.
export async function sendChatMessageDirect(
  messages: ChatMessageRequest[],
  intelligenceLevel = "standard",
  contextOptions?: AngelContextPayload,
): Promise<string> {
  const res = await fetch("/api/chat/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, intelligenceLevel, contextOptions }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(cleanErrorMessage(data.error || `Request failed with status ${res.status}`));
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

export async function extractMemoryCandidatesOnServer(userText: string, assistantReply?: string): Promise<Array<{ content: string; category: string; importance: any; confidence: any }>> {
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

export async function summarizeConversationOnServer(messages: Array<{ role: string; content: string }>): Promise<any | null> {
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
