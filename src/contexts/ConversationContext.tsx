import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Conversation, Message, IntelligenceLevel, ConnectionStatus } from "../types";
import {
  fetchConversations,
  createNewConversation,
  updateConversationTitle,
  deleteConversation,
  fetchMessages,
  insertMessage,
} from "../services/conversationService";
import {
  sendChatMessageStream,
  detectMemoryIntentOnServer,
  extractMemoryCandidatesOnServer,
  summarizeConversationOnServer,
  generateEmbeddingOnServer,
  AngelContextPayload,
} from "../services/aiService";
import {
  retrieveRelevantMemories,
  addMemory,
  forgetMemory,
  getUserMemoryPreferences,
  getConversationSummary,
  saveConversationSummaryRecord,
  fetchProjects,
  fetchProjectMemories,
} from "../services/memoryService";
import { useAuth } from "./AuthContext";
import { useCapability } from "./CapabilityContext";

interface ConversationContextType {
  conversations: Conversation[];
  filteredConversations: Conversation[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;
  streamingMessage: string;
  error: string | null;
  searchQuery: string;
  connectionStatus: ConnectionStatus;
  intelligenceLevel: IntelligenceLevel;
  setIntelligenceLevel: (level: IntelligenceLevel) => void;
  setSearchQuery: (query: string) => void;
  selectConversation: (id: string) => Promise<void>;
  startNewConversation: () => Promise<string | null>;
  renameConversation: (id: string, newTitle: string) => Promise<void>;
  removeConversation: (id: string) => Promise<void>;
  sendMessage: (
    content: string,
    mediaAttachment?: { data: string; mimeType: string; name?: string; sourceType?: string },
    onResponseComplete?: (fullText: string) => void
  ) => Promise<void>;
  addLiveMessage: (role: "user" | "assistant", content: string, metadata?: Record<string, any>) => Promise<void>;
  clearError: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

function generateSmartTitle(content: string): string {
  const cleaned = content
    .replace(/^(\s*hello|\s*hi|\s*hey|\s*please|\s*can you|\s*could you|\s*i want to|\s*help me with)\s+/i, "")
    .trim();
  if (!cleaned) return "New Conversation";
  const firstSentence = cleaned.split(/[.?!:\n]/)[0].trim();
  if (firstSentence.length <= 36) {
    return firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  }
  return firstSentence.slice(0, 36).trim() + "...";
}

export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { handleNaturalTaskCommand, orchestrateAndRunTask } = useCapability();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("online");
  const [intelligenceLevel, setIntelligenceLevel] = useState<IntelligenceLevel>("standard");

  const currentUserId = user?.id || "guest-session";

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setConnectionStatus("online");
    const handleOffline = () => setConnectionStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Load user or guest conversations
  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const list = await fetchConversations(currentUserId);
      setConversations(list);
      // Do not auto-resume past chat on fresh app open (new chats open fresh like ChatGPT)
    } catch (err: any) {
      console.error("Failed to load conversations:", err);
      setError("Unable to retrieve conversations.");
    } finally {
      setIsLoadingConversations(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    loadConversations();
  }, [user]);

  // Load messages whenever activeConversationId changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let isMounted = true;
    const loadMsgs = async () => {
      setIsLoadingMessages(true);
      try {
        const msgs = await fetchMessages(activeConversationId);
        if (isMounted) {
          setMessages(msgs);
        }
      } catch (err: any) {
        console.error("Failed to load messages:", err);
        if (isMounted) setError("Unable to load messages.");
      } finally {
        if (isMounted) setIsLoadingMessages(false);
      }
    };

    loadMsgs();
    return () => {
      isMounted = false;
    };
  }, [activeConversationId]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) || null;

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const selectConversation = async (id: string) => {
    if (isStreaming) return;
    setActiveConversationId(id);
    setError(null);
  };

  const startNewConversation = async (): Promise<string | null> => {
    if (isStreaming) return null;

    setConnectionStatus("syncing");
    try {
      const newConv = await createNewConversation(currentUserId, "New Conversation");
      if (newConv) {
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        setMessages([]);
        setConnectionStatus("online");
        return newConv.id;
      }
    } catch (err: any) {
      console.error("Error creating conversation:", err);
      setError("Could not create new conversation.");
    } finally {
      setConnectionStatus("online");
    }
    return null;
  };

  const renameConversation = async (id: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      await updateConversationTitle(id, newTitle.trim());
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: newTitle.trim(), updated_at: new Date().toISOString() } : c))
      );
    } catch (e) {
      console.error("Failed to rename conversation:", e);
    }
  };

  const removeConversation = async (id: string) => {
    setConnectionStatus("syncing");
    try {
      await deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err: any) {
      console.error("Error deleting conversation:", err);
      setError("Could not delete conversation.");
    } finally {
      setConnectionStatus("online");
    }
  };

  const sendMessage = async (
    content: string,
    mediaAttachment?: { data: string; mimeType: string; name?: string; sourceType?: string },
    onResponseComplete?: (fullText: string) => void
  ) => {
    if ((!content.trim() && !mediaAttachment) || isStreaming) return;

    setError(null);
    let targetConvId = activeConversationId;

    // If no active conversation, create one automatically
    if (!targetConvId) {
      const createdId = await startNewConversation();
      if (!createdId) {
        setError("Failed to initialize conversation.");
        return;
      }
      targetConvId = createdId;
    }

    const optimisticUserMsg: Message = {
      id: "temp-user-" + Date.now(),
      conversation_id: targetConvId,
      user_id: currentUserId,
      role: "user",
      content: content.trim() || (mediaAttachment ? `[Visual Content: ${mediaAttachment.name || "Attachment"}]` : ""),
      created_at: new Date().toISOString(),
      metadata: mediaAttachment
        ? {
            hasMedia: true,
            mediaName: mediaAttachment.name,
            mediaType: mediaAttachment.mimeType,
            sourceType: mediaAttachment.sourceType,
            previewUrl: mediaAttachment.data,
          }
        : undefined,
    };

    // Append user message to UI immediately
    setMessages((prev) => [...prev, optimisticUserMsg]);
    setIsStreaming(true);
    setStreamingMessage("");
    setConnectionStatus("syncing");

    try {
      // 1. Persist user message to Supabase/localStorage
      const savedUserMsg = await insertMessage(
        targetConvId,
        currentUserId,
        "user",
        optimisticUserMsg.content,
        optimisticUserMsg.metadata
      );
      if (savedUserMsg) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticUserMsg.id ? savedUserMsg : m)));
      }

      // Check for natural control commands ("Do it", "Send it", "Stop", "Cancel that", "Go ahead", "Pause", "Resume")
      const naturalCmd = await handleNaturalTaskCommand(content.trim());
      if (naturalCmd.handled && naturalCmd.reply) {
        setIsStreaming(false);
        setStreamingMessage("");
        setConnectionStatus("online");
        const savedAssistantMsg = await insertMessage(
          targetConvId,
          currentUserId,
          "assistant",
          naturalCmd.reply
        );
        if (savedAssistantMsg) {
          setMessages((prev) => [...prev, savedAssistantMsg]);
        }
        onResponseComplete?.(naturalCmd.reply);
        return;
      }

      // Update conversation title if first message
      if (messages.length === 0) {
        const generatedTitle = generateSmartTitle(content);
        setConversations((prev) =>
          prev.map((c) => (c.id === targetConvId ? { ...c, title: generatedTitle, updated_at: new Date().toISOString() } : c))
        );
        updateConversationTitle(targetConvId, generatedTitle).catch(() => {});
      }

      // 2. STAGE 3 CONTEXT & MEMORY RETRIEVAL PIPELINE
      const memoryPrefs = getUserMemoryPreferences(currentUserId);
      const isMemoryActive = memoryPrefs.memory_enabled;

      // Check for explicit memory intent (remember/forget)
      const explicitIntent = await detectMemoryIntentOnServer(content.trim());
      if (isMemoryActive && explicitIntent.isExplicitCommand) {
        if (explicitIntent.action === "remember" && explicitIntent.content) {
          addMemory(currentUserId, {
            content: explicitIntent.content,
            category: (explicitIntent.category as any) || "preference",
            importance: (explicitIntent.importance as any) || "high",
            confidence: (explicitIntent.confidence as any) || "high",
            source: "user_explicit",
            conversation_id: targetConvId,
          }).catch((err) => console.warn("[Memory Intent] Remember error:", err));
        } else if (explicitIntent.action === "forget") {
          forgetMemory(currentUserId, {
            keyword: explicitIntent.content || content.trim(),
            contentSubstr: explicitIntent.content,
          }).catch((err) => console.warn("[Memory Intent] Forget error:", err));
        }
      }

      // Contextual Memory Retrieval
      let relevantMemories: Array<{ content: string; category?: string; importance?: string }> = [];
      let activeProjectData: any = undefined;
      let convSummaryData: any = undefined;

      if (isMemoryActive) {
        try {
          // Retrieve top relevant memories
          const queryEmbedding = await generateEmbeddingOnServer(content.trim()).catch(() => []);
          const searchResults = await retrieveRelevantMemories(currentUserId, content.trim(), {
            limit: 6,
            minScore: 0.15,
            queryEmbedding,
          });
          relevantMemories = searchResults.map((r) => ({
            content: r.memory.content,
            category: r.memory.category,
            importance: r.memory.importance,
          }));

          // Retrieve active project context if present
          const projects = await fetchProjects(currentUserId);
          const activeProj = projects.find((p) => p.status === "active");
          if (activeProj) {
            const projMemories = await fetchProjectMemories(activeProj.id);
            activeProjectData = {
              name: activeProj.name,
              description: activeProj.description,
              goals: activeProj.goals,
              memories: projMemories.map((pm) => ({ content: pm.content, category: pm.category })),
            };
          }

          // Retrieve conversation summary if conversation is extended
          if (messages.length >= 8) {
            const summary = await getConversationSummary(targetConvId);
            if (summary) {
              convSummaryData = {
                summary: summary.summary,
                decisions_made: summary.decisions_made,
                key_facts: summary.key_facts,
                user_goals: summary.user_goals,
                next_steps: summary.next_steps,
              };
            }
          }
        } catch (memErr) {
          console.warn("[ConversationContext] Memory context preparation warning:", memErr);
        }
      }

      const contextOptions: AngelContextPayload = {
        preferredName: memoryPrefs.preferred_name || user?.name || user?.display_name || user?.username || undefined,
        communicationStyle: memoryPrefs.communication_style,
        customInstructions: memoryPrefs.custom_instructions,
        occupation: memoryPrefs.occupation,
        interests: memoryPrefs.interests,
        memories: isMemoryActive ? relevantMemories : undefined,
        activeProject: activeProjectData,
        conversationSummary: convSummaryData,
      };

      // 3. Prepare message window history for Gemini
      const fullHistory = [...messages, optimisticUserMsg];
      // If long conversation, provide summary context + last 12 messages to keep window tight & fast
      const recentWindow = fullHistory.length > 14 ? fullHistory.slice(-12) : fullHistory;
      const conversationHistory = recentWindow.map((m) => ({
        role: m.role,
        content: m.content,
        media:
          m.id === optimisticUserMsg.id && mediaAttachment
            ? {
                data: mediaAttachment.data,
                mimeType: mediaAttachment.mimeType,
              }
            : m.metadata?.previewUrl
            ? {
                data: m.metadata.previewUrl,
                mimeType: m.metadata.mediaType || "image/png",
              }
            : undefined,
      }));

      // 4. Request Angel response via streaming
      let accumulatedAssistantText = "";

      await sendChatMessageStream(
        conversationHistory,
        intelligenceLevel,
        {
          onChunk: (chunk: string) => {
            accumulatedAssistantText += chunk;
            setStreamingMessage(accumulatedAssistantText);
          },
          onDone: async (finalResponseText: string) => {
            setIsStreaming(false);
            setStreamingMessage("");
            setConnectionStatus("online");

            const responseContent = finalResponseText || accumulatedAssistantText || "I am here with you.";

            // 5. Save Assistant message to Supabase/localStorage
            const savedAssistantMsg = await insertMessage(
              targetConvId!,
              currentUserId,
              "assistant",
              responseContent,
              { model: "gemini-3.7-flash", intelligenceLevel }
            );

            if (savedAssistantMsg) {
              setMessages((prev) => [...prev, savedAssistantMsg]);
            } else {
              const fallbackAssistantMsg: Message = {
                id: "temp-assistant-" + Date.now(),
                conversation_id: targetConvId!,
                user_id: currentUserId,
                role: "assistant",
                content: responseContent,
                created_at: new Date().toISOString(),
              };
              setMessages((prev) => [...prev, fallbackAssistantMsg]);
            }

            // Refresh conversation list order
            setConversations((prev) => {
              const current = prev.find((c) => c.id === targetConvId);
              if (!current) return prev;
              const updatedList = prev.filter((c) => c.id !== targetConvId);
              return [{ ...current, updated_at: new Date().toISOString() }, ...updatedList];
            });

            // Trigger completion callback (e.g. for spoken voice in live session)
            onResponseComplete?.(responseContent);

            // 6. STAGE 3 BACKGROUND INTELLIGENCE (Implicit Extraction & Summarization)
            if (isMemoryActive && memoryPrefs.auto_extract_memory && !explicitIntent.isExplicitCommand) {
              setTimeout(async () => {
                try {
                  const candidates = await extractMemoryCandidatesOnServer(content.trim(), responseContent);
                  for (const candidate of candidates) {
                    await addMemory(currentUserId, {
                      content: candidate.content,
                      category: candidate.category as any,
                      importance: candidate.importance,
                      confidence: candidate.confidence,
                      source: "conversation",
                      conversation_id: targetConvId,
                    });
                  }
                } catch (bgErr) {
                  console.warn("[Background Memory Extraction] Notice:", bgErr);
                }
              }, 150);
            }

            // Periodic Summarization (e.g. at 8, 16, 24 messages)
            if (fullHistory.length >= 8 && fullHistory.length % 6 === 0) {
              setTimeout(async () => {
                try {
                  const summaryRes = await summarizeConversationOnServer(
                    fullHistory.map((m) => ({ role: m.role, content: m.content }))
                  );
                  if (summaryRes) {
                    await saveConversationSummaryRecord({
                      conversation_id: targetConvId!,
                      user_id: currentUserId,
                      summary: summaryRes.summary,
                      user_goals: summaryRes.user_goals || [],
                      decisions_made: summaryRes.decisions_made || [],
                      unresolved_questions: summaryRes.unresolved_questions || [],
                      key_facts: summaryRes.key_facts || [],
                      next_steps: summaryRes.next_steps || [],
                      message_count: fullHistory.length + 1,
                    });
                  }
                } catch (summErr) {
                  console.warn("[Background Conversation Summarization] Notice:", summErr);
                }
              }, 300);
            }
          },
          onError: (err: Error) => {
            console.error("Angel response generation error:", err);
            setIsStreaming(false);
            setStreamingMessage("");
            setConnectionStatus("online");
            setError(err.message || "Angel could not generate a response. Please try again.");
          },
        },
        contextOptions
      );
    } catch (err: any) {
      console.error("Message lifecycle error:", err);
      setIsStreaming(false);
      setStreamingMessage("");
      setConnectionStatus("online");
      setError(err.message || "An unexpected error occurred while sending your message.");
    }
  };

  const addLiveMessage = async (
    role: "user" | "assistant",
    content: string,
    metadata: Record<string, any> = {}
  ) => {
    if (!content.trim()) return;
    let targetConvId = activeConversationId;
    if (!targetConvId) {
      targetConvId = await startNewConversation();
      if (!targetConvId) return;
    }

    const optimisticMsg: Message = {
      id: `live-${role}-${Date.now()}`,
      conversation_id: targetConvId,
      user_id: currentUserId,
      role,
      content: content.trim(),
      metadata: { modality: "voice", ...metadata },
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    setConnectionStatus("syncing");

    try {
      const savedMsg = await insertMessage(
        targetConvId,
        currentUserId,
        role,
        content.trim(),
        { modality: "voice", ...metadata }
      );
      if (savedMsg) {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMsg.id ? savedMsg : m)));
      }

      if (messages.length === 0 && role === "user") {
        const generatedTitle = generateSmartTitle(content);
        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId ? { ...c, title: generatedTitle, updated_at: new Date().toISOString() } : c
          )
        );
        updateConversationTitle(targetConvId, generatedTitle).catch(() => {});
      }
    } catch (err) {
      console.error("[ConversationContext] Failed to persist live message:", err);
    } finally {
      setConnectionStatus("online");
    }
  };

  const clearError = () => setError(null);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        filteredConversations,
        activeConversationId,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        isStreaming,
        streamingMessage,
        error,
        searchQuery,
        connectionStatus,
        intelligenceLevel,
        setIntelligenceLevel,
        setSearchQuery,
        selectConversation,
        startNewConversation,
        renameConversation,
        removeConversation,
        sendMessage,
        addLiveMessage,
        clearError,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

export const useConversation = () => {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error("useConversation must be used within a ConversationProvider");
  }
  return context;
};
