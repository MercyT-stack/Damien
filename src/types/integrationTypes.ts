import { ToolPermissionLevel, ToolConnectionStatus } from "./toolTypes";

export type IntegrationCategory =
  | "COMMUNICATION"
  | "SOCIAL"
  | "CREATIVE"
  | "DEVELOPMENT"
  | "PRODUCTIVITY"
  | "CALENDAR"
  | "STORAGE"
  | "EDUCATION"
  | "BUSINESS"
  | "TRAVEL"
  | "MEDIA"
  | "AI"
  | "WEB";

export type AuthMethod =
  | "oauth2"
  | "api_key"
  | "personal_access_token"
  | "session_cookie"
  | "device_native"
  | "none";

export type IntegrationHealthStatus =
  | "HEALTHY"
  | "NOT_CONFIGURED"
  | "NEEDS_AUTH"
  | "EXPIRED"
  | "REVOKED"
  | "RATE_LIMITED"
  | "UNAVAILABLE"
  | "ERROR";

export type IntegrationAvailabilityType =
  | "CONNECTED"
  | "MOCK"
  | "DEMO"
  | "UNAVAILABLE"
  | "COMING_SOON"
  | "DEVICE_NATIVE";

export type PlatformSupportType = "web" | "desktop" | "mobile" | "tablet" | "all";

export interface IntegrationScope {
  id: string;
  name: string;
  description: string;
  riskLevel: ToolPermissionLevel;
  isSensitive: boolean; // Requires action preview or confirmation
  isGrantedByDefault?: boolean;
}

export interface IntegrationAction {
  id: string;
  name: string;
  description: string;
  requiredScopes: string[];
  riskLevel: ToolPermissionLevel;
  reversibility: "REVERSIBLE" | "PARTIALLY_REVERSIBLE" | "IRREVERSIBLE";
  requiresExplicitConfirmation: boolean;
  offlineCapable: boolean;
  sampleInput?: Record<string, any>;
}

export interface ExternalIntegration {
  id: string;
  name: string;
  provider: string;
  category: IntegrationCategory;
  description: string;
  icon: string;
  supportedPlatforms: PlatformSupportType[];
  authMethod: AuthMethod;
  authEndpoint?: string;
  scopes: IntegrationScope[];
  grantedScopes: string[];
  availableActions: IntegrationAction[];
  readCapabilities: string[];
  writeCapabilities: string[];
  riskLevel: ToolPermissionLevel;
  offlineMode: "OFFLINE_CAPABLE" | "ONLINE_REQUIRED" | "PARTIALLY_AVAILABLE";
  healthStatus: IntegrationHealthStatus;
  availability: IntegrationAvailabilityType;
  version: string;
  isConnected: boolean;
  accountEmail?: string;
  accountName?: string;
  connectedAt?: string;
  expiresAt?: string | null;
  lastUsedAt?: string | null;
  errorMessage?: string;
  handoffSupported?: boolean;
  handoffUrlTemplate?: string;
  webpageIntegrationSupported?: boolean;
}

// Device Context
export interface DeviceContextInfo {
  deviceId: string;
  deviceType: "desktop" | "laptop" | "mobile" | "tablet" | "unknown";
  os: string;
  browser: string;
  isOnline: boolean;
  cameraAvailable: boolean;
  microphoneAvailable: boolean;
  screenShareAvailable: boolean;
  locationCapability: "granted" | "denied" | "prompt" | "unavailable";
  networkType: string;
  deviceNativeAppsAvailable: string[];
  batteryLevel?: number | null;
  screenResolution: {
    width: number;
    height: number;
  };
}

// Webpage and Browser Agent Understanding
export interface WebpageElementInfo {
  id?: string;
  tag: string;
  type?: string;
  text?: string;
  ariaLabel?: string;
  selector?: string;
  isInteractive: boolean;
  href?: string;
}

export interface WebpageStructure {
  url: string;
  title: string;
  headings: string[];
  linksCount: number;
  formsCount: number;
  inputsCount: number;
  interactiveElements: WebpageElementInfo[];
  mainTextSnippet: string;
  hasAuthWall?: boolean;
}

// Universal External Action Payload
export interface UniversalExternalActionRequest {
  integrationId: string;
  actionId: string;
  targetResource?: string;
  inputPayload: Record<string, any>;
  intelligenceLevel?: string;
  conversationId?: string;
  userConfirmationGranted?: boolean;
}

export interface UniversalExternalActionResult {
  success: boolean;
  integrationId: string;
  actionId: string;
  executionStatus: "executed" | "confirmed_pending" | "cancelled" | "fallback_handoff" | "failed";
  data: any;
  artifact?: any;
  sources?: Array<{ title: string; url: string }>;
  handoffUrl?: string;
  handoffNotice?: string;
  error?: string;
  executionTimeMs: number;
}
