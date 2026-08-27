import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  MemoryItem,
  MemoryCategory,
  MemoryConfidence,
  MemoryImportance,
  ProjectItem,
  ProjectMemoryItem,
  UserMemoryPreferences,
  MemoryDiagnostics,
  ConversationSummary,
} from "../types";
import {
  fetchAllMemories,
  addMemory,
  forgetMemory,
  deleteMemoryPermanently,
  clearAllMemories,
  updateMemoryItem,
  fetchProjects,
  createProject as createProjectService,
  deleteProject as deleteProjectService,
  fetchProjectMemories,
  addProjectMemoryItem,
  getUserMemoryPreferences,
  updateUserMemoryPreferences,
  getMemoryDiagnostics,
  getConversationSummary,
} from "../services/memoryService";
import { generateEmbeddingOnServer } from "../services/aiService";
import { useAuth } from "./AuthContext";

interface MemoryContextType {
  memories: MemoryItem[];
  filteredMemories: MemoryItem[];
  projects: ProjectItem[];
  activeProject: ProjectItem | null;
  activeProjectMemories: ProjectMemoryItem[];
  memoryPreferences: UserMemoryPreferences;
  isMemoryEnabled: boolean;
  searchQuery: string;
  categoryFilter: MemoryCategory | "all";
  isLoading: boolean;
  diagnostics: MemoryDiagnostics | null;
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (cat: MemoryCategory | "all") => void;
  rememberFact: (
    content: string,
    category?: MemoryCategory,
    importance?: MemoryImportance,
    confidence?: MemoryConfidence,
    projectId?: string | null
  ) => Promise<{ memory: MemoryItem; action: string }>;
  forgetFact: (target: { id?: string; keyword?: string; contentSubstr?: string }) => Promise<number>;
  editMemory: (id: string, updates: Partial<MemoryItem>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  toggleMemoryEnabled: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserMemoryPreferences>) => Promise<void>;
  createProject: (name: string, description?: string, goals?: string[]) => Promise<ProjectItem>;
  deleteProject: (projectId: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  addProjectMemory: (
    projectId: string,
    content: string,
    category?: "purpose" | "goal" | "decision" | "milestone" | "technical" | "note"
  ) => Promise<void>;
  refreshMemories: () => Promise<void>;
  getSummaryForConversation: (convId: string) => Promise<ConversationSummary | null>;
}

const MemoryContext = createContext<MemoryContextType | undefined>(undefined);

export const MemoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || "guest-session";

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeProjectMemories, setActiveProjectMemories] = useState<ProjectMemoryItem[]>([]);
  const [memoryPreferences, setMemoryPreferences] = useState<UserMemoryPreferences>(() =>
    getUserMemoryPreferences(userId)
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<MemoryCategory | "all">("all");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [diagnostics, setDiagnostics] = useState<MemoryDiagnostics | null>(null);

  const isMemoryEnabled = memoryPreferences.memory_enabled;

  const refreshMemories = useCallback(async () => {
    setIsLoading(true);
    try {
      const [mems, projs, diag] = await Promise.all([
        fetchAllMemories(userId),
        fetchProjects(userId),
        getMemoryDiagnostics(userId),
      ]);
      setMemories(mems);
      setProjects(projs);
      setDiagnostics(diag);
      setMemoryPreferences(getUserMemoryPreferences(userId));
    } catch (e) {
      console.warn("[MemoryContext] Error refreshing memories:", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refreshMemories();
  }, [userId, refreshMemories]);

  // Load project-specific memories when active project changes
  useEffect(() => {
    if (!activeProjectId) {
      setActiveProjectMemories([]);
      return;
    }
    fetchProjectMemories(activeProjectId).then(setActiveProjectMemories);
  }, [activeProjectId]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  const filteredMemories = memories.filter((m) => {
    if (!m.is_active) return false;
    const matchesSearch =
      !searchQuery.trim() ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase().trim());
    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const rememberFact = async (
    content: string,
    category: MemoryCategory = "preference",
    importance: MemoryImportance = "normal",
    confidence: MemoryConfidence = "high",
    projectId?: string | null
  ) => {
    if (!content.trim()) throw new Error("Empty memory content");

    let embedding: number[] | null = null;
    try {
      embedding = await generateEmbeddingOnServer(content.trim());
    } catch {}

    const result = await addMemory(userId, {
      content: content.trim(),
      category,
      importance,
      confidence,
      source: "user_explicit",
      project_id: projectId || activeProjectId || null,
      embedding,
    });

    await refreshMemories();
    return result;
  };

  const forgetFact = async (target: { id?: string; keyword?: string; contentSubstr?: string }) => {
    const result = await forgetMemory(userId, target);
    await refreshMemories();
    return result.count;
  };

  const editMemory = async (id: string, updates: Partial<MemoryItem>) => {
    await updateMemoryItem(userId, id, updates);
    await refreshMemories();
  };

  const deleteMemory = async (id: string) => {
    await deleteMemoryPermanently(userId, id);
    await refreshMemories();
  };

  const clearAll = async () => {
    await clearAllMemories(userId);
    await refreshMemories();
  };

  const toggleMemoryEnabled = async () => {
    const updated = await updateUserMemoryPreferences(userId, {
      memory_enabled: !memoryPreferences.memory_enabled,
    });
    setMemoryPreferences(updated);
  };

  const updatePreferences = async (prefs: Partial<UserMemoryPreferences>) => {
    const updated = await updateUserMemoryPreferences(userId, prefs);
    setMemoryPreferences(updated);
  };

  const createProject = async (name: string, description?: string, goals?: string[]) => {
    const created = await createProjectService(userId, { name, description, goals });
    setProjects((prev) => [created, ...prev]);
    setActiveProjectId(created.id);
    return created;
  };

  const deleteProject = async (projectId: string) => {
    await deleteProjectService(userId, projectId);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  const selectProject = (projectId: string | null) => {
    setActiveProjectId(projectId);
  };

  const addProjectMemory = async (
    projectId: string,
    content: string,
    category: "purpose" | "goal" | "decision" | "milestone" | "technical" | "note" = "decision"
  ) => {
    const item = await addProjectMemoryItem(userId, projectId, content, category);
    setActiveProjectMemories((prev) => [item, ...prev]);
  };

  const getSummaryForConversation = async (convId: string) => {
    return getConversationSummary(convId);
  };

  return (
    <MemoryContext.Provider
      value={{
        memories,
        filteredMemories,
        projects,
        activeProject,
        activeProjectMemories,
        memoryPreferences,
        isMemoryEnabled,
        searchQuery,
        categoryFilter,
        isLoading,
        diagnostics,
        setSearchQuery,
        setCategoryFilter,
        rememberFact,
        forgetFact,
        editMemory,
        deleteMemory,
        clearAll,
        toggleMemoryEnabled,
        updatePreferences,
        createProject,
        deleteProject,
        selectProject,
        addProjectMemory,
        refreshMemories,
        getSummaryForConversation,
      }}
    >
      {children}
    </MemoryContext.Provider>
  );
};

export const useMemory = () => {
  const context = useContext(MemoryContext);
  if (!context) {
    throw new Error("useMemory must be used within a MemoryProvider");
  }
  return context;
};
