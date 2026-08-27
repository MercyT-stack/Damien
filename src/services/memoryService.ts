import { getSupabase } from "./supabaseClient";
import {
  MemoryItem,
  MemoryCategory,
  MemoryConfidence,
  MemoryImportance,
  MemorySource,
  MemoryExpirationType,
  ProjectItem,
  ProjectMemoryItem,
  ConversationSummary,
  UserMemoryPreferences,
  MemorySearchResult,
  MemoryDiagnostics,
} from "../types";

// ============================================================================
// LOCAL STORAGE KEYS (Fallback & Offline Tolerance)
// ============================================================================
const LOCAL_MEMORIES_KEY = "angel_local_memories_v3";
const LOCAL_PROJECTS_KEY = "angel_local_projects_v3";
const LOCAL_PROJECT_MEMORIES_KEY = "angel_local_project_memories_v3";
const LOCAL_SUMMARIES_KEY = "angel_local_conversation_summaries_v3";
const LOCAL_MEMORY_PREFS_KEY = "angel_local_user_memory_prefs_v3";

let supabaseTablesUnavailable = false;

// Default Memory Preferences
export const DEFAULT_MEMORY_PREFERENCES: UserMemoryPreferences = {
  user_id: "guest-session",
  memory_enabled: true,
  auto_extract_memory: true,
  preferred_name: "",
  communication_style: "balanced",
  custom_instructions: "",
  occupation: "Software Architect & Designer",
  interests: ["AI Systems", "Real-Time Audio", "Design"],
};

// ============================================================================
// LOCAL STORAGE PRIMITIVES
// ============================================================================

function getStoredMemories(userId: string): MemoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_MEMORIES_KEY);
    if (!raw) return [];
    const all: MemoryItem[] = JSON.parse(raw);
    return all.filter((m) => m.user_id === userId || userId === "guest-session" || m.user_id === "guest-session");
  } catch {
    return [];
  }
}

function saveStoredMemories(memories: MemoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_MEMORIES_KEY, JSON.stringify(memories));
  } catch (err) {
    console.warn("[Angel Memory] Local memory storage write error:", err);
  }
}

function getStoredProjects(userId: string): ProjectItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!raw) return [];
    const all: ProjectItem[] = JSON.parse(raw);
    return all.filter((p) => p.user_id === userId || userId === "guest-session" || p.user_id === "guest-session");
  } catch {
    return [];
  }
}

function saveStoredProjects(projects: ProjectItem[]): void {
  try {
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(projects));
  } catch (err) {
    console.warn("[Angel Memory] Local project storage write error:", err);
  }
}

function getStoredProjectMemories(projectId: string): ProjectMemoryItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_PROJECT_MEMORIES_KEY);
    if (!raw) return [];
    const all: ProjectMemoryItem[] = JSON.parse(raw);
    return all.filter((pm) => pm.project_id === projectId);
  } catch {
    return [];
  }
}

function saveStoredProjectMemories(items: ProjectMemoryItem[]): void {
  try {
    localStorage.setItem(LOCAL_PROJECT_MEMORIES_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn("[Angel Memory] Local project memory write error:", err);
  }
}

function getStoredSummaries(): Record<string, ConversationSummary> {
  try {
    const raw = localStorage.getItem(LOCAL_SUMMARIES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStoredSummary(summary: ConversationSummary): void {
  try {
    const all = getStoredSummaries();
    all[summary.conversation_id] = summary;
    localStorage.setItem(LOCAL_SUMMARIES_KEY, JSON.stringify(all));
  } catch (err) {
    console.warn("[Angel Memory] Local summary storage error:", err);
  }
}

// ============================================================================
// COSINE SIMILARITY & TEXT RELEVANCE RANKING
// ============================================================================

export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function calculateKeywordScore(query: string, content: string, category: string): number {
  const qTokens = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  const cTokens = content.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
  if (qTokens.length === 0 || cTokens.length === 0) return 0;

  let matches = 0;
  for (const qt of qTokens) {
    if (cTokens.includes(qt) || content.toLowerCase().includes(qt)) {
      matches += 1;
    }
  }

  let score = matches / Math.max(qTokens.length, 1);
  if (query.toLowerCase().includes(category.toLowerCase())) {
    score += 0.25;
  }
  return score;
}

// ============================================================================
// MEMORY CORE SERVICE
// ============================================================================

export async function fetchAllMemories(userId: string): Promise<MemoryItem[]> {
  const localList = getStoredMemories(userId);
  const supabase = getSupabase();

  if (!supabase || supabaseTablesUnavailable) {
    return localList.filter((m) => m.is_active);
  }

  try {
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache") || error.code === "42P01") {
        supabaseTablesUnavailable = true;
      }
      return localList.filter((m) => m.is_active);
    }

    if (Array.isArray(data)) {
      // Sync cloud data to local cache
      const cloudMemories = data as MemoryItem[];
      const mergedMap = new Map<string, MemoryItem>();
      localList.forEach((m) => mergedMap.set(m.id, m));
      cloudMemories.forEach((m) => mergedMap.set(m.id, m));
      const combined = Array.from(mergedMap.values());
      saveStoredMemories(combined);
      return cloudMemories;
    }

    return localList.filter((m) => m.is_active);
  } catch (err) {
    console.warn("[Angel Memory] Cloud fetch error, using local memories:", err);
    return localList.filter((m) => m.is_active);
  }
}

/**
 * Check if a new memory fact conflicts with or duplicates an existing memory
 */
export function findMemoryConflictOrDuplicate(
  memories: MemoryItem[],
  newContent: string,
  category: MemoryCategory
): { duplicate?: MemoryItem; conflict?: MemoryItem } {
  const cleanNew = newContent.toLowerCase().trim();

  for (const m of memories) {
    if (!m.is_active) continue;
    const cleanExisting = m.content.toLowerCase().trim();

    // Exact or near-identical duplicate
    if (cleanNew === cleanExisting || cleanExisting.includes(cleanNew) || cleanNew.includes(cleanExisting)) {
      return { duplicate: m };
    }

    // Direct category conflict (e.g. "prefer dark mode" vs "prefer light mode", or nickname update)
    if (m.category === category) {
      if (
        (cleanNew.includes("dark mode") && cleanExisting.includes("light mode")) ||
        (cleanNew.includes("light mode") && cleanExisting.includes("dark mode")) ||
        (cleanNew.includes("call me") && cleanExisting.includes("call me")) ||
        (cleanNew.includes("name is") && cleanExisting.includes("name is")) ||
        (cleanNew.includes("nickname is") && cleanExisting.includes("nickname is"))
      ) {
        return { conflict: m };
      }
    }
  }

  return {};
}

/**
 * Store a new long-term memory with duplicate prevention and conflict handling
 */
export async function addMemory(
  userId: string,
  params: {
    content: string;
    category?: MemoryCategory;
    confidence?: MemoryConfidence;
    importance?: MemoryImportance;
    source?: MemorySource;
    expiration_type?: MemoryExpirationType;
    expires_at?: string | null;
    conversation_id?: string | null;
    project_id?: string | null;
    metadata?: Record<string, any>;
    embedding?: number[] | null;
  }
): Promise<{ memory: MemoryItem; action: "created" | "updated" | "duplicate" }> {
  const now = new Date().toISOString();
  const existingMemories = getStoredMemories(userId);

  const category = params.category || "preference";
  const { duplicate, conflict } = findMemoryConflictOrDuplicate(existingMemories, params.content, category);

  // If exact duplicate exists, touch updated_at and return existing
  if (duplicate) {
    duplicate.last_confirmed_at = now;
    duplicate.updated_at = now;
    saveStoredMemories(existingMemories);
    return { memory: duplicate, action: "duplicate" };
  }

  // If a conflicting preference/fact exists, update the existing memory (conflict resolution)
  if (conflict) {
    conflict.content = params.content.trim();
    conflict.importance = params.importance || conflict.importance;
    conflict.confidence = params.confidence || conflict.confidence;
    conflict.source = params.source || conflict.source;
    conflict.updated_at = now;
    conflict.last_confirmed_at = now;
    saveStoredMemories(existingMemories);

    const supabase = getSupabase();
    if (supabase && !supabaseTablesUnavailable) {
      Promise.resolve(
        supabase
          .from("memories")
          .update({
            content: conflict.content,
            importance: conflict.importance,
            confidence: conflict.confidence,
            source: conflict.source,
            updated_at: now,
            last_confirmed_at: now,
          })
          .eq("id", conflict.id)
      )
        .then(({ error }: any) => {
          if (error && (error.code === "PGRST205" || error.message?.includes("schema cache"))) {
            supabaseTablesUnavailable = true;
          }
        })
        .catch(() => {});
    }

    return { memory: conflict, action: "updated" };
  }

  const memoryId = "mem-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7);
  const newMemory: MemoryItem = {
    id: memoryId,
    user_id: userId,
    content: params.content.trim(),
    category: params.category || "preference",
    confidence: params.confidence || "high",
    importance: params.importance || "normal",
    source: params.source || "user_explicit",
    expiration_type: params.expiration_type || "persistent",
    expires_at: params.expires_at || null,
    is_active: true,
    conversation_id: params.conversation_id || null,
    project_id: params.project_id || null,
    last_used_at: now,
    last_confirmed_at: now,
    metadata: params.metadata || {},
    embedding: params.embedding || null,
    created_at: now,
    updated_at: now,
  };

  // Local Save
  existingMemories.unshift(newMemory);
  saveStoredMemories(existingMemories);

  // Cloud Save
  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    try {
      const { data, error } = await supabase
        .from("memories")
        .insert({
          id: newMemory.id,
          user_id: newMemory.user_id,
          content: newMemory.content,
          category: newMemory.category,
          confidence: newMemory.confidence,
          importance: newMemory.importance,
          source: newMemory.source,
          expiration_type: newMemory.expiration_type,
          expires_at: newMemory.expires_at,
          is_active: true,
          conversation_id: newMemory.conversation_id,
          project_id: newMemory.project_id,
          metadata: newMemory.metadata,
          embedding: newMemory.embedding || [],
        })
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
          supabaseTablesUnavailable = true;
        }
      } else if (data) {
        return { memory: data as MemoryItem, action: "created" };
      }
    } catch (err) {
      console.warn("[Angel Memory] Cloud insert notice, preserved locally:", err);
    }
  }

  return { memory: newMemory, action: "created" };
}

/**
 * Forget/Remove memories by explicit text query or by specific ID
 */
export async function forgetMemory(
  userId: string,
  target: { id?: string; keyword?: string; contentSubstr?: string }
): Promise<{ count: number; forgotten: MemoryItem[] }> {
  const all = getStoredMemories(userId);
  const forgotten: MemoryItem[] = [];
  const now = new Date().toISOString();

  const updated = all.map((m) => {
    let matches = false;
    if (target.id && m.id === target.id) {
      matches = true;
    } else if (target.keyword && m.content.toLowerCase().includes(target.keyword.toLowerCase())) {
      matches = true;
    } else if (target.contentSubstr && m.content.toLowerCase().includes(target.contentSubstr.toLowerCase())) {
      matches = true;
    }

    if (matches && m.is_active) {
      forgotten.push(m);
      return { ...m, is_active: false, updated_at: now };
    }
    return m;
  });

  saveStoredMemories(updated);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable && forgotten.length > 0) {
    const ids = forgotten.map((f) => f.id);
    Promise.resolve(
      supabase
        .from("memories")
        .update({ is_active: false, updated_at: now })
        .in("id", ids)
    )
      .then(({ error }: any) => {
        if (error && (error.code === "PGRST205" || error.message?.includes("schema cache"))) {
          supabaseTablesUnavailable = true;
        }
      })
      .catch(() => {});
  }

  return { count: forgotten.length, forgotten };
}

/**
 * Permanently delete a single memory
 */
export async function deleteMemoryPermanently(userId: string, memoryId: string): Promise<boolean> {
  const all = getStoredMemories(userId);
  const filtered = all.filter((m) => m.id !== memoryId);
  saveStoredMemories(filtered);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    try {
      await supabase.from("memories").delete().eq("id", memoryId);
    } catch (e) {
      console.warn("[Angel Memory] Cloud deletion error:", e);
    }
  }

  return true;
}

/**
 * Clear all memories for a user
 */
export async function clearAllMemories(userId: string): Promise<boolean> {
  const all = getStoredMemories(userId);
  const remaining = all.filter((m) => m.user_id !== userId && userId !== "guest-session");
  saveStoredMemories(remaining);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    try {
      await supabase.from("memories").delete().eq("user_id", userId);
    } catch (e) {
      console.warn("[Angel Memory] Cloud clear all error:", e);
    }
  }

  return true;
}

/**
 * Update an existing memory's content or attributes
 */
export async function updateMemoryItem(
  userId: string,
  memoryId: string,
  updates: Partial<Omit<MemoryItem, "id" | "user_id" | "created_at">>
): Promise<MemoryItem | null> {
  const all = getStoredMemories(userId);
  const idx = all.findIndex((m) => m.id === memoryId);
  if (idx === -1) return null;

  const now = new Date().toISOString();
  const updatedItem: MemoryItem = {
    ...all[idx],
    ...updates,
    updated_at: now,
  };
  all[idx] = updatedItem;
  saveStoredMemories(all);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    Promise.resolve(
      supabase
        .from("memories")
        .update({ ...updates, updated_at: now })
        .eq("id", memoryId)
    ).catch(() => {});
  }

  return updatedItem;
}

/**
 * Contextual & Semantic Memory Retrieval for Angel Chat Engine
 * Combines semantic similarity, keyword matching, importance weighting, and recency
 */
export async function retrieveRelevantMemories(
  userId: string,
  query: string,
  options?: {
    projectId?: string | null;
    limit?: number;
    minScore?: number;
    queryEmbedding?: number[];
  }
): Promise<MemorySearchResult[]> {
  const memories = await fetchAllMemories(userId);
  const limit = options?.limit || 6;
  const minScore = options?.minScore ?? 0.15;
  const projectId = options?.projectId;
  const queryVec = options?.queryEmbedding;

  const now = Date.now();
  const results: MemorySearchResult[] = [];

  for (const mem of memories) {
    if (!mem.is_active) continue;

    // Check expiration
    if (mem.expires_at && new Date(mem.expires_at).getTime() < now) {
      continue;
    }

    let score = 0;
    let matchReason = "Relevance match";

    // 1. Vector Semantic Similarity (if embedding exists)
    if (queryVec && mem.embedding && mem.embedding.length > 0) {
      const cosSim = calculateCosineSimilarity(queryVec, mem.embedding);
      score += cosSim * 0.65;
    }

    // 2. Keyword & Lexical Match
    const kwScore = calculateKeywordScore(query, mem.content, mem.category);
    score += kwScore * 0.35;

    // 3. Importance Multipliers
    if (mem.importance === "critical") score += 0.25;
    else if (mem.importance === "high") score += 0.15;

    // 4. Project context boost
    if (projectId && mem.project_id === projectId) {
      score += 0.30;
      matchReason = "Active project context";
    }

    // 5. Explicit source boost
    if (mem.source === "user_explicit") {
      score += 0.10;
    }

    // 6. Identity and core preference boost
    if (mem.category === "identity" || mem.category === "preference") {
      score += 0.08;
    }

    if (score >= minScore) {
      results.push({
        memory: mem,
        score,
        matchReason,
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// ============================================================================
// PROJECT MEMORY & MANAGEMENT SERVICE
// ============================================================================

export async function fetchProjects(userId: string): Promise<ProjectItem[]> {
  const localList = getStoredProjects(userId);
  const supabase = getSupabase();

  if (!supabase || supabaseTablesUnavailable) {
    return localList;
  }

  try {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (error) {
      if (error.code === "PGRST205" || error.message?.includes("schema cache")) {
        supabaseTablesUnavailable = true;
      }
      return localList;
    }

    if (Array.isArray(data)) {
      saveStoredProjects(data as ProjectItem[]);
      return data as ProjectItem[];
    }
    return localList;
  } catch {
    return localList;
  }
}

export async function createProject(
  userId: string,
  params: { name: string; description?: string; goals?: string[]; metadata?: Record<string, any> }
): Promise<ProjectItem> {
  const now = new Date().toISOString();
  const projectId = "proj-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

  const newProj: ProjectItem = {
    id: projectId,
    user_id: userId,
    name: params.name.trim(),
    description: params.description?.trim() || "",
    goals: params.goals || [],
    status: "active",
    metadata: params.metadata || {},
    created_at: now,
    updated_at: now,
  };

  const stored = getStoredProjects(userId);
  stored.unshift(newProj);
  saveStoredProjects(stored);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    try {
      await supabase.from("projects").insert(newProj);
    } catch (e) {
      console.warn("[Angel Memory] Cloud project insert notice:", e);
    }
  }

  return newProj;
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  const stored = getStoredProjects(userId).filter((p) => p.id !== projectId);
  saveStoredProjects(stored);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    Promise.resolve(
      supabase.from("projects").delete().eq("id", projectId).eq("user_id", userId)
    ).catch(() => {});
  }
}

export async function fetchProjectMemories(projectId: string): Promise<ProjectMemoryItem[]> {
  const local = getStoredProjectMemories(projectId);
  const supabase = getSupabase();

  if (!supabase || supabaseTablesUnavailable) {
    return local;
  }

  try {
    const { data, error } = await supabase
      .from("project_memories")
      .select("*")
      .eq("project_id", projectId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) return local;
    if (Array.isArray(data)) {
      saveStoredProjectMemories(data as ProjectMemoryItem[]);
      return data as ProjectMemoryItem[];
    }
    return local;
  } catch {
    return local;
  }
}

export async function addProjectMemoryItem(
  userId: string,
  projectId: string,
  content: string,
  category: "purpose" | "goal" | "decision" | "milestone" | "technical" | "note" = "decision"
): Promise<ProjectMemoryItem> {
  const now = new Date().toISOString();
  const id = "pmem-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6);

  const item: ProjectMemoryItem = {
    id,
    project_id: projectId,
    user_id: userId,
    content: content.trim(),
    category,
    importance: "normal",
    is_active: true,
    created_at: now,
    updated_at: now,
  };

  const stored = getStoredProjectMemories(projectId);
  stored.unshift(item);
  saveStoredProjectMemories(stored);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    Promise.resolve(supabase.from("project_memories").insert(item)).catch(() => {});
  }

  return item;
}

// ============================================================================
// CONVERSATION SUMMARIES
// ============================================================================

export async function getConversationSummary(conversationId: string): Promise<ConversationSummary | null> {
  const all = getStoredSummaries();
  if (all[conversationId]) return all[conversationId];

  const supabase = getSupabase();
  if (!supabase || supabaseTablesUnavailable) return null;

  try {
    const { data, error } = await supabase
      .from("conversation_summaries")
      .select("*")
      .eq("conversation_id", conversationId)
      .single();

    if (error || !data) return null;
    saveStoredSummary(data as ConversationSummary);
    return data as ConversationSummary;
  } catch {
    return null;
  }
}

export async function saveConversationSummaryRecord(
  summary: Omit<ConversationSummary, "id" | "created_at" | "updated_at">
): Promise<ConversationSummary> {
  const now = new Date().toISOString();
  const fullSummary: ConversationSummary = {
    ...summary,
    id: "summ-" + Date.now(),
    created_at: now,
    updated_at: now,
  };

  saveStoredSummary(fullSummary);

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    Promise.resolve(
      supabase
        .from("conversation_summaries")
        .upsert(fullSummary, { onConflict: "conversation_id" })
    ).catch(() => {});
  }

  return fullSummary;
}

// ============================================================================
// USER MEMORY PREFERENCES
// ============================================================================

export function getUserMemoryPreferences(userId: string): UserMemoryPreferences {
  try {
    const raw = localStorage.getItem(LOCAL_MEMORY_PREFS_KEY + "_" + userId);
    if (raw) return JSON.parse(raw);
    const globalRaw = localStorage.getItem(LOCAL_MEMORY_PREFS_KEY);
    if (globalRaw) return JSON.parse(globalRaw);
  } catch {}
  return { ...DEFAULT_MEMORY_PREFERENCES, user_id: userId };
}

export async function updateUserMemoryPreferences(
  userId: string,
  prefs: Partial<UserMemoryPreferences>
): Promise<UserMemoryPreferences> {
  const current = getUserMemoryPreferences(userId);
  const updated: UserMemoryPreferences = {
    ...current,
    ...prefs,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  try {
    localStorage.setItem(LOCAL_MEMORY_PREFS_KEY + "_" + userId, JSON.stringify(updated));
    localStorage.setItem(LOCAL_MEMORY_PREFS_KEY, JSON.stringify(updated));
  } catch {}

  const supabase = getSupabase();
  if (supabase && !supabaseTablesUnavailable) {
    try {
      await supabase.from("user_preferences").upsert(updated, { onConflict: "user_id" });
    } catch {}
  }

  return updated;
}

// ============================================================================
// DIAGNOSTICS & EXPORT
// ============================================================================

export async function getMemoryDiagnostics(userId: string): Promise<MemoryDiagnostics> {
  const memories = await fetchAllMemories(userId);
  const projects = await fetchProjects(userId);
  const summaries = getStoredSummaries();
  const prefs = getUserMemoryPreferences(userId);

  const byCategory: Record<string, number> = {};
  const byConfidence: Record<string, number> = {};
  const byImportance: Record<string, number> = {};

  let activeCount = 0;
  for (const m of memories) {
    if (m.is_active) activeCount++;
    byCategory[m.category] = (byCategory[m.category] || 0) + 1;
    byConfidence[m.confidence] = (byConfidence[m.confidence] || 0) + 1;
    byImportance[m.importance] = (byImportance[m.importance] || 0) + 1;
  }

  return {
    totalMemories: memories.length,
    activeMemories: activeCount,
    byCategory,
    byConfidence,
    byImportance,
    activeProjects: projects.filter((p) => p.status === "active").length,
    conversationSummariesCount: Object.keys(summaries).length,
    memoryEnabled: prefs.memory_enabled,
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  };
}
