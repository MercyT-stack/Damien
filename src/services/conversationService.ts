import { getSupabase } from "./supabaseClient";
import { Conversation, Message } from "../types";

const LOCAL_CONVERSATIONS_KEY = "angel_local_conversations";
const LOCAL_MESSAGES_KEY = "angel_local_messages";

// Cache state to avoid repeated noisy console warnings if tables are unprovisioned
let supabaseTablesUnavailable = false;

// ---------------------------------------------------------------------------
// Local Storage Helper Utilities
// ---------------------------------------------------------------------------

function getLocalConversations(userId: string): Conversation[] {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
    if (!raw) return [];
    const all: Conversation[] = JSON.parse(raw);
    return all
      .filter((c) => (c.user_id === userId || userId === "guest-session" || c.user_id === "guest-session") && !c.is_archived)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  } catch {
    return [];
  }
}

function saveLocalConversation(conv: Conversation): void {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
    const all: Conversation[] = raw ? JSON.parse(raw) : [];
    const index = all.findIndex((c) => c.id === conv.id);
    if (index !== -1) {
      all[index] = conv;
    } else {
      all.unshift(conv);
    }
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn("Failed to write to local conversation cache:", err);
  }
}

function updateLocalConversationTitle(conversationId: string, title: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
    if (!raw) return;
    const all: Conversation[] = JSON.parse(raw);
    const now = new Date().toISOString();
    const updated = all.map((c) => (c.id === conversationId ? { ...c, title, updated_at: now } : c));
    localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn("Failed to update local conversation title:", err);
  }
}

function deleteLocalConversation(conversationId: string): void {
  try {
    const raw = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
    if (raw) {
      const all: Conversation[] = JSON.parse(raw);
      const filtered = all.filter((c) => c.id !== conversationId);
      localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(filtered));
    }
    const rawMsgs = localStorage.getItem(LOCAL_MESSAGES_KEY);
    if (rawMsgs) {
      const allMsgs: Message[] = JSON.parse(rawMsgs);
      const filteredMsgs = allMsgs.filter((m) => m.conversation_id !== conversationId);
      localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(filteredMsgs));
    }
  } catch (err) {
    console.warn("Failed to remove local conversation:", err);
  }
}

function getLocalMessages(conversationId: string): Message[] {
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY);
    if (!raw) return [];
    const all: Message[] = JSON.parse(raw);
    return all
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } catch {
    return [];
  }
}

function saveLocalMessage(msg: Message): void {
  try {
    const raw = localStorage.getItem(LOCAL_MESSAGES_KEY);
    const all: Message[] = raw ? JSON.parse(raw) : [];
    const existingIdx = all.findIndex((m) => m.id === msg.id);
    if (existingIdx !== -1) {
      all[existingIdx] = msg;
    } else {
      all.push(msg);
    }
    localStorage.setItem(LOCAL_MESSAGES_KEY, JSON.stringify(all));

    // Update parent conversation timestamp
    const rawConvs = localStorage.getItem(LOCAL_CONVERSATIONS_KEY);
    if (rawConvs) {
      const allConvs: Conversation[] = JSON.parse(rawConvs);
      const convIndex = allConvs.findIndex((c) => c.id === msg.conversation_id);
      if (convIndex !== -1) {
        allConvs[convIndex].updated_at = msg.created_at;
        if (msg.role === "user" && allConvs[convIndex].title === "New Conversation") {
          const generatedTitle = msg.content.slice(0, 32).trim() + (msg.content.length > 32 ? "..." : "");
          allConvs[convIndex].title = generatedTitle;
        }
        localStorage.setItem(LOCAL_CONVERSATIONS_KEY, JSON.stringify(allConvs));
      }
    }
  } catch (err) {
    console.warn("Failed to save local message:", err);
  }
}

// ---------------------------------------------------------------------------
// Main Service Functions (Dual-Layer: Supabase with Local Storage Fallback)
// ---------------------------------------------------------------------------

export async function fetchConversations(userId: string): Promise<Conversation[]> {
  const localList = getLocalConversations(userId);
  const supabase = getSupabase();

  if (!supabase || supabaseTablesUnavailable) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("updated_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        if (!supabaseTablesUnavailable) {
          console.info("[Angel Storage] Supabase tables are not yet created in the schema cache. Using local persistent storage.");
          supabaseTablesUnavailable = true;
        }
      } else {
        console.warn("[Angel Storage] Supabase fetch error, using local cache:", error.message || error);
      }
      return localList;
    }

    if (Array.isArray(data)) {
      // Sync fetched cloud conversations to local cache
      data.forEach((c) => saveLocalConversation(c as Conversation));
      return data as Conversation[];
    }

    return localList;
  } catch (err) {
    console.warn("[Angel Storage] Network or Supabase error during fetchConversations:", err);
    return localList;
  }
}

export async function createNewConversation(userId: string, title = "New Conversation"): Promise<Conversation | null> {
  const now = new Date().toISOString();
  const fallbackId = "conv-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

  const localConv: Conversation = {
    id: fallbackId,
    user_id: userId,
    title,
    is_archived: false,
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabase();
  if (!supabase || supabaseTablesUnavailable) {
    saveLocalConversation(localConv);
    return localConv;
  }

  try {
    const { data, error } = await supabase
      .from("conversations")
      .insert({
        id: fallbackId,
        user_id: userId,
        title,
        is_archived: false,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        supabaseTablesUnavailable = true;
      }
      saveLocalConversation(localConv);
      return localConv;
    }

    const created = data as Conversation;
    saveLocalConversation(created);
    return created;
  } catch (err) {
    console.warn("[Angel Storage] Falling back to local conversation creation:", err);
    saveLocalConversation(localConv);
    return localConv;
  }
}

export async function updateConversationTitle(conversationId: string, title: string): Promise<void> {
  updateLocalConversationTitle(conversationId, title);

  const supabase = getSupabase();
  if (!supabase || supabaseTablesUnavailable) {
    return;
  }

  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("conversations")
      .update({ title, updated_at: now })
      .eq("id", conversationId);

    if (error && (error.code === "PGRST205" || error.message?.includes("schema cache"))) {
      supabaseTablesUnavailable = true;
    }
  } catch (err) {
    console.warn("[Angel Storage] Could not update title in Supabase:", err);
  }
}

export async function deleteConversation(conversationId: string): Promise<void> {
  deleteLocalConversation(conversationId);

  const supabase = getSupabase();
  if (!supabase || supabaseTablesUnavailable) {
    return;
  }

  try {
    const { error } = await supabase.from("conversations").delete().eq("id", conversationId);
    if (error && (error.code === "PGRST205" || error.message?.includes("schema cache"))) {
      supabaseTablesUnavailable = true;
    }
  } catch (err) {
    console.warn("[Angel Storage] Could not delete from Supabase:", err);
  }
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const localMsgs = getLocalMessages(conversationId);
  const supabase = getSupabase();

  if (!supabase || supabaseTablesUnavailable) {
    return localMsgs;
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        supabaseTablesUnavailable = true;
      }
      return localMsgs;
    }

    if (Array.isArray(data)) {
      data.forEach((m) => saveLocalMessage(m as Message));
      return data as Message[];
    }

    return localMsgs;
  } catch (err) {
    console.warn("[Angel Storage] Could not fetch messages from Supabase:", err);
    return localMsgs;
  }
}

export async function insertMessage(
  conversationId: string,
  userId: string,
  role: "user" | "assistant" | "system",
  content: string,
  metadata: Record<string, any> = {}
): Promise<Message | null> {
  const now = new Date().toISOString();
  const localId = "msg-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);

  const localMsg: Message = {
    id: localId,
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
    metadata,
    created_at: now,
  };

  const supabase = getSupabase();
  if (!supabase || supabaseTablesUnavailable) {
    saveLocalMessage(localMsg);
    return localMsg;
  }

  try {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        id: localId,
        conversation_id: conversationId,
        user_id: userId,
        role,
        content,
        metadata,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        supabaseTablesUnavailable = true;
      }
      saveLocalMessage(localMsg);
      return localMsg;
    }

    const saved = data as Message;
    saveLocalMessage(saved);

    // Update conversation timestamp in Supabase
    await supabase
      .from("conversations")
      .update({ updated_at: now })
      .eq("id", conversationId);

    return saved;
  } catch (err) {
    console.warn("[Angel Storage] Falling back to local message save:", err);
    saveLocalMessage(localMsg);
    return localMsg;
  }
}
