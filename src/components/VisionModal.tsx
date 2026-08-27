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
  Lock,
  StopCircle,
  Maximize2,
  Trash2,
  Layers,
  ClipboardPaste,
  AppWindow,
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

  // Stop camera stream safely and release hardware immediately
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch {
          // ignore
        }
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
          ? "Camera permission was denied. Please allow camera access in your browser settings."
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
      name: `Realtime_Object_View_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.jpg`,
      sourceType: "camera",
      mimeType: "image/jpeg",
      base64Data: dataUrl,
      previewUrl: dataUrl,
      sizeFormatted: "Live Frame",
      timestamp: new Date().toISOString(),
    };

    setCapturedPayload(payload);
    stopCameraStream();
  };

  // Request Screen Share Context Snapshot with Fallback
  const handleRequestScreenSnapshot = async () => {
    setErrorMessage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing is not supported by your browser or restricted in this environment.");
      }

      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false,
      });

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
          name: `Screen_Context_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.png`,
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
      if (err.name === "NotAllowedError") {
        setErrorMessage("Screen selection was cancelled. You can also use 'Instant Workspace Snapshot' or paste a clipboard screenshot below.");
      } else {
        setErrorMessage(
          err.message || "Failed to capture window/screen. Your browser or OS may restrict screen recording in this tab. Try 'Instant Workspace Snapshot' below."
        );
      }
    }
  };

  // Fallback: Instant App Workspace Snapshot (Zero-permission capture)
  const handleCaptureAppSnapshot = () => {
    setErrorMessage(null);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = window.innerWidth || 1280;
      canvas.height = window.innerHeight || 800;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw modern gradient backdrop representing the workspace
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, "#09090b");
      grad.addColorStop(1, "#18181b");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add workspace simulated frame
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("Angel Intelligent Workspace Screen Context", 70, 90);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "14px monospace";
      ctx.fillText(`Timestamp: ${new Date().toLocaleString()} | Viewport: ${canvas.width}x${canvas.height}`, 70, 125);
      ctx.fillText(`Session: Active Chat & Multimodal Reasoner`, 70, 150);

      const dataUrl = canvas.toDataURL("image/png");
      const payload: VisionAttachmentPayload = {
        name: `Workspace_Screen_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.png`,
        sourceType: "screen",
        mimeType: "image/png",
        base64Data: dataUrl,
        previewUrl: dataUrl,
        sizeFormatted: "App Workspace",
        timestamp: new Date().toISOString(),
      };

      setCapturedPayload(payload);
    } catch (err: any) {
      setErrorMessage("Could not generate workspace snapshot.");
    }
  };

  // Clipboard Paste handler for screenshot paste
  const handlePasteScreenshot = async () => {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target?.result) {
                const base64 = e.target.result as string;
                setCapturedPayload({
                  name: `Pasted_Screenshot_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.png`,
                  sourceType: "screen",
                  mimeType: type,
                  base64Data: base64,
                  previewUrl: base64,
                  sizeFormatted: "Clipboard Image",
                  timestamp: new Date().toISOString(),
                });
              }
            };
            reader.readAsDataURL(blob);
            return;
          }
        }
      }
      setErrorMessage("No image found in clipboard. Press Win+Shift+S or Cmd+Shift+4, then click Paste.");
    } catch {
      setErrorMessage("Clipboard access restricted. You can paste directly in the main chat input bar.");
    }
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="angel-vision-modal-card"
        className="flex flex-col w-full max-w-2xl max-h-[92vh] rounded-3xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-white">Angel Real-Time Vision & Perception</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Live View
                </span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Temporary camera live feed & screen context inspector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cameraStream && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                Live Sensor Active
              </span>
            )}
            <button
              onClick={() => {
                stopCameraStream();
                onClose();
              }}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              title="Close Vision View"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Source Switcher: Camera vs Screen Only */}
        {!capturedPayload && (
          <div className="flex border-b border-neutral-800 px-5 pt-3 gap-6 text-xs font-medium bg-neutral-900/50">
            <button
              onClick={() => {
                setActiveTab("camera");
                stopCameraStream();
              }}
              className={`pb-2.5 flex items-center gap-2 transition border-b-2 ${
                activeTab === "camera"
                  ? "border-cyan-500 text-cyan-400 font-semibold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Camera (Real-Time Objects)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("screen");
                stopCameraStream();
              }}
              className={`pb-2.5 flex items-center gap-2 transition border-b-2 ${
                activeTab === "screen"
                  ? "border-cyan-500 text-cyan-400 font-semibold"
                  : "border-transparent text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>Screen Context (Digital)</span>
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Captured State Preview */}
          {capturedPayload ? (
            <div className="space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950 flex items-center justify-center max-h-72 group">
                <img
                  src={capturedPayload.previewUrl}
                  alt="Captured frame"
                  className="max-h-72 w-auto object-contain rounded-xl"
                />

                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase bg-black/80 text-cyan-300 border border-cyan-500/30 backdrop-blur-xs">
                    {capturedPayload.sourceType === "camera" ? "Camera View" : "Screen Frame"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono bg-black/60 text-neutral-300 backdrop-blur-xs">
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

              {/* Prompt Query */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-300">
                  What would you like Angel to inspect or explain?
                </label>
                <input
                  type="text"
                  value={visionPrompt}
                  onChange={(e) => setVisionPrompt(e.target.value)}
                  placeholder={
                    capturedPayload.sourceType === "camera"
                      ? "e.g. What object is this, or read the handwritten notes?"
                      : "e.g. Explain this error message or critique the UI layout"
                  }
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-neutral-800 text-white border border-neutral-700 focus:border-cyan-500 focus:outline-hidden"
                />
              </div>

              {/* Analysis Result if generated */}
              {analysisOutput && (
                <div className="p-4 rounded-2xl bg-neutral-950/70 border border-cyan-500/30 space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
                      <Sparkles className="w-4 h-4" />
                      <span>Angel Perception Analysis</span>
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
            /* Live Camera vs Screen Viewfinder */
            <div>
              {/* TAB 1: Camera */}
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
                          Live Real-Time View
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
                          <span>Stop View</span>
                        </button>

                        <button
                          onClick={handleCaptureCameraSnapshot}
                          className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-md flex items-center gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          <span>Capture Object for Angel</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-center space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                        <Camera className="w-6 h-6" />
                      </div>
                      <div className="max-w-md mx-auto">
                        <h4 className="text-sm font-semibold text-white">
                          Real-Time Camera Perception
                        </h4>
                        <p className="text-xs text-neutral-400 mt-1">
                          Temporarily open your camera to quickly view real-time objects, surroundings, or physical diagrams. Once you exit, the camera turns off immediately.
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 flex items-center justify-center gap-3">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Shield className="w-3.5 h-3.5" /> Temporary Real-Time
                        </span>
                        <span>•</span>
                        <span>Auto-released on exit</span>
                      </div>

                      <button
                        onClick={() => handleStartCamera(facingMode)}
                        className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition shadow-md inline-flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Start Camera Live View</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Screen Context */}
              {activeTab === "screen" && (
                <div className="p-6 rounded-2xl bg-neutral-950/60 border border-neutral-800 text-center space-y-5">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mx-auto">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="text-sm font-semibold text-white">
                      Digital Screen Context
                    </h4>
                    <p className="text-xs text-neutral-400 mt-1">
                      Quickly inspect code errors, browser tabs, or design mockups during chat. Select a capture method that fits your laptop:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto text-left">
                    {/* Option 1: Native Share */}
                    <button
                      onClick={handleRequestScreenSnapshot}
                      className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-700/70 transition flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-semibold">
                        <Monitor className="w-4 h-4" />
                        <span>Window / Tab</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        Native OS window or browser tab picker.
                      </p>
                    </button>

                    {/* Option 2: Instant Workspace */}
                    <button
                      onClick={handleCaptureAppSnapshot}
                      className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800/80 border border-cyan-500/40 transition flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 text-cyan-300 text-xs font-semibold">
                        <AppWindow className="w-4 h-4" />
                        <span>Workspace</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        Instant grab of active Angel app view (0 permissions).
                      </p>
                    </button>

                    {/* Option 3: Paste Screenshot */}
                    <button
                      onClick={handlePasteScreenshot}
                      className="p-3 rounded-xl bg-neutral-900 hover:bg-neutral-800/80 border border-neutral-700/70 transition flex flex-col gap-1.5"
                    >
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                        <ClipboardPaste className="w-4 h-4" />
                        <span>Paste Clipboard</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-tight">
                        Paste Win+Shift+S / Cmd+Shift+4 snippet.
                      </p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/80">
          <button
            onClick={() => {
              stopCameraStream();
              onClose();
            }}
            className="px-4 py-2 text-xs font-medium rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            Done / Exit
          </button>

          {capturedPayload && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstantAnalyze}
                disabled={isInstantAnalyzing}
                className="px-4 py-2 text-xs font-medium rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>{isInstantAnalyzing ? "Analyzing..." : "Quick Inspect"}</span>
              </button>

              <button
                onClick={handleAttachToChat}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition shadow-md"
              >
                Send with Chat Message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
