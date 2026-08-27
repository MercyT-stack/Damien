import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";
import { useVoice } from "../contexts/VoiceContext";
import { useMemory } from "../contexts/MemoryContext";
import { useCapability } from "../contexts/CapabilityContext";
import { VOICE_CATALOG } from "../config/voices";
import { SUPPORTED_LANGUAGES } from "../config/languages";
import { 
  X, 
  Search,
  Settings as SettingsIcon,
  Bell, 
  Clock,
  Puzzle, 
  Activity, 
  CreditCard, 
  Database, 
  HardDrive, 
  ShieldCheck, 
  Key, 
  UserCheck, 
  User, 
  Keyboard,
  Moon, 
  Sun, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Volume2,
  Copy,
  Camera,
  Mic,
  MapPin,
  Eye,
  FolderOpen,
  Trash2,
  Edit2,
  Plus,
  BrainCircuit,
  FolderKanban,
  Plug,
  Unplug,
  CheckCircle2,
  Globe,
  Sparkles,
  FileText,
  Code2,
  Table,
  Fingerprint,
} from "lucide-react";
import { SUPABASE_SQL_SCHEMA } from "../services/supabaseSchema";
import { MemoryCategory, MemoryImportance } from "../types";
import { ConnectionsHub } from "./ConnectionsHub";
import { ProactiveIntelligenceSettings } from "./ProactiveIntelligenceSettings";
import { VoiceRecognitionSettingsComponent } from "./VoiceRecognitionSettings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: SettingsTab;
}

export type SettingsTab = 
  | "general"
  | "notifications"
  | "personalization"
  | "projects"
  | "plugins"
  | "voice"
  | "voice_recognition"
  | "billing"
  | "data_controls"
  | "storage"
  | "safety"
  | "security"
  | "parental"
  | "permissions"
  | "account"
  | "keyboard";

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab }) => {
  const { theme, setTheme } = useTheme();
  const { user, updateName, signOut } = useAuth();
  const { 
    selectedVoice, 
    selectVoice, 
    voiceSettings, 
    updateVoiceSettings, 
    isPlayingSample 
  } = useVoice();
  const {
    memories,
    filteredMemories,
    projects,
    activeProject,
    activeProjectMemories,
    memoryPreferences,
    isMemoryEnabled,
    searchQuery: memorySearchQuery,
    categoryFilter,
    diagnostics,
    setSearchQuery: setMemorySearchQuery,
    setCategoryFilter,
    rememberFact,
    editMemory,
    deleteMemory,
    clearAll: clearAllMemories,
    toggleMemoryEnabled,
    updatePreferences,
    createProject,
    selectProject,
  } = useMemory();

  const {
    connectedServices,
    tools,
    userPermissions,
    connectService,
    disconnectService,
    revokePermission,
    isOnline,
  } = useCapability();

  const [activeTab, setActiveTab] = useState<SettingsTab>("voice");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // General Settings State
  const [soundEffects, setSoundEffects] = useState<boolean>(true);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Account State
  const [displayNameInput, setDisplayNameInput] = useState<string>(user?.display_name || user?.name || "");
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showSqlSchema, setShowSqlSchema] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Personalization Form State
  const [preferredName, setPreferredName] = useState<string>(memoryPreferences.preferred_name || "");
  const [commStyle, setCommStyle] = useState<string>(memoryPreferences.communication_style || "balanced");
  const [occupation, setOccupation] = useState<string>(memoryPreferences.occupation || "");
  const [customInstructions, setCustomInstructions] = useState<string>(memoryPreferences.custom_instructions || "");
  const [interestsInput, setInterestsInput] = useState<string>(
    memoryPreferences.interests ? memoryPreferences.interests.join(", ") : ""
  );
  const [personalizationSaved, setPersonalizationSaved] = useState<boolean>(false);

  // Manual Add Memory State
  const [newMemoryContent, setNewMemoryContent] = useState<string>("");
  const [newMemoryCategory, setNewMemoryCategory] = useState<MemoryCategory>("preference");
  const [newMemoryImportance, setNewMemoryImportance] = useState<MemoryImportance>("normal");
  const [isAddingMemory, setIsAddingMemory] = useState<boolean>(false);

  // Edit Memory State
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState<string>("");

  // New Project Form State
  const [newProjectName, setNewProjectName] = useState<string>("");
  const [newProjectDesc, setNewProjectDesc] = useState<string>("");
  const [newProjectGoals, setNewProjectGoals] = useState<string>("");
  const [isCreatingProject, setIsCreatingProject] = useState<boolean>(false);

  // Notifications State
  const [notifyAudioDone, setNotifyAudioDone] = useState<boolean>(true);
  const [notifyLiveChime, setNotifyLiveChime] = useState<boolean>(true);
  const [notifyTaskDone, setNotifyTaskDone] = useState<boolean>(true);

  // Voice Form State
  const [voiceModelType, setVoiceModelType] = useState<string>("Live");
  const [currentLang, setCurrentLang] = useState<string>(voiceSettings.language || "en");

  // Permissions State
  const [permissions] = useState([
    { id: "mic", name: "Microphone", icon: Mic, state: "GRANTED", desc: "Required for speech-to-text dictation and Angel Live voice." },
    { id: "camera", name: "Camera & Vision", icon: Camera, state: "GRANTED", desc: "Allows real-world visual analysis when activated in the chat bar." },
    { id: "location", name: "Precise Location", icon: MapPin, state: "TEMPORARILY GRANTED", desc: "Allows location-aware answers when explicitly requested." },
    { id: "screen", name: "Screen Context", icon: Eye, state: "REQUESTED", desc: "Temporary authorized access to screen context during tasks." },
    { id: "files", name: "File System & Attachments", icon: FolderOpen, state: "GRANTED", desc: "Allows uploading attachments and documents." },
  ]);

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    setPreferredName(memoryPreferences.preferred_name || "");
    setCommStyle(memoryPreferences.communication_style || "balanced");
    setOccupation(memoryPreferences.occupation || "");
    setCustomInstructions(memoryPreferences.custom_instructions || "");
    setInterestsInput(memoryPreferences.interests ? memoryPreferences.interests.join(", ") : "");
  }, [memoryPreferences]);

  useEffect(() => {
    if (user?.display_name || user?.name) {
      setDisplayNameInput(user.display_name || user.name || "");
    }
  }, [user]);

  if (!isOpen) return null;

  const currentVoiceIndex = VOICE_CATALOG.findIndex((v) => v.id === selectedVoice.id);

  const handlePrevVoice = () => {
    const prevIdx = (currentVoiceIndex - 1 + VOICE_CATALOG.length) % VOICE_CATALOG.length;
    selectVoice(VOICE_CATALOG[prevIdx].id);
  };

  const handleNextVoice = () => {
    const nextIdx = (currentVoiceIndex + 1) % VOICE_CATALOG.length;
    selectVoice(VOICE_CATALOG[nextIdx].id);
  };

  const handleSavePersonalization = async (e: React.FormEvent) => {
    e.preventDefault();
    const interestsList = interestsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    await updatePreferences({
      preferred_name: preferredName.trim() || undefined,
      communication_style: commStyle as any,
      occupation: occupation.trim() || undefined,
      custom_instructions: customInstructions.trim() || undefined,
      interests: interestsList,
    });

    setPersonalizationSaved(true);
    setTimeout(() => setPersonalizationSaved(false), 2500);
  };

  const handleAddManualMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryContent.trim()) return;
    await rememberFact(newMemoryContent.trim(), newMemoryCategory, newMemoryImportance, "high");
    setNewMemoryContent("");
    setIsAddingMemory(false);
  };

  const handleSaveMemoryEdit = async (id: string) => {
    if (!editingContent.trim()) return;
    await editMemory(id, { content: editingContent.trim() });
    setEditingMemoryId(null);
    setEditingContent("");
  };

  const handleCreateNewProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const goals = newProjectGoals
      .split("\n")
      .map((g) => g.trim())
      .filter(Boolean);
    await createProject(newProjectName.trim(), newProjectDesc.trim(), goals);
    setNewProjectName("");
    setNewProjectDesc("");
    setNewProjectGoals("");
    setIsCreatingProject(false);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    const ok = await updateName(displayNameInput.trim());
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const navItems = [
    { id: "general", label: "General", icon: SettingsIcon },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "personalization", label: "Personalization & Memory", icon: BrainCircuit },
    { id: "projects", label: "Projects & Workspace", icon: FolderKanban },
    { id: "plugins", label: "Plugins and apps", icon: Puzzle },
    { id: "voice", label: "Voice", icon: Volume2 },
    { id: "voice_recognition", label: "Voice recognition", icon: Fingerprint },
    { id: "data_controls", label: "Data controls", icon: HardDrive },
    { id: "storage", label: "Storage", icon: Database },
    { id: "safety", label: "Safety", icon: ShieldCheck },
    { id: "security", label: "Security and login", icon: Key },
    { id: "permissions", label: "Permissions", icon: UserCheck },
    { id: "account", label: "Account", icon: User },
    { id: "keyboard", label: "Keyboard shortcuts", icon: Keyboard },
  ];

  const filteredNavItems = navItems.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      id="modal-settings-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Outer Floating Settings Window (Two-Pane Master-Detail Layout) */}
      <div
        id="settings-modal-container"
        className="flex flex-row w-full max-w-[760px] h-[610px] rounded-[18px] bg-[#18181b] text-neutral-100 border border-neutral-800/80 shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ============================================================ */}
        {/* LEFT NAVIGATION SIDEBAR (Approx 30% width)                   */}
        {/* ============================================================ */}
        <div className="w-56 sm:w-60 bg-[#121214] border-r border-neutral-800/80 flex flex-col flex-shrink-0">
          {/* Top Search Input */}
          <div className="p-3 border-b border-neutral-800/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-neutral-800/70 border border-neutral-700/50 rounded-xl text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500 transition-colors"
              />
            </div>
          </div>

          {/* Navigation List */}
          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 custom-scrollbar">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`btn-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id as SettingsTab)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-xl transition-all text-left ${
                    isActive
                      ? "bg-neutral-800 text-white font-semibold shadow-xs"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-cyan-400" : "text-neutral-400"}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT CONTENT PANEL (Approx 70% width)                       */}
        {/* ============================================================ */}
        <div className="flex-1 flex flex-col bg-[#18181b] overflow-hidden">
          {/* Header Title with subtle horizontal divider */}
          <div className="px-7 pt-6 pb-3 flex items-center justify-between">
            <h1 className="text-xl font-semibold text-white tracking-tight">
              {activeTab === "voice"
                ? "Voice"
                : activeTab === "personalization"
                ? "Personalization & Memory"
                : activeTab === "projects"
                ? "Projects & Workspace Memory"
                : activeTab === "data_controls"
                ? "Data controls"
                : activeTab === "security"
                ? "Security and login"
                : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-px w-full bg-neutral-800/80 px-7" />

          {/* Content Pane */}
          <div className="flex-1 overflow-y-auto px-7 py-5 custom-scrollbar">
            
            {/* ========================================== */}
            {/* VOICE TAB                                  */}
            {/* ========================================== */}
            {activeTab === "voice" && (
              <div className="flex flex-col items-center pt-2">
                {/* Main Feature Circular Visual */}
                <div className="relative my-3 flex items-center justify-center">
                  <div className="w-[140px] h-[140px] rounded-full bg-gradient-to-tr from-sky-400 via-indigo-300 to-sky-100 shadow-[0_12px_32px_rgba(56,189,248,0.22)] overflow-hidden flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.85),transparent_65%)]" />
                    <div className="w-[125px] h-[125px] rounded-full bg-gradient-to-br from-indigo-200/50 via-sky-300/30 to-blue-500/40 blur-xs" />
                    {isPlayingSample && (
                      <div className="absolute inset-0 rounded-full border-2 border-white/60 animate-ping" />
                    )}
                  </div>
                </div>

                {/* Voice Name & Subtitle with Left & Right Chevron Arrows */}
                <div className="flex items-center justify-between w-full max-w-[340px] px-2 mt-1">
                  <button
                    id="btn-voice-prev"
                    onClick={handlePrevVoice}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-full transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="text-center">
                    <h3 className="text-lg font-bold text-white tracking-wide">
                      {selectedVoice.name}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {selectedVoice.description || "Composed and direct"}
                    </p>
                  </div>

                  <button
                    id="btn-voice-next"
                    onClick={handleNextVoice}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 rounded-full transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Pagination Indicators */}
                <div className="flex items-center gap-2 mt-3.5 mb-7">
                  {VOICE_CATALOG.map((v, i) => (
                    <button
                      key={v.id}
                      onClick={() => selectVoice(v.id)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === currentVoiceIndex
                          ? "w-3 bg-white"
                          : "w-1.5 bg-neutral-600 hover:bg-neutral-400"
                      }`}
                    />
                  ))}
                </div>

                {/* Settings Rows */}
                <div className="w-full space-y-4">
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-300 font-normal">Model</span>
                    <div className="relative">
                      <select
                        value={voiceModelType}
                        onChange={(e) => setVoiceModelType(e.target.value)}
                        className="appearance-none bg-transparent text-sm font-normal text-white pr-6 pl-2 py-0.5 focus:outline-hidden cursor-pointer"
                      >
                        <option value="Live" className="bg-neutral-900 text-white">Live (Gemini 2.5)</option>
                        <option value="Standard" className="bg-neutral-900 text-white">Standard (Flash 3.7)</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-0 top-1 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="h-px bg-neutral-800/80" />

                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm text-neutral-300 font-normal">Spoken Language</span>
                    <div className="relative">
                      <select
                        value={currentLang}
                        onChange={(e) => {
                          setCurrentLang(e.target.value);
                          updateVoiceSettings({ language: e.target.value });
                        }}
                        className="appearance-none bg-transparent text-sm font-normal text-white pr-6 pl-2 py-0.5 focus:outline-hidden cursor-pointer"
                      >
                        {SUPPORTED_LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code} className="bg-neutral-900 text-white">
                            {lang.name} ({lang.nativeName})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-0 top-1 text-neutral-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================ */}
            {/* VOICE RECOGNITION & SPEAKER IDENTITY TAB                    */}
            {/* ============================================================ */}
            {activeTab === "voice_recognition" && (
              <VoiceRecognitionSettingsComponent />
            )}

            {/* ============================================================ */}
            {/* PERSONALIZATION & PERSISTENT MEMORY TAB (Stage 3)            */}
            {/* ============================================================ */}
            {activeTab === "personalization" && (
              <div className="space-y-6">
                
                {/* Master Memory Switch & Diagnostic Banner */}
                <div className="p-4 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${isMemoryEnabled ? "bg-cyan-500/20 text-cyan-300" : "bg-neutral-700/50 text-neutral-400"}`}>
                      <BrainCircuit className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white flex items-center gap-2">
                        Persistent Memory & Context Intelligence
                        <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                          isMemoryEnabled ? "bg-emerald-500/20 text-emerald-300" : "bg-neutral-700 text-neutral-400"
                        }`}>
                          {isMemoryEnabled ? "Active" : "Paused"}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Angel remembers facts, preferences, and project context across sessions
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={toggleMemoryEnabled}
                    className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
                      isMemoryEnabled
                        ? "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
                        : "bg-cyan-500 text-neutral-950 hover:bg-cyan-400"
                    }`}
                  >
                    {isMemoryEnabled ? "Pause memory" : "Enable memory"}
                  </button>
                </div>

                {/* User Personalization Profile */}
                <form onSubmit={handleSavePersonalization} className="space-y-4 p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90">
                    User Profile & Custom Persona
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">
                        Preferred Name / Nickname
                      </label>
                      <input
                        type="text"
                        value={preferredName}
                        onChange={(e) => setPreferredName(e.target.value)}
                        placeholder="e.g. Mercy, Alex, Dr. Carter"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-800/60 text-white placeholder-neutral-500 border border-neutral-700/60 focus:border-cyan-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">
                        Background / Occupation
                      </label>
                      <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Full-stack Engineer, Product Designer"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-800/60 text-white placeholder-neutral-500 border border-neutral-700/60 focus:border-cyan-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      Communication Style
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5">
                      {[
                        { id: "concise", label: "Concise" },
                        { id: "balanced", label: "Balanced" },
                        { id: "analytical", label: "Analytical" },
                        { id: "creative", label: "Creative" },
                        { id: "socratic", label: "Socratic" },
                      ].map((style) => (
                        <button
                          key={style.id}
                          type="button"
                          onClick={() => setCommStyle(style.id)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                            commStyle === style.id
                              ? "bg-cyan-500/20 border-cyan-500/80 text-cyan-200 font-semibold"
                              : "bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:border-neutral-600"
                          }`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      Interests & Domains (comma separated)
                    </label>
                    <input
                      type="text"
                      value={interestsInput}
                      onChange={(e) => setInterestsInput(e.target.value)}
                      placeholder="e.g. AI architecture, UI design, distributed systems"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-800/60 text-white placeholder-neutral-500 border border-neutral-700/60 focus:border-cyan-500 focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">
                      Custom Instructions for Angel
                    </label>
                    <textarea
                      rows={2}
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Provide specific formatting preferences, guidelines, or tone instructions..."
                      className="w-full p-2.5 text-xs rounded-xl bg-neutral-800/60 text-white placeholder-neutral-500 border border-neutral-700/60 focus:border-cyan-500 focus:outline-hidden resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-white text-neutral-950 hover:bg-neutral-200 transition shadow-xs"
                    >
                      Save Profile & Instructions
                    </button>
                    {personalizationSaved && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Saved
                      </span>
                    )}
                  </div>
                </form>

                {/* Memory Explorer & Management */}
                <div className="p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-cyan-400/90">
                        Remembered Knowledge & Facts ({memories.length})
                      </h3>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        Facts automatically noted or explicitly requested ("Angel, remember that...")
                      </div>
                    </div>

                    <button
                      onClick={() => setIsAddingMemory(!isAddingMemory)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add memory
                    </button>
                  </div>

                  {/* Add Memory Inline Form */}
                  {isAddingMemory && (
                    <form onSubmit={handleAddManualMemory} className="p-3 rounded-xl bg-neutral-800/60 border border-neutral-700 space-y-2">
                      <input
                        type="text"
                        value={newMemoryContent}
                        onChange={(e) => setNewMemoryContent(e.target.value)}
                        placeholder="Enter fact or preference to remember..."
                        className="w-full px-3 py-1.5 text-xs rounded-lg bg-neutral-900 text-white border border-neutral-700 focus:border-cyan-500 focus:outline-hidden"
                      />
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2">
                          <select
                            value={newMemoryCategory}
                            onChange={(e) => setNewMemoryCategory(e.target.value as MemoryCategory)}
                            className="bg-neutral-900 text-neutral-300 text-xs px-2 py-1 rounded-lg border border-neutral-700 focus:outline-hidden"
                          >
                            <option value="preference">Preference</option>
                            <option value="identity">Identity</option>
                            <option value="project">Project</option>
                            <option value="work">Work</option>
                            <option value="goal">Goal</option>
                            <option value="decision">Decision</option>
                            <option value="technical">Technical</option>
                          </select>

                          <select
                            value={newMemoryImportance}
                            onChange={(e) => setNewMemoryImportance(e.target.value as MemoryImportance)}
                            className="bg-neutral-900 text-neutral-300 text-xs px-2 py-1 rounded-lg border border-neutral-700 focus:outline-hidden"
                          >
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setIsAddingMemory(false)}
                            className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-500 text-neutral-950 hover:bg-cyan-400"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                  )}

                  {/* Filter & Search Bar */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-500" />
                      <input
                        type="text"
                        placeholder="Search remembered facts..."
                        value={memorySearchQuery}
                        onChange={(e) => setMemorySearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1 text-xs bg-neutral-900/80 border border-neutral-700/50 rounded-lg text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
                      />
                    </div>

                    <select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value as any)}
                      className="bg-neutral-900 text-neutral-300 text-xs px-2 py-1 rounded-lg border border-neutral-700 focus:outline-hidden"
                    >
                      <option value="all">All</option>
                      <option value="preference">Preferences</option>
                      <option value="identity">Identity</option>
                      <option value="project">Project</option>
                      <option value="work">Work</option>
                      <option value="goal">Goals</option>
                      <option value="decision">Decisions</option>
                      <option value="technical">Technical</option>
                    </select>
                  </div>

                  {/* Memory List */}
                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {filteredMemories.length === 0 ? (
                      <div className="py-5 text-center text-xs text-neutral-500">
                        {memories.length === 0
                          ? "No memories saved yet. Talk with Angel or use 'Angel, remember that...' to start building context."
                          : "No memories matched your search query."}
                      </div>
                    ) : (
                      filteredMemories.map((mem) => {
                        const isEditing = editingMemoryId === mem.id;
                        return (
                          <div
                            key={mem.id}
                            className="p-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800 hover:border-neutral-700/80 transition flex items-center justify-between gap-2"
                          >
                            {isEditing ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editingContent}
                                  onChange={(e) => setEditingContent(e.target.value)}
                                  className="flex-1 px-2 py-1 text-xs bg-neutral-900 text-white rounded border border-neutral-600 focus:outline-hidden"
                                />
                                <button
                                  onClick={() => handleSaveMemoryEdit(mem.id)}
                                  className="p-1 text-emerald-400 hover:text-emerald-300"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingMemoryId(null)}
                                  className="p-1 text-neutral-400 hover:text-white"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs text-neutral-200 font-normal truncate">
                                    {mem.content}
                                  </div>
                                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-neutral-500">
                                    <span className="px-1.5 py-0.2 bg-neutral-800 text-cyan-300/80 rounded">
                                      {mem.category}
                                    </span>
                                    <span>{new Date(mem.created_at).toLocaleDateString()}</span>
                                    {mem.source === "user_explicit" && (
                                      <span className="text-sky-400 font-medium">Explicit</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingMemoryId(mem.id);
                                      setEditingContent(mem.content);
                                    }}
                                    className="p-1 text-neutral-400 hover:text-neutral-200"
                                    title="Edit memory"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => deleteMemory(mem.id)}
                                    className="p-1 text-neutral-400 hover:text-rose-400"
                                    title="Delete memory"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {memories.length > 0 && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => {
                          if (confirm("Are you sure you want to clear all stored memories?")) {
                            clearAllMemories();
                          }
                        }}
                        className="text-[11px] text-rose-400/80 hover:text-rose-300 transition"
                      >
                        Clear all memories
                      </button>
                    </div>
                  )}
                </div>

                {/* Diagnostics Snapshot */}
                {diagnostics && (
                  <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800/80 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-sm font-bold text-white">{diagnostics.total_memories}</div>
                      <div className="text-[10px] text-neutral-500 uppercase">Memories</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{diagnostics.active_projects}</div>
                      <div className="text-[10px] text-neutral-500 uppercase">Projects</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-400">
                        {diagnostics.database_layer === "supabase" ? "Supabase Cloud" : "Local First"}
                      </div>
                      <div className="text-[10px] text-neutral-500 uppercase">Storage</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{diagnostics.memory_footprint_kb} KB</div>
                      <div className="text-[10px] text-neutral-500 uppercase">Footprint</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================ */}
            {/* PROJECTS & WORKSPACE MEMORY TAB (Stage 3)                    */}
            {/* ============================================================ */}
            {activeTab === "projects" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Project Workspaces</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Maintain long-term architecture decisions, milestone goals, and domain facts for distinct projects
                    </p>
                  </div>

                  <button
                    onClick={() => setIsCreatingProject(!isCreatingProject)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New project
                  </button>
                </div>

                {/* Create Project Form */}
                {isCreatingProject && (
                  <form onSubmit={handleCreateNewProject} className="p-4 rounded-2xl bg-neutral-800/60 border border-neutral-700 space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-cyan-400">Create New Project</h3>
                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Project Name</label>
                      <input
                        type="text"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="e.g. Angel Companion, Aurora Engine"
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-900 text-white border border-neutral-700 focus:border-cyan-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Purpose & Description</label>
                      <input
                        type="text"
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        placeholder="Brief summary of project goals and scope..."
                        className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-900 text-white border border-neutral-700 focus:border-cyan-500 focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-300 block mb-1">Target Goals (one per line)</label>
                      <textarea
                        rows={2}
                        value={newProjectGoals}
                        onChange={(e) => setNewProjectGoals(e.target.value)}
                        placeholder="Deliver Stage 3 Memory&#10;Implement Sub-second latency"
                        className="w-full p-2 text-xs rounded-xl bg-neutral-900 text-white border border-neutral-700 focus:border-cyan-500 focus:outline-hidden resize-none"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCreatingProject(false)}
                        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-white text-neutral-950 hover:bg-neutral-200"
                      >
                        Create Project
                      </button>
                    </div>
                  </form>
                )}

                {/* Projects List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projects.map((proj) => {
                    const isSelected = activeProject?.id === proj.id;
                    return (
                      <div
                        key={proj.id}
                        onClick={() => selectProject(isSelected ? null : proj.id)}
                        className={`p-4 rounded-2xl border cursor-pointer transition ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500 text-white"
                            : "bg-neutral-800/30 border-neutral-800 hover:border-neutral-700 text-neutral-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs text-white">{proj.name}</div>
                          {isSelected && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-300 rounded-full">
                              Active Focus
                            </span>
                          )}
                        </div>
                        {proj.description && (
                          <div className="text-[11px] text-neutral-400 mt-1 line-clamp-2">
                            {proj.description}
                          </div>
                        )}
                        {proj.goals && proj.goals.length > 0 && (
                          <div className="mt-2 text-[10px] text-neutral-500">
                            {proj.goals.length} target goals tracked
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Active Project Decisions & Milestones */}
                {activeProject && (
                  <div className="p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800 space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-cyan-400/90">
                      Decisions & Milestones for {activeProject.name} ({activeProjectMemories.length})
                    </h3>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto custom-scrollbar">
                      {activeProjectMemories.length === 0 ? (
                        <div className="text-xs text-neutral-500 py-3 text-center">
                          No project decisions logged yet. As you discuss architecture and decisions in conversations, Angel will catalog them here.
                        </div>
                      ) : (
                        activeProjectMemories.map((pm) => (
                          <div key={pm.id} className="p-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs text-neutral-200 flex items-center justify-between">
                            <span>{pm.content}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-400 rounded">
                              {pm.category}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* GENERAL TAB                                */}
            {/* ========================================== */}
            {activeTab === "general" && (
              <div className="space-y-5 pt-1">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-neutral-200">Theme</div>
                    <div className="text-xs text-neutral-400 mt-0.5">Select interface appearance</div>
                  </div>
                  <div className="flex items-center gap-1 p-1 bg-neutral-800 rounded-xl">
                    <button
                      onClick={() => setTheme("dark")}
                      className={`p-1.5 rounded-lg text-xs font-medium transition ${theme === "dark" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
                    >
                      <Moon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTheme("light")}
                      className={`p-1.5 rounded-lg text-xs font-medium transition ${theme === "light" ? "bg-neutral-700 text-white" : "text-neutral-400 hover:text-white"}`}
                    >
                      <Sun className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-px bg-neutral-800/60" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-neutral-200">Sound effects</div>
                    <div className="text-xs text-neutral-400 mt-0.5">Play audio feedback for interactive actions</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>

                <div className="h-px bg-neutral-800/60" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-neutral-200">High contrast UI</div>
                    <div className="text-xs text-neutral-400 mt-0.5">Increase typography and container visual separation</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* NOTIFICATIONS & PROACTIVE TAB (STAGE 8)    */}
            {/* ========================================== */}
            {activeTab === "notifications" && (
              <div className="space-y-5 pt-1">
                <ProactiveIntelligenceSettings />

                <div className="h-px bg-neutral-800/80 my-4" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-neutral-200">Audio completion chime</div>
                    <div className="text-xs text-neutral-400 mt-0.5">Play a subtle tone when long responses finish</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyAudioDone}
                    onChange={(e) => setNotifyAudioDone(e.target.checked)}
                    className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* PLUGINS & CONNECTED SERVICES TAB (STAGE 6) */}
            {/* ========================================== */}
            {activeTab === "plugins" && (
              <div className="pt-1">
                <ConnectionsHub />
              </div>
            )}

            {/* ========================================== */}
            {/* DATA CONTROLS & STORAGE                    */}
            {/* ========================================== */}
            {(activeTab === "data_controls" || activeTab === "storage") && (
              <div className="space-y-5 pt-1">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-neutral-200">Dual-Layer Local-First Storage</div>
                    <div className="text-xs text-neutral-400 mt-0.5">Automatic offline caching with Supabase real-time sync</div>
                  </div>
                  <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/20 text-emerald-400">
                    Active
                  </span>
                </div>

                <div className="h-px bg-neutral-800/60" />

                <div className="flex items-center justify-between py-2">
                  <div>
                    <div className="text-sm text-neutral-200">Supabase SQL Schema (Stage 1, 2, 3 & 4)</div>
                    <div className="text-xs text-neutral-400 mt-0.5">Export complete SQL definitions for conversations, memories, projects, and tool ecosystems</div>
                  </div>
                  <button
                    onClick={() => setShowSqlSchema(!showSqlSchema)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                  >
                    {showSqlSchema ? "Hide SQL" : "View SQL"}
                  </button>
                </div>

                {showSqlSchema && (
                  <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 relative">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 2000);
                      }}
                      className="absolute top-3 right-3 px-2 py-1 bg-neutral-800 text-[10px] text-neutral-300 rounded hover:bg-neutral-700 flex items-center gap-1"
                    >
                      {copiedSql ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedSql ? "Copied" : "Copy SQL"}
                    </button>
                    <pre className="text-[10px] text-neutral-400 font-mono overflow-x-auto max-h-48 custom-scrollbar">
                      {SUPABASE_SQL_SCHEMA}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {/* ========================================== */}
            {/* CAPABILITIES & TOOL PERMISSIONS            */}
            {/* ========================================== */}
            {activeTab === "permissions" && (
              <div className="space-y-4 pt-1">
                <div className="pb-1 border-b border-neutral-800/60">
                  <span className="text-xs font-semibold text-white">Tool Capabilities & Permission Ledger</span>
                  <p className="text-[11px] text-neutral-400">
                    Granular permission controls for web search, document creation, code sandbox, and live sensors.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {tools.map((tool) => {
                    const perm = userPermissions[tool.id];
                    const isGranted = perm?.state === "granted" || perm?.state === "temporary" || tool.riskLevel === "none";
                    const isCustom = !!perm;

                    return (
                      <div
                        key={tool.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-neutral-800/40 border border-neutral-800 hover:border-neutral-700 transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-neutral-800 text-cyan-400 border border-neutral-700/80">
                            {tool.id === "tool_web_search" ? (
                              <Globe className="w-4 h-4" />
                            ) : tool.id === "tool_doc_creator" ? (
                              <FileText className="w-4 h-4" />
                            ) : tool.id === "tool_code_workspace" ? (
                              <Code2 className="w-4 h-4" />
                            ) : tool.id === "tool_spreadsheet_analyst" ? (
                              <Table className="w-4 h-4" />
                            ) : (
                              <Sparkles className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-white">{tool.name}</span>
                              <span className="text-[10px] text-neutral-500 font-mono">({tool.offlineAvailability})</span>
                            </div>
                            <div className="text-[11px] text-neutral-400">{tool.description}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${
                              isGranted
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-cyan-500/20 text-cyan-400"
                            }`}
                          >
                            {perm?.state ? perm.state.toUpperCase() : tool.riskLevel === "none" ? "IMPLICIT" : "PROMPT"}
                          </span>

                          {isCustom && (
                            <button
                              onClick={() => revokePermission(tool.id)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                              title="Revoke Permission"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ========================================== */}
            {/* ACCOUNT TAB                                */}
            {/* ========================================== */}
            {activeTab === "account" && (
              <div className="space-y-4 pt-1">
                <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Current Session</div>
                    <div className="text-xs text-neutral-400 mt-0.5">
                      {user ? user.email : "Guest User (Offline Local-First Mode)"}
                    </div>
                  </div>
                  {user && (
                    <button
                      onClick={() => signOut()}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                    >
                      Sign out
                    </button>
                  )}
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1">Display Name</label>
                    <input
                      type="text"
                      value={displayNameInput}
                      onChange={(e) => setDisplayNameInput(e.target.value)}
                      placeholder="Enter display name"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-neutral-800/60 text-white placeholder-neutral-500 border border-neutral-700/60 focus:border-cyan-500 focus:outline-hidden"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-white text-neutral-950 hover:bg-neutral-200"
                    >
                      Update Name
                    </button>
                    {saveSuccess && (
                      <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Updated
                      </span>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* ========================================== */}
            {/* KEYBOARD SHORTCUTS TAB                     */}
            {/* ========================================== */}
            {activeTab === "keyboard" && (
              <div className="space-y-4 pt-1">
                <div className="text-xs text-neutral-400">
                  Global navigation hotkeys for instant command execution, search, and workflow switching.
                </div>

                {[
                  {
                    category: "Global Navigation & Search",
                    items: [
                      { key: "⌘K / Ctrl+K", desc: "Open Command Palette & search conversations" },
                      { key: "⌘M / Ctrl+M", desc: "Start new conversation & focus composer" },
                      { key: "⌘N / Ctrl+N", desc: "Start new conversation" },
                      { key: "⌘B / Ctrl+B", desc: "Toggle navigation sidebar" },
                      { key: "⌘, / Ctrl+,", desc: "Open Settings & Preferences" },
                      { key: "?", desc: "Show keyboard shortcuts cheatsheet" },
                      { key: "Escape", desc: "Close modals, dialogs & overlays" },
                    ],
                  },
                  {
                    category: "Workspaces & Memory",
                    items: [
                      { key: "⌘Shift+P / Ctrl+Shift+P", desc: "Jump to Projects & Workspace Hub" },
                      { key: "⌘Shift+M / Ctrl+Shift+M", desc: "Jump to Personalization & Memory Hub" },
                    ],
                  },
                  {
                    category: "Voice & Real-Time Interaction",
                    items: [
                      { key: "⌘Shift+V / Ctrl+Shift+V", desc: "Start or end Live Voice conversation" },
                      { key: "⌘/ / Ctrl+/", desc: "Focus message composer" },
                    ],
                  },
                  {
                    category: "Message Composer",
                    items: [
                      { key: "Enter", desc: "Send message to Angel" },
                      { key: "Shift + Enter", desc: "Insert new line in composer" },
                    ],
                  },
                ].map((group) => (
                  <div key={group.category} className="space-y-2">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-cyan-500/90">
                      {group.category}
                    </div>
                    <div className="space-y-1.5">
                      {group.items.map((sc) => (
                        <div
                          key={sc.key}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-800/40 border border-neutral-800 text-xs"
                        >
                          <span className="text-neutral-300">{sc.desc}</span>
                          <kbd className="px-2 py-0.5 bg-neutral-800 text-neutral-200 font-mono rounded border border-neutral-700 text-[11px] shadow-2xs">
                            {sc.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
