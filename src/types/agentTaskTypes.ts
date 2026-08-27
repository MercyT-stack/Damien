import { ToolCategory, ToolPermissionLevel, ToolArtifact } from "./toolTypes";

export type TaskClassificationCategory =
  | "QUESTION"
  | "RESEARCH"
  | "CREATION"
  | "EDITING"
  | "ANALYSIS"
  | "COMMUNICATION"
  | "DEVICE_ACTION"
  | "APPLICATION_ACTION"
  | "WEB_ACTION"
  | "FILE_ACTION"
  | "CODING"
  | "DESIGN"
  | "PLANNING"
  | "SCHEDULING"
  | "MULTI_STEP_TASK"
  | "LONG_RUNNING_TASK";

export type TaskComplexity = "simple" | "moderate" | "complex" | "autonomous_workflow";

export type AgentTaskStatus =
  | "QUEUED"
  | "PLANNING"
  | "WAITING_FOR_USER"
  | "WAITING_FOR_PERMISSION"
  | "EXECUTING"
  | "PAUSED"
  | "VERIFYING"
  | "COMPLETED"
  | "PARTIAL_SUCCESS"
  | "FAILED"
  | "CANCELLED"
  | "EXPIRED";

export type StepStatus =
  | "pending"
  | "in_progress"
  | "waiting_permission"
  | "verifying"
  | "completed"
  | "failed"
  | "skipped"
  | "cancelled";

export type ActionReversibility = "REVERSIBLE" | "PARTIALLY_REVERSIBLE" | "IRREVERSIBLE";

export type ActionRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface PendingActionPreview {
  id: string;
  taskId: string;
  stepId: string;
  actionType: "email_send" | "message_send" | "file_delete" | "publish" | "account_change" | "form_submit" | "custom";
  title: string;
  description: string;
  recipient?: string;
  subject?: string;
  previewContent: string;
  reversibility: ActionReversibility;
  riskLevel: ActionRiskLevel;
  requiredPermission: string;
  status: "pending_approval" | "approved" | "rejected" | "executed";
  createdAt: string;
}

export interface AgentTaskStep {
  id: string;
  order: number;
  label: string;
  description?: string;
  toolId?: string;
  inputPayload?: Record<string, any>;
  dependencies: string[]; // Step IDs that must complete first
  status: StepStatus;
  riskLevel: ActionRiskLevel;
  reversibility: ActionReversibility;
  requiresConfirmation: boolean;
  actionPreview?: PendingActionPreview;
  outputArtifact?: ToolArtifact;
  outputResult?: any;
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  error?: string;
  retryCount: number;
  maxRetries: number;
  alternativeToolId?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
}

export interface TaskQualityVerification {
  isVerified: boolean;
  objectiveMetScore: number; // 0 to 100
  checksPerformed: string[];
  syntaxPassed?: boolean;
  sourcesRetrievedCount?: number;
  formatCompliant?: boolean;
  notes?: string;
  recommendations?: string[];
  verifiedAt: string;
}

export interface AgentTask {
  id: string;
  userId?: string;
  conversationId: string;
  title: string;
  userGoal: string;
  categories: TaskClassificationCategory[];
  complexity: TaskComplexity;
  intelligenceLevel: "quick" | "standard" | "detailed" | "deep" | "pro" | "auto";
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: AgentTaskStatus;
  steps: AgentTaskStep[];
  currentStepIndex: number;
  progressPercent: number;
  requiredTools: string[];
  requiredPermissions: string[];
  outputArtifacts: ToolArtifact[];
  verification?: TaskQualityVerification;
  sideNotes: string[]; // User steering instructions added during execution
  pendingClarification?: {
    question: string;
    options?: string[];
    context: string;
  } | null;
  errorMessage?: string;
  partialSuccessNotes?: string;
  offlineSupported: boolean;
  maxExecutionTimeMs: number;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type AgentEventType =
  | "TASK_CREATED"
  | "PLAN_CREATED"
  | "PLAN_MODIFIED"
  | "STEP_STARTED"
  | "STEP_COMPLETED"
  | "STEP_FAILED"
  | "STEP_RETRIED"
  | "PERMISSION_REQUESTED"
  | "PERMISSION_GRANTED"
  | "PERMISSION_DENIED"
  | "CLARIFICATION_REQUESTED"
  | "CLARIFICATION_ANSWERED"
  | "ACTION_PREVIEW_GENERATED"
  | "ACTION_APPROVED"
  | "ACTION_REJECTED"
  | "USER_STEERING_NOTE"
  | "TASK_PAUSED"
  | "TASK_RESUMED"
  | "TASK_CANCELLED"
  | "TASK_VERIFIED"
  | "TASK_COMPLETED"
  | "TASK_FAILED";

export interface AgentTaskEvent {
  id: string;
  taskId: string;
  eventType: AgentEventType;
  stepId?: string;
  toolId?: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}
