import React, { useState, useEffect, useRef, useMemo } from "react";
import { useConversation } from "../contexts/ConversationContext";
import { useMemory } from "../contexts/MemoryContext";
import { useVoice } from "../contexts/VoiceContext";
import { useTheme } from "../contexts/ThemeContext";
import { SettingsTab } from "./SettingsModal";
import { IntelligenceLevel } from "../types";
import {
  Search,
  MessageSquare,
  Plus,
  FolderKanban,
  BrainCircuit,
  Settings,
  Mic,
  Moon,
  Sun,
  Monitor,
  Sparkles,
  Layers,
  Keyboard,
  ArrowRight,
  X,
  Sliders,
  Database,
  Radio,
  FileText
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: (tab?: SettingsTab) => void;
  onToggleSidebar: () => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: "Navigation" | "Conversations" | "Projects" | "Intelligence" | "Settings" | "Actions";
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onToggleSidebar,
}) => {
  const {
    conversations,
    activeConversationId,
    selectConversation,
    startNewConversation,
    intelligenceLevel,
    setIntelligenceLevel,
  } = useConversation();

  const {
    projects,
    activeProject,
    selectProject,
  } = useMemory();

  const {
    isVoiceActive,
    startVoiceSession,
    stopVoiceSession,
  } = useVoice();

  const { theme, setTheme } = useTheme();

  const [query, setQuery] = useState<string>("");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isMac = typeof window !== "undefined" && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl+";

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Build command list dynamically
  const commands: CommandItem[] = useMemo(() => {
    const list: CommandItem[] = [];

    // Core Quick Actions
    list.push({
      id: "action-new-chat",
      title: "New Conversation",
      subtitle: "Start a fresh discussion with Angel",
      category: "Actions",
      icon: <Plus className="w-4 h-4 text-amber-500" />,
      shortcut: `${modKey}M`,
      action: () => {
        startNewConversation();
        onClose();
      },
    });

    list.push({
      id: "action-toggle-voice",
      title: isVoiceActive ? "End Voice Session" : "Start Live Voice Call",
      subtitle: isVoiceActive ? "Disconnect two-way audio" : "Talk with Angel in real-time",
      category: "Actions",
      icon: <Mic className={`w-4 h-4 ${isVoiceActive ? "text-rose-500" : "text-amber-500"}`} />,
      shortcut: `${modKey}Shift+V`,
      action: () => {
        if (isVoiceActive) stopVoiceSession();
        else startVoiceSession();
        onClose();
      },
    });

    list.push({
      id: "action-toggle-sidebar",
      title: "Toggle Navigation Sidebar",
      subtitle: "Expand or recede the conversation sidebar",
      category: "Navigation",
      icon: <Layers className="w-4 h-4 text-neutral-400" />,
      shortcut: `${modKey}B`,
      action: () => {
        onToggleSidebar();
        onClose();
      },
    });

    // Settings Navigation
    list.push({
      id: "nav-settings-voice",
      title: "Voice & Speech Settings",
      subtitle: "Select voice timbre, language, and audio parameters",
      category: "Settings",
      icon: <Sliders className="w-4 h-4 text-neutral-400" />,
      shortcut: `${modKey},`,
      action: () => {
        onOpenSettings("voice");
        onClose();
      },
    });

    list.push({
      id: "nav-settings-projects",
      title: "Projects & Workspace Hub",
      subtitle: "Manage active projects, goals, and technical guidelines",
      category: "Settings",
      icon: <FolderKanban className="w-4 h-4 text-amber-500" />,
      shortcut: `${modKey}Shift+P`,
      action: () => {
        onOpenSettings("projects");
        onClose();
      },
    });

    list.push({
      id: "nav-settings-memory",
      title: "Personalization & Memory Hub",
      subtitle: "Review stored facts, preferences, and system prompt tuning",
      category: "Settings",
      icon: <BrainCircuit className="w-4 h-4 text-amber-500" />,
      shortcut: `${modKey}Shift+M`,
      action: () => {
        onOpenSettings("personalization");
        onClose();
      },
    });

    list.push({
      id: "nav-settings-shortcuts",
      title: "Keyboard Shortcuts Cheatsheet",
      subtitle: "View complete list of navigation hotkeys",
      category: "Settings",
      icon: <Keyboard className="w-4 h-4 text-neutral-400" />,
      shortcut: "?",
      action: () => {
        onOpenSettings("keyboard");
        onClose();
      },
    });

    // Theme toggling
    list.push({
      id: "action-theme-dark",
      title: "Switch to Dark Mode",
      subtitle: "Set dark appearance theme",
      category: "Settings",
      icon: <Moon className="w-4 h-4 text-neutral-400" />,
      action: () => {
        setTheme("dark");
        onClose();
      },
    });

    list.push({
      id: "action-theme-light",
      title: "Switch to Light Mode",
      subtitle: "Set light appearance theme",
      category: "Settings",
      icon: <Sun className="w-4 h-4 text-amber-500" />,
      action: () => {
        setTheme("light");
        onClose();
      },
    });

    // Intelligence Levels
    const levels: Array<{ id: IntelligenceLevel; label: string; desc: string }> = [
      { id: "quick", label: "Quick Model (Flash Lite)", desc: "Lowest latency for rapid answers" },
      { id: "standard", label: "Standard Intelligence (Flash)", desc: "Balanced speed & quality" },
      { id: "detailed", label: "Detailed Intelligence", desc: "Exhaustive step-by-step reasoning" },
      { id: "deep", label: "Deep Research Mode", desc: "Multi-step contextual analysis" },
      { id: "pro", label: "Pro Reasoning (Gemini 2.5 Pro)", desc: "Advanced reasoning for complex tasks" },
    ];

    levels.forEach((lvl) => {
      list.push({
        id: `intel-${lvl.id}`,
        title: `Set Intelligence: ${lvl.label}`,
        subtitle: lvl.desc,
        category: "Intelligence",
        icon: <Sparkles className={`w-4 h-4 ${intelligenceLevel === lvl.id ? "text-amber-500" : "text-neutral-400"}`} />,
        action: () => {
          setIntelligenceLevel(lvl.id);
          onClose();
        },
      });
    });

    // Projects
    projects.forEach((proj) => {
      const isSelected = activeProject?.id === proj.id;
      list.push({
        id: `proj-${proj.id}`,
        title: `Project: ${proj.name}`,
        subtitle: isSelected ? "Currently active workspace" : `Switch focus to this project (${proj.goals?.length || 0} goals)`,
        category: "Projects",
        icon: <FolderKanban className={`w-4 h-4 ${isSelected ? "text-amber-500" : "text-neutral-400"}`} />,
        action: () => {
          selectProject(isSelected ? null : proj.id);
          onClose();
        },
      });
    });

    // Conversations
    conversations.forEach((c) => {
      const isCurrent = c.id === activeConversationId;
      const formattedDate = c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "Recent";

      list.push({
        id: `conv-${c.id}`,
        title: c.title || "Untitled Conversation",
        subtitle: `Conversation • Updated ${formattedDate}`,
        category: "Conversations",
        icon: <MessageSquare className={`w-4 h-4 ${isCurrent ? "text-amber-500" : "text-neutral-400"}`} />,
        action: () => {
          selectConversation(c.id);
          onClose();
        },
      });
    });

    return list;
  }, [
    conversations,
    activeConversationId,
    projects,
    activeProject,
    intelligenceLevel,
    isVoiceActive,
    modKey,
  ]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const lower = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      return (
        cmd.title.toLowerCase().includes(lower) ||
        (cmd.subtitle && cmd.subtitle.toLowerCase().includes(lower)) ||
        cmd.category.toLowerCase().includes(lower)
      );
    });
  }, [commands, query]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Handle keyboard navigation within the palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      id="command-palette-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-[12vh] px-4 animate-fadeIn"
    >
      <div
        id="command-palette-dialog"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn flex flex-col max-h-[70vh]"
      >
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command, search conversations, or jump to projects..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-mono font-semibold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            ESC to close
          </kbd>
        </div>

        {/* Results List */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-neutral-100 dark:divide-neutral-800/40 custom-scrollbar"
        >
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-400 dark:text-neutral-500">
              No matching commands or conversations found for "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={cmd.id}
                  data-index={idx}
                  onClick={() => cmd.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-amber-500/10 dark:bg-amber-500/15 text-neutral-900 dark:text-white"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`p-1.5 rounded-lg shrink-0 ${
                        isSelected
                          ? "bg-amber-500/20 text-amber-500"
                          : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500"
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{cmd.title}</span>
                        <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                          {cmd.category}
                        </span>
                      </div>
                      {cmd.subtitle && (
                        <div className="text-[11px] text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                          {cmd.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-300/60 dark:border-neutral-700">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <ArrowRight className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-neutral-200 dark:bg-neutral-800 rounded text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 font-mono bg-neutral-200 dark:bg-neutral-800 rounded text-[10px]">↓</kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 font-mono bg-neutral-200 dark:bg-neutral-800 rounded text-[10px]">↵</kbd>
              to select
            </span>
          </div>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
            Angel Command Palette
          </span>
        </div>
      </div>
    </div>
  );
};
