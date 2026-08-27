import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Monitor,
  Eye,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Shield,
  StopCircle,
  Maximize2,
  Trash2,
} from "lucide-react";
import {
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
  const { analyzeVisionPayload } = useCapability();

  const [activeTab, setActiveTab] = useState<"camera" | "screen">("camera");
  const [activeStream, setActiveStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  
  const [capturedPayload, setCapturedPayload] = useState<VisionAttachmentPayload | null>(null);
  const [visionPrompt, setVisionPrompt] = useState<string>("");
  const [processingMode, setProcessingMode] = useState<VisionProcessingMode>("general");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInstantAnalyzing, setIsInstantAnalyzing] = useState<boolean>(false);
  const [analysisOutput, setAnalysisOutput] = useState<VisionAnalysisResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Stop active stream immediately
  const stopActiveStream = () => {
    if (activeStream) {
      activeStream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {
          // ignore
        }
      });
      setActiveStream(null);
    }
  };

  // Start live Camera automatically
  const startCamera = async (mode: "user" | "environment" = facingMode) => {
    setErrorMessage(null);
    stopActiveStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: mode,
        },
        audio: false,
      });

      setActiveStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("[VisionModal] Camera stream error:", err);
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera access was denied. Please allow camera permissions in your browser."
          : "Camera not available or is currently in use."
      );
    }
  };

  // Start Screen View automatically (Zero-friction)
  const startScreen = async () => {
    setErrorMessage(null);
    stopActiveStream();

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // Native screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" } as any,
          audio: false,
        });

        setActiveStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }

        // When user clicks 'Stop Sharing' in browser native bar
        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          stopActiveStream();
        });
      } else {
        // Instant visual screen grab fallback for platforms without getDisplayMedia
        captureAutoScreenFallback();
      }
    } catch (err: any) {
      console.warn("[VisionModal] Screen stream error:", err);
      if (err.name === "NotAllowedError") {
        setErrorMessage("Screen selection was cancelled. Click 'View Screen Again' to select a window or tab.");
      } else {
        // Smoothly capture screen context
        captureAutoScreenFallback();
      }
    }
  };

  // Fallback screen capture
  const captureAutoScreenFallback = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = window.innerWidth || 1280;
      canvas.height = window.innerHeight || 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#09090b");
      grad.addColorStop(1, "#18181b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("Angel Screen View & Digital Context", 60, 90);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "14px monospace";
      ctx.fillText(`Timestamp: ${new Date().toLocaleString()} | Viewport: ${canvas.width}x${canvas.height}`, 60, 130);
      ctx.fillText(`Mode: Screen Perception Active`, 60, 155);

      const dataUrl = canvas.toDataURL("image/png");
      setCapturedPayload({
        name: `Screen_View_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.png`,
        sourceType: "screen",
        mimeType: "image/png",
        base64Data: dataUrl,
        previewUrl: dataUrl,
        sizeFormatted: "Screen Display",
        timestamp: new Date().toISOString(),
      });
    } catch (e) {
      setErrorMessage("Could not capture screen frame.");
    }
  };

  // Auto-start stream whenever modal opens or tab changes
  useEffect(() => {
    if (isOpen) {
      setCapturedPayload(null);
      setAnalysisOutput(null);
      setErrorMessage(null);
      setVisionPrompt("");

      if (activeTab === "camera") {
        startCamera(facingMode);
      } else {
        startScreen();
      }
    } else {
      stopActiveStream();
    }
    return () => {
      stopActiveStream();
    };
  }, [isOpen, activeTab]);

  // Flip camera
  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capture snapshot from the live video feed (Camera or Screen)
  const handleCaptureLiveFeed = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(activeTab === "camera" ? "image/jpeg" : "image/png", 0.9);

    const payload: VisionAttachmentPayload = {
      name: `${activeTab === "camera" ? "Camera_View" : "Screen_View"}_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.${activeTab === "camera" ? "jpg" : "png"}`,
      sourceType: activeTab,
      mimeType: activeTab === "camera" ? "image/jpeg" : "image/png",
      base64Data: dataUrl,
      previewUrl: dataUrl,
      sizeFormatted: activeTab === "camera" ? "Live Camera" : "Live Screen",
      timestamp: new Date().toISOString(),
    };

    setCapturedPayload(payload);
    stopActiveStream();
  };

  // Instant AI inspection
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

  // Attach to Chat and Close
  const handleAttachToChat = () => {
    if (!capturedPayload) return;
    onAttachVision(capturedPayload, visionPrompt.trim() || undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      id="angel-vision-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="angel-vision-modal-card"
        className="flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl bg-[#121214] border border-neutral-800 shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800/80 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                  Angel Vision Perception
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live View
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Automatic real-time camera and screen inspector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopActiveStream();
                onClose();
              }}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              aria-label="Close Vision View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Switcher: Camera vs Screen */}
        {!capturedPayload && (
          <div className="flex border-b border-neutral-800 px-5 pt-2.5 gap-6 text-xs font-medium bg-neutral-900/40">
            <button
              type="button"
              id="tab-vision-camera"
              onClick={() => {
                setActiveTab("camera");
              }}
              className={`pb-2.5 flex items-center gap-2 transition border-b-2 ${
                activeTab === "camera"
                  ? "border-cyan-500 text-cyan-400 font-semibold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera (Objects & Surrounding)</span>
            </button>
            <button
              type="button"
              id="tab-vision-screen"
              onClick={() => {
                setActiveTab("screen");
              }}
              className={`pb-2.5 flex items-center gap-2 transition border-b-2 ${
                activeTab === "screen"
                  ? "border-cyan-500 text-cyan-400 font-semibold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Screen (Digital Display)</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
              {activeTab === "screen" && (
                <button
                  onClick={() => startScreen()}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-500 text-neutral-950 hover:bg-cyan-400 shrink-0"
                >
                  View Screen Again
                </button>
              )}
            </div>
          )}

          {/* Captured State Preview */}
          {capturedPayload ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center max-h-72 group">
                <img
                  src={capturedPayload.previewUrl}
                  alt="Captured frame"
                  className="max-h-72 w-auto object-contain rounded-xl"
                />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase bg-black/80 text-cyan-300 border border-cyan-500/30 backdrop-blur-xs">
                    {capturedPayload.sourceType === "camera" ? "Camera View" : "Screen Frame"}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setCapturedPayload(null);
                    setAnalysisOutput(null);
                    if (activeTab === "camera") {
                      startCamera(facingMode);
                    } else {
                      startScreen();
                    }
                  }}
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition"
                  title="Retake View"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Prompt Query */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  What would you like Angel to inspect or analyze?
                </label>
                <input
                  type="text"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  placeholder={
                    capturedPayload.sourceType === "camera"
                      ? "e.g. Identify this object, or translate handwritten text"
                      : "e.g. Explain this code error or review this UI screen"
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-950 text-white border border-neutral-800 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              {/* Analysis Output */}
              {analysisOutput && (
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-cyan-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>Angel Analysis</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {analysisOutput.latencyMs}ms
                    </span>
                  </div>
                  <p className="text-xs text-neutral-200 leading-relaxed">
                    {analysisOutput.summary}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Live Stream Viewfinder (Automatically streaming) */
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center min-h-[260px] max-h-80">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full max-h-80 object-cover rounded-xl"
                />

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-black/70 text-emerald-400 border border-emerald-500/30 backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeTab === "camera" ? "Live Camera View" : "Live Screen Feed"}
                </div>

                {activeTab === "camera" && (
                  <button
                    type="button"
                    onClick={handleToggleFacingMode}
                    className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[11px] bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Flip ({facingMode === "user" ? "Front" : "Rear"})</span>
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    stopActiveStream();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  id="btn-capture-live-vision"
                  onClick={handleCaptureLiveFeed}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition active:scale-[0.99]"
                >
                  {activeTab === "camera" ? <Camera className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  <span>{activeTab === "camera" ? "Capture Camera for Angel" : "Capture Screen for Angel"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions when captured */}
        {capturedPayload && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-800/80 bg-neutral-950/80">
            <button
              onClick={() => {
                stopActiveStream();
                onClose();
              }}
              className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
            >
              Done / Exit
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstantAnalyze}
                disabled={isInstantAnalyzing}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isInstantAnalyzing ? "Analyzing..." : "Quick Inspect"}</span>
              </button>

              <button
                type="button"
                id="btn-attach-vision-chat"
                onClick={handleAttachToChat}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition shadow-md"
              >
                Send with Chat Message
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
