import React, { useEffect, useRef, useState } from "react";
import Markdown from "react-markdown";
import { useConversation } from "../contexts/ConversationContext";
import { useAuth } from "../contexts/AuthContext";
import { useVoice } from "../contexts/VoiceContext";
import { useCapability } from "../contexts/CapabilityContext";
import { AngelLogo } from "./AngelLogo";
import { Greeting } from "./Greeting";
import { AngelLiveBanner } from "./AngelLiveBanner";
import { TaskExecutionPanel } from "./TaskExecutionPanel";
import { PermissionRequestModal } from "./PermissionRequestModal";
import { ArtifactViewerModal } from "./artifacts/ArtifactViewerModal";
import { ActionPreviewModal } from "./ActionPreviewModal";
import { 
  Copy, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Volume2, 
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
  Eye
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
  const { isVoiceActive, liveTranscript, voiceState, selectedVoice } = useVoice();
  const {
    setActiveArtifactModal,
    activeActionPreview,
    approveActionPreview,
    rejectActionPreview,
    setActiveActionPreview,
  } = useCapability();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingMessage, isStreaming, liveTranscript]);

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

  return (
    <div id="angel-chat-area" className="flex-1 overflow-y-auto px-4 py-6">
      {/* Global Capability Modals */}
      <PermissionRequestModal />
      <ArtifactViewerModal />
      <ActionPreviewModal
        preview={activeActionPreview}
        onApprove={approveActionPreview}
        onReject={rejectActionPreview}
        onClose={() => setActiveActionPreview(null)}
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {/* Angel Live In-Chat Banner */}
        <AngelLiveBanner />

        {/* Active Multi-step Task Pipeline Panel */}
        <TaskExecutionPanel />

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
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isVoiceMsg = msg.metadata?.modality === "voice" || msg.metadata?.voice;
              const toolCalls = msg.metadata?.toolCalls || [];
              const sources = msg.metadata?.sources || [];
              const artifacts = (msg.metadata?.artifacts || []) as ToolArtifact[];

              return (
                <div
                  key={msg.id}
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
                    className={`relative max-w-[85%] sm:max-w-[80%] group rounded-2xl p-4 sm:p-5 text-sm leading-relaxed ${
                      isUser
                        ? "bg-white text-neutral-950 dark:bg-white dark:text-neutral-950 font-normal rounded-tr-xs shadow-md border border-neutral-200/60 dark:border-transparent"
                        : "bg-[#131314] text-neutral-100 border border-neutral-800/90 rounded-tl-xs shadow-md"
                    }`}
                  >
                    {/* Header for Angel: Exact visual style matching screenshot */}
                    {!isUser && (
                      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-neutral-800/80 text-xs">
                        <div className="flex items-center gap-2">
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
                    )}

                    {/* Message Body */}
                    {isUser ? (
                      <div className="space-y-2.5">
                        {msg.metadata?.previewUrl && (
                          <div className="rounded-xl overflow-hidden border border-neutral-200 shadow-sm max-w-sm">
                            <img
                              src={msg.metadata.previewUrl}
                              alt={msg.metadata.mediaName || "Attached image"}
                              className="w-full h-auto max-h-64 object-contain bg-neutral-900"
                            />
                            {msg.metadata.mediaName && (
                              <div className="px-3 py-1.5 bg-neutral-50 border-t border-neutral-200 text-[11px] text-neutral-600 flex items-center justify-between font-mono">
                                <span className="truncate">{msg.metadata.mediaName}</span>
                                {msg.metadata.sourceType && (
                                  <span className="capitalize font-sans px-1.5 py-0.5 rounded bg-neutral-200 text-neutral-700 text-[9px]">
                                    {msg.metadata.sourceType}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap text-neutral-900 font-normal">{msg.content}</div>
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
                    <div className="w-8 h-8 rounded-xl bg-neutral-800 text-neutral-100 dark:bg-neutral-200 dark:text-neutral-900 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm mt-0.5 border border-neutral-700 dark:border-neutral-300">
                      {(user?.display_name || user?.email || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Live User Spoken Stream Indicator */}
            {isVoiceActive && liveTranscript.user && (
              <div className="flex gap-3 justify-end animate-fadeIn">
                <div className="relative max-w-[85%] sm:max-w-[80%] rounded-2xl p-4 sm:p-5 text-sm leading-relaxed bg-white text-neutral-950 rounded-tr-xs shadow-md border border-cyan-500/40">
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-600 font-semibold mb-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Speaking live...</span>
                  </div>
                  <div className="italic text-neutral-900">{liveTranscript.user}</div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-cyan-500 text-neutral-950 flex items-center justify-center text-xs font-bold shrink-0 shadow-sm mt-0.5">
                  {(user?.display_name || user?.email || "U").charAt(0).toUpperCase()}
                </div>
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
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
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
                    <span className="inline-block w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
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
      </div>
    </div>
  );
};

