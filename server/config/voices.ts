export interface ServerVoiceConfig {
  id: string;
  name: string;
  providerVoice: string; // Gemini Live/TTS prebuilt voice
  genderPresentation: string;
  styleDescription: string;
  defaultSamplePhrase: string;
}

export const SERVER_VOICE_CATALOG: Record<string, ServerVoiceConfig> = {
  unique: {
    id: "unique",
    name: "UNIQUE",
    providerVoice: "Kore",
    genderPresentation: "Feminine",
    styleDescription: "Angel's signature voice — polished, intelligent, warm, confident, American foundation with subtle international undertone",
    defaultSamplePhrase: "Hey. I'm Angel. What's up?",
  },
  aura: {
    id: "aura",
    name: "AURA",
    providerVoice: "Aoede",
    genderPresentation: "Feminine",
    styleDescription: "Warm, smooth, elegant and intimate without being overly soft",
    defaultSamplePhrase: "Hey. Take your time, we'll think through this together.",
  },
  nova: {
    id: "nova",
    name: "NOVA",
    providerVoice: "Zephyr",
    genderPresentation: "Neutral",
    styleDescription: "Bright, energetic, confident and youthful with direct pacing",
    defaultSamplePhrase: "Hey! What's happening? Let's get straight to it.",
  },
  velvet: {
    id: "velvet",
    name: "VELVET",
    providerVoice: "Leda",
    genderPresentation: "Feminine",
    styleDescription: "Deeply smooth, calm, sophisticated and composed",
    defaultSamplePhrase: "Hey there. I'm right here whenever you're ready.",
  },
  sable: {
    id: "sable",
    name: "SABLE",
    providerVoice: "Charon",
    genderPresentation: "Masculine",
    styleDescription: "Low, confident, grounded and authoritative with steady presence",
    defaultSamplePhrase: "Good to connect. What's on your radar today?",
  },
  muse: {
    id: "muse",
    name: "MUSE",
    providerVoice: "Puck",
    genderPresentation: "Masculine",
    styleDescription: "Warm, expressive, intelligent and conversational with wit",
    defaultSamplePhrase: "Hey! Great to see you. Got something fun in mind?",
  },
  pulse: {
    id: "pulse",
    name: "PULSE",
    providerVoice: "Fenrir",
    genderPresentation: "Masculine",
    styleDescription: "Energetic, modern, crisp and lively with dynamic rhythm",
    defaultSamplePhrase: "Let's make it happen. What are we building today?",
  },
  haven: {
    id: "haven",
    name: "HAVEN",
    providerVoice: "Callisto",
    genderPresentation: "Neutral",
    styleDescription: "Soft, reassuring, calm and comforting with patient clarity",
    defaultSamplePhrase: "Hey. Good to have you here. How's your day going?",
  },
  lumen: {
    id: "lumen",
    name: "LUMEN",
    providerVoice: "Aoede",
    genderPresentation: "Feminine",
    styleDescription: "Luminous, crystal-clear, articulate and thoughtful with radiant pacing",
    defaultSamplePhrase: "Hello. Let's illuminate this idea together.",
  },
  ember: {
    id: "ember",
    name: "EMBER",
    providerVoice: "Fenrir",
    genderPresentation: "Masculine",
    styleDescription: "Warm, resonant, deep and assuring with authentic gravitas",
    defaultSamplePhrase: "I'm ready whenever you are. Let's make progress.",
  },
};

export function getServerVoice(voiceId?: string): ServerVoiceConfig {
  if (!voiceId) return SERVER_VOICE_CATALOG.unique;
  const key = voiceId.toLowerCase();
  return SERVER_VOICE_CATALOG[key] || SERVER_VOICE_CATALOG.unique;
}
