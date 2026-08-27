import { useEffect } from "react";

interface ShortcutHandlers {
  onOpenCommandPalette: () => void;
  onNewConversation: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: (tab?: any) => void;
  onToggleVoice?: () => void;
  onFocusComposer?: () => void;
  onCloseModals?: () => void;
}

export function useKeyboardShortcuts({
  onOpenCommandPalette,
  onNewConversation,
  onToggleSidebar,
  onOpenSettings,
  onToggleVoice,
  onFocusComposer,
  onCloseModals,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const isMod = isMac ? e.metaKey : e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      // 1. Cmd + K / Ctrl + K -> Focus Search / Open Command Palette
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        onOpenCommandPalette();
        return;
      }

      // 2. Cmd + M / Ctrl + M or Cmd + N / Ctrl + N -> New Conversation
      if (isMod && (e.key === "m" || e.key === "M" || e.key === "n" || e.key === "N")) {
        // Only trigger if not Shift (Cmd+Shift+M is reserved for Memory)
        if (!e.shiftKey) {
          e.preventDefault();
          onNewConversation();
          return;
        }
      }

      // 3. Cmd + Shift + P / Ctrl + Shift + P -> Open Projects Hub
      if (isMod && e.shiftKey && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        onOpenSettings("projects");
        return;
      }

      // 4. Cmd + Shift + M / Ctrl + Shift + M -> Open Memory Hub
      if (isMod && e.shiftKey && (e.key === "m" || e.key === "M")) {
        e.preventDefault();
        onOpenSettings("personalization");
        return;
      }

      // 5. Cmd + Shift + V / Ctrl + Shift + V -> Toggle Live Voice Call
      if (isMod && e.shiftKey && (e.key === "v" || e.key === "V")) {
        e.preventDefault();
        if (onToggleVoice) {
          onToggleVoice();
        }
        return;
      }

      // 6. Cmd + B / Ctrl + B or Cmd + \ / Ctrl + \ -> Toggle Sidebar
      if (isMod && (e.key === "b" || e.key === "B" || e.key === "\\")) {
        e.preventDefault();
        onToggleSidebar();
        return;
      }

      // 7. Cmd + , / Ctrl + , -> Open Settings
      if (isMod && e.key === ",") {
        e.preventDefault();
        onOpenSettings("voice");
        return;
      }

      // 8. Cmd + / / Ctrl + / -> Focus composer or open quick help
      if (isMod && e.key === "/") {
        e.preventDefault();
        if (onFocusComposer) {
          onFocusComposer();
        }
        return;
      }

      // 9. ? (Shift + /) when NOT inside input -> Open Keyboard shortcuts
      if (!isMod && e.key === "?" && !isInput) {
        e.preventDefault();
        onOpenSettings("keyboard");
        return;
      }

      // 10. Escape -> Close active modals
      if (e.key === "Escape") {
        if (onCloseModals) {
          onCloseModals();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    onOpenCommandPalette,
    onNewConversation,
    onToggleSidebar,
    onOpenSettings,
    onToggleVoice,
    onFocusComposer,
    onCloseModals,
  ]);
}
