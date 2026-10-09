import React, { useState } from "react";
import {
  X,
  Download,
  FileText,
  FileCode,
  FileSpreadsheet,
  Check,
  Calendar,
  MessageSquare,
  User,
  Sparkles,
} from "lucide-react";
import { Conversation, Message } from "../types";
import {
  exportConversationToJson,
  exportConversationToPdf,
  exportConversationToMarkdown,
  formatExportDateTime,
  ExportUserInfo,
} from "../utils/chatExport";

export type ExportFormat = "pdf" | "json" | "markdown";

interface DownloadChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: { id?: string; title?: string; created_at?: string; updated_at?: string } | null;
  messages: Message[];
  userInfo?: ExportUserInfo;
}

export const DownloadChatModal: React.FC<DownloadChatModalProps> = ({
  isOpen,
  onClose,
  conversation,
  messages,
  userInfo,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const title = conversation?.title || "Current Conversation";
  const messageCount = messages.length;
  const userName = userInfo?.nickname || userInfo?.name || "You";

  const handleDownload = (format: ExportFormat = selectedFormat) => {
    setIsExporting(true);
    setExportSuccess(null);

    try {
      if (format === "pdf") {
        exportConversationToPdf(conversation, messages, userInfo);
      } else if (format === "json") {
        exportConversationToJson(conversation, messages, userInfo);
      } else if (format === "markdown") {
        exportConversationToMarkdown(conversation, messages, userInfo);
      }

      setExportSuccess(
        format === "pdf"
          ? "PDF file generated and downloaded!"
          : format === "json"
          ? "JSON file downloaded!"
          : "Markdown file downloaded!"
      );

      setTimeout(() => {
        setExportSuccess(null);
      }, 3500);
    } catch (err: any) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      id="download-chat-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="download-chat-modal"
        className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                Download Conversation
              </h3>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                Save your session history locally
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation Summary Card */}
        <div className="px-5 pt-4 pb-2">
          <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/70 dark:border-neutral-700/60 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-1">
                {title}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 shrink-0 font-medium">
                {messageCount} {messageCount === 1 ? "message" : "messages"}
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-neutral-500 dark:text-neutral-400">
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="truncate">{userName} & Angel</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                <span>{formatExportDateTime(conversation?.created_at || new Date())}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Format Selector */}
        <div className="px-5 py-3 space-y-2.5">
          <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Choose Export Format
          </label>

          {/* Option 1: PDF */}
          <div
            onClick={() => setSelectedFormat("pdf")}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedFormat === "pdf"
                ? "border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 ring-1 ring-cyan-500/30"
                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-transparent"
            }`}
          >
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-500 shrink-0 mt-0.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                  PDF Document (.pdf)
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  Formatted
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                Clean, beautifully styled printable document with badges, timestamps, and page numbers.
              </p>
            </div>
          </div>

          {/* Option 2: JSON */}
          <div
            onClick={() => setSelectedFormat("json")}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedFormat === "json"
                ? "border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 ring-1 ring-cyan-500/30"
                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-transparent"
            }`}
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
              <FileCode className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Raw JSON Data (.json)
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  Structured
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                Complete conversation data with roles, IDs, tool execution logs, and ISO timestamps.
              </p>
            </div>
          </div>

          {/* Option 3: Markdown */}
          <div
            onClick={() => setSelectedFormat("markdown")}
            className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              selectedFormat === "markdown"
                ? "border-cyan-500 bg-cyan-500/5 dark:bg-cyan-500/10 ring-1 ring-cyan-500/30"
                : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-transparent"
            }`}
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Markdown (.md)
                </span>
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                  Notes
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-snug">
                Readable plain-text markdown file easy to import into Notion, Obsidian, or GitHub.
              </p>
            </div>
          </div>
        </div>

        {/* Success notification if any */}
        {exportSuccess && (
          <div className="mx-5 mb-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => handleDownload(selectedFormat)}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 transition shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? "Exporting..." : `Download ${selectedFormat.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
