import React from "react";
import { AngelLogo } from "./AngelLogo";
import { useAuth } from "../contexts/AuthContext";
import { PanelLeft, User } from "lucide-react";

interface HeaderProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenAuth: () => void;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isSidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenAuth,
}) => {
  const { user } = useAuth();

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

      {/* Right side: Sign In / User Account Button ONLY */}
      <div className="flex items-center">
        {user ? (
          <button
            id="btn-user-header"
            onClick={() => onOpenSettings()}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 text-xs font-medium rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors"
            title="Account & Settings"
            aria-label="User settings and account"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 text-white flex items-center justify-center text-[10px] font-semibold">
              {(user.display_name || user.email || "A").charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline max-w-[100px] truncate text-[11px]">
              {user.display_name || user.email.split("@")[0]}
            </span>
          </button>
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
