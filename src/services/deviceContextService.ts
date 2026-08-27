import { DeviceContextInfo } from "../types/integrationTypes";

/**
 * Stage 6 Device Context Service
 * Detects device hardware capabilities, screen parameters, and local application awareness
 */

let cachedDeviceId: string | null = null;

export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;
  try {
    let stored = localStorage.getItem("angel_device_id_v1");
    if (!stored) {
      stored = `dev-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
      localStorage.setItem("angel_device_id_v1", stored);
    }
    cachedDeviceId = stored;
    return stored;
  } catch {
    return "dev-browser-default";
  }
}

export function detectDeviceType(): "desktop" | "laptop" | "mobile" | "tablet" | "unknown" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent.toLowerCase();
  const isMobile = /mobile|android|iphone|ipod|blackberry|opera mini|iemobile/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isTablet) return "tablet";
  if (isMobile) return "mobile";
  if (window.innerWidth < 1024) return "laptop";
  return "desktop";
}

export function detectOperatingSystem(): string {
  if (typeof window === "undefined") return "Unknown OS";
  const ua = navigator.userAgent;
  if (/windows nt 10/i.test(ua)) return "Windows 10/11";
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os x/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Unknown OS";
}

export function detectBrowser(): string {
  if (typeof window === "undefined") return "Unknown Browser";
  const ua = navigator.userAgent;
  if (/chrome|crios/i.test(ua) && !/edge|edg|opr/i.test(ua)) return "Google Chrome";
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return "Apple Safari";
  if (/firefox|fxios/i.test(ua)) return "Mozilla Firefox";
  if (/edg/i.test(ua)) return "Microsoft Edge";
  if (/opr\//i.test(ua)) return "Opera";
  return "Modern Browser";
}

/**
 * Check installed/native application availability for current platform
 * Returns list of apps supported natively or via protocol handoff
 */
export function checkDeviceNativeApps(os: string): string[] {
  const commonWebApps = ["Google Drive", "Canva Web", "GitHub Web", "Gmail Web", "Notion Web"];
  if (os === "macOS" || os.includes("Windows")) {
    return [...commonWebApps, "VS Code", "Terminal", "System Mail", "Desktop Browser"];
  }
  if (os === "Android" || os === "iOS") {
    return [...commonWebApps, "WhatsApp Mobile", "Camera App", "Photos", "System Calendar"];
  }
  return commonWebApps;
}

/**
 * Inspect comprehensive device context
 */
export async function getDeviceContext(): Promise<DeviceContextInfo> {
  const os = detectOperatingSystem();
  const deviceType = detectDeviceType();
  const browser = detectBrowser();
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  let cameraAvailable = false;
  let microphoneAvailable = false;
  let screenShareAvailable = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getDisplayMedia;

  if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      cameraAvailable = devices.some((d) => d.kind === "videoinput");
      microphoneAvailable = devices.some((d) => d.kind === "audioinput");
    } catch {
      cameraAvailable = true;
      microphoneAvailable = true;
    }
  }

  // Location capability check
  let locationCapability: "granted" | "denied" | "prompt" | "unavailable" = "prompt";
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    locationCapability = "unavailable";
  } else if (navigator.permissions && navigator.permissions.query) {
    try {
      const status = await navigator.permissions.query({ name: "geolocation" as any });
      locationCapability = status.state as any;
    } catch {
      locationCapability = "prompt";
    }
  }

  const networkType = (navigator as any)?.connection?.effectiveType || (isOnline ? "4G/WiFi" : "Offline");

  return {
    deviceId: getDeviceId(),
    deviceType,
    os,
    browser,
    isOnline,
    cameraAvailable,
    microphoneAvailable,
    screenShareAvailable,
    locationCapability,
    networkType,
    deviceNativeAppsAvailable: checkDeviceNativeApps(os),
    screenResolution: {
      width: typeof window !== "undefined" ? window.screen.width : 1920,
      height: typeof window !== "undefined" ? window.screen.height : 1080,
    },
  };
}
