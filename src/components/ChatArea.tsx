import React, { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { useConversation } from "../contexts/ConversationContext";
import { useAuth } from "../contexts/AuthContext";
import { useMemory } from "../contexts/MemoryContext";
import { useVoice } from "../contexts/VoiceContext";
import { useCapability } from "../contexts/CapabilityContext";
import { AngelLogo } from "./AngelLogo";
import { Greeting } from "./Greeting";
import { AngelLiveBanner } from "./AngelLiveBanner";
import { TaskExecutionPanel } from "./TaskExecutionPanel";
import { PermissionRequestModal } from "./PermissionRequestModal";
import { ArtifactViewerModal } from "./artifacts/ArtifactViewerModal";
import { ActionPreviewModal } from "./ActionPreviewModal";
import { DownloadChatModal } from "./DownloadChatModal";
import { ReadAloudPlayerBar } from "./ReadAloudPlayerBar";
import { useReadAloud } from "../hooks/useReadAloud";
import { UserAvatar } from "./UserAvatar";
import { 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Volume2, 
  VolumeX,
  Radio,
  Globe,
  ExternalLink,
  FileText,
  Code2,
  Table,
  BookOpen,
  Network,
  Presentation,
  CheckCircle2,
  Download,
  Eye,
  Clock,
  MessageSquare,
  Square,
  ArrowDown
} from "lucide-react";
import { ToolArtifact } from "../types/toolTypes";

interface ChatAreaProps {
  onSelectPrompt: (prompt: string) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({ onSelectPrompt }) => {
  const {
    messages,
    isStreaming,
    streamingMessage,
    error,
    clearError,
    activeConversation,
    isLoadingMessages,
  } = useConversation();

  const { user } = useAuth();
  const { memoryPreferences } = useMemory();
  const { isVoiceActive, liveTranscript, voiceState, selectedVoice } = useVoice();
  const {
    setActiveArtifactModal,
    activeActionPreview,
    approveActionPreview,
    rejectActionPreview,
    setActiveActionPreview,
  } = useCapability();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState<boolean>(false);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState<boolean>(false);
  const isNearBottomRef = useRef<boolean>(true);
  const prevMessagesCountRef = useRef<number>(messages.length);
  const readAloud = useReadAloud();

  // Stop read aloud when Live Voice session is active
  useEffect(() => {
    if (isVoiceActive) {
      readAloud.stop();
    }
  }, [isVoiceActive, readAloud]);

  // Scroll active message into view when reading conversation aloud
  useEffect(() => {
    if (readAloud.isConversationMode && readAloud.activeMessageId) {
      const el = document.getElementById(`message-${readAloud.activeMessageId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [readAloud.activeMessageId, readAloud.isConversationMode]);

  // Handle user scroll events to detect if user has scrolled away from bottom
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const distanceToBottom = scrollHeight - (scrollTop + clientHeight);

    // Consider within 120px as "near bottom"
    const isAtBottom = distanceToBottom <= 120;
    isNearBottomRef.current = isAtBottom;

    if (distanceToBottom > 240 && messages.length > 2) {
      setShowScrollBottomBtn(true);
    } else {
      setShowScrollBottomBtn(false);
    }
  };

  // Dedicated function to scroll cleanly to the most recent message
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
    }
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
    setShowScrollBottomBtn(false);
    isNearBottomRef.current = true;
  };

  // Auto scroll to bottom when new content is added to the conversation history
  useEffect(() => {
    if (readAloud.isPlaying) return;

    const countChanged = messages.length !== prevMessagesCountRef.current;
    prevMessagesCountRef.current = messages.length;

    // When a brand new message is added or streamed, or if user is near bottom, ensure it's visible
    if (countChanged || isNearBottomRef.current || isStreaming) {
      // Immediate frame
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
        messagesEndRef.current?.scrollIntoView({
          behavior: countChanged ? "smooth" : "auto",
          block: "end",
        });
      });
    }
  }, [messages, streamingMessage, isStreaming, liveTranscript, readAloud.isPlaying]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const getArtifactIcon = (type: string) => {
    switch (type) {
      case "document":
        return <FileText className="w-4 h-4 text-blue-400" />;
      case "code":
        return <Code2 className="w-4 h-4 text-emerald-400" />;
      case "spreadsheet":
        return <Table className="w-4 h-4 text-cyan-400" />;
      case "research":
        return <BookOpen className="w-4 h-4 text-purple-400" />;
      case "diagram":
        return <Network className="w-4 h-4 text-cyan-400" />;
      case "presentation":
        return <Presentation className="w-4 h-4 text-rose-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
    }
  };

  const formatMessageTime = (dateInput?: string | Date) => {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  };

  const formatFullDateTime = (dateInput?: string | Date) => {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatDateDivider = (dateInput?: string | Date) => {
    if (!dateInput) return "";
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";

    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    return d.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const isSameDay = (d1Str?: string, d2Str?: string) => {
    if (!d1Str || !d2Str) return false;
    const d1 = new Date(d1Str);
    const d2 = new Date(d2Str);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div
      id="angel-chat-area"
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-4 py-6 relative custom-scrollbar scroll-smooth"
    >
      {/* Global Capability Modals */}
      <PermissionRequestModal />
      <ArtifactViewerModal />
      <ActionPreviewModal
        preview={activeActionPreview}
        onApprove={approveActionPreview}
        onReject={rejectActionPreview}
        onClose={() => setActiveActionPreview(null)}
      />
      <DownloadChatModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        conversation={activeConversation}
        messages={messages}
        userInfo={{
          name: user?.name,
          email: user?.email,
          nickname: memoryPreferences?.preferred_name || user?.username || user?.display_name,
        }}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Angel Live In-Chat Banner */}
        <AngelLiveBanner />

        {/* Active Multi-step Task Pipeline Panel */}
        <TaskExecutionPanel />

        {/* Conversation Header & Download Action Bar (when messages exist) */}
        {messages.length > 0 && (
          <div
            id="conversation-header-action-bar"
            className="flex items-center justify-between px-3 py-2 rounded-xl bg-neutral-100/70 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-xs animate-fadeIn"
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              <MessageSquare className="w-4 h-4 text-cyan-500 shrink-0" />
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                {activeConversation?.title || "Active Conversation"}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0 font-medium">
                {messages.length} {messages.length === 1 ? "message" : "messages"}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Read Aloud Conversation Button */}
              {readAloud.isSupported && (
                <button
                  id="btn-read-aloud-chat"
                  onClick={() => {
                    if (readAloud.isPlaying && readAloud.isConversationMode) {
                      readAloud.stop();
                    } else {
                      readAloud.speakConversation(messages);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border shadow-2xs hover:shadow-xs transition group ${
                    readAloud.isPlaying && readAloud.isConversationMode
                      ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-700 dark:text-cyan-300"
                      : "bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 border-neutral-200/80 dark:border-neutral-700"
                  }`}
                  title={
                    readAloud.isPlaying && readAloud.isConversationMode
                      ? "Stop Reading History"
                      : "Read Entire Conversation Aloud (Web Speech API)"
                  }
                  aria-label="Read Conversation Aloud"
                >
                  {readAloud.isPlaying && readAloud.isConversationMode ? (
                    <>
                      <Square className="w-3.5 h-3.5 text-rose-500 fill-current" />
                      <span className="font-semibold text-rose-600 dark:text-rose-400">Stop Reading</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">Read Aloud</span>
                    </>
                  )}
                </button>
              )}

              <button
                id="btn-download-chat"
                onClick={() => setIsDownloadModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700 shadow-2xs hover:shadow-xs transition group"
                title="Download Chat (PDF or JSON)"
                aria-label="Download Chat"
              >
                <Download className="w-3.5 h-3.5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-cyan-700 dark:text-cyan-400">Download Chat</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Notification Banner */}
        {error && (
          <div
            id="chat-error-banner"
            className="flex items-center justify-between p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs animate-fadeIn"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="px-2 py-1 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-rose-700 dark:text-rose-300 font-medium text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoadingMessages && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs text-neutral-400">Loading conversation history...</span>
          </div>
        ) : messages.length === 0 && !isStreaming && !isVoiceActive ? (
          /* Empty state: Dynamic Greeting & Suggestions */
          <Greeting onSelectPrompt={onSelectPrompt} />
        ) : (
          /* Messages Stream */
          <div className="space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const isVoiceMsg = msg.metadata?.modality === "voice" || msg.metadata?.voice;
              const toolCalls = msg.metadata?.toolCalls || [];
              const sources = msg.metadata?.sources || [];
              const artifacts = (msg.metadata?.artifacts || []) as ToolArtifact[];

              const prevMsg = index > 0 ? messages[index - 1] : null;
              const showDateDivider = index === 0 || !isSameDay(prevMsg?.created_at, msg.created_at);
              const formattedTime = formatMessageTime(msg.created_at);
              const fullDateTime = formatFullDateTime(msg.created_at);
              const isThisMessagePlaying =
                readAloud.activeMessageId === msg.id && (readAloud.isPlaying || readAloud.isPaused);

              return (
                <React.Fragment key={msg.id}>
                  {/* Calendar Day Divider */}
                  {showDateDivider && (
                    <div className="flex items-center justify-center my-4 select-none animate-fadeIn">
                      <div className="h-px bg-neutral-200 dark:bg-neutral-800/80 flex-1 max-w-[60px] sm:max-w-[100px]" />
                      <span className="mx-3 px-3 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-[11px] font-medium text-neutral-500 dark:text-neutral-400 tracking-wide font-mono">
                        {formatDateDivider(msg.created_at)}
                      </span>
                      <div className="h-px bg-neutral-200 dark:bg-neutral-800/80 flex-1 max-w-[60px] sm:max-w-[100px]" />
                    </div>
                  )}

                  <div
                    id={`message-${msg.id}`}
                    className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fadeIn`}
                  >
                    {/* Angel Avatar on Left */}
                    {!isUser && (
                      <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        <AngelLogo size="xs" />
                      </div>
                    )}

                    {/* Message Bubble Container */}
                    <div
                      className={`relative max-w-[85%] sm:max-w-[80%] group rounded-2xl p-4 sm:p-5 text-sm leading-relaxed transition-all duration-200 ${
                        isThisMessagePlaying
                          ? "ring-2 ring-cyan-500 shadow-lg shadow-cyan-500/20"
                          : ""
                      } ${
                        isUser
                          ? "bg-white text-neutral-950 dark:bg-white dark:text-neutral-950 font-normal rounded-tr-xs shadow-md border border-neutral-200/60 dark:border-transparent"
                          : "bg-[#131314] text-neutral-100 border border-neutral-800/90 rounded-tl-xs shadow-md"
                      }`}
                    >
                      {/* Header for Angel: Exact visual style matching screenshot */}
                      {!isUser && (
                        <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800/80 text-xs gap-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className="font-bold tracking-wider uppercase text-cyan-500 text-[11px]">
                              ANGEL
                            </span>
                            {isVoiceMsg && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-medium">
                                <Volume2 className="w-3 h-3" />
                                <span>Spoken</span>
                              </span>
                            )}
                            {toolCalls.length > 0 && (
                              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 font-mono">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{toolCalls[0].toolName || "Tool Executed"}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {formattedTime && (
                              <span
                                className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 select-none"
                                title={fullDateTime}
                              >
                                <Clock className="w-3 h-3 opacity-60" />
                                <span>{formattedTime}</span>
                              </span>
                            )}
                            {readAloud.isSupported && (
                              <button
                                id={`btn-read-aloud-msg-${msg.id}`}
                                onClick={() => readAloud.speakMessage(msg)}
                                className={`p-1 rounded-md transition-all ${
                                  isThisMessagePlaying
                                    ? "text-cyan-400 bg-cyan-500/20 opacity-100"
                                    : "opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-white hover:bg-neutral-800"
                                }`}
                                title={
                                  isThisMessagePlaying
                                    ? readAloud.isPaused
                                      ? "Resume playback"
                                      : "Pause / Stop reading"
                                    : "Read response aloud"
                                }
                                aria-label="Read response aloud"
                              >
                                {isThisMessagePlaying ? (
                                  readAloud.isPaused ? (
                                    <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                                  ) : (
                                    <Volume2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                  )
                                ) : (
                                  <Volume2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              id={`btn-copy-msg-${msg.id}`}
                              onClick={() => handleCopy(msg.content, msg.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-opacity"
                              title="Copy response"
                            >
                              {copiedMsgId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Message Body */}
                      {isUser ? (
                        <div className="space-y-2.5">
                          {msg.metadata?.previewUrl && (
                            <div className="rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-sm max-w-sm">
                              {msg.metadata.mediaType?.startsWith("video/") || msg.metadata.previewUrl.startsWith("data:video/") ? (
                                <video
                                  src={msg.metadata.previewUrl}
                                  controls
                                  playsInline
                                  className="w-full h-auto max-h-64 object-contain bg-black"
                                />
                              ) : (
                                <img
                                  src={msg.metadata.previewUrl}
                                  alt={msg.metadata.mediaName || "Attached image"}
                                  className="w-full h-auto max-h-64 object-contain bg-neutral-900"
                                />
                              )}
                              {msg.metadata.mediaName && (
                                <div className="px-3 py-1.5 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-300 flex items-center justify-between font-mono">
                                  <span className="truncate">{msg.metadata.mediaName}</span>
                                  {msg.metadata.sourceType && (
                                    <span className="capitalize font-sans px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-[9px]">
                                      {msg.metadata.sourceType}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          <div className="whitespace-pre-wrap text-neutral-900 font-normal break-words">{msg.content}</div>
                          <div className="flex items-center justify-end gap-2 pt-1 text-[10px] text-neutral-500 select-none font-mono tracking-tight">
                            {readAloud.isSupported && (
                              <button
                                id={`btn-read-aloud-user-${msg.id}`}
                                onClick={() => readAloud.speakMessage(msg)}
                                className={`p-1 rounded-md transition-all ${
                                  isThisMessagePlaying
                                    ? "text-cyan-600 bg-cyan-500/20 opacity-100"
                                    : "opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100"
                                }`}
                                title={
                                  isThisMessagePlaying
                                    ? readAloud.isPaused
                                      ? "Resume playback"
                                      : "Pause / Stop reading"
                                    : "Read message aloud"
                                }
                                aria-label="Read message aloud"
                              >
                                <Volume2
                                  className={`w-3 h-3 ${isThisMessagePlaying ? "text-cyan-600 animate-pulse" : ""}`}
                                />
                              </button>
                            )}
                            {formattedTime && (
                              <div className="flex items-center gap-1" title={fullDateTime}>
                                <Clock className="w-2.5 h-2.5 opacity-60" />
                                <span>{formattedTime}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                      <div className="space-y-3">
                        <div className="markdown-body prose prose-invert max-w-none text-sm space-y-3 font-normal leading-relaxed text-neutral-200">
                          <Markdown>{msg.content}</Markdown>
                        </div>

                        {/* Grounded Web Sources Row */}
                        {sources.length > 0 && (
                          <div className="pt-2 border-t border-neutral-800/60 space-y-1.5">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                              <Globe className="w-3 h-3 text-cyan-400" />
                              <span>Verified Sources & Citations:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {sources.map((src: any, sIdx: number) => (
                                <a
                                  key={sIdx}
                                  href={src.url || "#"}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-cyan-500/40 text-[11px] text-neutral-300 hover:text-cyan-300 transition-colors"
                                >
                                  <span className="truncate max-w-[140px]">{src.title || src.domain || `Source ${sIdx + 1}`}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Embedded Artifact Cards */}
                        {artifacts.length > 0 && (
                          <div className="pt-2 space-y-2">
                            {artifacts.map((art) => (
                              <div
                                key={art.id}
                                onClick={() => setActiveArtifactModal(art)}
                                className="group/art flex items-center justify-between p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-950 transition-all cursor-pointer shadow-sm"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover/art:border-cyan-500/30">
                                    {getArtifactIcon(art.type)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500 font-mono">
                                        {art.type}
                                      </span>
                                      <span className="text-[10px] text-neutral-500">• Click to open viewer</span>
                                    </div>
                                    <h4 className="text-xs font-semibold text-neutral-200 group-hover/art:text-white truncate">
                                      {art.title}
                                    </h4>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 text-neutral-400 group-hover/art:text-cyan-400 px-2 py-1 rounded-lg text-xs">
                                  <Eye className="w-3.5 h-3.5" />
                                  <span className="text-[11px] font-medium hidden sm:inline">Preview</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User Avatar on Right */}
                  {isUser && (
                    <UserAvatar
                      avatarId={user?.avatar_id}
                      usernameOrEmail={user?.username || user?.email}
                      size="md"
                      className="mt-0.5"
                    />
                  )}
                </div>
              </React.Fragment>
              );
            })}

            {/* Live User Spoken Stream Indicator */}
            {isVoiceActive && liveTranscript.user && (
              <div className="flex gap-3 justify-end animate-fadeIn">
                <div className="relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed bg-white text-neutral-950 rounded-tr-xs shadow-md border border-cyan-500/40">
                  <div className="flex items-center justify-between text-[10px] text-cyan-600 font-semibold mb-1 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3 h-3 animate-pulse" />
                      <span>Speaking live...</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 opacity-60" />
                      <span>{formatMessageTime(new Date())}</span>
                    </span>
                  </div>
                  <div className="italic text-neutral-900">{liveTranscript.user}</div>
                </div>
                <UserAvatar
                  avatarId={user?.avatar_id}
                  usernameOrEmail={user?.username || user?.email}
                  size="md"
                  className="mt-0.5"
                />
              </div>
            )}

            {/* Live Assistant Voice Streaming Message */}
            {isVoiceActive && liveTranscript.assistant && (
              <div className="flex gap-3 justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <AngelLogo size="xs" />
                </div>

                <div className="relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed bg-[#131314] text-neutral-100 border border-cyan-500/50 rounded-tl-xs shadow-lg">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800/80 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold tracking-wider uppercase text-cyan-500 text-[11px]">
                        ANGEL
                      </span>
                      <span className="text-[10px] text-cyan-400 font-medium">
                        (Live Voice: {selectedVoice.name})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 select-none">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{formatMessageTime(new Date())}</span>
                      </span>
                      <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    </div>
                  </div>

                  <div className="markdown-body prose prose-invert max-w-none text-sm space-y-3 font-normal leading-relaxed text-neutral-200">
                    <Markdown>{liveTranscript.assistant}</Markdown>
                  </div>
                </div>
              </div>
            )}

            {/* Live Text Streaming Message Block */}
            {isStreaming && (
              <div id="message-streaming" className="flex gap-3 justify-start animate-fadeIn">
                <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-cyan-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                  <AngelLogo size="xs" />
                </div>

                <div className="relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed bg-[#131314] text-neutral-100 border border-neutral-800/90 rounded-tl-xs shadow-md">
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800/80 text-xs">
                    <span className="font-bold tracking-wider uppercase text-cyan-500 text-[11px]">
                      ANGEL
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1 select-none">
                        <Clock className="w-3 h-3 opacity-60" />
                        <span>{formatMessageTime(new Date())}</span>
                      </span>
                      <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                    </div>
                  </div>

                  {streamingMessage ? (
                    <div className="markdown-body prose prose-invert max-w-none text-sm space-y-3 font-normal leading-relaxed text-neutral-200">
                      <Markdown>{streamingMessage}</Markdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-neutral-400 py-1 text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500 animate-spin" />
                      <span>Angel is thinking...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Auditory Playback Controller Bar */}
        <ReadAloudPlayerBar player={readAloud} />
      </div>

      {/* Floating Scroll To Bottom Button when user scrolled up */}
      {showScrollBottomBtn && (
        <button
          id="btn-scroll-to-bottom"
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="fixed bottom-24 right-8 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full bg-cyan-500 text-neutral-950 font-semibold text-xs shadow-lg shadow-cyan-500/25 hover:bg-cyan-400 hover:scale-105 active:scale-95 transition-all animate-bounce"
          aria-label="Scroll to newest message"
          title="Scroll to most recent message"
        >
          <ArrowDown className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Newest</span>
        </button>
      )}
    </div>
  );
};

