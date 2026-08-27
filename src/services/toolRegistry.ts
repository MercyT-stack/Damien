import { ToolMetadata, ToolCategory, ConnectedService } from "../types/toolTypes";

/**
 * MASTER TOOL REGISTRY FOR ANGEL
 * Stage 4 Capability, Tool & Integration Ecosystem
 */

export const ANGEL_TOOL_REGISTRY: ToolMetadata[] = [
  // ==========================================
  // A. INFORMATION & RESEARCH
  // ==========================================
  {
    id: "tool_web_search",
    name: "Web Search & Current Information",
    description: "Search the live web for real-time news, current events, official documentation, articles, and fact-checking.",
    category: "information",
    icon: "Globe",
    riskLevel: "none",
    requiresConfirmation: false,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.2.0",
    capabilities: ["web_search", "current_news", "fact_checking", "source_retrieval"],
    inputSchema: {
      query: { type: "string", description: "Search query string" },
      numResults: { type: "number", description: "Number of search results to return" },
    },
  },
  {
    id: "tool_deep_research",
    name: "Deep Research Synthesis",
    description: "Conduct multi-source deep research, cross-reference credible publications, and synthesize comprehensive analytical reports.",
    category: "information",
    icon: "BookOpen",
    riskLevel: "low",
    requiresConfirmation: false,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.1.0",
    capabilities: ["multi_source_research", "cross_referencing", "citation_generation", "analytical_synthesis"],
    inputSchema: {
      topic: { type: "string", description: "Research topic or problem" },
      depth: { type: "string", enum: ["quick", "standard", "deep", "pro"], description: "Intelligence depth" },
    },
  },

  // ==========================================
  // B. FILES & EXTRACTION
  // ==========================================
  {
    id: "tool_file_reader",
    name: "File Reader & Content Extraction",
    description: "Read, parse, extract text and structural data from uploaded documents, PDFs, DOCX, CSV, and code files.",
    category: "files",
    icon: "FileText",
    riskLevel: "none",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["pdf_extraction", "docx_parsing", "csv_reading", "code_inspection"],
  },
  {
    id: "tool_file_transform",
    name: "File Transformation & Conversion",
    description: "Transform file formats, summarize long-form documents, and convert structured data.",
    category: "files",
    icon: "RefreshCw",
    riskLevel: "low",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["file_summarization", "format_conversion", "data_structuring"],
  },

  // ==========================================
  // C. DOCUMENTS & CREATION
  // ==========================================
  {
    id: "tool_document_creator",
    name: "Document & Report Generator",
    description: "Generate structured, professional documents, executive reports, project proposals, letters, and briefs with formatting.",
    category: "documents",
    icon: "FileCheck",
    riskLevel: "none",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.2.0",
    capabilities: ["report_generation", "proposal_writing", "letter_drafting", "markdown_export"],
  },
  {
    id: "tool_presentation_builder",
    name: "Presentation Slide Architect",
    description: "Draft, outline, and structure multi-slide executive presentations with bullet points, visuals, and presenter notes.",
    category: "documents",
    icon: "Presentation",
    riskLevel: "low",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["slide_outlines", "deck_structuring", "speaker_notes"],
  },

  // ==========================================
  // D. DATA & SPREADSHEETS
  // ==========================================
  {
    id: "tool_spreadsheet_analyst",
    name: "Data Analyst & Spreadsheet Engine",
    description: "Analyze tabular CSV/Excel data, calculate statistics, detect trends, and output interactive data tables and charts.",
    category: "data",
    icon: "Table",
    riskLevel: "none",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.1.0",
    capabilities: ["csv_analytics", "trend_detection", "chart_generation", "tabular_calculations"],
  },

  // ==========================================
  // E. CREATIVE & DIAGRAMS
  // ==========================================
  {
    id: "tool_diagram_creator",
    name: "Architecture & Flowchart Visualizer",
    description: "Generate clear architectural diagrams, flowcharts, mind maps, and entity relationship diagrams.",
    category: "creative",
    icon: "Network",
    riskLevel: "none",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["svg_generation", "mermaid_diagrams", "system_architecture", "flowcharts"],
  },
  {
    id: "tool_image_creator",
    name: "Image & Visual Asset Studio",
    description: "Generate creative imagery, concepts, illustrations, and UI mockups from descriptive prompts.",
    category: "creative",
    icon: "Sparkles",
    riskLevel: "low",
    requiresConfirmation: false,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["image_generation", "visual_concepts", "ui_mockups"],
  },

  // ==========================================
  // F. CODING & WORKSPACE
  // ==========================================
  {
    id: "tool_code_workspace",
    name: "Coding Workspace & Sandbox",
    description: "Write, analyze, debug, refactor code, verify syntax, and provide sandboxed interactive HTML/JS previews.",
    category: "coding",
    icon: "Code2",
    riskLevel: "low",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.3.0",
    capabilities: ["code_generation", "code_review", "syntax_debugging", "sandboxed_preview"],
  },

  // ==========================================
  // G. COMMUNICATION
  // ==========================================
  {
    id: "tool_communication_drafter",
    name: "Communication & Email Drafter",
    description: "Draft poised emails, announcement messages, and replies tailored to target tone and recipient context.",
    category: "communication",
    icon: "Mail",
    riskLevel: "low",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["email_drafting", "message_crafting", "tone_adjustment"],
  },
  {
    id: "tool_send_communication",
    name: "Live Email & Message Dispatch",
    description: "Send emails or dispatch messages through connected accounts. Strictly requires explicit user confirmation.",
    category: "communication",
    icon: "Send",
    riskLevel: "high",
    requiresConfirmation: true,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "needs_auth",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["email_sending", "message_dispatch"],
  },

  // ==========================================
  // H. PRODUCTIVITY & TASKS
  // ==========================================
  {
    id: "tool_task_planner",
    name: "Task & Project Planner",
    description: "Decompose complex requests into structured milestone checklists, schedule action items, and track completion.",
    category: "productivity",
    icon: "CheckSquare",
    riskLevel: "none",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.1.0",
    capabilities: ["task_breakdown", "milestone_tracking", "action_item_scheduling"],
  },

  // ==========================================
  // I. CONNECTED SERVICES & INTEGRATIONS
  // ==========================================
  {
    id: "tool_canva_integration",
    name: "Canva Design Platform",
    description: "Connect to Canva workspace to inspect design templates, generate flyers, graphics, and export visual assets.",
    category: "integrations",
    icon: "Palette",
    riskLevel: "medium",
    requiresConfirmation: true,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "not_connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["canva_templates", "design_export", "flyer_generation"],
    authRequirements: ["canva_oauth_token"],
  },
  {
    id: "tool_github_integration",
    name: "GitHub Repositories",
    description: "Browse repositories, inspect pull requests, read issues, review code commits, and propose branches.",
    category: "integrations",
    icon: "GitBranch",
    riskLevel: "medium",
    requiresConfirmation: true,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "not_connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["repo_browsing", "issue_inspection", "pr_review", "commit_proposals"],
    authRequirements: ["github_token"],
  },
  {
    id: "tool_google_workspace",
    name: "Google Workspace (Drive, Docs, Calendar, Gmail)",
    description: "Access Google Drive documents, sync calendar schedules, and organize workspace spreadsheets with granular permissions.",
    category: "integrations",
    icon: "HardDrive",
    riskLevel: "high",
    requiresConfirmation: true,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "not_connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["google_drive_read", "google_calendar_sync", "google_docs_export"],
    authRequirements: ["google_oauth_token"],
  },
  {
    id: "tool_microsoft_365",
    name: "Microsoft 365 (OneDrive, Word, Excel, Outlook)",
    description: "Interact with OneDrive storage, Office 365 documents, Excel workbooks, and Outlook calendar events.",
    category: "integrations",
    icon: "Layers",
    riskLevel: "high",
    requiresConfirmation: true,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "not_connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["onedrive_read", "excel_sync", "word_export"],
    authRequirements: ["ms_graph_token"],
  },
  {
    id: "tool_capcut_media",
    name: "CapCut & Media Concepts",
    description: "Plan video concepts, script storyboards, generate captions, and export media asset blueprints.",
    category: "integrations",
    icon: "Video",
    riskLevel: "medium",
    requiresConfirmation: true,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "not_connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["video_concepts", "storyboard_scripting", "caption_generation"],
  },
  {
    id: "tool_whatsapp_messaging",
    name: "WhatsApp Communication",
    description: "Draft and dispatch WhatsApp messages with explicit user approval and verified recipient confirmation.",
    category: "integrations",
    icon: "MessageCircle",
    riskLevel: "high",
    requiresConfirmation: true,
    offlineAvailability: "online",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "not_connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["whatsapp_draft", "whatsapp_send"],
  },

  // ==========================================
  // J. LOCATION & SENSORY
  // ==========================================
  {
    id: "tool_location_services",
    name: "Location & Geographic Intelligence",
    description: "Retrieve local context, nearby establishments, time zones, weather context, and spatial recommendations with user consent.",
    category: "location",
    icon: "MapPin",
    riskLevel: "medium",
    requiresConfirmation: true,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.0.0",
    capabilities: ["geolocation", "local_places", "weather_context"],
  },
  {
    id: "tool_vision_analyzer",
    name: "Vision & Visual Understanding",
    description: "Analyze uploaded pictures, webcam frames, document photos, screenshots, and visual errors.",
    category: "vision",
    icon: "Camera",
    riskLevel: "low",
    requiresConfirmation: false,
    offlineAvailability: "both",
    supportedPlatforms: ["web", "mobile", "desktop"],
    connectionStatus: "connected",
    isEnabled: true,
    version: "1.2.0",
    capabilities: ["image_ocr", "object_recognition", "screenshot_debugging", "diagram_reading"],
  },
];

/**
 * DEFAULT INTEGRATIONS CATALOG
 */
export const DEFAULT_CONNECTED_SERVICES: ConnectedService[] = [
  {
    id: "service_google_workspace",
    name: "Google Workspace",
    provider: "Google Cloud",
    category: "integrations",
    description: "Google Drive, Docs, Sheets, Calendar, and Gmail",
    icon: "HardDrive",
    status: "not_connected",
    scopes: ["drive.readonly", "calendar.events", "gmail.compose"],
    grantedScopes: [],
    accessType: "none",
    requiresOAuth: true,
    notes: "Requires Google OAuth authorization for cloud file and calendar access.",
  },
  {
    id: "service_microsoft_365",
    name: "Microsoft 365",
    provider: "Microsoft Graph",
    category: "integrations",
    description: "OneDrive, Word, Excel, Outlook, and Teams",
    icon: "Layers",
    status: "not_connected",
    scopes: ["Files.Read", "Calendars.ReadWrite", "Mail.Send"],
    grantedScopes: [],
    accessType: "none",
    requiresOAuth: true,
    notes: "Requires Microsoft Graph authentication for OneDrive and Outlook.",
  },
  {
    id: "service_github",
    name: "GitHub",
    provider: "GitHub",
    category: "integrations",
    description: "Repository access, issues, pull requests, and commit review",
    icon: "GitBranch",
    status: "not_connected",
    scopes: ["repo:read", "issues:write"],
    grantedScopes: [],
    accessType: "none",
    requiresOAuth: true,
    notes: "Connect your GitHub account or Personal Access Token.",
  },
  {
    id: "service_canva",
    name: "Canva",
    provider: "Canva Design Platform",
    category: "integrations",
    description: "Design flyers, presentations, social banners, and brand graphics",
    icon: "Palette",
    status: "not_connected",
    scopes: ["design:content:read", "design:content:write"],
    grantedScopes: [],
    accessType: "none",
    requiresOAuth: true,
    notes: "Connect your Canva account to create and export live designs.",
  },
  {
    id: "service_capcut",
    name: "CapCut Media",
    provider: "ByteDance / CapCut",
    category: "integrations",
    description: "Video conceptualization, subtitles, storyboards, and export blueprints",
    icon: "Video",
    status: "not_connected",
    scopes: ["media.read", "video.export"],
    grantedScopes: [],
    accessType: "none",
    requiresOAuth: true,
    notes: "Media integration framework ready for API token connection.",
  },
  {
    id: "service_whatsapp",
    name: "WhatsApp",
    provider: "Meta WhatsApp Business",
    category: "integrations",
    description: "Secure communication drafting and recipient messaging",
    icon: "MessageCircle",
    status: "not_connected",
    scopes: ["whatsapp_business_messaging"],
    grantedScopes: [],
    accessType: "none",
    requiresOAuth: true,
    notes: "Requires WhatsApp Cloud API credentials and user confirmation.",
  },
];

/**
 * Helper: Find tool by ID
 */
export function getToolById(toolId: string): ToolMetadata | undefined {
  return ANGEL_TOOL_REGISTRY.find((t) => t.id === toolId);
}

/**
 * Helper: Get tools by category
 */
export function getToolsByCategory(category: ToolCategory): ToolMetadata[] {
  return ANGEL_TOOL_REGISTRY.filter((t) => t.category === category);
}

/**
 * Helper: Match user intent to recommended tools
 */
export function detectRecommendedTools(userPrompt: string): ToolMetadata[] {
  const lower = userPrompt.toLowerCase().trim();
  const matched: ToolMetadata[] = [];

  const add = (id: string) => {
    const tool = getToolById(id);
    if (tool && !matched.some((m) => m.id === id)) {
      matched.push(tool);
    }
  };

  // 1. Web Search & News
  if (
    lower.includes("search") ||
    lower.includes("news") ||
    lower.includes("today") ||
    lower.includes("latest") ||
    lower.includes("current") ||
    lower.includes("what happened") ||
    lower.includes("stock price") ||
    lower.includes("weather in") ||
    lower.includes("who won")
  ) {
    add("tool_web_search");
  }

  // 2. Deep Research
  if (
    lower.includes("research") ||
    lower.includes("compare sources") ||
    lower.includes("comprehensive study") ||
    lower.includes("in-depth analysis") ||
    lower.includes("market analysis")
  ) {
    add("tool_deep_research");
    add("tool_web_search");
  }

  // 3. Document / Report Creation
  if (
    lower.includes("create a document") ||
    lower.includes("write a report") ||
    lower.includes("draft a proposal") ||
    lower.includes("write an executive summary") ||
    lower.includes("format this document") ||
    lower.includes("create a brief") ||
    lower.includes("business plan")
  ) {
    add("tool_document_creator");
  }

  // 4. Presentations
  if (
    lower.includes("presentation") ||
    lower.includes("slide deck") ||
    lower.includes("powerpoint") ||
    lower.includes("pitch deck") ||
    lower.includes("slides for")
  ) {
    add("tool_presentation_builder");
    add("tool_document_creator");
  }

  // 5. Spreadsheets / CSV Data
  if (
    lower.includes("spreadsheet") ||
    lower.includes("excel") ||
    lower.includes("csv") ||
    lower.includes("calculate") ||
    lower.includes("table of") ||
    lower.includes("data analysis") ||
    lower.includes("metrics")
  ) {
    add("tool_spreadsheet_analyst");
  }

  // 6. Coding / Programming
  if (
    lower.includes("code") ||
    lower.includes("function") ||
    lower.includes("react") ||
    lower.includes("typescript") ||
    lower.includes("javascript") ||
    lower.includes("python") ||
    lower.includes("debug") ||
    lower.includes("refactor") ||
    lower.includes("fix error") ||
    lower.includes("html") ||
    lower.includes("css") ||
    lower.includes("api endpoint")
  ) {
    add("tool_code_workspace");
  }

  // 7. Diagrams / Flowcharts
  if (
    lower.includes("diagram") ||
    lower.includes("flowchart") ||
    lower.includes("architecture diagram") ||
    lower.includes("mind map") ||
    lower.includes("workflow")
  ) {
    add("tool_diagram_creator");
  }

  // 8. Visual / Design / Canva
  if (
    lower.includes("flyer") ||
    lower.includes("poster") ||
    lower.includes("banner") ||
    lower.includes("canva") ||
    lower.includes("graphic design")
  ) {
    add("tool_canva_integration");
    add("tool_diagram_creator");
  }

  // 9. GitHub
  if (
    lower.includes("github") ||
    lower.includes("repository") ||
    lower.includes("pull request") ||
    lower.includes("git branch")
  ) {
    add("tool_github_integration");
    add("tool_code_workspace");
  }

  // 10. Email / Communication
  if (
    lower.includes("draft an email") ||
    lower.includes("write an email") ||
    lower.includes("send message") ||
    lower.includes("reply to email")
  ) {
    add("tool_communication_drafter");
  }

  return matched;
}
