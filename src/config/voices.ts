import { VoiceConfig, UserVoicePreferences } from "../types";

export const DEFAULT_VOICE_ID = "unique";

export const VOICE_CATALOG: VoiceConfig[] = [
  {
    id: "unique",
    name: "UNIQUE",
    category: "Angel Signature",
    description:
      "Angel's signature voice — polished, intelligent, warm, confident with an American foundation and a subtle international undertone.",
    providerVoice: "Kore",
    isDefault: true,
    genderPresentation: "Feminine",
    styleSummary: "Polished • Warm • Confident",
    accentNote: "American foundation with subtle international undertone",
    samplePhrases: {
      "en-US": "Hey. I'm Angel. What's up?",
      "en-GB": "Hello. I'm Angel. How are things?",
      "en-NG": "Hey. Angel here. How far now?",
      "ko-KR": "안녕, 엔젤이야. 무슨 일 있어?",
      "de-DE": "Hallo, ich bin Angel. Was hast du vor?",
      "fr-FR": "Salut, je suis Angel. Comment ça va ?",
      "es-ES": "Hola, soy Angel. ¿Qué tal?",
      "ja-JP": "こんにちは、エンジェルです。どうしたの？",
      "zh-CN": "嗨，我是 Angel。最近怎么样？",
      "ar-SA": "مرحباً، أنا آنجل. كيف حالك؟",
      "hi-IN": "नमस्ते, मैं एंजेल हूँ। सब कैसा चल रहा है?",
      "yo-NG": "Báwo, èmi ni Angel. Ṣé àlàáfíà ni?",
      "ig-NG": "Kèdú, abụ m Angel. Kèdú kwanụ?",
      "ha-NG": "Sannu, ni ce Angel. Yaya kake?",
      "pt-BR": "Oi, sou a Angel. Tudo bem?",
      "it-IT": "Ciao, sono Angel. Come stai?",
    },
  },
  {
    id: "aura",
    name: "AURA",
    category: "Calm & Grounded",
    description:
      "Warm, smooth, elegant and intimate without being overly soft. Serene and thoughtful cadence.",
    providerVoice: "Aoede",
    isDefault: false,
    genderPresentation: "Feminine",
    styleSummary: "Warm • Smooth • Intimate",
    accentNote: "Lyrical & Serene",
    samplePhrases: {
      "en-US": "Hey. Take your time, we'll think through this together.",
      "en-GB": "Hello. Take all the time you need.",
      "ko-KR": "안녕. 천천히 이야기해봐, 같이 생각해보자.",
      "de-DE": "Hallo. Lass uns das ganz in Ruhe durchgehen.",
      "fr-FR": "Salut. Prends ton temps, on regarde ça ensemble.",
      "es-ES": "Hola. Tómate tu tiempo, lo vemos juntos.",
    },
  },
  {
    id: "nova",
    name: "NOVA",
    category: "Crisp & Confident",
    description:
      "Bright, energetic, confident and youthful with direct, articulate pacing.",
    providerVoice: "Zephyr",
    isDefault: false,
    genderPresentation: "Neutral",
    styleSummary: "Bright • Energetic • Direct",
    accentNote: "Crisp & Articulate",
    samplePhrases: {
      "en-US": "Hey! What's happening? Let's get straight to it.",
      "en-GB": "Right then. What are we tackling today?",
      "ko-KR": "안녕! 오늘 어떤 멋진 일을 해볼까?",
      "de-DE": "Hi! Was steht an? Packen wir es an.",
      "fr-FR": "Salut ! Qu'est-ce qu'on fait de beau aujourd'hui ?",
      "es-ES": "¡Hola! ¿Qué hay? Vamos directos al grano.",
    },
  },
  {
    id: "velvet",
    name: "VELVET",
    category: "Lyrical & Delicate",
    description:
      "Deeply smooth, calm, sophisticated, and composed with gentle emotional resonance.",
    providerVoice: "Leda",
    isDefault: false,
    genderPresentation: "Feminine",
    styleSummary: "Smooth • Sophisticated • Composed",
    accentNote: "Delicate & Measured",
    samplePhrases: {
      "en-US": "Hey there. I'm right here whenever you're ready.",
      "en-GB": "Hello. I'm all ears whenever you are ready.",
      "ko-KR": "반가워. 언제든 편하게 말해줘.",
      "de-DE": "Schön dich zu sehen. Ich bin ganz Ohr.",
      "fr-FR": "Bonjour. Je suis là dès que tu le souhaites.",
      "es-ES": "Hola. Aquí estoy cuando quieras empezar.",
    },
  },
  {
    id: "sable",
    name: "SABLE",
    category: "Deep & Authoritative",
    description:
      "Low, confident, grounded, and authoritative with steady presence and rich depth.",
    providerVoice: "Charon",
    isDefault: false,
    genderPresentation: "Masculine",
    styleSummary: "Low • Grounded • Authoritative",
    accentNote: "Resonant & Deep",
    samplePhrases: {
      "en-US": "Good to connect. What's on your radar today?",
      "en-GB": "Good to speak. What's on the agenda?",
      "ko-KR": "반갑습니다. 오늘 어떤 주제를 다뤄볼까요?",
      "de-DE": "Guten Tag. Was steht heute im Fokus?",
      "fr-FR": "Ravi de vous retrouver. Quel est le programme ?",
      "es-ES": "Un gusto saludarte. ¿Cuál es el plan hoy?",
    },
  },
  {
    id: "muse",
    name: "MUSE",
    category: "Warm & Expressive",
    description:
      "Warm, expressive, intelligent, and conversational with playful wit.",
    providerVoice: "Puck",
    isDefault: false,
    genderPresentation: "Masculine",
    styleSummary: "Warm • Expressive • Playful",
    accentNote: "Lively & Engaging",
    samplePhrases: {
      "en-US": "Hey! Great to see you. Got something fun in mind?",
      "en-GB": "Well look who's here. What are we getting into?",
      "ko-KR": "안녕! 드디어 왔네. 재밌는 아이디어 있어?",
      "de-DE": "Hey! Schön dass du da bist. Was hast du Spannendes vor?",
      "fr-FR": "Salut ! Trop bien de te voir. Qu'est-ce qu'on invente ?",
      "es-ES": "¡Hola! Qué bueno verte. ¿Tienes alguna idea genial?",
    },
  },
  {
    id: "pulse",
    name: "PULSE",
    category: "Crisp & Confident",
    description:
      "Energetic, modern, crisp, and lively with charismatic rhythm.",
    providerVoice: "Fenrir",
    isDefault: false,
    genderPresentation: "Masculine",
    styleSummary: "Energetic • Modern • Crisp",
    accentNote: "Dynamic & Bold",
    samplePhrases: {
      "en-US": "Let's make it happen. What are we building today?",
      "en-GB": "Ready when you are. Let's make things move.",
      "ko-KR": "시작해볼까? 오늘 무슨 도전을 해볼래?",
      "de-DE": "Auf geht's. Was packen wir heute an?",
      "fr-FR": "C'est parti ! Qu'est-ce qu'on réalise aujourd'hui ?",
      "es-ES": "¡A por ello! ¿Qué vamos a crear hoy?",
    },
  },
  {
    id: "lumen",
    name: "LUMEN",
    category: "Clear & Reassuring",
    description:
      "Clear, warm, lucid, and reassuring with natural cadence and crystal clarity.",
    providerVoice: "Aoede",
    isDefault: false,
    genderPresentation: "Feminine",
    styleSummary: "Clear • Warm • Reassuring",
    accentNote: "Lucid & Harmonious",
    samplePhrases: {
      "en-US": "Hello. I'm Lumen. Clear minds build great things.",
      "en-GB": "Good day. I'm Lumen. Let's make sense of everything.",
      "ko-KR": "안녕하세요, 루멘이에요. 차근차근 함께 해결해봐요.",
      "de-DE": "Hallo, ich bin Lumen. Bringen wir Klarheit hinein.",
      "fr-FR": "Bonjour, je suis Lumen. Mettons tout cela au clair.",
      "es-ES": "Hola, soy Lumen. Vamos a ordenar tus ideas con calma.",
    },
  },
  {
    id: "ember",
    name: "EMBER",
    category: "Confident & Dramatic",
    description:
      "Confident, expressive, vibrant, and slightly dramatic with compelling vocal energy.",
    providerVoice: "Fenrir",
    isDefault: false,
    genderPresentation: "Neutral",
    styleSummary: "Confident • Expressive • Vibrant",
    accentNote: "Dynamic & Dramatic",
    samplePhrases: {
      "en-US": "Hey there! Ready to spark something extraordinary today?",
      "en-GB": "Well hello. Let's ignite some bold new ideas.",
      "ko-KR": "반가워! 오늘 아주 멋진 일을 벌여보자고.",
      "de-DE": "Hallo! Bereit für etwas Außergewöhnliches?",
      "fr-FR": "Salut ! Prêt à allumer une étincelle de créativité ?",
      "es-ES": "¡Hola! ¿Preparado para encender algo grande hoy?",
    },
  },
];

export const DEFAULT_USER_VOICE_PREFERENCES: UserVoicePreferences = {
  voice_id: DEFAULT_VOICE_ID,
  language: "auto",
  regional_accent: "automatic",
  speaking_speed: 1.0,
  auto_language_detection: true,
  captions_enabled: true,
};

export function getVoiceById(id?: string): VoiceConfig {
  if (!id) return VOICE_CATALOG[0];
  const found = VOICE_CATALOG.find((v) => v.id.toLowerCase() === id.toLowerCase());
  return found || VOICE_CATALOG[0];
}

export function getVoiceSamplePhrase(voice: VoiceConfig, languageCode: string = "auto"): string {
  if (languageCode !== "auto" && voice.samplePhrases[languageCode]) {
    return voice.samplePhrases[languageCode];
  }
  return voice.samplePhrases["en-US"] || "Hey. I'm Angel. What's up?";
}
