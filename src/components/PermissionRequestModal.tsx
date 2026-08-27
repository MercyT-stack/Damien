import React from "react";
import { useCapability } from "../contexts/CapabilityContext";
import { ShieldCheck, AlertTriangle, Clock, X, Lock, CheckCircle2, ShieldAlert } from "lucide-react";

export const PermissionRequestModal: React.FC = () => {
  const { activePermissionRequest, grantPermission, denyPermission } = useCapability();

  if (!activePermissionRequest) return null;

  const {
    toolId,
    toolName,
    serviceName,
    requestedActions,
    reason,
    riskLevel,
  } = activePermissionRequest;

  const isHighRisk = riskLevel === "high" || riskLevel === "critical";

  return (
    <div
      id="angel-permission-dialog"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5 text-neutral-100 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isHighRisk
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
              }`}
            >
              {isHighRisk ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-cyan-500 block">
                SECURITY & PERMISSION REQUIRED
              </span>
              <h3 className="text-base font-semibold text-white">{toolName}</h3>
            </div>
          </div>
          <button
            onClick={() => denyPermission(toolId)}
            className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
            title="Cancel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason / Explanation */}
        <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3.5 text-xs text-neutral-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400/90 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Angel requests authorization</span>
          </div>
          <p className="leading-relaxed text-neutral-400">{reason}</p>
        </div>

        {/* Capabilities list */}
        {requestedActions && requestedActions.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
              Requested Actions & Scopes:
            </span>
            <div className="space-y-1.5 bg-neutral-950/40 border border-neutral-800/50 rounded-xl p-3">
              {requestedActions.map((action, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-neutral-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="capitalize">{action.replace(/_/g, " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Temporary Access Notice */}
        <div className="flex items-center gap-2 text-[11px] text-neutral-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
          <span>You maintain complete control. Access can be revoked anytime in Settings.</span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => grantPermission(toolId, "once")}
              className="px-3.5 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium border border-neutral-700/80 transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Allow Once</span>
            </button>
            <button
              onClick={() => grantPermission(toolId, "session")}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-950" />
              <span>Allow Session</span>
            </button>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={() => grantPermission(toolId, "always")}
              className="text-[11px] text-neutral-400 hover:text-neutral-200 hover:underline px-1 py-1"
            >
              Always Allow For This Tool
            </button>
            <button
              onClick={() => denyPermission(toolId)}
              className="px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              Deny
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
