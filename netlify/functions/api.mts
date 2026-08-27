import type { Config } from "@netlify/functions";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

async function bodyOf(req: Request): Promise<Record<string, any>> {
  try {
    return (await req.json()) as Record<string, any>;
  } catch {
    return {};
  }
}

export default async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, "") || "/";
  const body = await bodyOf(req);

  try {
    if (req.method === "GET" && path === "/health") {
      return json({ status: "ok", app: "ANGEL", runtime: "netlify-functions", timestamp: new Date().toISOString() });
    }

    if (req.method === "POST" && path === "/chat/generate") {
      const { generateAngelResponse } = await import("../../server/services/geminiService.js");
      if (!Array.isArray(body.messages) || body.messages.length === 0) return json({ error: "Invalid messages payload." }, 400);
      const reply = await generateAngelResponse({ messages: body.messages, intelligenceLevel: body.intelligenceLevel || "standard", contextOptions: body.contextOptions });
      return json({ reply });
    }

    if (req.method === "POST" && path === "/memory/detect-intent") {
      const { detectExplicitMemoryIntent } = await import("../../server/services/memoryExtractor.js");
      return json(detectExplicitMemoryIntent(String(body.text || "")));
    }

    if (req.method === "POST" && path === "/memory/extract-candidates") {
      const { extractImplicitMemories } = await import("../../server/services/memoryExtractor.js");
      return json({ candidates: await extractImplicitMemories(String(body.userText || ""), body.assistantReply) });
    }

    if (req.method === "POST" && path === "/memory/summarize-conversation") {
      const { summarizeConversationHistory } = await import("../../server/services/memoryExtractor.js");
      if (!Array.isArray(body.messages)) return json({ error: "Invalid messages payload." }, 400);
      return json({ summary: await summarizeConversationHistory(body.messages) });
    }

    if (req.method === "POST" && path === "/memory/embed") {
      const { generateTextEmbedding } = await import("../../server/services/memoryExtractor.js");
      return json({ embedding: await generateTextEmbedding(String(body.text || "")) });
    }

    if (req.method === "POST" && path === "/vision/analyze") {
      const { analyzeMultimodalVision } = await import("../../server/services/visionService.js");
      if (!body.imageBase64) return json({ success: false, error: "Missing imageBase64 payload." }, 400);
      return json(await analyzeMultimodalVision({
        imageBase64: body.imageBase64,
        mimeType: body.mimeType,
        sourceType: body.sourceType || "image",
        prompt: body.prompt,
        mode: body.mode || "general",
        intelligenceLevel: body.intelligenceLevel || "standard",
        language: body.language || "en",
      }));
    }

    if (req.method === "POST" && path === "/orchestration/classify") {
      const { classifyUserIntent } = await import("../../server/services/agentOrchestratorService.js");
      return json(await classifyUserIntent(body));
    }

    if (req.method === "POST" && path === "/orchestration/plan") {
      const { generateDynamicPlan } = await import("../../server/services/agentOrchestratorService.js");
      return json({ steps: await generateDynamicPlan(body) });
    }

    if (req.method === "POST" && path === "/orchestration/replan") {
      const { replanTask } = await import("../../server/services/agentOrchestratorService.js");
      return json(await replanTask(body));
    }

    if (req.method === "POST" && path === "/orchestration/verify") {
      const { verifyTaskQuality } = await import("../../server/services/agentOrchestratorService.js");
      return json({ verification: await verifyTaskQuality(body) });
    }

    if (req.method === "POST" && path === "/orchestration/command-intent") {
      const { interpretNaturalCommand } = await import("../../server/services/agentOrchestratorService.js");
      return json(interpretNaturalCommand(String(body.text || "")));
    }

    if (req.method === "POST" && path === "/tools/execute") {
      const { executeServerTool } = await import("../../server/services/toolExecutionService.js");
      return json(await executeServerTool({ toolId: body.toolId, input: body.input || {}, intelligenceLevel: body.intelligenceLevel || "standard", context: body.context || {} }));
    }

    if (req.method === "POST" && path === "/integrations/execute") {
      const { executeUniversalExternalAction } = await import("../../server/services/externalActionService.js");
      return json(await executeUniversalExternalAction({
        integrationId: body.integrationId,
        actionId: body.actionId,
        inputPayload: body.inputPayload || {},
        intelligenceLevel: body.intelligenceLevel || "standard",
        userConfirmationGranted: Boolean(body.userConfirmationGranted),
      }));
    }

    if (req.method === "POST" && path === "/action/classify-and-plan") {
      const { classifyAndConstructActionPlan } = await import("../../server/services/actionEngineService.js");
      return json({ plan: await classifyAndConstructActionPlan(body) });
    }

    if (req.method === "POST" && path === "/action/execute-application") {
      const { executeApplicationControlAction } = await import("../../server/services/actionEngineService.js");
      return json(await executeApplicationControlAction({ applicationId: body.applicationId, action: body.action, payload: body.payload || {} }));
    }

    if (req.method === "GET" && path === "/tools/status") {
      return json({ status: "online", runtime: "netlify-functions", timestamp: new Date().toISOString() });
    }

    if (req.method === "GET" && path === "/vision/status") {
      return json({ status: "online", supportedSources: ["camera", "screen", "image", "document", "diagram", "code", "video", "webpage"], timestamp: new Date().toISOString() });
    }

    if (req.method === "POST" && path === "/intelligence/current-info") {
      const { fetchCurrentWorldInfo } = await import("../../server/services/realtimeIntelligenceService.js");
      return json(await fetchCurrentWorldInfo(body));
    }

    if (req.method === "POST" && path === "/intelligence/briefing") {
      const { generateProactiveBriefing } = await import("../../server/services/realtimeIntelligenceService.js");
      return json({ briefing: await generateProactiveBriefing(body) });
    }

    if (req.method === "GET" && path === "/intelligence/upgrades") {
      const { generateUpgradeProposals } = await import("../../server/services/realtimeIntelligenceService.js");
      return json({ proposals: await generateUpgradeProposals() });
    }

    if (req.method === "POST" && path === "/intelligence/country-profile") {
      const { fetchCountryCulturalProfile } = await import("../../server/services/realtimeIntelligenceService.js");
      return json({ profile: await fetchCountryCulturalProfile(String(body.countryOrCity || "")) });
    }

    if (req.method === "POST" && path === "/intelligence/project-synergy") {
      const { analyzeProjectWorldSynergy } = await import("../../server/services/realtimeIntelligenceService.js");
      return json({ synergy: await analyzeProjectWorldSynergy(body) });
    }

    if (req.method === "POST" && path === "/voice/preview") {
      const { generateVoicePreview } = await import("../../server/services/ttsService.js");
      return json(await generateVoicePreview({ voiceId: body.voiceId || "unique", customText: body.customText, language: body.language }));
    }

    return json({ error: "Angel API route not found.", path }, 404);
  } catch (error: any) {
    console.error("Angel API error", path, error);
    return json({ error: error?.message || "Angel could not complete that operation." }, 500);
  }
};

export const config: Config = {
  path: "/api/*",
};
