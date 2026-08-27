import { IntelligenceLevelOption, ThemeMode } from "../types";

export const APP_NAME = "ANGEL";
export const CURRENT_STAGE = "STAGE 11: FINAL MASTER INTEGRATION & PRODUCTION READINESS";

export const INTELLIGENCE_LEVELS: IntelligenceLevelOption[] = [
  {
    id: "quick",
    name: "Quick",
    tier: "free",
    description: "Rapid, concise responses optimized for speed and casual dialogue.",
    isAvailableInStage1: true,
  },
  {
    id: "standard",
    name: "Standard",
    tier: "free",
    description: "Balanced reasoning, conversational depth, and precision.",
    isAvailableInStage1: true,
  },
  {
    id: "detailed",
    name: "Detailed",
    tier: "free",
    description: "Exhaustive explanations, in-depth breakdowns, and thorough analysis.",
    isAvailableInStage1: true,
  },
  {
    id: "deep",
    name: "Deep",
    tier: "pro",
    description: "Multi-step complex reasoning and structured exploration.",
    isAvailableInStage1: true,
  },
  {
    id: "pro",
    name: "Pro",
    tier: "pro",
    description: "Maximum compute effort with expert domain synthesis.",
    isAvailableInStage1: true,
  },
  {
    id: "auto",
    name: "Auto",
    tier: "pro",
    description: "Dynamic routing based on prompt nuance and task complexity.",
    isAvailableInStage1: true,
  },
];

/**
 * Natural Personality-Driven Greeting Engine
 * Generates spontaneous, varied greetings (warm, playful, casual, curious, direct).
 */
export function getDynamicGreeting(
  displayName?: string,
  isReturning: boolean = true
): { greeting: string; subtitle: string } {
  const hour = new Date().getHours();
  const nameFragment = displayName ? `, ${displayName}` : "";

  const naturalGreetings = [
    `Hey${nameFragment}. What's up?`,
    `Hey you. How are you doing today?`,
    `Well, look who decided to show up${nameFragment}.`,
    `Hey, you're back. What's going on?`,
    `Alright${nameFragment}, I'm listening. What's happening?`,
    `Hey. Good to see you. What's on your mind?`,
    `What's up? Got something interesting for me?`,
    `Hey${nameFragment}. Ready when you are.`,
    `There you are. What are we getting into?`,
  ];

  let timeContextGreetings: string[] = [];
  if (hour >= 5 && hour < 12) {
    timeContextGreetings = [
      `Morning${nameFragment}. What's on your mind today?`,
      `Hey, early start. What are we tackling?`,
      `Good morning${nameFragment}. How's your day starting off?`,
    ];
  } else if (hour >= 12 && hour < 18) {
    timeContextGreetings = [
      `Hey${nameFragment}. How's the day treating you?`,
      `Afternoon. What are we looking at?`,
      `Hey, good timing. What's going on?`,
    ];
  } else if (hour >= 18 && hour < 23) {
    timeContextGreetings = [
      `Evening${nameFragment}. What's on your radar tonight?`,
      `Hey, wind down or get things done? I'm ready.`,
      `Good evening. What are we exploring?`,
    ];
  } else {
    timeContextGreetings = [
      `Late hours${nameFragment}. What's on your mind?`,
      `Still up? Alright, let's keep things sharp.`,
      `Quiet night. What are you working through?`,
    ];
  }

  const allGreetings = [...naturalGreetings, ...timeContextGreetings];
  const greeting = allGreetings[Math.floor(Math.random() * allGreetings.length)];

  const subtitles = [
    "Ask a quick question, explore an idea, or just talk things through.",
    "Conversations, real-time voice, and sharp insights.",
    "Brilliant, loyal, and ready whenever you are.",
    "Speak freely — in voice or text.",
  ];
  const subtitle = subtitles[Math.floor(Math.random() * subtitles.length)];

  return { greeting, subtitle };
}
