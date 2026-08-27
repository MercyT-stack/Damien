import {
  UserFacingActionPlan,
  TaskBoundPermissionGrant,
  ActionExecutionReport,
  TargetApplicationId,
} from "../types/actionEngineTypes";

const ACTIVE_TASK_BOUND_GRANTS_KEY = "angel_task_bound_grants_v1";
const PERMISSION_AUDIT_LOG_KEY = "angel_permission_audit_log_v1";

/**
 * Fetch all stored task-bound permission grants
 */
export function getStoredTaskBoundGrants(): TaskBoundPermissionGrant[] {
  try {
    const raw = localStorage.getItem(ACTIVE_TASK_BOUND_GRANTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save task-bound permission grants to local storage
 */
export function saveTaskBoundGrants(grants: TaskBoundPermissionGrant[]): void {
  try {
    localStorage.setItem(ACTIVE_TASK_BOUND_GRANTS_KEY, JSON.stringify(grants));
  } catch {}
}

/**
 * Create a new task-bound temporary permission grant
 */
export function grantTaskBoundPermission(params: {
  userId?: string;
  taskId: string;
  applicationId: TargetApplicationId | string;
  applicationName: string;
  action: string;
  durationMinutes?: number;
}): TaskBoundPermissionGrant {
  const duration = params.durationMinutes || 20;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 60 * 1000).toISOString();

  const grant: TaskBoundPermissionGrant = {
    id: `grant-${Date.now()}`,
    userId: params.userId || "anonymous",
    taskId: params.taskId,
    applicationId: params.applicationId,
    applicationName: params.applicationName,
    action: params.action,
    scopeLevel: "execute_action",
    grantedAt: now.toISOString(),
    expiresAt,
    durationMinutes: duration,
    status: "active",
    auditTrail: [
      {
        timestamp: now.toISOString(),
        event: "GRANTED",
        details: `Granted task-bound access for ${params.action} (${duration}m limit)`,
      },
    ],
  };

  const existing = getStoredTaskBoundGrants();
  saveTaskBoundGrants([grant, ...existing]);
  return grant;
}

/**
 * Release temporary access immediately upon task completion or cancellation
 */
export function releaseTaskBoundPermission(grantId: string): void {
  const grants = getStoredTaskBoundGrants();
  const updated = grants.map((g) => {
    if (g.id === grantId && g.status === "active") {
      return {
        ...g,
        status: "released" as const,
        releasedAt: new Date().toISOString(),
        auditTrail: [
          ...g.auditTrail,
          {
            timestamp: new Date().toISOString(),
            event: "RELEASED",
            details: "Access automatically released after task verification.",
          },
        ],
      };
    }
    return g;
  });

  saveTaskBoundGrants(updated);
}

/**
 * Revoke permission grant manually from Settings / Connections
 */
export function revokeTaskBoundPermission(grantId: string): void {
  const grants = getStoredTaskBoundGrants();
  const updated = grants.map((g) => {
    if (g.id === grantId) {
      return {
        ...g,
        status: "revoked" as const,
        releasedAt: new Date().toISOString(),
        auditTrail: [
          ...g.auditTrail,
          {
            timestamp: new Date().toISOString(),
            event: "REVOKED",
            details: "Revoked manually by user in Settings.",
          },
        ],
      };
    }
    return g;
  });

  saveTaskBoundGrants(updated);
}

/**
 * Call Server API to classify user request and construct user-facing Action Plan
 */
export async function classifyAndConstructActionPlan(params: {
  userPrompt: string;
  intelligenceLevel?: string;
  connectedApps?: string[];
  deviceContext?: Record<string, any>;
}): Promise<UserFacingActionPlan> {
  const res = await fetch("/api/action/classify-and-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Failed to construct action plan: ${res.status}`);
  }

  const data = await res.json();
  return data.plan;
}

/**
 * Execute application control action (WhatsApp, Canva, CapCut, GitHub, Google Drive)
 */
export async function executeAppControl(params: {
  applicationId: string;
  action: string;
  payload: Record<string, any>;
}): Promise<any> {
  const res = await fetch("/api/action/execute-application", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Failed executing app action: ${res.status}`);
  }

  return await res.json();
}
