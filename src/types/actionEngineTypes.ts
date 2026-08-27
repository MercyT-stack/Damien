/**
 * ANGEL — STAGE 10 TYPES
 * Universal Action Engine, Application Control, Web Control,
 * Automation, Task-Bound Permissions & Task Execution
 */

export type ActionCategory =
  | "INFORMATIONAL"
  | "RESEARCH"
  | "CREATION"
  | "EDITING"
  | "AUTOMATION"
  | "APPLICATION_CONTROL"
  | "WEB_CONTROL"
  | "COMMUNICATION"
  | "FILE_OPERATION"
  | "ACCOUNT_OPERATION"
  | "TRANSACTIONAL"
  | "SCHEDULED"
  | "MULTI_STEP_AGENT_TASK";

export type ActionLifecycleStage =
  | "UNDERSTAND"
  | "PLAN"
  | "ASK_FOR_PERMISSION"
  | "ACCESS"
  | "EXECUTE"
  | "OBSERVE"
  | "VERIFY"
  | "REPORT"
  | "RELEASE_ACCESS";

export type TargetApplicationId =
  | "whatsapp"
  | "canva"
  | "capcut"
  | "github"
  | "google_drive"
  | "google_calendar"
  | "gmail"
  | "browser"
  | "terminal_ide"
  | "filesystem"
  | "system_app"
  | "custom_web";

export type PermissionScopeLevel = "read_only" | "read_write" | "manage" | "execute_action";

export interface TaskBoundPermissionGrant {
  id: string;
  userId: string;
  taskId: string;
  applicationId: TargetApplicationId | string;
  applicationName: string;
  action: string;
  scopeLevel: PermissionScopeLevel;
  grantedAt: string;
  expiresAt: string;
  durationMinutes: number;
  status: "active" | "released" | "revoked" | "expired";
  releasedAt?: string;
  auditTrail: Array<{
    timestamp: string;
    event: string;
    details?: string;
  }>;
}

export interface UserFacingActionPlan {
  planId: string;
  category: ActionCategory;
  title: string;
  whatImAboutToDo: string;
  estimatedDuration: string;
  requiresPermissionPrompt: boolean;
  requiredApplication?: {
    id: TargetApplicationId | string;
    name: string;
    icon: string;
    isInstalledOrAvailable: boolean;
    appUrl?: string;
  };
  permissionRequirement?: {
    applicationId: string;
    applicationName: string;
    scope: string;
    durationDescription: string;
    isSensitive: boolean;
    reason: string;
  };
  steps: Array<{
    order: number;
    label: string;
    description: string;
    requiresConfirmation?: boolean;
    riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  }>;
  verificationCriteria: string[];
  safetyCheckNote?: string;
  draftPreview?: {
    type: "message" | "creative_design" | "video_timeline" | "code_diff" | "form_submission";
    recipient?: string;
    possibleRecipients?: Array<{ name: string; detail: string; id: string }>;
    subject?: string;
    content: string;
    metadata?: Record<string, any>;
  };
}

export interface ApplicationLaunchResult {
  applicationId: string;
  applicationName: string;
  launched: boolean;
  platform: "web" | "desktop" | "mobile" | "protocol";
  targetUrlOrProtocol?: string;
  verificationStatus: "verified_opened" | "unconfirmed" | "unavailable";
  message: string;
}

export interface BrowserControlAction {
  actionType: "navigate" | "search" | "read_content" | "fill_form" | "click" | "extract_data" | "download";
  url?: string;
  selector?: string;
  value?: string;
  isReadAction: boolean; // Distinction between reading and acting
  requiresConfirmation: boolean;
}

export interface CodeSafetyDiff {
  filePath: string;
  operation: "create" | "modify" | "delete";
  summary: string;
  originalSnippet?: string;
  newSnippet: string;
  isDestructive: boolean;
}

export interface ActionExecutionReport {
  taskId: string;
  category: ActionCategory;
  success: boolean;
  summary: string;
  targetApp?: string;
  artifactsProduced: Array<{
    id: string;
    title: string;
    type: string;
    content: string;
    url?: string;
  }>;
  verificationStatus: "verified" | "partially_verified" | "failed";
  verificationDetails: string[];
  accessReleased: boolean;
  releasedPermissionId?: string;
  timestamp: string;
}
