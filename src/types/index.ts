export type ThemeMode = "dark" | "light" | "system" | "black" | "white";

export type LiveSessionState =
  | "NORMAL_CHAT"
  | "LIVE_CONNECTING"
  | "LIVE_LISTENING"
  | "LIVE_THINKING"
  | "LIVE_SPEAKING"
  | "LIVE_INTERRUPTED"
  | "LIVE_ENDING"
  | "LIVE_ENDED"
  | "LIVE_ERROR";

export type IntelligenceTier = "free" | "pro";

export type IntelligenceLevel = 
  | "quick" 
  | "standard" 
  | "detailed" 
  | "deep" 
  | "pro" 
  | "auto";

export type ModalityType = "text" | "voice";

export type VoiceState =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "interrupted"
  | "paused"
  | "ending"
  | "ended"
  | "error"
  | "reconnecting";

export type VoiceCategory =
  | "Angel Signature"
  | "Warm & Expressive"
  | "Crisp & Confident"
  | "Calm & Grounded"
  | "Deep & Authoritative"
  | "Lyrical & Delicate"
  | "Clear & Reassuring"
  | "Confident & Dramatic";

export interface VoiceConfig {
  id: string;
  name: string;
  category: VoiceCategory;
  description: string;
  providerVoice: string; // Gemini Live/TTS voice: Kore, Aoede, Zephyr, Leda, Charon, Puck, Fenrir, Callisto
  isDefault?: boolean;
  genderPresentation: "Feminine" | "Masculine" | "Neutral";
  styleSummary: string;
  accentNote: string;
  samplePhrases: Record<string, string>; // Language code -> sample phrase
}

export interface UserVoicePreferences {
  voice_id: string;
  language: string;
  regional_accent?: string;
  speaking_speed: number; // 0.8 to 1.2
  auto_language_detection: boolean;
  captions_enabled: boolean;
}

export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region?: string;
  hasText: boolean;
  hasSpeech: boolean;
  hasTranscription: boolean;
  samplePhrase: string;
}

export interface UserPreferences {
  theme: ThemeMode;
  language: string;
  intelligence_level: IntelligenceLevel;
  voice?: UserVoicePreferences;
}

export interface Profile {
  id: string;
  email: string;
  name: string;
  display_name: string;
  avatar_url?: string | null;
  preferences: UserPreferences;
  created_at?: string;
  updated_at?: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  is_archived: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface MessageMetadata {
  modality?: ModalityType;
  voice?: boolean;
  voice_id?: string;
  language?: string;
  duration_seconds?: number;
  vision?: boolean;
  tokens?: number;
  model?: string;
  streaming?: boolean;
  error?: boolean;
  interrupted?: boolean;
  ttfa_ms?: number;
  toolCalls?: Array<{ toolId: string; toolName: string; status: string; resultSummary?: string }>;
  artifacts?: any[];
  taskRunId?: string;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  [key: string]: any;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: MessageMetadata;
  created_at: string;
}

export type ConnectionStatus = "online" | "offline" | "syncing";

export interface IntelligenceLevelOption {
  id: IntelligenceLevel;
  name: string;
  tier: IntelligenceTier;
  description: string;
  isAvailableInStage1: boolean;
}

export interface LiveVoiceEvent {
  type: "audio" | "transcript" | "user_transcript" | "interrupted" | "state_change" | "command" | "error" | "ttfa";
  data?: any;
}

export type PermissionState = "granted" | "denied" | "prompt" | "temporary";

export interface PermissionItem {
  id: string;
  name: string;
  description: string;
  state: PermissionState;
  iconName: string;
}

export type MemoryCategory =
  | "identity"
  | "preference"
  | "communication"
  | "project"
  | "work"
  | "education"
  | "interest"
  | "routine"
  | "goal"
  | "decision"
  | "relationship"
  | "technical"
  | "task"
  | "other";

export type MemoryConfidence = "high" | "medium" | "low";
export type MemoryImportance = "low" | "normal" | "high" | "critical";
export type MemorySource = 
  | "user_explicit" 
  | "conversation" 
  | "profile" 
  | "project" 
  | "system" 
  | "imported_data";

export type MemoryExpirationType = "persistent" | "temporary" | "expiring" | "session_only";

export interface MemoryItem {
  id: string;
  user_id: string;
  content: string;
  category: MemoryCategory;
  confidence: MemoryConfidence;
  importance: MemoryImportance;
  source: MemorySource;
  expiration_type: MemoryExpirationType;
  expires_at?: string | null;
  is_active: boolean;
  conversation_id?: string | null;
  project_id?: string | null;
  last_used_at?: string | null;
  last_confirmed_at?: string | null;
  metadata?: Record<string, any>;
  embedding?: number[] | null;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = "active" | "completed" | "paused" | "archived";

export interface ProjectItem {
  id: string;
  user_id: string;
  name: string;
  description: string;
  goals: string[];
  status: ProjectStatus;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemoryItem {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  category: "purpose" | "goal" | "decision" | "milestone" | "technical" | "note";
  importance: MemoryImportance;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConversationSummary {
  id: string;
  conversation_id: string;
  user_id: string;
  summary: string;
  user_goals: string[];
  decisions_made: string[];
  unresolved_questions: string[];
  key_facts: string[];
  next_steps: string[];
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserMemoryPreferences {
  user_id: string;
  memory_enabled: boolean;
  auto_extract_memory: boolean;
  preferred_name?: string;
  communication_style: "concise" | "balanced" | "detailed" | "direct" | "analytical" | "creative" | "socratic";
  custom_instructions?: string;
  occupation?: string;
  interests?: string[];
  metadata?: Record<string, any>;
  updated_at?: string;
}

export interface MemorySearchResult {
  memory: MemoryItem;
  score: number;
  matchReason?: string;
}

export interface MemoryDiagnostics {
  totalMemories: number;
  activeMemories: number;
  total_memories?: number;
  active_projects?: number;
  database_layer?: string;
  memory_footprint_kb?: number;
  byCategory: Record<string, number>;
  byConfidence: Record<string, number>;
  byImportance: Record<string, number>;
  activeProjects: number;
  conversationSummariesCount: number;
  memoryEnabled: boolean;
  isOnline: boolean;
}

export interface ConnectedApp {
  id: string;
  name: string;
  description: string;
  category: string;
  isConnected: boolean;
  scopes: string[];
}

export interface PersonalizationSettings {
  preferredName: string;
  userBio: string;
  communicationStyle: "natural" | "concise" | "detailed" | "direct";
  customInstructions: string;
  interests: string[];
}

export * from "./toolTypes";
export * from "./actionEngineTypes";
export * from "./voiceIdentityTypes";

