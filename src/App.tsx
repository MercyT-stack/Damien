import React, { useState, useEffect, useCallback } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { MemoryProvider } from "./contexts/MemoryContext";
import { CapabilityProvider } from "./contexts/CapabilityContext";
import { ConversationProvider, useConversation } from "./contexts/ConversationContext";
import { VoiceProvider, useVoice } from "./contexts/VoiceContext";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ChatArea } from "./components/ChatArea";
import { ChatComposer } from "./components/ChatComposer";
import { SettingsModal, SettingsTab } from "./components/SettingsModal";
import { AuthModal } from "./components/AuthModal";
import { WelcomePersonalizeModal } from "./components/WelcomePersonalizeModal";
import { CommandPalette } from "./components/CommandPalette";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const AngelMainLayout: React.FC = () => {
  const { startNewConversation } = useConversation();
  const { isVoiceActive, startVoiceSession, stopVoiceSession } = useVoice();

  // Sidebar open/receded state (persisted locally)
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem("angel_sidebar_open");
    return saved !== null ? saved === "true" : true;
  });

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("voice");
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [welcomePersonalizeOpen, setWelcomePersonalizeOpen] = useState<boolean>(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);
  const [composerPrompt, setComposerPrompt] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("angel_sidebar_open", String(sidebarOpen));
  }, [sidebarOpen]);

  const handleOpenSettings = useCallback((tab: SettingsTab = "voice") => {
    setSettingsTab(tab);
    setSettingsOpen(true);
    setCommandPaletteOpen(false);
  }, []);

  const handleSelectPrompt = (prompt: string) => {
    setComposerPrompt(prompt);
  };

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleFocusComposer = useCallback(() => {
    const textarea = document.getElementById("input-chat-message") as HTMLTextAreaElement | null;
    if (textarea) {
      textarea.focus();
    }
  }, []);

  const handleNewConversationShortcut = useCallback(() => {
    startNewConversation();
    setCommandPaletteOpen(false);
    setTimeout(() => {
      handleFocusComposer();
    }, 80);
  }, [startNewConversation, handleFocusComposer]);

  const handleToggleVoice = useCallback(() => {
    if (isVoiceActive) {
      stopVoiceSession();
    } else {
      startVoiceSession();
    }
  }, [isVoiceActive, stopVoiceSession, startVoiceSession]);

  const handleCloseModals = useCallback(() => {
    setCommandPaletteOpen(false);
    setSettingsOpen(false);
    setAuthOpen(false);
  }, []);

  // Wire Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onOpenCommandPalette: () => setCommandPaletteOpen((prev) => !prev),
    onNewConversation: handleNewConversationShortcut,
    onToggleSidebar: handleToggleSidebar,
    onOpenSettings: handleOpenSettings,
    onToggleVoice: handleToggleVoice,
    onFocusComposer: handleFocusComposer,
    onCloseModals: handleCloseModals,
  });

  return (
    <div
      id="angel-app-root"
      className="flex h-screen w-screen overflow-hidden bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans transition-colors duration-200"
    >
      {/* Navigation Sidebar with More & Recede Icons */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenSettings={handleOpenSettings}
        onOpenAuth={() => setAuthOpen(true)}
      />

      {/* Main Conversation & Dashboard Shell */}
      <div className="flex-1 flex flex-col h-full min-w-0 relative overflow-hidden bg-white dark:bg-neutral-950 transition-all duration-300">
        {/* Top Header */}
        <Header
          isSidebarOpen={sidebarOpen}
          onToggleSidebar={handleToggleSidebar}
          onOpenSettings={() => handleOpenSettings("voice")}
          onOpenAuth={() => setAuthOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Center Conversation Workspace */}
        <main className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] min-w-0 overflow-hidden relative">
          {/* Scrollable Chat Area */}
          <ChatArea onSelectPrompt={handleSelectPrompt} />

          {/* Bottom Chat Composer with Direct Document & File Attachment */}
          <ChatComposer
            initialPrompt={composerPrompt}
            onClearInitialPrompt={() => setComposerPrompt("")}
          />
        </main>
      </div>

      {/* Global Command & Navigation Palette (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenSettings={handleOpenSettings}
        onToggleSidebar={handleToggleSidebar}
      />

      {/* Settings & Auth Modal Dialogs */}
      <SettingsModal
        isOpen={settingsOpen}
        initialTab={settingsTab}
        onClose={() => setSettingsOpen(false)}
      />

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccessfulAuth={() => {
          setTimeout(() => {
            setWelcomePersonalizeOpen(true);
          }, 150);
        }}
      />

      <WelcomePersonalizeModal
        isOpen={welcomePersonalizeOpen}
        onClose={() => setWelcomePersonalizeOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MemoryProvider>
          <CapabilityProvider>
            <ConversationProvider>
              <VoiceProvider>
                <AngelMainLayout />
              </VoiceProvider>
            </ConversationProvider>
          </CapabilityProvider>
        </MemoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
