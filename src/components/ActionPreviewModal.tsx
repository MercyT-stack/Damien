import React from "react";
import { PendingActionPreview } from "../types/agentTaskTypes";
import {
  ShieldAlert,
  Send,
  Trash2,
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
} from "lucide-react";

interface ActionPreviewModalProps {
  preview: PendingActionPreview | null;
  onApprove: (previewId: string) => void;
  onReject: (previewId: string) => void;
  onClose: () => void;
}

export const ActionPreviewModal: React.FC<ActionPreviewModalProps> = ({
  preview,
  onApprove,
  onReject,
  onClose,
}) => {
  if (!preview) return null;

  const isIrreversible = preview.reversibility === "IRREVERSIBLE";
  const isHighRisk = preview.riskLevel === "HIGH" || preview.riskLevel === "CRITICAL";

  const getActionIcon = () => {
    switch (preview.actionType) {
      case "email_send":
      case "message_send":
        return <Send className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
      case "file_delete":
        return <Trash2 className="w-5 h-5 text-red-500 dark:text-red-400" />;
      case "publish":
        return <Share2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />;
      default:
        return <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-preview-title"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 flex items-start justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center border border-neutral-200 dark:border-neutral-700">
              {getActionIcon()}
            </div>
            <div>
              <h2 id="action-preview-title" className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                {preview.title || "Confirm Sensitive Action"}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Angel prepared this action and requires your confirmation before proceeding.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Close"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Badges and metadata */}
        <div className="px-6 py-3 bg-neutral-100/60 dark:bg-neutral-800/40 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
              isHighRisk
                ? "bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20"
                : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Risk: {preview.riskLevel}
          </span>
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium ${
              isIrreversible
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
            }`}
          >
            {preview.reversibility}
          </span>
          {preview.recipient && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-200/80 dark:bg-neutral-700/80 text-neutral-700 dark:text-neutral-300 font-medium">
              <User className="w-3.5 h-3.5" />
              To: {preview.recipient}
            </span>
          )}
        </div>

        {/* Content Body */}
        <div className="px-6 py-4 flex-1 overflow-y-auto space-y-4 text-sm">
          {preview.subject && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1">
                Subject
              </div>
              <div className="p-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl border border-neutral-200 dark:border-neutral-700 font-medium text-neutral-900 dark:text-neutral-100">
                {preview.subject}
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Prepared Payload / Content
            </div>
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-56 overflow-y-auto">
              {preview.previewContent}
            </div>
          </div>

          {isIrreversible && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <strong>Notice:</strong> This action cannot be undone once executed. Please verify all information carefully.
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/80 flex items-center justify-between gap-3">
          <button
            onClick={() => onReject(preview.id)}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 transition"
          >
            Cancel Action
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onApprove(preview.id)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400 shadow-md transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve & Execute
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
