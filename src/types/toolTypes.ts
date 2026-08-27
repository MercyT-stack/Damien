export type ToolCategory =
  | "information"
  | "files"
  | "documents"
  | "data"
  | "creative"
  | "media"
  | "coding"
  | "communication"
  | "productivity"
  | "integrations"
  | "device"
  | "location"
  | "vision";

export type ToolPermissionLevel = "none" | "low" | "medium" | "high" | "critical";

export type ToolPermissionState =
  | "granted"
  | "temporary"
  | "prompt"
  | "denied"
  | "revoked"
  | "expired";

export type ToolConnectionStatus =
  | "connected"
  | "not_connected"
  | "unavailable"
  | "needs_auth"
  | "partial";

export type ToolExecutionState =
  | "idle"
  | "evaluating"
  | "permission_required"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

export type OfflineAvailability = "online" | "offline" | "both" | "partial";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  riskLevel: ToolPermissionLevel;
  requiresConfirmation: boolean;
  offlineAvailability: OfflineAvailability;
  supportedPlatforms: string[];
  connectionStatus: ToolConnectionStatus;
  isEnabled: boolean;
  version: string;
  capabilities: string[];
  authRequirements?: string[];
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export type ArtifactType =
  | "document"
  | "code"
  | "spreadsheet"
  | "research"
  | "image"
  | "diagram"
  | "presentation"
  | "action_preview";

export interface ToolArtifact {
  id: string;
  type: ArtifactType;
  title: string;
  content: string;
  summary?: string;
  metadata?: Record<string, any>;
  downloadUrl?: string;
  rawOutput?: any;
  created_at: string;
}

export type TaskStepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

export interface TaskStep {
  id: string;
  label: string;
  status: TaskStepStatus;
  detail?: string;
  toolId?: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export type TaskOverallStatus = "idle" | "running" | "completed" | "partial_success" | "failed" | "cancelled";

export interface TaskRun {
  id: string;
  conversationId: string;
  user_id?: string;
  title: string;
  intent: string;
  status: TaskOverallStatus;
  steps: TaskStep[];
  activeStepIndex: number;
  selectedTools: string[];
  outputArtifacts: ToolArtifact[];
  progressPercent: number;
  errorMessage?: string;
  sideNotes?: string[];
  created_at: string;
  updated_at: string;
}

export interface PermissionRequest {
  id: string;
  toolId: string;
  toolName: string;
  toolCategory: ToolCategory;
  serviceName: string;
  requestedActions: string[];
  reason: string;
  riskLevel: ToolPermissionLevel;
  targetResource?: string;
  durationOptions: ("once" | "session" | "always")[];
  timestamp: string;
}

export interface UserToolPermission {
  toolId: string;
  state: ToolPermissionState;
  grantedScopes: string[];
  accessType: "temporary" | "persistent" | "none";
  grantedAt?: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
}

export interface ConnectedService {
  id: string;
  name: string;
  provider: string;
  category: ToolCategory;
  description: string;
  icon: string;
  status: ToolConnectionStatus;
  accountEmail?: string;
  accountName?: string;
  scopes: string[];
  grantedScopes: string[];
  accessType: "temporary" | "persistent" | "none";
  requiresOAuth: boolean;
  lastUsed?: string;
  connectedAt?: string;
  notes?: string;
}

export interface ToolExecutionRequest {
  toolId: string;
  input: Record<string, any>;
  conversationId?: string;
  taskId?: string;
  intelligenceLevel?: string;
  context?: Record<string, any>;
}

export interface ToolExecutionResponse {
  success: boolean;
  toolId: string;
  output: any;
  artifact?: ToolArtifact;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  error?: string;
  executionTimeMs?: number;
}
