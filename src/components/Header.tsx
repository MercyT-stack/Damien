import React from "react";
import { AngelLogo } from "./AngelLogo";
import { useAuth } from "../contexts/AuthContext";
import { useMemory } from "../contexts/MemoryContext";
import { PanelLeft, User } from "lucide-react";
import { UserAvatar } from "./UserAvatar";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings?: () => void;
  onOpenAuth: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onOpenAuth,
}) => {
  const { user, profile } = useAuth();
  const { memoryPreferences } = useMemory();

  const nickname =
    memoryPreferences?.preferred_name?.trim() ||
    user?.username ||
    user?.display_name?.toLowerCase().replace(/\s+/g, "_") ||
    user?.name ||
    user?.email?.split("@")[0] ||
    "mercy";

  return (
    <header
      id="angel-header"
      className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 sm:px-6 border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md transition-colors duration-200"
    >
      {/* Left side: Sidebar Toggle / Chat Icon Button + Logo + Brand */}
      <div className="flex items-center gap-3">
        <button
          id="btn-sidebar-toggle"
          onClick={onToggleSidebar}
          className="p-2 -ml-1 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors flex items-center justify-center"
          title={isSidebarOpen ? "Recede Sidebar" : "Open Chats & Sidebar"}
          aria-label="Toggle navigation sidebar"
        >
          <PanelLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-200" />
        </button>

        <div className="flex items-center gap-2.5">
          <AngelLogo size="sm" />
          <span className="font-semibold tracking-[0.2em] text-sm uppercase text-neutral-900 dark:text-neutral-100 font-serif">
            ANGEL
          </span>
        </div>
      </div>

      {/* Right side: Nickname + Avatar ONLY (when signed in) OR Sign In button (when signed out) */}
      <div className="flex items-center gap-2">
        {user ? (
          <div
            id="user-badge-header"
            className="flex items-center gap-2 pl-1.5 pr-3 py-1 text-xs font-semibold rounded-full bg-[#18181b] border border-neutral-800 text-white shadow-xs select-none"
            title={`Nickname: ${nickname}`}
          >
            <UserAvatar
              avatarId={profile?.avatar_url || user.avatar_id}
              usernameOrEmail={nickname}
              size="xs"
              className="rounded-full"
            />
            <span className="max-w-[130px] truncate text-xs font-bold text-white tracking-normal font-sans">
              {nickname}
            </span>
          </div>
        ) : (
          <button
            id="btn-signin-header"
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors shadow-xs"
            aria-label="Sign in"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
};


