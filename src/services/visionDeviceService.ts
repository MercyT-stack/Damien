import { VisionSourceType, VisionPermissionState, VisionAttachmentPayload } from "../types/visionTypes";

export interface CameraStreamResult {
  stream: MediaStream;
  permissionState: VisionPermissionState;
}

/**
 * Checks system capability and permission for camera
 */
export async function checkCameraPermission(): Promise<VisionPermissionState> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return "UNAVAILABLE";
  }

  try {
    if (navigator.permissions && (navigator.permissions as any).query) {
      const status = await (navigator.permissions as any).query({ name: "camera" });
      if (status.state === "granted") return "GRANTED";
      if (status.state === "denied") return "DENIED";
      return "REQUESTED";
    }
  } catch (e) {
    // Some browsers reject query for camera name, fallback to requested state
  }

  return "REQUESTED";
}

/**
 * Starts device camera video stream with explicit permission
 */
export async function startCameraStream(facingMode: "user" | "environment" = "user"): Promise<CameraStreamResult> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("Camera hardware or browser API is unavailable.");
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode,
      },
      audio: false,
    });

    return {
      stream,
      permissionState: "GRANTED",
    };
  } catch (err: any) {
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      throw new Error("Camera permission was denied. Please allow access in browser permissions.");
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      throw new Error("No camera device found on this system.");
    } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
      throw new Error("Camera is currently in use by another application.");
    }
    throw new Error(err.message || "Failed to initialize camera.");
  }
}

/**
 * Captures high-definition snapshot from HTMLVideoElement and returns base64
 */
export function captureFrameFromVideo(
  video: HTMLVideoElement,
  format: "image/jpeg" | "image/png" = "image/jpeg",
  quality = 0.85
): string {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas rendering context unavailable.");
  }

  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(format, quality);
}

/**
 * Requests explicit screen access, grabs a snapshot frame, and immediately releases the stream
 */
export async function captureScreenSnapshot(): Promise<string> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error("Screen capture API is not supported on this browser or device.");
  }

  let stream: MediaStream | null = null;
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      video: { cursor: "always" } as any,
      audio: false,
    });

    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) {
      throw new Error("No video track captured from screen.");
    }

    // Try ImageCapture API first if supported
    if ((window as any).ImageCapture) {
      try {
        const imageCapture = new (window as any).ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0);
          return canvas.toDataURL("image/png");
        }
      } catch (e) {
        // Fallback to video element
      }
    }

    // Fallback using temporary hidden video element
    const video = document.createElement("video");
    video.srcObject = stream;
    video.autoplay = true;
    video.muted = true;

    await new Promise<void>((resolve) => {
      video.onloadedmetadata = () => {
        video.play().then(() => resolve()).catch(() => resolve());
      };
      // Timeout fallback
      setTimeout(resolve, 500);
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Failed to render screen canvas frame.");
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png");
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      throw new Error("Screen share permission was cancelled or denied.");
    }
    throw new Error(err.message || "Failed to capture screen context.");
  } finally {
    // Ensure all screen tracks are released immediately
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
  }
}

/**
 * Safely stops all tracks on a MediaStream to turn off camera LED and free hardware
 */
export function releaseMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      track.stop();
      track.enabled = false;
    });
  } catch (e) {
    console.warn("Error releasing media stream:", e);
  }
}

/**
 * Converts File to VisionAttachmentPayload
 */
export async function fileToVisionAttachment(file: File): Promise<VisionAttachmentPayload> {
  const mimeType = file.type || "application/octet-stream";
  let sourceType: VisionSourceType = "image";
  const nameLower = file.name.toLowerCase();

  if (mimeType.includes("pdf") || nameLower.endsWith(".pdf")) {
    sourceType = "document";
  } else if (nameLower.endsWith(".ts") || nameLower.endsWith(".tsx") || nameLower.endsWith(".py") || nameLower.endsWith(".sql")) {
    sourceType = "code";
  } else if (file.type.startsWith("image/")) {
    sourceType = "image";
  }

  const sizeFormatted =
    file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024) || 1} KB`;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = (reader.result as string) || "";
      resolve({
        name: file.name,
        sourceType,
        mimeType,
        base64Data,
        previewUrl: base64Data,
        sizeFormatted,
        timestamp: new Date().toISOString(),
      });
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
