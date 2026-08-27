import React, { useState, useRef, useEffect } from "react";
import { AngelLogo } from "./AngelLogo";
import { useConversation } from "../contexts/ConversationContext";
import { useAuth } from "../contexts/AuthContext";
import { useMemory } from "../contexts/MemoryContext";
import { SettingsTab } from "./SettingsModal";
import { UserAvatar } from "./UserAvatar";
import { 
  Plus, 
  Search, 
  MessageSquare, 
  Trash2, 
  Edit3,
  Check,
  FolderKanban, 
  BrainCircuit, 
  Settings, 
  Database, 
  Lock, 
  LogOut, 
  PanelLeftClose, 
  ChevronDown,
  ChevronRight,
  X,
  Sparkles,
  Sliders,
  Folder,
  Layers,
  Fingerprint,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onOpenAuth: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenAuth,
}) => {
  const {
    filteredConversations,
    activeConversationId,
    selectConversation,
    startNewConversation,
    renameConversation,
    removeConversation,
    searchQuery,
    setSearchQuery,
    isStreaming,
  } = useConversation();

  const { user, profile, isSupabaseLive, signOut } = useAuth();
  const {
    projects,
    activeProject,
    selectProject,
    createProject,
    deleteProject,
  } = useMemory();

  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>("");
  const [isProjectsExpanded, setIsProjectsExpanded] = useState<boolean>(true);
  const [isAddingProject, setIsAddingProject] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // Focus project input when opening inline creator
  useEffect(() => {
    if (isAddingProject) {
      projectInputRef.current?.focus();
    }
  }, [isAddingProject]);

  const handleSelectConv = (id: string) => {
    if (editingConvId) return;
    selectConversation(id);
  };

  const handleNewChat = async () => {
    await startNewConversation();
  };

  const handleStartRename = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingConvId(id);
    setEditingTitle(currentTitle);
  };

  const handleSaveRename = async (e: React.MouseEvent | React.FormEvent, id: string) => {
    e.stopPropagation();
    if (editingTitle.trim()) {
      await renameConversation(id, editingTitle.trim());
    }
    setEditingConvId(null);
  };

  const handleQuickCreateProject = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newProjectName.trim() || isCreatingProject) return;

    setIsCreatingProject(true);
    try {
      await createProject(newProjectName.trim());
      setNewProjectName("");
      setIsAddingProject(false);
    } catch (err) {
      console.error("Failed to quick create project:", err);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleToggleProjectSelect = (projectId: string) => {
    if (activeProject?.id === projectId) {
      selectProject(null);
    } else {
      selectProject(projectId);
    }
  };

  const handleDeleteProjectClick = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    try {
      await deleteProject(projectId);
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Main Sidebar */}
      <aside
        id="angel-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 h-full bg-neutral-50/95 dark:bg-neutral-900/95 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 ease-in-out shrink-0 ${
          isOpen
            ? "translate-x-0 opacity-100"
            : "-translate-x-full md:-translate-x-full md:w-0 md:border-r-0 md:overflow-hidden opacity-0 pointer-events-none"
        }`}
      >
        {/* Top Header with Logo and Recede Icon */}
        <div className="flex items-center justify-between p-3.5 border-b border-neutral-200/80 dark:border-neutral-800/80 relative">
          <div className="flex items-center gap-2.5 min-w-0">
            <AngelLogo size="sm" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold tracking-[0.2em] text-sm uppercase text-neutral-900 dark:text-neutral-100 font-serif truncate">
                ANGEL
              </span>
              <span className="text-[10px] tracking-wider uppercase text-cyan-600 dark:text-cyan-400 font-medium">
                Stage 3 Intelligence
              </span>
            </div>
          </div>

          {/* [Recede / Collapse Sidebar Icon] Button */}
          <button
            id="btn-recede-sidebar"
            onClick={onClose}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition group"
            title="Recede / Collapse Sidebar"
            aria-label="Recede sidebar"
          >
            <PanelLeftClose className="w-4 h-4 text-neutral-500 group-hover:text-cyan-500 transition-colors" />
          </button>
        </div>

        {/* Primary Action: New Conversation */}
        <div className="p-3 pb-2">
          <button
            id="btn-new-conversation"
            onClick={handleNewChat}
            disabled={isStreaming}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white font-medium text-xs tracking-wide shadow-xs hover:shadow-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed group"
            title="Start New Conversation (⌘M / ⌘N)"
          >
            <div className="flex items-center gap-2.5">
              <Plus className="w-4 h-4 text-cyan-400 dark:text-cyan-600 group-hover:rotate-90 transition-transform duration-200" />
              <span>New Conversation</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-neutral-800 dark:bg-neutral-200 text-neutral-300 dark:text-neutral-700">
              ⌘M
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-3.5 h-3.5 text-neutral-400" />
            <input
              id="input-search-conversations"
              type="text"
              placeholder="Search (⌘K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-lg bg-neutral-200/60 dark:bg-neutral-800/60 border border-transparent focus:border-cyan-500/50 focus:bg-white dark:focus:bg-neutral-950 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden transition-colors"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs"
              >
                ×
              </button>
            ) : (
              <kbd className="absolute right-2 text-[9px] font-mono px-1 py-0.2 rounded bg-neutral-300/60 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        {/* Scrollable Container for Projects & Conversations */}
        <div className="flex-1 overflow-y-auto px-3 space-y-4 py-1">
          {/* ========================================================================= */}
          {/* 🗂️ PROJECTS & WORKSPACES SECTION IN SIDEBAR */}
          {/* ========================================================================= */}
          <div id="sidebar-projects-section" className="space-y-1.5">
            <div className="flex items-center justify-between px-2 py-1">
              <button
                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition"
              >
                {isProjectsExpanded ? (
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                ) : (
                  <ChevronRight className="w-3 h-3 text-neutral-400" />
                )}
                <FolderKanban className="w-3.5 h-3.5 text-cyan-500" />
                <span>Projects</span>
                <span className="text-[10px] font-normal lowercase bg-neutral-200/80 dark:bg-neutral-800/80 px-1.5 py-0.2 rounded-full text-neutral-600 dark:text-neutral-300 ml-0.5">
                  {projects.length}
                </span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  id="btn-sidebar-add-project"
                  onClick={() => {
                    setIsProjectsExpanded(true);
                    setIsAddingProject((prev) => !prev);
                  }}
                  className="p-1 rounded-md text-neutral-400 hover:text-cyan-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition"
                  title="Create New Project"
                  aria-label="Create new project"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <button
                  id="btn-sidebar-manage-projects"
                  onClick={() => onOpenSettings("projects")}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition"
                  title="Manage Projects & Workspace"
                  aria-label="Manage projects"
                >
                  <Sliders className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Active Project Highlight Banner */}
            {activeProject && (
              <div className="px-2 py-1.5 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-between text-xs animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0 pr-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[9px] uppercase tracking-wider text-cyan-600 dark:text-cyan-400 font-semibold">
                      Active Workspace Focus
                    </div>
                    <div className="font-medium text-neutral-900 dark:text-neutral-100 truncate">
                      {activeProject.name}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => selectProject(null)}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-cyan-500/20 transition"
                  title="Clear Project Focus"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Inline Add Project Input */}
            {isProjectsExpanded && isAddingProject && (
              <form
                onSubmit={handleQuickCreateProject}
                className="px-2 py-1.5 rounded-xl bg-white dark:bg-neutral-950 border border-cyan-500/50 shadow-xs space-y-1.5 animate-fadeIn"
              >
                <input
                  ref={projectInputRef}
                  type="text"
                  placeholder="New project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setIsAddingProject(false);
                      setNewProjectName("");
                    }
                  }}
                  className="w-full px-2 py-1 text-xs bg-transparent text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
                />
                <div className="flex items-center justify-end gap-1 px-1 pb-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingProject(false);
                      setNewProjectName("");
                    }}
                    className="px-2 py-0.5 rounded text-[10px] text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectName.trim() || isCreatingProject}
                    className="px-2.5 py-0.5 rounded bg-cyan-500 hover:bg-cyan-600 text-neutral-950 font-medium text-[10px] disabled:opacity-50 transition"
                  >
                    {isCreatingProject ? "Creating..." : "Save"}
                  </button>
                </div>
              </form>
            )}

            {/* Projects List */}
            {isProjectsExpanded && (
              <div className="space-y-0.5">
                {projects.length === 0 ? (
                  <div className="px-3 py-2 text-[11px] text-neutral-400 dark:text-neutral-500 text-center rounded-lg bg-neutral-200/30 dark:bg-neutral-800/30">
                    No active projects. Click <span className="font-semibold text-cyan-500">+</span> to start one.
                  </div>
                ) : (
                  projects.map((proj) => {
                    const isSelected = activeProject?.id === proj.id;
                    return (
                      <div
                        key={proj.id}
                        id={`sidebar-project-item-${proj.id}`}
                        onClick={() => handleToggleProjectSelect(proj.id)}
                        className={`group relative flex items-center justify-between w-full px-2.5 py-1.5 text-xs rounded-xl transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? "bg-cyan-500/15 text-cyan-900 dark:text-cyan-200 font-medium border border-cyan-500/30 shadow-xs"
                            : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-1">
                          <Folder
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? "text-cyan-500 fill-cyan-500/20" : "text-neutral-400 group-hover:text-cyan-500"
                            }`}
                          />
                          <span className="truncate">{proj.name}</span>
                          {proj.goals && proj.goals.length > 0 && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-neutral-200/70 dark:bg-neutral-800/70 text-neutral-500 dark:text-neutral-400 shrink-0">
                              {proj.goals.length} goals
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isSelected && (
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 px-1 py-0.2 rounded bg-cyan-500/10">
                              Active
                            </span>
                          )}
                          <button
                            onClick={(e) => handleDeleteProjectClick(e, proj.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                            title="Delete Project"
                            aria-label={`Delete project ${proj.name}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* 💬 RECENT CONVERSATIONS STREAM */}
          {/* ========================================================================= */}
          <div id="sidebar-conversations-section" className="space-y-1 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60">
            <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold tracking-wider uppercase text-neutral-400 dark:text-neutral-500">
              <span>Recent Conversations</span>
              <span className="text-[10px] font-normal lowercase">{filteredConversations.length}</span>
            </div>

            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-400 dark:text-neutral-500">
                {searchQuery ? "No matching conversations" : "No conversations yet. Start a new one."}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    id={`conv-item-${conv.id}`}
                    className={`group relative flex items-center justify-between w-full px-3 py-2 text-xs rounded-xl transition-all duration-150 cursor-pointer ${
                      isActive
                        ? "bg-cyan-500/10 dark:bg-cyan-500/15 text-cyan-900 dark:text-cyan-300 font-medium border border-cyan-500/20"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60"
                    }`}
                    onClick={() => handleSelectConv(conv.id)}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cyan-500" : "text-neutral-400"}`} />
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingTitle}
                          onChange={(e) => setEditingTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRename(e, conv.id);
                            if (e.key === "Escape") setEditingConvId(null);
                          }}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-white dark:bg-neutral-950 px-1.5 py-0.5 rounded border border-cyan-500 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-hidden"
                        />
                      ) : (
                        <span className="truncate">{conv.title || "New Conversation"}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isEditing ? (
                        <button
                          onClick={(e) => handleSaveRename(e, conv.id)}
                          className="p-1 text-cyan-600 hover:text-cyan-700 rounded transition"
                          title="Save Title"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={(e) => handleStartRename(e, conv.id, conv.title || "New Conversation")}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded transition"
                            title="Rename Conversation"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            id={`btn-delete-conv-${conv.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              removeConversation(conv.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 transition shrink-0"
                            title="Delete Conversation"
                            aria-label={`Delete conversation ${conv.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bottom Section: Settings + User Profile */}
        <div className="p-3 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-neutral-100/50 dark:bg-neutral-900/50 space-y-2">
          {/* User Account Card & Settings (Available once signed in) */}
          {user ? (
            <>
              {/* Settings Trigger */}
              <button
                id="btn-sidebar-settings"
                onClick={() => onOpenSettings("voice")}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition-colors"
              >
                <Settings className="w-4 h-4 text-neutral-500" />
                <span>Settings</span>
              </button>

              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-200/40 dark:bg-neutral-800/40">
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <UserAvatar
                    avatarId={profile?.avatar_url || user.avatar_id}
                    usernameOrEmail={user.username || user.email}
                    size="sm"
                  />
                  <div className="min-w-0 flex flex-col">
                    <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                      {user.email && user.email.includes("@")
                        ? user.email
                            .split("@")[0]
                            .split(/[._+\-]+/)
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                            .join(" ")
                        : "User"}
                    </span>
                    <span className="text-[10px] text-neutral-500 truncate">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  id="btn-sidebar-signout"
                  onClick={() => signOut()}
                  className="p-1.5 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shrink-0"
                  title="Sign Out"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          ) : (
            <button
              id="btn-sidebar-login"
              onClick={() => onOpenAuth()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In to ANGEL</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
