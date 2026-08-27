import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer } from "ws";
import { createServer as createViteServer } from "vite";
import { generateAngelResponse, streamAngelResponse, ChatMessagePayload } from "./server/services/geminiService.js";
import { generateVoicePreview } from "./server/services/ttsService.js";
import { setupVoiceLiveWebSocket } from "./server/services/voiceLiveService.js";
import {
  detectExplicitMemoryIntent,
  extractImplicitMemories,
  summarizeConversationHistory,
  generateTextEmbedding,
} from "./server/services/memoryExtractor.js";
import { executeServerTool } from "./server/services/toolExecutionService.js";
import { executeUniversalExternalAction } from "./server/services/externalActionService.js";
import { analyzeMultimodalVision } from "./server/services/visionService.js";
import {
  classifyUserIntent,
  generateDynamicPlan,
  replanTask,
  verifyTaskQuality,
  interpretNaturalCommand,
} from "./server/services/agentOrchestratorService.js";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  app.use(express.json({ limit: "10mb" }));

  // ==========================================
  // API ROUTES
  // ==========================================

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "ANGEL",
      stage: "Stage 3 — Persistent Memory, Personalization & Context Intelligence",
      timestamp: new Date().toISOString(),
    });
  });

  // Non-streaming Angel Chat API
  app.post("/api/chat/generate", async (req, res) => {
    try {
      const { messages, intelligenceLevel, contextOptions } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid messages payload." });
      }

      const reply = await generateAngelResponse({
        messages: messages as ChatMessagePayload[],
        intelligenceLevel,
        contextOptions,
      });

      return res.json({ reply });
    } catch (error: any) {
      console.error("Error in /api/chat/generate:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate Angel response.",
      });
    }
  });

  // Streaming Angel Chat API (Server-Sent Events)
  app.post("/api/chat/stream", async (req, res) => {
    try {
      const { messages, intelligenceLevel, contextOptions } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid messages payload." });
      }

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders?.();

      const stream = streamAngelResponse({
        messages: messages as ChatMessagePayload[],
        intelligenceLevel,
        contextOptions,
      });

      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Error in /api/chat/stream:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Streaming failed." });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || "Streaming error" })}\n\n`);
        res.end();
      }
    }
  });

  // Voice Library Preview API (TTS)
  app.post("/api/voice/preview", async (req, res) => {
    try {
      const { voiceId, customText, language } = req.body;
      const preview = await generateVoicePreview({
        voiceId: voiceId || "unique",
        customText,
        language,
      });

      return res.json(preview);
    } catch (error: any) {
      console.warn("Voice preview notice:", error?.message || error);
      return res.json({
        fallback: true,
        ttfaMs: 20,
        message: "Fallback synthesizer active.",
      });
    }
  });

  // ==========================================
  // STAGE 3 MEMORY & CONTEXT INTELLIGENCE APIS
  // ==========================================

  // Detect explicit memory/forget commands
  app.post("/api/memory/detect-intent", (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.json({ isExplicitCommand: false, action: "none" });
      }
      const result = detectExplicitMemoryIntent(text);
      return res.json(result);
    } catch (err: any) {
      return res.json({ isExplicitCommand: false, action: "none" });
    }
  });

  // Extract implicit candidate memories from conversation turn
  app.post("/api/memory/extract-candidates", async (req, res) => {
    try {
      const { userText, assistantReply } = req.body;
      if (!userText || typeof userText !== "string") {
        return res.json({ candidates: [] });
      }
      const candidates = await extractImplicitMemories(userText, assistantReply);
      return res.json({ candidates });
    } catch (err: any) {
      return res.json({ candidates: [] });
    }
  });

  // Summarize conversation history for long conversations
  app.post("/api/memory/summarize-conversation", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Invalid messages payload." });
      }
      const summary = await summarizeConversationHistory(messages);
      return res.json({ summary });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to summarize" });
    }
  });

  // Generate embedding vector for text
  app.post("/api/memory/embed", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.json({ embedding: [] });
      }
      const embedding = await generateTextEmbedding(text);
      return res.json({ embedding });
    } catch (err: any) {
      return res.json({ embedding: [] });
    }
  });

  // ==========================================
  // STAGE 4 TOOL & CAPABILITY ENGINE APIS
  // ==========================================

  // Execute a server-side tool (Web Search, Deep Research, Documents, Data Analysis, Code, Diagrams)
  app.post("/api/tools/execute", async (req, res) => {
    try {
      const { toolId, input, intelligenceLevel, context } = req.body;
      if (!toolId) {
        return res.status(400).json({ success: false, error: "Missing toolId parameter." });
      }

      const result = await executeServerTool({
        toolId,
        input: input || {},
        intelligenceLevel: intelligenceLevel || "standard",
        context: context || {},
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/tools/execute:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to execute tool.",
      });
    }
  });

  // Tool Engine & Environment status check
  app.get("/api/tools/status", (req, res) => {
    res.json({
      status: "online",
      stage: "Stage 7 — Vision, Screen Awareness, Camera & Multimodal Understanding",
      searchGroundingAvailable: true,
      modelsAvailable: ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"],
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // STAGE 7 MULTIMODAL VISION, CAMERA & SCREEN APIS
  // ==========================================

  // Multimodal Vision & Document Intelligence Analysis
  app.post("/api/vision/analyze", async (req, res) => {
    try {
      const { imageBase64, mimeType, sourceType, prompt, mode, intelligenceLevel, language } = req.body;
      if (!imageBase64 || typeof imageBase64 !== "string") {
        return res.status(400).json({ success: false, error: "Missing imageBase64 payload." });
      }

      const result = await analyzeMultimodalVision({
        imageBase64,
        mimeType,
        sourceType: sourceType || "image",
        prompt,
        mode: mode || "general",
        intelligenceLevel: intelligenceLevel || "standard",
        language: language || "en",
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/vision/analyze:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to analyze multimodal visual content.",
      });
    }
  });

  // Vision Sensor & Environment Capabilities Status
  app.get("/api/vision/status", (req, res) => {
    res.json({
      status: "online",
      supportedSources: ["camera", "screen", "image", "document", "diagram", "code", "video", "webpage"],
      supportedModes: ["general", "ocr", "ui_design", "code_debug", "document_summary", "educational", "chart_analysis"],
      models: ["gemini-2.5-flash", "gemini-3.7-flash", "gemini-flash-latest"],
      maxPayloadSize: "10MB",
      ocrPreservesStructure: true,
      timestamp: new Date().toISOString(),
    });
  });

  // ==========================================
  // STAGE 6 EXTERNAL INTEGRATIONS & UNIVERSAL ACTIONS
  // ==========================================

  // Execute universal external service action
  app.post("/api/integrations/execute", async (req, res) => {
    try {
      const { integrationId, actionId, inputPayload, intelligenceLevel, userConfirmationGranted } = req.body;
      if (!integrationId || !actionId) {
        return res.status(400).json({ error: "Missing integrationId or actionId." });
      }

      const result = await executeUniversalExternalAction({
        integrationId,
        actionId,
        inputPayload: inputPayload || {},
        intelligenceLevel: intelligenceLevel || "standard",
        userConfirmationGranted: !!userConfirmationGranted,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/integrations/execute:", error);
      return res.status(500).json({
        success: false,
        error: error.message || "Failed to execute external integration action.",
      });
    }
  });

  // ==========================================
  // STAGE 5 AGENT ORCHESTRATION & PLANNING APIS
  // ==========================================

  // Classify user intent (Simple Question vs Moderate vs Complex Agent Task)
  app.post("/api/orchestration/classify", async (req, res) => {
    try {
      const { userPrompt, conversationHistory, intelligenceLevel, hasActiveTask } = req.body;
      if (!userPrompt || typeof userPrompt !== "string") {
        return res.status(400).json({ error: "Missing userPrompt parameter." });
      }

      const classification = await classifyUserIntent({
        userPrompt,
        conversationHistory,
        intelligenceLevel,
        hasActiveTask,
      });

      return res.json(classification);
    } catch (error: any) {
      console.error("Error in /api/orchestration/classify:", error);
      return res.status(500).json({
        error: error.message || "Failed to classify intent.",
      });
    }
  });

  // Generate dynamic multi-step plan
  app.post("/api/orchestration/plan", async (req, res) => {
    try {
      const { goal, userPrompt, suggestedSteps, intelligenceLevel, userPreferences } = req.body;
      if (!goal || !userPrompt) {
        return res.status(400).json({ error: "Missing goal or userPrompt parameter." });
      }

      const steps = await generateDynamicPlan({
        goal,
        userPrompt,
        suggestedSteps,
        intelligenceLevel,
        userPreferences,
      });

      return res.json({ steps });
    } catch (error: any) {
      console.error("Error in /api/orchestration/plan:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate dynamic plan.",
      });
    }
  });

  // Replan / Recover on step failure or user steering note
  app.post("/api/orchestration/replan", async (req, res) => {
    try {
      const { task, failedStepId, errorMessage, userSteeringNote } = req.body;
      if (!task) {
        return res.status(400).json({ error: "Missing task parameter." });
      }

      const replanResult = await replanTask({
        task,
        failedStepId,
        errorMessage,
        userSteeringNote,
      });

      return res.json(replanResult);
    } catch (error: any) {
      console.error("Error in /api/orchestration/replan:", error);
      return res.status(500).json({
        error: error.message || "Failed to replan task.",
      });
    }
  });

  // Verify task completion quality
  app.post("/api/orchestration/verify", async (req, res) => {
    try {
      const { task, collectedOutputs, artifacts } = req.body;
      if (!task) {
        return res.status(400).json({ error: "Missing task parameter." });
      }

      const verification = await verifyTaskQuality({
        task,
        collectedOutputs: collectedOutputs || [],
        artifacts: artifacts || [],
      });

      return res.json({ verification });
    } catch (error: any) {
      console.error("Error in /api/orchestration/verify:", error);
      return res.status(500).json({
        error: error.message || "Failed to verify task quality.",
      });
    }
  });

  // Natural Command Intent (Do it, Send it, Stop, Cancel, Go ahead)
  app.post("/api/orchestration/command-intent", (req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.json({ intent: "neutral", isConfirmation: false, isCancellation: false });
      }

      const result = interpretNaturalCommand(text);
      return res.json(result);
    } catch (err: any) {
      return res.json({ intent: "neutral", isConfirmation: false, isCancellation: false });
    }
  });

  // ==========================================
  // STAGE 8 REAL-TIME CONTINUOUS INTELLIGENCE APIS
  // ==========================================

  // Live Grounded Research & Current World Knowledge
  app.post("/api/intelligence/current-info", async (req, res) => {
    try {
      const { topic, category, userInterests, userLocation, intelligenceLevel } = req.body;
      if (!topic || typeof topic !== "string") {
        return res.status(400).json({ error: "Missing topic parameter." });
      }

      const { fetchCurrentWorldInfo } = await import("./server/services/realtimeIntelligenceService.js");
      const result = await fetchCurrentWorldInfo({
        topic,
        category,
        userInterests,
        userLocation,
        intelligenceLevel,
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/intelligence/current-info:", error);
      return res.status(500).json({
        error: error.message || "Failed to fetch current world information.",
      });
    }
  });

  // Proactive Briefing Generator (Morning / Evening / On-Demand)
  app.post("/api/intelligence/briefing", async (req, res) => {
    try {
      const { briefingType, userName, preferredName, userInterests, activeProjects, location, intelligenceLevel } = req.body;
      const { generateProactiveBriefing } = await import("./server/services/realtimeIntelligenceService.js");
      const briefing = await generateProactiveBriefing({
        briefingType: briefingType || "on_demand",
        userName,
        preferredName,
        userInterests,
        activeProjects,
        location,
        intelligenceLevel,
      });

      return res.json({ briefing });
    } catch (error: any) {
      console.error("Error in /api/intelligence/briefing:", error);
      return res.status(500).json({
        error: error.message || "Failed to generate proactive briefing.",
      });
    }
  });

  // System Self-Improvement & Upgrade Proposals
  app.get("/api/intelligence/upgrades", async (req, res) => {
    try {
      const { generateUpgradeProposals } = await import("./server/services/realtimeIntelligenceService.js");
      const proposals = await generateUpgradeProposals();
      return res.json({ proposals });
    } catch (error: any) {
      console.error("Error in /api/intelligence/upgrades:", error);
      return res.status(500).json({
        error: error.message || "Failed to load upgrade proposals.",
      });
    }
  });

  // Stage 9: Country, City & Cultural Profile
  app.post("/api/intelligence/country-profile", async (req, res) => {
    try {
      const { countryOrCity } = req.body;
      if (!countryOrCity || typeof countryOrCity !== "string") {
        return res.status(400).json({ error: "Missing countryOrCity parameter." });
      }

      const { fetchCountryCulturalProfile } = await import("./server/services/realtimeIntelligenceService.js");
      const profile = await fetchCountryCulturalProfile(countryOrCity);
      return res.json({ profile });
    } catch (error: any) {
      console.error("Error in /api/intelligence/country-profile:", error);
      return res.status(500).json({
        error: error.message || "Failed to fetch cultural profile.",
      });
    }
  });

  // Stage 9: Project & World Ecosystem Synergy Analysis
  app.post("/api/intelligence/project-synergy", async (req, res) => {
    try {
      const { projectName, projectDescription, technologies } = req.body;
      if (!projectName) {
        return res.status(400).json({ error: "Missing projectName parameter." });
      }

      const { analyzeProjectWorldSynergy } = await import("./server/services/realtimeIntelligenceService.js");
      const synergy = await analyzeProjectWorldSynergy({
        projectName,
        projectDescription,
        technologies,
      });
      return res.json({ synergy });
    } catch (error: any) {
      console.error("Error in /api/intelligence/project-synergy:", error);
      return res.status(500).json({
        error: error.message || "Failed to analyze project ecosystem synergy.",
      });
    }
  });

  // ==========================================
  // STAGE 10 UNIVERSAL ACTION ENGINE APIS
  // ==========================================

  // Classify request & construct a user-facing Action Plan ("WHAT I'M ABOUT TO DO")
  app.post("/api/action/classify-and-plan", async (req, res) => {
    try {
      const { userPrompt, conversationHistory, deviceContext, connectedApps, intelligenceLevel } = req.body;
      if (!userPrompt || typeof userPrompt !== "string") {
        return res.status(400).json({ error: "Missing userPrompt parameter." });
      }

      const { classifyAndConstructActionPlan } = await import("./server/services/actionEngineService.js");
      const plan = await classifyAndConstructActionPlan({
        userPrompt,
        conversationHistory,
        deviceContext,
        connectedApps,
        intelligenceLevel,
      });

      return res.json({ plan });
    } catch (error: any) {
      console.error("Error in /api/action/classify-and-plan:", error);
      return res.status(500).json({
        error: error.message || "Failed to classify and plan action.",
      });
    }
  });

  // Execute application control action (WhatsApp, Canva, CapCut, GitHub, Google Drive)
  app.post("/api/action/execute-application", async (req, res) => {
    try {
      const { applicationId, action, payload } = req.body;
      if (!applicationId || !action) {
        return res.status(400).json({ error: "Missing applicationId or action parameter." });
      }

      const { executeApplicationControlAction } = await import("./server/services/actionEngineService.js");
      const result = await executeApplicationControlAction({
        applicationId,
        action,
        payload: payload || {},
      });

      return res.json(result);
    } catch (error: any) {
      console.error("Error in /api/action/execute-application:", error);
      return res.status(500).json({
        error: error.message || "Failed to execute application action.",
      });
    }
  });

  // ==========================================
  // WEBSOCKET SERVER FOR GEMINI LIVE VOICE
  // ==========================================

  const wss = new WebSocketServer({ server, path: "/api/voice/live" });
  wss.on("error", (err) => {
    console.warn("[Server] WebSocket Server error:", err?.message || err);
  });
  setupVoiceLiveWebSocket(wss);

  server.on("error", (err) => {
    console.error("[Server] HTTP Server error:", err?.message || err);
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ANGEL Server is active and listening on http://0.0.0.0:${PORT} (HTTP & WebSockets)`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start Angel server:", err);
  process.exit(1);
});
