export type VisionSourceType =
  | "camera"
  | "screen"
  | "image"
  | "document"
  | "diagram"
  | "code"
  | "video"
  | "webpage";

export type VisionProcessingMode =
  | "general"
  | "ocr"
  | "ui_design"
  | "code_debug"
  | "document_summary"
  | "educational"
  | "chart_analysis";

export type VisionPermissionState =
  | "NOT_REQUESTED"
  | "REQUESTED"
  | "GRANTED"
  | "DENIED"
  | "RESTRICTED"
  | "EXPIRED"
  | "REVOKED"
  | "UNAVAILABLE";

export type VisionTaskLifecycleState =
  | "IDLE"
  | "REQUESTING_PERMISSION"
  | "CONNECTING"
  | "CAPTURING"
  | "ANALYZING"
  | "WAITING"
  | "EXECUTING"
  | "VERIFYING"
  | "COMPLETED"
  | "PAUSED"
  | "CANCELLED"
  | "FAILED";

export interface VisionUIElement {
  type: string;
  label: string;
  coordinates?: string;
  description?: string;
}

export interface VisionDesignFeedback {
  typography?: string;
  layout?: string;
  contrast?: string;
  hierarchy?: string;
  alignment?: string;
  score?: number;
  recommendations?: string[];
}

export interface VisionCodeInspection {
  language?: string;
  errorsFound?: string[];
  suggestedFix?: string;
}

export interface VisionEducationalBreakdown {
  subject?: string;
  keyFormulas?: string[];
  explanationSteps?: string[];
}

export interface VisionDocumentStructure {
  title?: string;
  sections?: Array<{ heading: string; summary: string }>;
  keyMetrics?: Record<string, string>;
  detectedLanguage?: string;
}

export interface VisionActionSuggestion {
  id: string;
  label: string;
  integrationId?: string;
  prompt: string;
}

export interface VisionAnalysisResult {
  success: boolean;
  sourceType: VisionSourceType;
  summary: string;
  ocrText?: string;
  detectedObjects?: string[];
  uiElements?: VisionUIElement[];
  designEvaluation?: VisionDesignFeedback;
  codeInspection?: VisionCodeInspection;
  educationalBreakdown?: VisionEducationalBreakdown;
  documentStructure?: VisionDocumentStructure;
  suggestedActions?: VisionActionSuggestion[];
  rawResponse: string;
  latencyMs: number;
  isOffline: boolean;
  error?: string;
}

export interface VisionSessionMetadata {
  sessionId: string;
  userId: string;
  conversationId?: string;
  sourceType: VisionSourceType;
  permissionState: VisionPermissionState;
  deviceInfo?: {
    os: string;
    browser: string;
    deviceType: string;
  };
  durationSeconds?: number;
  timestamp: string;
}

export interface VisionAttachmentPayload {
  name: string;
  sourceType: VisionSourceType;
  mimeType: string;
  base64Data: string;
  previewUrl: string;
  sizeFormatted?: string;
  extractedText?: string;
  timestamp: string;
}
