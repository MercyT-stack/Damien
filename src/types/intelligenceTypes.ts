/**
 * ANGEL — STAGE 8 & 9 TYPES
 * Continuous Intelligence, Real-time Awareness, Learning, Proactive Assistance,
 * Global World Knowledge & Cultural Intelligence
 */

export type KnowledgeType = "model_knowledge" | "current_information" | "user_memory";

export type InformationFreshness = "live" | "realtime" | "daily" | "weekly" | "historical_stable";

export type NewsVerificationStatus =
  | "confirmed"
  | "developing"
  | "reported"
  | "unconfirmed"
  | "rumored";

export type WorldCategory =
  | "world"
  | "politics"
  | "business"
  | "technology"
  | "ai"
  | "science"
  | "education"
  | "health"
  | "climate"
  | "travel"
  | "entertainment"
  | "sports"
  | "culture";

export interface WorldRegion {
  id: string;
  name: string;
  country: string;
  city?: string;
  currency: string;
  timeZone: string;
  primaryLanguage: string;
  isFollowed: boolean;
  culturalNote?: string;
}

export interface CulturalContext {
  regionCode: string;
  language: string;
  etiquetteTips: string[];
  localGreetings: string[];
  businessCustoms: string[];
  currentHolidaysOrSeasons: string[];
}

export type ProactiveEventCategory =
  | "news"
  | "project"
  | "weather"
  | "schedule"
  | "system_upgrade"
  | "learning_insight"
  | "opportunity"
  | "world_development"
  | "cultural_event"
  | "travel_advisory"
  | "user_return";

export type ProactivePriority = "critical" | "high" | "medium" | "low" | "informational";

export type BriefingScheduleType = "morning" | "evening" | "custom" | "disabled";

export interface ProactivePreferences {
  enabled: boolean;
  morningBriefingEnabled: boolean;
  morningBriefingTime: string; // "08:00"
  eveningBriefingEnabled: boolean;
  eveningBriefingTime: string; // "20:00"
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string; // "07:00"
  topics: {
    ai_tech: boolean;
    world_news: boolean;
    business_finance: boolean;
    developer_ecosystem: boolean;
    science_education: boolean;
    weather_local: boolean;
    project_monitoring: boolean;
    system_upgrades: boolean;
    cultural_events: boolean;
    travel_awareness: boolean;
  };
  followedRegions: string[];
  sourceRankingPreference: "official_first" | "broad_mix" | "academic_first";
  frequency: "low" | "medium" | "high";
  maxBriefingsPerDay: number;
  locationAccessAllowed: boolean;
  userCityOrRegion?: string;
  allowIdleReturnGreeting: boolean;
}

export interface ProactiveEvent {
  id: string;
  user_id: string;
  category: ProactiveEventCategory;
  priority: ProactivePriority;
  title: string;
  summary: string;
  body: string;
  sources?: Array<{
    title: string;
    url: string;
    snippet?: string;
    publishedDate?: string;
    credibilityScore?: number; // 1-5
  }>;
  suggestedAction?: {
    label: string;
    promptText: string;
    type: "chat_prompt" | "review_upgrade" | "check_project" | "view_source";
    payload?: Record<string, any>;
  };
  relevanceScore: number; // 0.0 - 1.0
  relevanceReason: string;
  isRead: boolean;
  isDismissed: boolean;
  userFeedback?: "useful" | "not_useful" | "more_like_this" | "less_like_this";
  created_at: string;
  expires_at?: string;
}

export interface UpgradeProposal {
  id: string;
  title: string;
  category: "model" | "api" | "tool" | "performance" | "security" | "workflow";
  whatChanged: string;
  whyItMatters: string;
  potentialBenefit: string;
  potentialCost: string;
  potentialRisks: string;
  recommendedAction: string;
  status: "pending_review" | "approved" | "dismissed";
  created_at: string;
}

export interface RealtimeBriefingPayload {
  briefingType: "morning" | "evening" | "on_demand" | "project_update";
  greeting: string;
  dateStr: string;
  headlineItems: Array<{
    category: string;
    headline: string;
    takeaway: string;
    sourceName?: string;
    url?: string;
  }>;
  projectHighlights: Array<{
    projectName: string;
    statusNote: string;
    suggestion?: string;
  }>;
  weatherSnippet?: {
    location: string;
    temperature: string;
    condition: string;
    recommendation: string;
  };
  closingRemark: string;
}

export interface LearningInsight {
  id: string;
  user_id: string;
  observedPattern: string;
  inferredPreference: string;
  confidence: number; // 0.0 - 1.0
  occurrences: number;
  status: "active" | "confirmed_by_user" | "rejected";
  created_at: string;
  updated_at: string;
}

export interface KnowledgeCacheEntry {
  key: string;
  query: string;
  data: any;
  sources: Array<{ title: string; url: string; snippet?: string }>;
  fetched_at: string;
  expires_at: string;
}

export interface CurrentInfoResult {
  topic: string;
  category?: WorldCategory | string;
  summary: string;
  insights: string[];
  verificationStatus: NewsVerificationStatus;
  regionalContext?: {
    country?: string;
    city?: string;
    currency?: string;
    language?: string;
    culturalNote?: string;
  };
  sources: Array<{
    title: string;
    url: string;
    snippet?: string;
    sourceType?: "official" | "primary" | "academic" | "news" | "specialist" | "social";
    credibilityScore?: number;
  }>;
  conflictingReports?: string;
  freshness: string;
  confidence: "high" | "moderate" | "unverified";
  timestamp: string;
}
