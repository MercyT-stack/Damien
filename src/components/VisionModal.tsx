import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Upload,
  Monitor,
  Eye,
  Sparkles,
  RefreshCw,
  Check,
  AlertCircle,
  Image as ImageIcon,
  FileText,
  Code2,
  BookOpen,
  Layout,
  Layers,
  Shield,
  Lock,
  ArrowRight,
  Maximize2,
  Trash2,
  StopCircle,
} from "lucide-react";
import {
  VisionSourceType,
  VisionProcessingMode,
  VisionAttachmentPayload,
  VisionAnalysisResult,
} from "../types/visionTypes";
import { useCapability } from "../contexts/CapabilityContext";

interface VisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachVision: (payload: VisionAttachmentPayload, promptText?: string) => void;
}

export const VisionModal: React.FC<VisionModalProps> = ({
  isOpen,
  onClose,
  onAttachVision,
}) => {
  const {
    deviceContext,
    isOnline,
    analyzeVisionPayload,
    isVisionAnalyzing,
    lastVisionAnalysis,
  } = useCapability();

  const [activeTab, setActiveTab] = useState<"camera" | "upload" | "screen">("camera");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [permissionRequested, setPermissionRequested] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<"prompt" | "granted" | "denied">("prompt");
  
  const [capturedPayload, setCapturedPayload] = useState<VisionAttachmentPayload | null>(null);
  const [visionPrompt, setVisionPrompt] = useState<string>("");
  const [processingMode, setProcessingMode] = useState<VisionProcessingMode>("general");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInstantAnalyzing, setIsInstantAnalyzing] = useState<boolean>(false);
  const [analysisOutput, setAnalysisOutput] = useState<VisionAnalysisResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream safely and release hardware
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
        track.enabled = false;
      });
      setCameraStream(null);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCameraStream();
      setCapturedPayload(null);
      setAnalysisOutput(null);
      setErrorMessage(null);
      setPermissionRequested(false);
      setVisionPrompt("");
    }
    return () => {
      stopCameraStream();
    };
  }, [isOpen]);

  // Request Camera Permission & Start Video Stream
  const handleStartCamera = async (mode: "user" | "environment" = facingMode) => {
    setErrorMessage(null);
    setPermissionRequested(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported on this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: mode,
        },
        audio: false,
      });

      setCameraStream(stream);
      setPermissionState("granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn("[VisionModal] Camera permission denied/error:", err);
      setPermissionState("denied");
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. You can allow camera access in browser permissions."
          : "No camera device found or camera is currently busy."
      );
    }
  };

  // Switch between front and rear camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    stopCameraStream();
    handleStartCamera(nextMode);
  };

  // Capture Snapshot from Camera Feed
  const handleCaptureCameraSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);

    const payload: VisionAttachmentPayload = {
      name: `Camera_Capture_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.jpg`,
      sourceType: "camera",
      mimeType: "image/jpeg",
      base64Data: dataUrl,
      previewUrl: dataUrl,
      sizeFormatted: "Camera Frame",
      timestamp: new Date().toISOString(),
    };

    setCapturedPayload(payload);
    stopCameraStream();
  };

  // Request Screen Share Context Snapshot
  const handleRequestScreenSnapshot = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen capture is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false,
      });

      const videoTrack = stream.getVideoTracks()[0];
      const video = document.createElement("video");
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;

      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          video.play().then(() => resolve()).catch(() => resolve());
        };
        setTimeout(resolve, 600);
      });

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");

        const payload: VisionAttachmentPayload = {
          name: `Screen_Capture_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.png`,
          sourceType: "screen",
          mimeType: "image/png",
          base64Data: dataUrl,
          previewUrl: dataUrl,
          sizeFormatted: "Screen Display",
          timestamp: new Date().toISOString(),
        };

        setCapturedPayload(payload);
      }

      // Terminate screen share immediately after capture
      stream.getTracks().forEach((track) => track.stop());
    } catch (err: any) {
      console.warn("[VisionModal] Screen context error:", err);
      if (err.name !== "NotAllowedError") {
        setErrorMessage(err.message || "Failed to capture screen context.");
      }
    }
  };

  // Handle File Upload / Drop (Images & PDFs)
  const handleFileUpload = (file: File) => {
    setErrorMessage(null);
    const mime = file.type || "";
    let sourceType: VisionSourceType = "image";
    const nameLower = file.name.toLowerCase();

    if (mime.includes("pdf") || nameLower.endsWith(".pdf")) {
      sourceType = "document";
    } else if (nameLower.endsWith(".ts") || nameLower.endsWith(".tsx") || nameLower.endsWith(".py") || nameLower.endsWith(".sql")) {
      sourceType = "code";
    } else if (mime.startsWith("image/")) {
      sourceType = "image";
    } else {
      setErrorMessage("Please upload an image (PNG, JPG, WebP) or document (PDF).");
      return;
    }

    const sizeFormatted =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024) || 1} KB`;

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        const base64 = e.target.result as string;
        setCapturedPayload({
          name: file.name,
          sourceType,
          mimeType: mime || "image/png",
          base64Data: base64,
          previewUrl: base64,
          sizeFormatted,
          timestamp: new Date().toISOString(),
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // Run instant multimodal intelligence analysis
  const handleInstantAnalyze = async () => {
    if (!capturedPayload) return;
    setIsInstantAnalyzing(true);
    setErrorMessage(null);
    try {
      const result = await analyzeVisionPayload(
        capturedPayload,
        visionPrompt.trim() || undefined,
        processingMode
      );
      setAnalysisOutput(result);
    } catch (err: any) {
      setErrorMessage(err.message || "Analysis failed.");
    } finally {
      setIsInstantAnalyzing(false);
    }
  };

  // Attach to Chat
  const handleAttachToChat = () => {
    if (!capturedPayload) return;
    onAttachVision(capturedPayload, visionPrompt.trim() || undefined);
    onClose();
  };

  if (!isOpen) return null;

  const modeOptions: Array<{ id: VisionProcessingMode; label: string; icon: any }> = [
    { id: "general", label: "Scene Understanding", icon: Eye },
    { id: "ocr", label: "OCR & Document Text", icon: FileText },
    { id: "ui_design", label: "UI & Design Critique", icon: Layout },
    { id: "code_debug", label: "Code & Error Diagnosis", icon: Code2 },
    { id: "educational", label: "Educational & Diagrams", icon: BookOpen },
  ];

  return (
    <div
      id="angel-vision-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="angel-vision-modal-card"
        className="flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Angel Multimodal Perception</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Stage 7
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Camera environment, screen context, document vision & OCR reasoning
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cameraStream && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Camera Sensor Active
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Switcher Tabs (when not captured yet) */}
        {!capturedPayload && (
          <div className="flex border-b border-neutral-800 px-5 pt-3 gap-5 text-xs font-medium bg-neutral-900/50">
            <button
              onClick={() => {
                setActiveTab("camera");
                stopCameraStream();
              }}
              className={`pb-2.5 flex items-center gap-2 transition border-b-2 ${
                activeTab === "camera"
                  ? "border-amber-500 text-amber-400 font-semibold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera (Physical)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("screen");
                stopCameraStream();
              }}
              className={`pb-2.5 flex items-center gap-2 transition border-b-2 ${
                activeTab === "screen"
                  ? "border-amber-500 text-amber-400 font-semibold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Screen Context (Digital)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("upload");
                stopCameraStream();
              }}
              className={`pb-2.5 flex items-center gap-2 transition border-b-2 ${
                activeTab === "upload"
                  ? "border-amber-500 text-amber-400 font-semibold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Image / PDF</span>
            </button>
          </div>
        )}

        {/* Main Content Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Captured State Preview & Analysis */}
          {capturedPayload ? (
            <div className="space-y-4">
              {/* Visual Thumbnail & Source Badge */}
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center max-h-72 group">
                {capturedPayload.mimeType.includes("pdf") ? (
                  <div className="p-8 flex flex-col items-center justify-center text-center space-y-2">
                    <FileText className="w-12 h-12 text-rose-400" />
                    <span className="text-xs font-semibold text-white">{capturedPayload.name}</span>
                    <span className="text-[11px] text-neutral-400">PDF Document Ready for Multimodal Analysis</span>
                  </div>
                ) : (
                  <img
                    src={capturedPayload.previewUrl}
                    alt="Captured content"
                    className="max-h-72 w-auto object-contain rounded-xl"
                  />
                )}

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase bg-black/70 text-amber-300 border border-amber-500/30 backdrop-blur-xs">
                    Source: {capturedPayload.sourceType}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-black/60 text-neutral-300 backdrop-blur-xs">
                    {capturedPayload.sizeFormatted}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCapturedPayload(null);
                    setAnalysisOutput(null);
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition"
                  title="Discard and retake"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Selection Chips */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  Select Multimodal Focus
                </label>
                <div className="flex flex-wrap gap-2">
                  {modeOptions.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = processingMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setProcessingMode(opt.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                          isSelected
                            ? "bg-amber-500 text-neutral-950 font-semibold shadow-xs"
                            : "bg-neutral-800/80 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Query / Prompt Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  What would you like Angel to check or do with this?
                </label>
                <input
                  type="text"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  placeholder={
                    capturedPayload.sourceType === "camera"
                      ? "e.g. What is this object and how does it work?"
                      : capturedPayload.sourceType === "screen"
                      ? "e.g. Identify this error message and suggest a fix"
                      : "e.g. Summarize key takeaways, extract text or critique the layout"
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-800 text-white border border-neutral-700 focus:border-amber-500 focus:outline-hidden"
                />
              </div>

              {/* Instant Analysis Output Preview (if run) */}
              {analysisOutput && (
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-amber-500/30 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-white">Angel Vision Insights</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {analysisOutput.latencyMs}ms
                    </span>
                  </div>

                  <p className="text-xs text-neutral-200 leading-relaxed">
                    {analysisOutput.summary}
                  </p>

                  {/* OCR text snippet if available */}
                  {analysisOutput.ocrText && (
                    <div className="p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-neutral-300 max-h-32 overflow-y-auto">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block mb-1">Extracted OCR:</span>
                      {analysisOutput.ocrText}
                    </div>
                  )}

                  {/* Design Critique if present */}
                  {analysisOutput.designEvaluation && (
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                      {analysisOutput.designEvaluation.typography && (
                        <div className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
                          <span className="text-neutral-400 font-semibold block">Typography</span>
                          <span className="text-neutral-200">{analysisOutput.designEvaluation.typography}</span>
                        </div>
                      )}
                      {analysisOutput.designEvaluation.layout && (
                        <div className="p-2 rounded-lg bg-neutral-900/80 border border-neutral-800">
                          <span className="text-neutral-400 font-semibold block">Layout & Hierarchy</span>
                          <span className="text-neutral-200">{analysisOutput.designEvaluation.layout}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* 2. Source Capture Views */
            <div className="space-y-4">
              {/* TAB 1: Camera Feed */}
              {activeTab === "camera" && (
                <div className="space-y-4">
                  {cameraStream ? (
                    <div className="space-y-3">
                      <div className="relative rounded-2xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center max-h-80">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full max-h-80 object-cover rounded-xl"
                        />
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/70 text-emerald-400 border border-emerald-500/30 backdrop-blur-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Live Stream
                        </div>

                        <button
                          onClick={handleToggleFacingMode}
                          className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[11px] bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-xs flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Flip ({facingMode === "user" ? "Front" : "Rear"})</span>
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <button
                          onClick={stopCameraStream}
                          className="px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5"
                        >
                          <StopCircle className="w-4 h-4" />
                          <span>Release Camera</span>
                        </button>

                        <button
                          onClick={handleCaptureCameraSnapshot}
                          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-md flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capture Frame for Angel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Camera Permission & Request Card */
                    <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-semibold text-white">
                          Physical Environment & Object Vision
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1">
                          Grant Angel camera access to identify objects, read signs, diagnose diagrams, and explore your surroundings.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-center gap-3">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Shield className="w-3.5 h-3.5" /> Session-based
                        </span>
                        <span>•</span>
                        <span>Auto-released on finish</span>
                        <span>•</span>
                        <span>No background recording</span>
                      </div>

                      <button
                        onClick={() => handleStartCamera(facingMode)}
                        className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition shadow-md inline-flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Allow Camera & Start Session</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Screen Context */}
              {activeTab === "screen" && (
                <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-sm font-semibold text-white">
                      Digital Screen & Application Awareness
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Capture the current window, web tab, or application to inspect UI errors, code bugs, or design layouts.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-center gap-3">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Lock className="w-3.5 h-3.5" /> Instant Single-Frame Grab
                    </span>
                    <span>•</span>
                    <span>Stream released immediately</span>
                  </div>

                  <button
                    onClick={handleRequestScreenSnapshot}
                    className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition shadow-md inline-flex items-center gap-2"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>Select Window / Tab to Capture</span>
                  </button>
                </div>
              )}

              {/* TAB 3: File Upload / Drag & Drop */}
              {activeTab === "upload" && (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className="p-8 rounded-2xl border-2 border-dashed border-neutral-800 hover:border-amber-500/60 bg-neutral-950/40 hover:bg-neutral-900/50 transition cursor-pointer text-center space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                      e.target.value = "";
                    }}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-neutral-800 text-amber-400 flex items-center justify-center mx-auto border border-neutral-700">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-white block">
                      Click to choose or Drag & Drop visual files
                    </span>
                    <span className="text-[11px] text-neutral-400 block mt-0.5">
                      Supports PNG, JPEG, WebP images, and PDF documents (OCR enabled)
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/80 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition"
          >
            Cancel
          </button>

          {capturedPayload && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isInstantAnalyzing}
                onClick={handleInstantAnalyze}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition flex items-center gap-1.5"
              >
                {isInstantAnalyzing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>{isInstantAnalyzing ? "Analyzing..." : "Quick Analyze"}</span>
              </button>

              <button
                type="button"
                onClick={handleAttachToChat}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition flex items-center gap-1.5 shadow-xs"
              >
                <span>Attach to Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
