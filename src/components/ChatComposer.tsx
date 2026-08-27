import React, { useState, useRef, useEffect } from "react";
import { useConversation } from "../contexts/ConversationContext";
import { useVoice } from "../contexts/VoiceContext";
import { useAuth } from "../contexts/AuthContext";
import { useCapability } from "../contexts/CapabilityContext";
import { VisionModal } from "./VisionModal";
import { AngelLogo } from "./AngelLogo";
import { IntelligenceLevel } from "../types";
import { VisionAttachmentPayload } from "../types/visionTypes";
import { 
  Plus, 
  ArrowUp, 
  Mic, 
  MicOff,
  Camera, 
  Sparkles, 
  X, 
  Radio, 
  Pause, 
  Play, 
  PhoneOff, 
  Sliders, 
  Check, 
  Keyboard, 
  Image as ImageIcon, 
  Globe, 
  Brain, 
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileCode,
  File,
  Table,
  Code2,
  Network,
  Presentation,
  Plug,
  Monitor,
  Eye,
} from "lucide-react";

interface AttachedDocument {
  name: string;
  type: "pdf" | "spreadsheet" | "code" | "document" | "image" | "text";
  size: string;
  content: string;
  isImage?: boolean;
  sourceType?: string;
}

interface ChatComposerProps {
  initialPrompt?: string;
  onClearInitialPrompt?: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  initialPrompt = "",
  onClearInitialPrompt,
}) => {
  const { sendMessage, isStreaming, intelligenceLevel, setIntelligenceLevel } = useConversation();
  const { 
    startVoiceSession, 
    stopVoiceSession, 
    isVoiceActive, 
    voiceState, 
    isMuted, 
    isPaused, 
    toggleMute, 
    pauseVoice, 
    resumeVoice,
    selectedVoice,
    sendLiveText,
    liveTranscript,
    setIsVoiceLibraryOpen
  } = useVoice();
  const { user } = useAuth();

  const [text, setText] = useState<string>("");
  const [showToolsMenu, setShowToolsMenu] = useState<boolean>(false);
  const [showIntelligenceMenu, setShowIntelligenceMenu] = useState<boolean>(false);
  const [showLiveTextInput, setShowLiveTextInput] = useState<boolean>(false);
  const [isVisionModalOpen, setIsVisionModalOpen] = useState<boolean>(false);
  const [attachedDoc, setAttachedDoc] = useState<AttachedDocument | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const intelligenceMenuRef = useRef<HTMLDivElement>(null);

  // Speech-To-Text (STT) state
  const [isSTTActive, setIsSTTActive] = useState<boolean>(false);
  const [sttTranscript, setSttTranscript] = useState<string>("");
  const [sttError, setSttError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
      if (intelligenceMenuRef.current && !intelligenceMenuRef.current.contains(e.target as Node)) {
        setShowIntelligenceMenu(false);
      }
    };
    if (showToolsMenu || showIntelligenceMenu) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [showToolsMenu, showIntelligenceMenu]);

  // Sync initial prompt from suggestion cards if provided
  useEffect(() => {
    if (initialPrompt) {
      setText(initialPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
      onClearInitialPrompt?.();
    }
  }, [initialPrompt, onClearInitialPrompt]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  // Speech-To-Text (STT) initialization & control
  const startSTT = () => {
    setSttError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSttError("Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let accumulated = "";

      recognition.onstart = () => {
        setIsSTTActive(true);
        setSttTranscript("");
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            accumulated += event.results[i][0].transcript + " ";
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setSttTranscript((accumulated + interim).trim());
      };

      recognition.onerror = (event: any) => {
        console.warn("[STT] Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          setSttError("Microphone access was denied. Please allow microphone permissions.");
        } else if (event.error !== "no-speech") {
          setSttError(`Voice recognition error: ${event.error}`);
        }
        setIsSTTActive(false);
      };

      recognition.onend = () => {
        // Handled on Done or Cancel
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("[STT] Failed to start:", err);
      setSttError("Could not initialize microphone input.");
      setIsSTTActive(false);
    }
  };

  const handleStopSTT = (apply: boolean) => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }

    if (apply && sttTranscript.trim()) {
      setText((prev) => (prev ? `${prev} ${sttTranscript.trim()}` : sttTranscript.trim()));
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }

    setIsSTTActive(false);
    setSttTranscript("");
  };

  // Handle Vision Attachment from VisionModal
  const handleAttachVision = (payload: VisionAttachmentPayload, promptText?: string) => {
    setAttachedDoc({
      name: payload.name,
      type: payload.mimeType.includes("pdf") ? "pdf" : "image",
      size: payload.sizeFormatted || "Visual Context",
      content: payload.base64Data,
      isImage: !payload.mimeType.includes("pdf"),
      sourceType: payload.sourceType,
    });
    if (promptText) {
      setText((prev) => (prev ? `${prev}\n${promptText}` : promptText));
    }
  };

  // Direct Clipboard Paste handler for screenshots and images
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file.type.startsWith("image/") || file.type.includes("pdf")) {
        e.preventDefault();
        processUploadedFile(file);
      }
    }
  };

  // Direct Document & File Attachment Processor (Invoked strictly from Plus menu or drag-drop)
  const processUploadedFile = (file: File) => {
    let type: AttachedDocument["type"] = "document";
    const nameLower = file.name.toLowerCase();
    
    if (file.type.includes("pdf") || nameLower.endsWith(".pdf")) {
      type = "pdf";
    } else if (
      file.type.includes("csv") ||
      file.type.includes("spreadsheet") ||
      nameLower.endsWith(".xlsx") ||
      nameLower.endsWith(".csv")
    ) {
      type = "spreadsheet";
    } else if (
      file.type.includes("json") ||
      nameLower.endsWith(".json") ||
      nameLower.endsWith(".ts") ||
      nameLower.endsWith(".tsx") ||
      nameLower.endsWith(".js") ||
      nameLower.endsWith(".jsx") ||
      nameLower.endsWith(".html") ||
      nameLower.endsWith(".py") ||
      nameLower.endsWith(".sql") ||
      nameLower.endsWith(".css")
    ) {
      type = "code";
    } else if (file.type.startsWith("image/")) {
      type = "image";
    } else if (nameLower.endsWith(".txt") || nameLower.endsWith(".md")) {
      type = "text";
    }

    const sizeFormatted = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024) || 1} KB`;

    const reader = new FileReader();

    if (type === "image" || type === "pdf") {
      reader.onload = (e) => {
        if (e.target?.result) {
          setAttachedDoc({
            name: file.name,
            type,
            size: sizeFormatted,
            content: e.target.result as string,
            isImage: type === "image",
            sourceType: type === "pdf" ? "document" : "image",
          });
        }
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (e) => {
        const textContent = (e.target?.result as string) || `[File contents: ${file.name}]`;
        setAttachedDoc({
          name: file.name,
          type,
          size: sizeFormatted,
          content: textContent,
          isImage: false,
          sourceType: type === "code" ? "code" : "document",
        });
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
    e.target.value = "";
    setShowToolsMenu(false);
  };

  const handleSend = () => {
    if ((!text.trim() && !attachedDoc) || isStreaming) return;
    
    let content = text.trim();
    let mediaAttachmentPayload: { data: string; mimeType: string; name?: string; sourceType?: string } | undefined = undefined;

    if (attachedDoc) {
      if (attachedDoc.isImage || attachedDoc.content.startsWith("data:")) {
        const mimeType = attachedDoc.type === "pdf" ? "application/pdf" : "image/png";
        mediaAttachmentPayload = {
          data: attachedDoc.content,
          mimeType,
          name: attachedDoc.name,
          sourceType: attachedDoc.sourceType || (attachedDoc.isImage ? "image" : "document"),
        };
        if (!content) {
          content = `Please analyze this attached ${attachedDoc.sourceType || "visual content"}: ${attachedDoc.name}`;
        }
      } else {
        const docHeader = `[Attached Document: "${attachedDoc.name}" (${attachedDoc.size})]\n---\n${attachedDoc.content}\n---\n\n`;
        content = docHeader + (content || "Please review and work with the attached document.");
      }
    }

    setText("");
    setAttachedDoc(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    if (isVoiceActive) {
      sendLiveText(content);
    } else {
      sendMessage(content, mediaAttachmentPayload);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getDocIcon = (type?: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4 text-rose-500" />;
      case "spreadsheet":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-500" />;
      case "code":
        return <FileCode className="w-4 h-4 text-cyan-500" />;
      case "image":
        return <ImageIcon className="w-4 h-4 text-blue-500" />;
      default:
        return <File className="w-4 h-4 text-indigo-500" />;
    }
  };

  const intelligenceOptions: Array<{ id: IntelligenceLevel; label: string; tier: string }> = [
    { id: "quick", label: "Quick", tier: "Free" },
    { id: "standard", label: "Standard", tier: "Free" },
    { id: "detailed", label: "Detailed", tier: "Free" },
    { id: "deep", label: "Deep Research", tier: "Pro" },
    { id: "pro", label: "Pro Reasoning", tier: "Pro" },
    { id: "auto", label: "Auto Intelligence", tier: "Pro" },
  ];

  return (
    <div id="angel-chat-composer" className="w-full max-w-3xl mx-auto px-4 pb-4 sm:pb-6 relative">
      {/* Hidden File Inputs for Document & Image Attachments */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.json,.js,.ts,.tsx,.jsx,.html,.py,.sql,.css,.xml,.yml,.yaml"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Vision Modal for Camera & Screen Context */}
      <VisionModal
        isOpen={isVisionModalOpen}
        onClose={() => setIsVisionModalOpen(false)}
        onAttachVision={handleAttachVision}
      />

      {/* Attached Document Preview Chip */}
      {attachedDoc && (
        <div
          id="attached-document-chip"
          className="mb-2.5 p-2.5 px-3.5 rounded-xl bg-white dark:bg-neutral-900 border border-cyan-500/40 shadow-lg flex items-center justify-between gap-3 animate-fadeIn"
        >
          <div className="flex items-center gap-3 min-w-0">
            {attachedDoc.isImage ? (
              <img
                src={attachedDoc.content}
                alt={attachedDoc.name}
                className="w-9 h-9 object-cover rounded-lg border border-neutral-200 dark:border-neutral-800 shrink-0"
              />
            ) : (
              <div className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 shrink-0">
                {getDocIcon(attachedDoc.type)}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 block truncate">
                {attachedDoc.name}
              </span>
              <span className="text-[10px] text-neutral-500 flex items-center gap-1.5 font-mono">
                <span>{attachedDoc.size}</span>
                <span>•</span>
                <span className="capitalize">{attachedDoc.type} ready for prompt</span>
              </span>
            </div>
          </div>
          <button
            onClick={() => setAttachedDoc(null)}
            className="p-1 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
            title="Remove document"
            aria-label="Remove attached file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Speech-To-Text Listening Banner */}
      {isSTTActive && (
        <div
          id="stt-active-panel"
          className="mb-2.5 p-3.5 rounded-2xl bg-neutral-900 text-white border border-cyan-500/40 shadow-xl flex flex-col gap-2.5 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold text-neutral-100">
                Dictating... Speak clearly
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-stt-cancel"
                onClick={() => handleStopSTT(false)}
                className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
              <button
                id="btn-stt-done"
                onClick={() => handleStopSTT(true)}
                className="flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Done</span>
              </button>
            </div>
          </div>

          <div className="text-xs text-neutral-300 italic min-h-[1.5rem] bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
            {sttTranscript || "Listening for speech..."}
          </div>
        </div>
      )}

      {/* STT Error Notice */}
      {sttError && (
        <div className="mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center justify-between">
          <span>{sttError}</span>
          <button onClick={() => setSttError(null)} className="p-1 hover:bg-rose-500/20 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Plus (+) Tool & Attachment Menu */}
      {showToolsMenu && (
        <div
          ref={toolsMenuRef}
          id="tools-popover-menu"
          className="absolute bottom-full left-4 mb-2.5 w-80 p-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl z-30 animate-scaleIn max-h-[440px] overflow-y-auto custom-scrollbar"
        >
          <div className="px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Tool Ecosystem & Capabilities
            </span>
            <button
              onClick={() => setShowToolsMenu(false)}
              className="p-0.5 text-neutral-400 hover:text-neutral-800 dark:hover:text-white rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* FILES & MULTIMODAL */}
            <div>
              <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                Input & Multimodal
              </div>
              <div className="space-y-0.5">
                <button
                  id="btn-menu-upload-image"
                  onClick={() => {
                    imageInputRef.current?.click();
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Upload Image / PDF</span>
                    <span className="text-[10px] text-neutral-400">Photos, diagrams, invoices, PDFs</span>
                  </div>
                </button>

                <button
                  id="btn-menu-attach-file"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Paperclip className="w-4 h-4 text-cyan-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Attach Document or Code</span>
                    <span className="text-[10px] text-neutral-400">DOCX, CSV, TXT, code files</span>
                  </div>
                </button>

                <button
                  id="btn-menu-camera-vision"
                  onClick={() => {
                    setIsVisionModalOpen(true);
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Real-Time Camera & Screen Vision</span>
                    <span className="text-[10px] text-neutral-400">Temporary live eye & digital inspector</span>
                  </div>
                </button>
              </div>
            </div>

            {/* CREATE & GENERATE */}
            <div>
              <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                Create & Generate
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setText("Create a comprehensive document and report for: ");
                    setShowToolsMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Document & Report</span>
                    <span className="text-[10px] text-neutral-400">Formatted executive doc artifact</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setText("Create a detailed spreadsheet and financial analysis for: ");
                    setShowToolsMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Table className="w-4 h-4 text-cyan-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Spreadsheet & Analysis</span>
                    <span className="text-[10px] text-neutral-400">Data tables, CSV & formulas</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setText("Build clean, production-ready code for: ");
                    setShowToolsMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Code2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Code Workspace</span>
                    <span className="text-[10px] text-neutral-400">Multi-file code & execution</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setText("Design a system architecture diagram for: ");
                    setShowToolsMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Network className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Diagram & Architecture</span>
                    <span className="text-[10px] text-neutral-400">Visual system workflows</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setText("Generate an image of: ");
                    setShowToolsMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <ImageIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Create Image</span>
                    <span className="text-[10px] text-neutral-400">High-resolution visual art</span>
                  </div>
                </button>
              </div>
            </div>

            {/* RESEARCH & WEB */}
            <div>
              <div className="px-2 pb-1 text-[10px] font-bold tracking-wider text-neutral-500 uppercase">
                Research & Grounding
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={() => {
                    setText("Search the web and verify current sources for: ");
                    setShowToolsMenu(false);
                    textareaRef.current?.focus();
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Grounded Web Search</span>
                    <span className="text-[10px] text-neutral-400">Live search with verified URLs</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIntelligenceLevel("deep");
                    setShowToolsMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                >
                  <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                  <div className="text-left">
                    <span className="block font-medium">Deep Investigation</span>
                    <span className="text-[10px] text-neutral-400">Multi-step autonomous analysis</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intelligence Tier Menu */}
      {showIntelligenceMenu && (
        <div
          ref={intelligenceMenuRef}
          id="intelligence-popover-menu"
          className="absolute bottom-full right-16 mb-2.5 w-52 p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl z-30 animate-scaleIn"
        >
          <div className="px-2 py-1.5 border-b border-neutral-100 dark:border-neutral-800 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Intelligence Strategy
            </span>
          </div>
          <div className="space-y-0.5">
            {intelligenceOptions.map((opt) => {
              const isSelected = intelligenceLevel === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => {
                    setIntelligenceLevel(opt.id);
                    setShowIntelligenceMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                    isSelected
                      ? "bg-cyan-500/10 text-cyan-900 dark:text-cyan-300 font-semibold"
                      : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-500">
                    {opt.tier}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* LIVE VOICE ACTIVE DOCK IN COMPOSER */}
      {isVoiceActive ? (
        <div
          id="live-voice-active-dock"
          className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-neutral-950 text-white border border-neutral-800 shadow-xl animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            {/* Live Indicator + Voice Identity */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                <Radio className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
                  <span>Angel Live Voice</span>
                  <span className="text-[10px] text-cyan-400 font-normal">
                    ({selectedVoice.name})
                  </span>
                </span>
                <span className="text-[10px] text-neutral-400">
                  {isPaused ? "Paused" : voiceState === "speaking" ? "Speaking" : "Active"}
                </span>
              </div>
            </div>

            {/* Quick Live Voice Controls */}
            <div className="flex items-center gap-1.5">
              <button
                id="btn-dock-mute"
                onClick={toggleMute}
                className={`p-2 rounded-xl transition ${
                  isMuted ? "bg-red-500/20 text-red-400" : "text-neutral-300 hover:bg-neutral-800"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                aria-label="Toggle mute"
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                id="btn-dock-pause"
                onClick={isPaused ? resumeVoice : pauseVoice}
                className="p-2 text-neutral-300 hover:bg-neutral-800 rounded-xl transition"
                title={isPaused ? "Resume Live Session" : "Pause Live Session"}
                aria-label="Pause or resume live session"
              >
                {isPaused ? <Play className="w-4 h-4 text-cyan-400" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                id="btn-dock-end-live"
                onClick={() => stopVoiceSession(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md transition ml-1"
                title="End Live Voice Session"
                aria-label="End Live Voice"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>End Live</span>
              </button>
            </div>
          </div>

          {/* Live Transcription card styled exactly like screenshot */}
          {(liveTranscript.user || liveTranscript.assistant) && (
            <div className="space-y-3 pt-1">
              {liveTranscript.user && (
                <div className="flex gap-2.5 justify-end">
                  <div className="p-3 rounded-2xl bg-white text-neutral-900 text-xs shadow-sm max-w-[85%]">
                    <div className="italic">{liveTranscript.user}</div>
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center justify-center text-[10px] font-semibold shrink-0">
                    {(user?.display_name || user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                </div>
              )}

              {liveTranscript.assistant && (
                <div className="flex gap-2.5 justify-start">
                  <div className="w-7 h-7 rounded-xl bg-neutral-900 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <AngelLogo size="xs" />
                  </div>
                  <div className="flex-1 p-3.5 rounded-2xl bg-[#131314] border border-neutral-800 text-xs">
                    <div className="font-semibold text-cyan-500 uppercase tracking-wider text-[11px]">
                      ANGEL
                    </div>
                    <div className="border-b border-neutral-800/80 my-2" />
                    <div className="text-neutral-200 leading-relaxed">
                      {liveTranscript.assistant}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Optional text prompt input while Live */}
          {showLiveTextInput && (
            <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type a message into live conversation..."
                className="flex-1 px-3 py-1.5 text-xs bg-neutral-950 border border-neutral-800 rounded-xl text-neutral-100 placeholder:text-neutral-500 focus:outline-hidden focus:border-cyan-500/60"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="p-1.5 rounded-xl bg-cyan-500 text-neutral-950 font-bold disabled:opacity-40"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        /* CLEAN CHAT BAR: [ + ] [ Input Textarea ] [ Mic ] [ Angel Live ] [ Intelligence ] [ Send ] */
        <div className="relative flex items-end gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl bg-neutral-100/90 dark:bg-neutral-900/90 border border-neutral-300/80 dark:border-neutral-800/80 focus-within:border-cyan-500/60 dark:focus-within:border-cyan-500/60 focus-within:ring-2 focus-within:ring-cyan-500/10 shadow-lg transition-all duration-200">
          {/* [ + ] Tool/File Attachment Entry Point (Attachments live exclusively here) */}
          <button
            id="btn-composer-plus"
            type="button"
            onClick={() => setShowToolsMenu(!showToolsMenu)}
            className={`p-2 rounded-xl transition-all shrink-0 ${
              showToolsMenu
                ? "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 rotate-45"
                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60"
            }`}
            title="Tools & Attachments"
            aria-label="Open tools menu"
          >
            <Plus className="w-5 h-5 transition-transform duration-200" />
          </button>

          {/* Input Textarea */}
          <textarea
            id="input-chat-message"
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={attachedDoc ? `Ask about "${attachedDoc.name}" or work with it...` : "Message Angel or tap Live..."}
            disabled={isStreaming}
            className="flex-1 max-h-[180px] py-1.5 px-2 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden resize-none leading-relaxed disabled:opacity-60"
          />

          {/* [ Vision ] Camera, Screen & Visual Input */}
          <button
            id="btn-composer-vision"
            type="button"
            onClick={() => setIsVisionModalOpen(true)}
            disabled={isStreaming}
            className="p-2 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 disabled:opacity-50"
            title="Vision (Camera, Screen & Image Input)"
            aria-label="Vision input"
          >
            <Camera className="w-4 h-4 stroke-[2]" />
          </button>

          {/* [ Microphone ] Speech-to-Text Dictation */}
          <button
            id="btn-composer-stt-mic"
            type="button"
            onClick={startSTT}
            disabled={isStreaming}
            className="p-2 rounded-xl transition-all duration-150 flex items-center justify-center shrink-0 text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 disabled:opacity-50"
            title="Microphone (Voice Dictation)"
            aria-label="Speech-to-text voice dictation"
          >
            <Mic className="w-4 h-4 stroke-[2]" />
          </button>

          {/* [ Intelligence Tier Selector ] */}
          <button
            id="btn-composer-intelligence"
            type="button"
            onClick={() => setShowIntelligenceMenu(!showIntelligenceMenu)}
            className="p-2 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60 transition hidden sm:flex items-center justify-center shrink-0"
            title={`Intelligence: ${intelligenceLevel}`}
            aria-label="Select intelligence level"
          >
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </button>

          {/* [ Primary Dynamic Action: Live (when empty) vs Send (when typed) ] */}
          {text.trim() || attachedDoc ? (
            <button
              id="btn-composer-send"
              type="button"
              onClick={handleSend}
              disabled={isStreaming}
              className="p-2 rounded-xl flex items-center justify-center transition-all duration-150 shrink-0 bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-950 hover:bg-neutral-800 dark:hover:bg-white shadow-xs"
              title="Send Message (Enter)"
              aria-label="Send message"
            >
              <ArrowUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : isVoiceActive ? (
            <button
              id="btn-composer-angel-live-active"
              type="button"
              onClick={() => stopVoiceSession(true)}
              disabled={isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/20 hover:bg-rose-500/20 border border-cyan-500/50 hover:border-rose-500/50 text-cyan-400 hover:text-rose-300 font-semibold text-xs transition-all duration-200 shadow-xs shrink-0 group"
              title="Live Chat Active — Click to End ('Angel, end conversation')"
              aria-label="End Live Chat"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="tracking-wide">Live Active</span>
            </button>
          ) : (
            <button
              id="btn-composer-angel-live"
              type="button"
              onClick={startVoiceSession}
              disabled={isStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 hover:from-cyan-500/30 hover:to-cyan-600/30 border border-cyan-500/40 text-neutral-900 dark:text-neutral-100 font-semibold text-xs transition-all duration-200 shadow-xs hover:shadow-md disabled:opacity-50 shrink-0 group"
              title="Start Live Chat with Angel (Say 'Hey Angel')"
              aria-label="Start Live Chat session"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </span>
              <span className="tracking-wide">Live</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
