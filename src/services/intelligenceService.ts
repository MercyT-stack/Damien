/**
 * ANGEL — STAGE 8 CLIENT SERVICE
 * Real-time continuous intelligence, proactive briefings, and knowledge queries
 */

import {
  CurrentInfoResult,
  RealtimeBriefingPayload,
  UpgradeProposal,
  ProactivePreferences,
} from "../types/intelligenceTypes";

const PROACTIVE_PREFS_KEY = "angel_proactive_preferences_v1";

export const DEFAULT_PROACTIVE_PREFERENCES: ProactivePreferences = {
  enabled: true,
  morningBriefingEnabled: true,
  morningBriefingTime: "08:30",
  eveningBriefingEnabled: true,
  eveningBriefingTime: "20:00",
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  topics: {
    ai_tech: true,
    world_news: true,
    business_finance: true,
    developer_ecosystem: true,
    science_education: true,
    weather_local: true,
    project_monitoring: true,
    system_upgrades: true,
    cultural_events: true,
    travel_awareness: true,
  },
  followedRegions: ["Global", "Nigeria", "United States", "United Kingdom", "South Korea"],
  sourceRankingPreference: "official_first",
  frequency: "medium",
  maxBriefingsPerDay: 2,
  locationAccessAllowed: true,
  userCityOrRegion: "San Francisco, CA",
  allowIdleReturnGreeting: true,
};

export function loadProactivePreferences(): ProactivePreferences {
  try {
    const raw = localStorage.getItem(PROACTIVE_PREFS_KEY);
    if (!raw) return DEFAULT_PROACTIVE_PREFERENCES;
    return { ...DEFAULT_PROACTIVE_PREFERENCES, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_PROACTIVE_PREFERENCES;
  }
}

export function saveProactivePreferences(prefs: ProactivePreferences): void {
  try {
    localStorage.setItem(PROACTIVE_PREFS_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error("Failed to save proactive preferences:", err);
  }
}

/**
 * Check if the current time is within user quiet hours
 */
export function isInQuietHours(prefs: ProactivePreferences): boolean {
  if (!prefs.quietHoursEnabled) return false;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = prefs.quietHoursStart.split(":").map(Number);
  const [endH, endM] = prefs.quietHoursEnd.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes > endMinutes) {
    // Crosses midnight (e.g. 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  } else {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
}

/**
 * Fetch grounded live current world knowledge
 */
export async function queryCurrentWorldInfo(params: {
  topic: string;
  category?: string;
  userInterests?: string[];
  userLocation?: string;
  intelligenceLevel?: string;
}): Promise<CurrentInfoResult> {
  const res = await fetch("/api/intelligence/current-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Current info query failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Generate a proactive briefing
 */
export async function fetchProactiveBriefing(params: {
  briefingType: "morning" | "evening" | "on_demand";
  userName?: string;
  preferredName?: string;
  userInterests?: string[];
  activeProjects?: Array<{ name: string; description?: string; goals?: string[] }>;
  location?: string;
  intelligenceLevel?: string;
}): Promise<RealtimeBriefingPayload> {
  const res = await fetch("/api/intelligence/briefing", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error(`Briefing generation failed: ${res.statusText}`);
  }

  const data = await res.json();
  return data.briefing;
}

/**
 * Fetch system self-improvement upgrade proposals
 */
export async function fetchUpgradeProposals(): Promise<UpgradeProposal[]> {
  const res = await fetch("/api/intelligence/upgrades");
  if (!res.ok) {
    throw new Error("Failed to fetch upgrade proposals");
  }
  const data = await res.json();
  return data.proposals || [];
}

/**
 * Fetch country, city & cultural profile
 */
export async function fetchCountryProfile(countryOrCity: string): Promise<any> {
  const res = await fetch("/api/intelligence/country-profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ countryOrCity }),
  });

  if (!res.ok) {
    throw new Error(`Failed to load profile for ${countryOrCity}`);
  }

  const data = await res.json();
  return data.profile;
}

/**
 * Analyze active workspace project synergy with world ecosystem developments
 */
export async function fetchProjectSynergy(params: {
  projectName: string;
  projectDescription?: string;
  technologies?: string[];
}): Promise<any> {
  const res = await fetch("/api/intelligence/project-synergy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    throw new Error("Failed to analyze project ecosystem synergy");
  }

  const data = await res.json();
  return data.synergy;
}
