import React, { useState } from "react";
import { useCapability } from "../contexts/CapabilityContext";
import {
  CheckCircle2,
  Circle,
  Loader2,
  XCircle,
  AlertCircle,
  StopCircle,
  Sparkles,
  Send,
  ChevronDown,
  ChevronUp,
  Pause,
  Play,
  RotateCcw,
  ShieldAlert,
  Award,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

export const TaskExecutionPanel: React.FC = () => {
  const {
    activeAgentTask,
    cancelActiveAgentTask,
    pauseActiveAgentTask,
    resumeActiveAgentTask,
    retryFailedAgentTaskStep,
    addSideNoteToAgentTask,
    activeActionPreview,
    setActiveActionPreview,
    isExecuting,
    setActiveArtifactModal,
  } = useCapability();

  const [sideNoteText, setSideNoteText] = useState("");
  const [isExpanded, setIsExpanded] = useState(true);

  if (!activeAgentTask || activeAgentTask.status === "COMPLETED") {
    return null;
  }

  const {
    id,
    title,
    userGoal,
    status,
    steps,
    currentStepIndex,
    progressPercent,
    sideNotes,
    errorMessage,
    verification,
    outputArtifacts,
    priority,
    complexity,
  } = activeAgentTask;

  const isRunning = status === "EXECUTING" || status === "PLANNING" || status === "VERIFYING";
  const isPaused = status === "PAUSED";
  const isWaitingPermission = status === "WAITING_FOR_PERMISSION";

  const handleSendSideNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sideNoteText.trim()) return;
    addSideNoteToAgentTask(sideNoteText.trim());
    setSideNoteText("");
  };

  const getStatusBadge = () => {
    switch (status) {
      case "PLANNING":
        return <span className="text-blue-400 font-semibold">PLANNING EXECUTION</span>;
      case "EXECUTING":
        return <span className="text-cyan-400 font-semibold">ANGEL IS EXECUTING</span>;
      case "VERIFYING":
        return <span className="text-purple-400 font-semibold">VERIFYING QUALITY</span>;
      case "PAUSED":
        return <span className="text-yellow-400 font-semibold">TASK PAUSED</span>;
      case "WAITING_FOR_PERMISSION":
        return <span className="text-rose-400 font-semibold">WAITING FOR APPROVAL</span>;
      case "CANCELLED":
        return <span className="text-neutral-400 font-semibold">TASK STOPPED</span>;
      case "FAILED":
        return <span className="text-red-400 font-semibold">TASK FAILED</span>;
      case "PARTIAL_SUCCESS":
        return <span className="text-cyan-300 font-semibold">PARTIALLY COMPLETED</span>;
      default:
        return <span className="text-neutral-300 font-semibold">TASK QUEUED</span>;
    }
  };

  return (
    <div
      id="angel-task-execution-panel"
      className="mx-auto max-w-4xl mb-4 bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-4 shadow-xl text-neutral-900 dark:text-neutral-100 backdrop-blur-md transition-all animate-fadeIn"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-500">
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {getStatusBadge()}
              </span>
              <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">({progressPercent}%)</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                {complexity}
              </span>
            </div>
            <h4 className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 line-clamp-1">{title}</h4>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Controls */}
          {isRunning && (
            <button
              onClick={pauseActiveAgentTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium transition"
              title="Pause task"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              onClick={resumeActiveAgentTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-medium transition"
              title="Resume task"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          )}

          {(isRunning || isPaused || isWaitingPermission) && (
            <button
              onClick={cancelActiveAgentTask}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-medium transition"
              title="Cancel task"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress Bar Line */}
      <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full mt-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            status === "FAILED" || status === "CANCELLED"
              ? "bg-rose-500"
              : status === "VERIFYING"
              ? "bg-purple-500"
              : "bg-gradient-to-r from-cyan-500 to-cyan-300"
          }`}
          style={{ width: `${Math.max(5, progressPercent)}%` }}
        />
      </div>

      {/* Sensitive Action Approval Alert Banner */}
      {activeActionPreview && (
        <div className="mt-3 p-3 bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-300 dark:border-cyan-700/60 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-cyan-800 dark:text-cyan-300">
            <ShieldAlert className="w-4 h-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
            <span>
              <strong>Action Confirmation Required:</strong> {activeActionPreview.title}
            </span>
          </div>
          <button
            onClick={() => setActiveActionPreview(activeActionPreview)}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium shadow-sm transition"
          >
            Review & Approve
          </button>
        </div>
      )}

      {/* Expanded Step Pipeline */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-3">
          {/* Step Badges Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {steps.map((step, idx) => {
              const isCompleted = step.status === "completed";
              const isCurrent = step.status === "in_progress";
              const isStepFailed = step.status === "failed";
              const isWaiting = step.status === "waiting_permission";

              return (
                <div
                  key={step.id}
                  className={`flex flex-col p-2 rounded-xl text-xs transition-all border ${
                    isCurrent
                      ? "bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-900 dark:text-cyan-200 border-cyan-500/40 shadow-sm"
                      : isCompleted
                      ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/20"
                      : isStepFailed
                      ? "bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-500/30"
                      : isWaiting
                      ? "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-800 dark:text-cyan-300 border-cyan-500/30"
                      : "bg-neutral-50 dark:bg-neutral-800/60 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-800"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 font-medium truncate">
                      {isCurrent ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-500 shrink-0" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      ) : isStepFailed ? (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                      ) : isWaiting ? (
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      )}
                      <span className="truncate">{step.label}</span>
                    </div>

                    {isStepFailed && (
                      <button
                        onClick={() => retryFailedAgentTaskStep(step.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-300 hover:bg-rose-500/30 flex items-center gap-1"
                        title="Retry this step"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        Retry
                      </button>
                    )}
                  </div>

                  {step.description && (
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1">
                      {step.description}
                    </span>
                  )}

                  {step.outputArtifact && (
                    <button
                      onClick={() => setActiveArtifactModal(step.outputArtifact || null)}
                      className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                      View {step.outputArtifact.type}: {step.outputArtifact.title}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quality Verification Card */}
          {verification && (
            <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <Award className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div>
                  <strong>Quality Verification Passed ({verification.objectiveMetScore}/100):</strong>{" "}
                  {verification.notes}
                </div>
              </div>
            </div>
          )}

          {/* Error Message if Failed */}
          {errorMessage && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Side-Notes List if user submitted modifications */}
          {sideNotes && sideNotes.length > 0 && (
            <div className="space-y-1 bg-neutral-50 dark:bg-neutral-950/40 p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800/60 text-xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block">
                User Modifications (Side Chat):
              </span>
              {sideNotes.map((note, nIdx) => (
                <div key={nIdx} className="text-cyan-700 dark:text-cyan-300/90 pl-1 border-l-2 border-cyan-500/50">
                  "{note}"
                </div>
              ))}
            </div>
          )}

          {/* Side Chat Input Form: allows user to steer active task while running */}
          {isRunning && (
            <form onSubmit={handleSendSideNote} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={sideNoteText}
                onChange={(e) => setSideNoteText(e.target.value)}
                placeholder="Steer active task (e.g. 'Use 5 slides', 'Focus on Nigerian pricing')..."
                className="flex-1 bg-neutral-50 dark:bg-neutral-950/80 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-neutral-200 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition"
              />
              <button
                type="submit"
                disabled={!sideNoteText.trim()}
                className="p-1.5 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 text-white rounded-xl transition"
                title="Send steering note"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
