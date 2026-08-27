import { ExternalIntegration, IntegrationCategory } from "../types/integrationTypes";

/**
 * MASTER EXTERNAL INTEGRATION REGISTRY FOR ANGEL
 * Stage 6 External World, Application, Web, Account & Integration Ecosystem
 * 
 * Supports: Communication, Creative, Development, Productivity, Calendar, Storage,
 * Education, Business, Travel, Media, and Web/Browser Agent tools.
 */

export const ANGEL_INTEGRATION_REGISTRY: ExternalIntegration[] = [
  // ==========================================
  // 1. COMMUNICATION: GMAIL & GOOGLE WORKSPACE
  // ==========================================
  {
    id: "integration_gmail",
    name: "Google Gmail",
    provider: "Google Workspace",
    category: "COMMUNICATION",
    description: "Read authorized email threads, draft smart replies, and dispatch confirmed messages.",
    icon: "Mail",
    supportedPlatforms: ["all"],
    authMethod: "oauth2",
    authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    version: "2.1.0",
    riskLevel: "high",
    offlineMode: "ONLINE_REQUIRED",
    healthStatus: "NOT_CONFIGURED",
    availability: "CONNECTED",
    isConnected: false,
    handoffSupported: true,
    handoffUrlTemplate: "https://mail.google.com/mail/u/0/#inbox",
    scopes: [
      {
        id: "gmail.readonly",
        name: "Read Inbox & Emails",
        description: "Allows Angel to search and inspect relevant email communications.",
        riskLevel: "medium",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "gmail.compose",
        name: "Draft Messages",
        description: "Allows Angel to prepare polished drafts for your review.",
        riskLevel: "low",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "gmail.send",
        name: "Dispatch Emails",
        description: "Allows sending emails ONLY after explicit confirmation in the action preview.",
        riskLevel: "critical",
        isSensitive: true,
        isGrantedByDefault: false,
      },
    ],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_gmail_search",
        name: "Search Messages & Threads",
        description: "Search email inbox for specific topics, dates, or contacts.",
        requiredScopes: ["gmail.readonly"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
      {
        id: "action_gmail_draft",
        name: "Draft Email",
        description: "Generate structured, professional email draft with subject, body, and recipient.",
        requiredScopes: ["gmail.compose"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
      {
        id: "action_gmail_send",
        name: "Send Live Email",
        description: "Dispatch email to verified recipient after user pre-execution preview.",
        requiredScopes: ["gmail.send"],
        riskLevel: "critical",
        reversibility: "IRREVERSIBLE",
        requiresExplicitConfirmation: true,
        offlineCapable: false,
      },
    ],
    readCapabilities: ["search_threads", "inspect_message_body", "read_attachments_meta"],
    writeCapabilities: ["create_draft", "dispatch_email", "label_message"],
  },

  // ==========================================
  // 2. CREATIVE: CANVA DESIGN PLATFORM
  // ==========================================
  {
    id: "integration_canva",
    name: "Canva Design Platform",
    provider: "Canva Inc.",
    category: "CREATIVE",
    description: "Generate flyers, presentations, social media banners, and brand graphics in your Canva workspace.",
    icon: "Palette",
    supportedPlatforms: ["all"],
    authMethod: "oauth2",
    authEndpoint: "https://www.canva.com/api/oauth/authorize",
    version: "2.0.0",
    riskLevel: "medium",
    offlineMode: "PARTIALLY_AVAILABLE",
    healthStatus: "NOT_CONFIGURED",
    availability: "CONNECTED",
    isConnected: false,
    handoffSupported: true,
    handoffUrlTemplate: "https://www.canva.com/design/play",
    scopes: [
      {
        id: "design:content:read",
        name: "Inspect Designs & Folders",
        description: "Allows Angel to search existing design projects and assets.",
        riskLevel: "low",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "design:content:write",
        name: "Create & Edit Visuals",
        description: "Allows Angel to generate new flyers, slides, and layouts.",
        riskLevel: "medium",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "design:export",
        name: "Export Hi-Res Assets",
        description: "Allows exporting PNG, PDF, and MP4 files directly to workspace.",
        riskLevel: "low",
        isSensitive: false,
        isGrantedByDefault: true,
      },
    ],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_canva_create_flyer",
        name: "Create Business Flyer / Poster",
        description: "Generates a structured graphic layout with typography, palette, and asset blueprint.",
        requiredScopes: ["design:content:write"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
      {
        id: "action_canva_create_presentation",
        name: "Create Multi-Slide Deck",
        description: "Builds a complete presentation deck with visual themes and slide notes.",
        requiredScopes: ["design:content:write"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
      {
        id: "action_canva_export",
        name: "Export Design Assets",
        description: "Exports the generated visual artifact as an interactive SVG / high-resolution image.",
        requiredScopes: ["design:export"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
    ],
    readCapabilities: ["browse_templates", "inspect_design_elements", "color_palette_sampling"],
    writeCapabilities: ["generate_flyer", "create_slide_deck", "render_svg_banner", "export_bundle"],
  },

  // ==========================================
  // 3. DEVELOPMENT: GITHUB REPOSITORIES
  // ==========================================
  {
    id: "integration_github",
    name: "GitHub Developer Ecosystem",
    provider: "GitHub / Microsoft",
    category: "DEVELOPMENT",
    description: "Inspect repositories, analyze code files, review pull requests, create bugfix branches, and propose safe commits.",
    icon: "GitBranch",
    supportedPlatforms: ["all"],
    authMethod: "oauth2",
    authEndpoint: "https://github.com/login/oauth/authorize",
    version: "3.0.0",
    riskLevel: "high",
    offlineMode: "PARTIALLY_AVAILABLE",
    healthStatus: "NOT_CONFIGURED",
    availability: "CONNECTED",
    isConnected: false,
    handoffSupported: true,
    handoffUrlTemplate: "https://github.com/",
    scopes: [
      {
        id: "repo:read",
        name: "Read Public & Private Repositories",
        description: "Inspect source code, branches, issues, and commit histories.",
        riskLevel: "medium",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "issues:write",
        name: "Manage Issues & Comments",
        description: "Create issue summaries, track milestone tasks, and leave code review comments.",
        riskLevel: "low",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "repo:write",
        name: "Push Branches & Commits",
        description: "Allows committing code changes and opening pull requests. Requires pre-execution diff preview.",
        riskLevel: "high",
        isSensitive: true,
        isGrantedByDefault: false,
      },
    ],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_github_inspect_repo",
        name: "Inspect Repository & Files",
        description: "Read repository tree, dependencies, README, and source files.",
        requiredScopes: ["repo:read"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
      {
        id: "action_github_propose_diff",
        name: "Analyze Code & Propose Diff",
        description: "Identifies bugs, generates refactored TypeScript/Python code, and outputs a unified git diff.",
        requiredScopes: ["repo:read"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
      {
        id: "action_github_create_pr",
        name: "Create Pull Request / Commit",
        description: "Pushes verified changes to a new branch and creates a pull request for review.",
        requiredScopes: ["repo:write"],
        riskLevel: "high",
        reversibility: "PARTIALLY_REVERSIBLE",
        requiresExplicitConfirmation: true,
        offlineCapable: false,
      },
    ],
    readCapabilities: ["read_trees", "read_commits", "diff_branches", "inspect_pull_requests"],
    writeCapabilities: ["create_branch", "open_pull_request", "add_issue_comment"],
  },

  // ==========================================
  // 4. COMMUNICATION: WHATSAPP MESSAGING
  // ==========================================
  {
    id: "integration_whatsapp",
    name: "WhatsApp Communication",
    provider: "Meta / WhatsApp Cloud API",
    category: "COMMUNICATION",
    description: "Draft, verify recipients, and dispatch WhatsApp messages with explicit user review.",
    icon: "MessageCircle",
    supportedPlatforms: ["all"],
    authMethod: "oauth2",
    version: "1.4.0",
    riskLevel: "critical",
    offlineMode: "ONLINE_REQUIRED",
    healthStatus: "NOT_CONFIGURED",
    availability: "CONNECTED",
    isConnected: false,
    handoffSupported: true,
    handoffUrlTemplate: "https://web.whatsapp.com/",
    scopes: [
      {
        id: "whatsapp_business_messaging",
        name: "Send Direct Messages",
        description: "Allows dispatching approved text messages to verified contacts.",
        riskLevel: "critical",
        isSensitive: true,
        isGrantedByDefault: false,
      },
    ],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_whatsapp_draft",
        name: "Draft WhatsApp Message",
        description: "Draft message with appropriate tone, resolve recipient ambiguity, and present preview.",
        requiredScopes: [],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
      {
        id: "action_whatsapp_send",
        name: "Dispatch WhatsApp Message",
        description: "Sends the message to the confirmed recipient contact.",
        requiredScopes: ["whatsapp_business_messaging"],
        riskLevel: "critical",
        reversibility: "IRREVERSIBLE",
        requiresExplicitConfirmation: true,
        offlineCapable: false,
      },
    ],
    readCapabilities: ["resolve_contact_name"],
    writeCapabilities: ["draft_message", "dispatch_direct_message"],
  },

  // ==========================================
  // 5. PRODUCTIVITY & CLOUD STORAGE: GOOGLE DRIVE & DOCS
  // ==========================================
  {
    id: "integration_google_drive",
    name: "Google Drive & Cloud Docs",
    provider: "Google Cloud",
    category: "STORAGE",
    description: "Search documents, read spreadsheets, and export project proposals directly to Google Drive.",
    icon: "HardDrive",
    supportedPlatforms: ["all"],
    authMethod: "oauth2",
    authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    version: "2.0.0",
    riskLevel: "high",
    offlineMode: "PARTIALLY_AVAILABLE",
    healthStatus: "NOT_CONFIGURED",
    availability: "CONNECTED",
    isConnected: false,
    handoffSupported: true,
    handoffUrlTemplate: "https://drive.google.com/drive/my-drive",
    scopes: [
      {
        id: "drive.readonly",
        name: "Search & Read Drive Files",
        description: "Search files, read Google Docs, and inspect spreadsheet tables.",
        riskLevel: "medium",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "drive.file",
        name: "Save & Export Files",
        description: "Create new Google Docs and upload workspace artifacts to Google Drive.",
        riskLevel: "medium",
        isSensitive: false,
        isGrantedByDefault: true,
      },
    ],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_drive_search",
        name: "Search Drive Documents",
        description: "Find files modified recently, query documents by title or topic.",
        requiredScopes: ["drive.readonly"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
      {
        id: "action_drive_export_doc",
        name: "Export Document to Google Drive",
        description: "Uploads report or document directly into Google Drive.",
        requiredScopes: ["drive.file"],
        riskLevel: "medium",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
    ],
    readCapabilities: ["search_files", "extract_doc_text", "read_sheet_rows"],
    writeCapabilities: ["create_google_doc", "upload_file_artifact"],
  },

  // ==========================================
  // 6. CALENDAR: GOOGLE CALENDAR
  // ==========================================
  {
    id: "integration_google_calendar",
    name: "Google Calendar",
    provider: "Google Workspace",
    category: "CALENDAR",
    description: "Check schedule availability, identify meeting conflicts, and create confirmed calendar events.",
    icon: "Calendar",
    supportedPlatforms: ["all"],
    authMethod: "oauth2",
    authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    version: "2.0.0",
    riskLevel: "high",
    offlineMode: "PARTIALLY_AVAILABLE",
    healthStatus: "NOT_CONFIGURED",
    availability: "CONNECTED",
    isConnected: false,
    handoffSupported: true,
    handoffUrlTemplate: "https://calendar.google.com/calendar/u/0/r",
    scopes: [
      {
        id: "calendar.readonly",
        name: "Read Schedule & Events",
        description: "Inspect upcoming agenda and check participant availability.",
        riskLevel: "low",
        isSensitive: false,
        isGrantedByDefault: true,
      },
      {
        id: "calendar.events",
        name: "Create & Update Events",
        description: "Schedule new meetings and invite confirmed attendees.",
        riskLevel: "medium",
        isSensitive: true,
        isGrantedByDefault: false,
      },
    ],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_calendar_check_schedule",
        name: "Check Calendar Schedule",
        description: "Lists upcoming events and identifies open time slots for a given day.",
        requiredScopes: ["calendar.readonly"],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
      {
        id: "action_calendar_create_event",
        name: "Create Calendar Event",
        description: "Schedules meeting with start/end time, description, and attendee invitations.",
        requiredScopes: ["calendar.events"],
        riskLevel: "medium",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: true,
        offlineCapable: false,
      },
    ],
    readCapabilities: ["list_events", "check_free_busy"],
    writeCapabilities: ["create_event", "update_event_time", "delete_event"],
  },

  // ==========================================
  // 7. WEB & BROWSER AGENT
  // ==========================================
  {
    id: "integration_browser_agent",
    name: "Web & Browser Agent",
    provider: "Angel Web Core",
    category: "WEB",
    description: "Read, parse semantic webpage structures, extract structured data, analyze forms, and navigate online resources.",
    icon: "Globe",
    supportedPlatforms: ["all"],
    authMethod: "none",
    version: "1.5.0",
    riskLevel: "low",
    offlineMode: "ONLINE_REQUIRED",
    healthStatus: "HEALTHY",
    availability: "CONNECTED",
    isConnected: true,
    scopes: [],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_web_fetch_page",
        name: "Fetch & Parse Webpage Content",
        description: "Retrieves webpage content, strips boilerplate, and structures text and links.",
        requiredScopes: [],
        riskLevel: "none",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
      {
        id: "action_web_analyze_structure",
        name: "Analyze Semantic Web Structure",
        description: "Extracts buttons, interactive inputs, navigation links, and tabular data from URL.",
        requiredScopes: [],
        riskLevel: "none",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
    ],
    readCapabilities: ["fetch_html_text", "extract_structured_tables", "parse_links"],
    writeCapabilities: ["summarize_page_content", "extract_metadata"],
  },

  // ==========================================
  // 8. CREATIVE MEDIA: CAPCUT VIDEO CONCEPTS
  // ==========================================
  {
    id: "integration_capcut",
    name: "CapCut Video & Media Studio",
    provider: "ByteDance / CapCut",
    category: "MEDIA",
    description: "Plan short-form promotional videos, storyboard scene-by-scene blueprints, and generate timed subtitle captions.",
    icon: "Video",
    supportedPlatforms: ["all"],
    authMethod: "oauth2",
    version: "1.1.0",
    riskLevel: "low",
    offlineMode: "OFFLINE_CAPABLE",
    healthStatus: "NOT_CONFIGURED",
    availability: "CONNECTED",
    isConnected: false,
    handoffSupported: true,
    handoffUrlTemplate: "https://www.capcut.com/editor",
    scopes: [],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_capcut_storyboard",
        name: "Generate Video Storyboard Blueprint",
        description: "Constructs scene-by-scene visual script, pacing guidelines, audio cues, and export blueprint.",
        requiredScopes: [],
        riskLevel: "low",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
    ],
    readCapabilities: ["inspect_media_aspect_ratios"],
    writeCapabilities: ["generate_storyboard_blueprint", "generate_subtitle_srt"],
  },

  // ==========================================
  // 9. TRAVEL & LOCAL GEOGRAPHY: MAPS & PLACES
  // ==========================================
  {
    id: "integration_travel_maps",
    name: "Maps & Local Travel Intelligence",
    provider: "Google Maps & Geographic Services",
    category: "TRAVEL",
    description: "Find nearby businesses, plan multi-stop itineraries, estimate routes, and check travel time zones.",
    icon: "MapPin",
    supportedPlatforms: ["all"],
    authMethod: "none",
    version: "1.2.0",
    riskLevel: "medium",
    offlineMode: "PARTIALLY_AVAILABLE",
    healthStatus: "HEALTHY",
    availability: "CONNECTED",
    isConnected: true,
    scopes: [],
    grantedScopes: [],
    availableActions: [
      {
        id: "action_travel_find_places",
        name: "Discover Nearby Places & Recommendations",
        description: "Searches restaurants, venues, transit hubs, and services with verified ratings and location coordinates.",
        requiredScopes: [],
        riskLevel: "none",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: false,
      },
      {
        id: "action_travel_plan_itinerary",
        name: "Plan Travel Itinerary & Route",
        description: "Creates comprehensive multi-day travel schedule with transit estimates, stops, and points of interest.",
        requiredScopes: [],
        riskLevel: "none",
        reversibility: "REVERSIBLE",
        requiresExplicitConfirmation: false,
        offlineCapable: true,
      },
    ],
    readCapabilities: ["search_places", "calculate_route_etas", "time_zone_lookup"],
    writeCapabilities: ["generate_itinerary_artifact"],
  },
];

export function getIntegrationById(id: string): ExternalIntegration | undefined {
  return ANGEL_INTEGRATION_REGISTRY.find((i) => i.id === id);
}

export function getIntegrationsByCategory(category: IntegrationCategory): ExternalIntegration[] {
  return ANGEL_INTEGRATION_REGISTRY.filter((i) => i.category === category);
}

/**
 * Match user request to appropriate external integration
 */
export function matchIntegrationForIntent(prompt: string): ExternalIntegration | null {
  const p = prompt.toLowerCase();

  // Canva / Design
  if (p.includes("canva") || p.includes("flyer") || p.includes("poster") || p.includes("banner design")) {
    return getIntegrationById("integration_canva") || null;
  }

  // GitHub / Coding
  if (p.includes("github") || p.includes("repository") || p.includes("pull request") || p.includes("commit my code")) {
    return getIntegrationById("integration_github") || null;
  }

  // Gmail / Email
  if (p.includes("gmail") || p.includes("check my email") || p.includes("send an email") || p.includes("email sarah") || p.includes("email daniel")) {
    return getIntegrationById("integration_gmail") || null;
  }

  // WhatsApp
  if (p.includes("whatsapp") || p.includes("message on whatsapp") || p.includes("text daniel on whatsapp")) {
    return getIntegrationById("integration_whatsapp") || null;
  }

  // Google Drive
  if (p.includes("google drive") || p.includes("drive document") || p.includes("find my drive file") || p.includes("upload to drive")) {
    return getIntegrationById("integration_google_drive") || null;
  }

  // Google Calendar
  if (p.includes("calendar") || p.includes("schedule a meeting") || p.includes("check my schedule tomorrow") || p.includes("set up calendar event")) {
    return getIntegrationById("integration_google_calendar") || null;
  }

  // Webpage / Browser
  if (p.includes("open website") || p.includes("read this webpage") || p.includes("inspect url") || p.includes("http://") || p.includes("https://")) {
    return getIntegrationById("integration_browser_agent") || null;
  }

  // CapCut / Video
  if (p.includes("capcut") || p.includes("video script") || p.includes("storyboard") || p.includes("short video")) {
    return getIntegrationById("integration_capcut") || null;
  }

  // Travel / Maps
  if (p.includes("find places near") || p.includes("restaurants near") || p.includes("travel itinerary") || p.includes("plan a route")) {
    return getIntegrationById("integration_travel_maps") || null;
  }

  return null;
}
