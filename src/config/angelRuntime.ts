export type AngelIntelligenceLevel = "quick" | "standard" | "detailed" | "deep" | "pro" | "auto";

export const ANGEL_IDENTITY = {
  name: "Angel",
  defaultVoiceId: "unique",
  defaultLanguage: "en-US",
  defaultIntelligence: "standard" as AngelIntelligenceLevel,
  defaultTheme: "dark" as const,
  wakeWords: ["angel", "hey angel", "okay angel", "ok angel"],
  endConversationCommands: [
    "angel end conversation",
    "angel stop listening",
    "angel stop",
    "end conversation",
    "stop listening",
  ],
};

export const INTELLIGENCE_LEVELS: Record<AngelIntelligenceLevel, {
  label: string;
  tier: "free" | "pro";
  description: string;
}> = {
  quick: { label: "Quick", tier: "free", description: "Fast answers for simple requests and everyday questions." },
  standard: { label: "Standard", tier: "free", description: "Angel's balanced everyday intelligence." },
  detailed: { label: "Detailed", tier: "free", description: "More context, structure, examples and careful reasoning." },
  deep: { label: "Deep", tier: "pro", description: "Long-form research, deeper analysis and multi-step investigation." },
  pro: { label: "Pro", tier: "pro", description: "High-complexity reasoning, planning and professional workflows." },
  auto: { label: "Auto", tier: "pro", description: "Angel chooses the appropriate intelligence level for the request." },
};

export interface AngelVoiceOption {
  id: string;
  name: string;
  language: string;
  locale: string;
  description: string;
  character: string;
  accent: string;
}

// Voice identity stays fixed after selection. Emotion changes delivery only.
export const ANGEL_VOICES: AngelVoiceOption[] = [
  { id: "unique", name: "Unique", language: "English", locale: "en-US", description: "Angel's original default voice: polished American English with a subtle international quality.", character: "Elegant, warm, intelligent", accent: "International American" },
  { id: "nigerian-english", name: "Nigerian English", language: "English", locale: "en-NG", description: "Natural Nigerian English delivery with region-appropriate rhythm and pronunciation.", character: "Warm, lively, confident", accent: "Nigerian" },
  { id: "german", name: "German", language: "Deutsch", locale: "de-DE", description: "Natural Standard German pronunciation and cadence.", character: "Composed, precise, cultured", accent: "German" },
  { id: "korean", name: "Korean", language: "한국어", locale: "ko-KR", description: "Natural Korean speech rhythm and pronunciation.", character: "Graceful, attentive, refined", accent: "Korean" },
  { id: "french", name: "French", language: "Français", locale: "fr-FR", description: "Natural French pronunciation and conversational cadence.", character: "Elegant, expressive, composed", accent: "French" },
  { id: "spanish", name: "Spanish", language: "Español", locale: "es-ES", description: "Natural European Spanish pronunciation and rhythm.", character: "Bright, confident, expressive", accent: "Spanish" },
  { id: "portuguese-br", name: "Brazilian Portuguese", language: "Português", locale: "pt-BR", description: "Natural Brazilian Portuguese rhythm and pronunciation.", character: "Warm, animated, friendly", accent: "Brazilian" },
  { id: "japanese", name: "Japanese", language: "日本語", locale: "ja-JP", description: "Natural Japanese cadence and pronunciation.", character: "Calm, precise, graceful", accent: "Japanese" },
  { id: "mandarin", name: "Mandarin Chinese", language: "中文", locale: "zh-CN", description: "Natural Mandarin pronunciation and tonal delivery.", character: "Clear, poised, thoughtful", accent: "Mandarin" },
  { id: "arabic", name: "Arabic", language: "العربية", locale: "ar-SA", description: "Modern Standard Arabic pronunciation suitable for broad international use.", character: "Warm, dignified, articulate", accent: "Arabic" },
  { id: "hindi", name: "Hindi", language: "हिन्दी", locale: "hi-IN", description: "Natural Hindi pronunciation and conversational rhythm.", character: "Warm, expressive, intelligent", accent: "Indian" },
  { id: "italian", name: "Italian", language: "Italiano", locale: "it-IT", description: "Natural Italian cadence and pronunciation.", character: "Expressive, stylish, warm", accent: "Italian" },
  { id: "dutch", name: "Dutch", language: "Nederlands", locale: "nl-NL", description: "Natural Dutch pronunciation and rhythm.", character: "Friendly, clear, composed", accent: "Dutch" },
  { id: "swedish", name: "Swedish", language: "Svenska", locale: "sv-SE", description: "Natural Swedish cadence and pronunciation.", character: "Calm, modern, friendly", accent: "Swedish" },
  { id: "yoruba", name: "Yorùbá", language: "Yorùbá", locale: "yo-NG", description: "Yorùbá language profile for Nigerian localization; tone-aware speech when supported by the selected TTS engine.", character: "Warm, culturally grounded, lively", accent: "Yorùbá" },
  { id: "igbo", name: "Igbo", language: "Igbo", locale: "ig-NG", description: "Igbo language profile for Nigerian localization; tone-aware speech when supported by the selected TTS engine.", character: "Warm, clear, culturally grounded", accent: "Igbo" },
  { id: "hausa", name: "Hausa", language: "Hausa", locale: "ha-NG", description: "Hausa language profile for Nigerian localization.", character: "Calm, confident, welcoming", accent: "Hausa" },
];

export const EMOTION_DELIVERY = {
  rule: "Emotion changes delivery, not identity.",
  supported: ["neutral", "happy", "excited", "calm", "concerned", "sad", "empathetic", "playful", "serious", "confident"],
};

export function normalizeWakePhrase(text: string): string {
  return text.trim().toLowerCase().replace(/[,.!?]+/g, "").replace(/\s+/g, " ");
}

export function isWakePhrase(text: string): boolean {
  const normalized = normalizeWakePhrase(text);
  return ANGEL_IDENTITY.wakeWords.some((word) => normalized === word || normalized.startsWith(`${word} `));
}

export function isEndConversationCommand(text: string): boolean {
  const normalized = normalizeWakePhrase(text);
  return ANGEL_IDENTITY.endConversationCommands.some((command) => normalized === command || normalized.endsWith(` ${command}`));
}
