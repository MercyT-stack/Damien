import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Camera,
  Video,
  StopCircle,
  RefreshCw,
  Check,
  RotateCcw,
  AlertCircle,
  Play,
  Pause,
  Upload,
  Sparkles,
} from "lucide-react";

export interface MediaCaptureAttachment {
  name: string;
  type: "image" | "video";
  mimeType: string;
  dataUrl: string;
  sizeFormatted: string;
  durationSeconds?: number;
}

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachMedia: (attachment: MediaCaptureAttachment) => void;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onAttachMedia,
}) => {
  const [captureMode, setCaptureMode] = useState<"photo" | "video">("photo");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Video recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);

  // Preview captured media
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [capturedVideoBlob, setCapturedVideoBlob] = useState<Blob | null>(null);
  const [capturedVideoUrl, setCapturedVideoUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera tracks cleanly
  const stopStream = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      setStream(null);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Start live camera stream automatically
  const startCamera = async (mode: "user" | "environment" = facingMode, withAudio: boolean = captureMode === "video") => {
    setErrorMessage(null);
    stopStream();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser.");
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: withAudio ? { echoCancellation: true, noiseSuppression: true } : false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn("[CameraCaptureModal] getUserMedia error:", err);
      setErrorMessage(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera / Microphone permission denied. Please enable camera access in your browser."
          : "Camera not available or currently in use by another application."
      );
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCapturedPhoto(null);
      setCapturedVideoBlob(null);
      setCapturedVideoUrl(null);
      setIsRecording(false);
      setRecordingSeconds(0);
      startCamera(facingMode, captureMode === "video");
    } else {
      stopStream();
      if (capturedVideoUrl) {
        URL.revokeObjectURL(capturedVideoUrl);
      }
    }
    return () => {
      stopStream();
    };
  }, [isOpen, captureMode]);

  // Flip front / rear camera
  const handleToggleFacingMode = () => {
    const next = facingMode === "user" ? "environment" : "user";
    setFacingMode(next);
    startCamera(next, captureMode === "video");
  };

  // Capture still photograph
  const handleTakePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedPhoto(dataUrl);
    stopStream();
  };

  // Start Video Recording
  const handleStartRecording = () => {
    if (!stream) return;
    setErrorMessage(null);
    recordedChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : MediaRecorder.isTypeSupported("video/webm")
        ? "video/webm"
        : "video/mp4";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        setCapturedVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setCapturedVideoUrl(url);
        stopStream();
      };

      recorder.start(250);
      setIsRecording(true);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setErrorMessage("Could not start video recording: " + err.message);
    }
  };

  // Stop Video Recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Retake photo or video
  const handleRetake = () => {
    setCapturedPhoto(null);
    if (capturedVideoUrl) {
      URL.revokeObjectURL(capturedVideoUrl);
    }
    setCapturedVideoBlob(null);
    setCapturedVideoUrl(null);
    setIsRecording(false);
    setRecordingSeconds(0);
    startCamera(facingMode, captureMode === "video");
  };

  // Upload photo or video from disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onAttachMedia({
            name: file.name,
            type: "image",
            mimeType: file.type,
            dataUrl: ev.target.result as string,
            sizeFormatted: `${Math.round(file.size / 1024)} KB`,
          });
          onClose();
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onAttachMedia({
            name: file.name,
            type: "video",
            mimeType: file.type,
            dataUrl: ev.target.result as string,
            sizeFormatted: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          });
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Final Attach to Chat
  const handleConfirmAttach = () => {
    if (capturedPhoto) {
      onAttachMedia({
        name: `Photo_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.jpg`,
        type: "image",
        mimeType: "image/jpeg",
        dataUrl: capturedPhoto,
        sizeFormatted: "Photo Capture",
      });
      onClose();
    } else if (capturedVideoBlob && capturedVideoUrl) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          onAttachMedia({
            name: `Video_${new Date().toISOString().slice(11, 19).replace(/:/g, "-")}.mp4`,
            type: "video",
            mimeType: capturedVideoBlob.type || "video/mp4",
            dataUrl: ev.target.result as string,
            sizeFormatted: `${(capturedVideoBlob.size / (1024 * 1024)).toFixed(1)} MB`,
            durationSeconds: recordingSeconds,
          });
          onClose();
        }
      };
      reader.readAsDataURL(capturedVideoBlob);
    }
  };

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div
      id="camera-capture-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="camera-capture-modal-card"
        className="relative w-full max-w-xl rounded-3xl bg-[#121214] border border-neutral-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800/80 bg-neutral-950/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              {captureMode === "photo" ? <Camera className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-wide uppercase">
                {captureMode === "photo" ? "Take a Picture" : "Record Video"}
              </h3>
              <p className="text-[11px] text-neutral-400">
                Capture high-resolution visual context for Angel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mode Switcher: Photo vs Video */}
        {!capturedPhoto && !capturedVideoUrl && (
          <div className="flex items-center justify-center gap-3 px-5 py-2.5 bg-neutral-900/60 border-b border-neutral-800/60">
            <button
              type="button"
              onClick={() => {
                setCaptureMode("photo");
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                captureMode === "photo"
                  ? "bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Photo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setCaptureMode("video");
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                captureMode === "video"
                  ? "bg-cyan-500 text-neutral-950 shadow-md shadow-cyan-500/20"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video with Audio</span>
            </button>
          </div>
        )}

        {/* Body Viewfinder / Preview */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-center items-center bg-black/40 overflow-y-auto">
          {errorMessage && (
            <div className="w-full mb-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Captured Photo Preview */}
          {capturedPhoto && (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative w-full max-h-[380px] rounded-2xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
                <img src={capturedPhoto} alt="Captured preview" className="max-h-[380px] w-auto object-contain rounded-xl" />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30 backdrop-blur-xs">
                  Photo Snapshot
                </div>
              </div>
            </div>
          )}

          {/* 2. Captured Video Preview */}
          {capturedVideoUrl && (
            <div className="w-full flex flex-col items-center space-y-3">
              <div className="relative w-full max-h-[380px] rounded-2xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center">
                <video
                  ref={previewVideoRef}
                  src={capturedVideoUrl}
                  controls
                  playsInline
                  className="max-h-[380px] w-auto rounded-xl"
                />
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/70 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30 backdrop-blur-xs">
                  Recorded Video ({formatTimer(recordingSeconds)})
                </div>
              </div>
            </div>
          )}

          {/* 3. Live Viewfinder */}
          {!capturedPhoto && !capturedVideoUrl && (
            <div className="relative w-full max-h-[380px] rounded-2xl overflow-hidden border border-neutral-800 bg-black flex items-center justify-center min-h-[260px]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full max-h-[380px] object-cover rounded-xl"
              />

              {/* Recording Indicator & Timer */}
              {isRecording ? (
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-400 text-xs font-semibold backdrop-blur-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="font-mono">{formatTimer(recordingSeconds)}</span>
                  <span>REC</span>
                </div>
              ) : (
                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 text-emerald-400 text-[10px] font-semibold border border-emerald-500/30 backdrop-blur-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Camera
                </div>
              )}

              {/* Flip Camera Button */}
              {!isRecording && (
                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-xl text-[11px] bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 backdrop-blur-xs flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Flip ({facingMode === "user" ? "Front" : "Rear"})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer Action Bar */}
        <div className="px-5 py-4 border-t border-neutral-800/80 bg-neutral-950/90 flex items-center justify-between">
          <input
            type="file"
            ref={fileInputRef}
            accept={captureMode === "photo" ? "image/*" : "video/*"}
            className="hidden"
            onChange={handleFileUpload}
          />

          {capturedPhoto || capturedVideoUrl ? (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake</span>
              </button>

              <button
                type="button"
                id="btn-confirm-attach-media"
                onClick={handleConfirmAttach}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-neutral-950 shadow-lg shadow-cyan-500/20 transition active:scale-[0.99]"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Attach to Angel Chat</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from disk</span>
              </button>

              {/* Shutter / Record Trigger */}
              {captureMode === "photo" ? (
                <button
                  type="button"
                  id="btn-shutter-take-photo"
                  onClick={handleTakePhoto}
                  className="px-6 py-2.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition active:scale-95"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Snap Picture</span>
                </button>
              ) : !isRecording ? (
                <button
                  type="button"
                  id="btn-record-video-start"
                  onClick={handleStartRecording}
                  className="px-6 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition active:scale-95"
                >
                  <span className="w-3 h-3 rounded-full bg-white animate-pulse" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  type="button"
                  id="btn-record-video-stop"
                  onClick={handleStopRecording}
                  className="px-6 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95"
                >
                  <StopCircle className="w-4 h-4" />
                  <span>Stop & Preview</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
