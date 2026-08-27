export type SpeakerSensitivityLevel = "low" | "balanced" | "high";

export type VoiceProfileRole = "owner" | "partner" | "family" | "colleague" | "guest";

export interface VoiceCharacteristics {
  pitchAvgHz: number;
  pitchRange: [number, number];
  spectralCentroidAvg: number;
  harmonicRatio: number;
  mfccVector: number[];
  sampleDurationMs: number;
  sampleCount: number;
  snrDb?: number;
}

export interface VoiceIdentityProfile {
  id: string;
  name: string;
  role: VoiceProfileRole;
  enrolledAt: string;
  lastVerifiedAt?: string;
  isPrimaryOwner: boolean;
  confidenceBaseline: number;
  voiceprintHash: string;
  characteristics: VoiceCharacteristics;
  color: string;
  avatarUrl?: string;
}

export interface VoiceRecognitionSettings {
  respondOnlyToMyVoice: boolean;
  sensitivity: SpeakerSensitivityLevel;
  ignoreUnknownSpeakers: boolean;
  guestModeAllowed: boolean;
  strictVerificationForSensitiveActions: boolean;
  wakeWordRequired: boolean;
  crossDeviceEncryptedSync: boolean;
  activeProfileId: string;
  profiles: VoiceIdentityProfile[];
  providerId: "local_edge_biometrics" | "picovoice_eagle" | "pyannote_voice" | "gemini_speaker_id";
  lastExportAt?: string;
}

export interface SpeakerVerificationResult {
  isVerified: boolean;
  confidence: number; // 0 to 1
  matchedProfile?: VoiceIdentityProfile;
  actionAllowed: boolean;
  rejectionReason?: 
    | "unknown_speaker" 
    | "low_confidence" 
    | "unauthorized_sensitive_action" 
    | "voice_not_enrolled"
    | "guest_mode_disabled";
  isGuest: boolean;
  metrics?: {
    pitchMatch: number;
    timbreMatch: number;
    spectralMatch: number;
  };
}

export interface VoiceEnrollmentStep {
  id: number;
  title: string;
  promptPhrase: string;
  targetDurationSeconds: number;
  description: string;
}

export interface IVoiceIdentityEngine {
  readonly providerId: string;
  readonly providerName: string;
  readonly description: string;
  readonly isCloudBased: boolean;

  extractVoiceCharacteristics(audioBuffer: Float32Array, sampleRate: number): Promise<VoiceCharacteristics>;
  compareCharacteristics(sample: VoiceCharacteristics, enrolled: VoiceCharacteristics): {
    score: number;
    metrics: { pitchMatch: number; timbreMatch: number; spectralMatch: number };
  };
  generateVoiceprintHash(characteristics: VoiceCharacteristics): string;
}
