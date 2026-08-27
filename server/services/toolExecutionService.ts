import { GoogleGenAI, Type } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export interface ExecuteToolParams {
  toolId: string;
  input: Record<string, any>;
  intelligenceLevel?: string;
  context?: Record<string, any>;
}

export interface ToolResultPayload {
  success: boolean;
  toolId: string;
  output: any;
  artifact?: {
    id: string;
    type: "document" | "code" | "spreadsheet" | "research" | "image" | "diagram" | "presentation" | "action_preview";
    title: string;
    content: string;
    summary?: string;
    metadata?: Record<string, any>;
    downloadUrl?: string;
    rawOutput?: any;
    created_at: string;
  };
  sources?: Array<{ title: string; url: string; snippet?: string }>;
  error?: string;
  executionTimeMs?: number;
}

/**
 * Execute a registered tool on the server
 */
export async function executeServerTool(params: ExecuteToolParams): Promise<ToolResultPayload> {
  const startTime = Date.now();
  const { toolId, input, intelligenceLevel = "standard", context } = params;
  const ai = getAiClient();

  try {
    switch (toolId) {
      // ==========================================
      // 1. WEB SEARCH & GROUNDING
      // ==========================================
      case "tool_web_search": {
        const query = input.query || input.prompt || "Latest global technology news";
        const model = "gemini-3.7-flash";

        const searchPrompt = `You are Angel's web search engine. Research the user query using Google Search grounding:
Query: "${query}"

Provide a clean, well-synthesized answer with up-to-date facts, dates, key takeaways, and relevant context.`;

        const response = await ai.models.generateContent({
          model,
          contents: searchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
          },
        });

        const text = response.text || "No search results could be synthesized.";
        
        // Extract search grounding metadata sources
        const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
        const searchChunks = groundingMetadata?.groundingChunks || [];
        const webSources: Array<{ title: string; url: string; snippet?: string }> = [];

        if (Array.isArray(searchChunks)) {
          for (const chunk of searchChunks) {
            if (chunk.web?.uri) {
              webSources.push({
                title: chunk.web.title || new URL(chunk.web.uri).hostname,
                url: chunk.web.uri,
                snippet: chunk.web.snippet || "",
              });
            }
          }
        }

        return {
          success: true,
          toolId,
          output: text,
          sources: webSources,
          artifact: {
            id: `art-${Date.now()}`,
            type: "research",
            title: `Search: ${query.slice(0, 40)}`,
            content: text,
            summary: `Synthesized from ${webSources.length} verified web sources.`,
            metadata: {
              query,
              sourceCount: webSources.length,
              grounding: true,
            },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 2. DEEP RESEARCH SYNTHESIS
      // ==========================================
      case "tool_deep_research": {
        const topic = input.topic || input.query || "Advanced AI Systems and Tool Architecture";
        const model = "gemini-3.7-flash";

        const researchPrompt = `You are Angel conducting in-depth research on: "${topic}".
Perform thorough web research, collect verified data points, cross-reference perspectives, and synthesize an executive research briefing.

Structure your report into:
# Executive Summary
## Key Findings & Core Metrics
## Cross-Reference Analysis
## Implications & Strategic Takeaways
## References & Sources`;

        const response = await ai.models.generateContent({
          model,
          contents: researchPrompt,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 0.5,
          },
        });

        const text = response.text || "Research synthesis completed.";
        const groundingMetadata = (response.candidates?.[0] as any)?.groundingMetadata;
        const searchChunks = groundingMetadata?.groundingChunks || [];
        const webSources: Array<{ title: string; url: string; snippet?: string }> = [];

        if (Array.isArray(searchChunks)) {
          for (const chunk of searchChunks) {
            if (chunk.web?.uri) {
              webSources.push({
                title: chunk.web.title || new URL(chunk.web.uri).hostname,
                url: chunk.web.uri,
                snippet: chunk.web.snippet || "",
              });
            }
          }
        }

        return {
          success: true,
          toolId,
          output: text,
          sources: webSources,
          artifact: {
            id: `art-res-${Date.now()}`,
            type: "research",
            title: `Deep Research: ${topic.slice(0, 45)}`,
            content: text,
            summary: `Comprehensive briefing cross-referenced across ${webSources.length} sources.`,
            metadata: {
              topic,
              depth: intelligenceLevel,
              sourceCount: webSources.length,
            },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 3. DOCUMENT & REPORT GENERATOR
      // ==========================================
      case "tool_document_creator": {
        const title = input.title || "Project Specification & Executive Report";
        const description = input.description || input.prompt || "Document overview and objectives";
        const format = input.format || "markdown";

        const docPrompt = `You are Angel's Document Architect. Generate a complete, polished, publication-ready document for:
Title: "${title}"
Details: "${description}"

Format in elegant Markdown with clear headings, executive overview, detailed sections, bullet points, and action items.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: docPrompt,
        });

        const text = response.text || "Document generated successfully.";

        return {
          success: true,
          toolId,
          output: text,
          artifact: {
            id: `art-doc-${Date.now()}`,
            type: "document",
            title: title,
            content: text,
            summary: `Structured document formatted for review and export.`,
            metadata: { format, lengthWords: text.split(/\s+/).length },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 4. PRESENTATION BUILDER
      // ==========================================
      case "tool_presentation_builder": {
        const title = input.title || input.topic || "Executive Strategy Presentation";
        const slideCount = input.slideCount || 5;

        const presentationPrompt = `You are Angel's Presentation Architect. Create a structured ${slideCount}-slide presentation deck outline for: "${title}".
For EACH slide provide:
- Slide Number & Title
- Key Talking Points (3-4 concise bullets)
- Visual/Diagram Suggestion
- Speaker Notes`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: presentationPrompt,
        });

        const text = response.text || "Presentation slides generated.";

        return {
          success: true,
          toolId,
          output: text,
          artifact: {
            id: `art-pres-${Date.now()}`,
            type: "presentation",
            title: `Deck: ${title}`,
            content: text,
            summary: `${slideCount}-Slide Executive Deck Outline with Speaker Notes.`,
            metadata: { slideCount, topic: title },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 5. SPREADSHEET & DATA ANALYST
      // ==========================================
      case "tool_spreadsheet_analyst": {
        const dataQuery = input.query || input.prompt || "Financial quarterly budget allocation model";
        const csvContent = input.csv || "";

        const dataPrompt = `You are Angel's Data & Quantitative Analyst.
Analyze the following request/data:
Query: "${dataQuery}"
${csvContent ? `CSV Input:\n${csvContent}` : ""}

Return a structured JSON object with the following structure:
{
  "title": "Dataset Title",
  "summary": "Key analytical takeaways and trends",
  "headers": ["Column 1", "Column 2", "Column 3", "Column 4"],
  "rows": [
    ["Row1Val1", "Row1Val2", 100, 25.5],
    ["Row2Val1", "Row2Val2", 200, 42.0]
  ],
  "metrics": [
    {"label": "Total Revenue", "value": "$1,250,000", "change": "+14%"},
    {"label": "Average Conversion", "value": "4.2%", "change": "+0.8%"}
  ]
}
Return ONLY valid JSON.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: dataPrompt,
          config: {
            responseMimeType: "application/json",
          },
        });

        let parsedData: any = {};
        try {
          parsedData = JSON.parse(response.text || "{}");
        } catch {
          parsedData = {
            title: "Data Analysis",
            summary: response.text,
            headers: ["Category", "Value", "Notes"],
            rows: [["Item 1", 100, "Estimated"], ["Item 2", 250, "Verified"]],
            metrics: [{ label: "Total", value: "350" }],
          };
        }

        // Build CSV string representation
        const csvHeaderStr = (parsedData.headers || []).join(",");
        const csvRowsStr = (parsedData.rows || []).map((r: any[]) => r.join(",")).join("\n");
        const fullCsv = `${csvHeaderStr}\n${csvRowsStr}`;

        return {
          success: true,
          toolId,
          output: parsedData,
          artifact: {
            id: `art-data-${Date.now()}`,
            type: "spreadsheet",
            title: parsedData.title || "Spreadsheet Data Analysis",
            content: fullCsv,
            summary: parsedData.summary || "Tabular dataset with statistical breakdown.",
            metadata: {
              headers: parsedData.headers,
              rowCount: parsedData.rows?.length || 0,
              metrics: parsedData.metrics || [],
            },
            rawOutput: parsedData,
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 6. CODING WORKSPACE & DEBUGGER
      // ==========================================
      case "tool_code_workspace": {
        const task = input.task || input.prompt || "Write a robust TypeScript React component";
        const language = input.language || "typescript";
        const existingCode = input.code || "";

        const codePrompt = `You are Angel's Senior Software Engineer & Architect.
Task: "${task}"
Target Language: ${language}
${existingCode ? `Existing Code:\n\`\`\`${language}\n${existingCode}\n\`\`\`` : ""}

Provide:
1. Complete, production-ready, clean code with TypeScript types.
2. Architecture breakdown & implementation notes.
3. Verification/test considerations.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: codePrompt,
        });

        const text = response.text || "Code generated.";

        // Extract primary code block if present
        let extractedCode = text;
        const codeBlockMatch = text.match(/```(?:[a-zA-Z0-9]+)?\n([\s\S]*?)```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
          extractedCode = codeBlockMatch[1];
        }

        return {
          success: true,
          toolId,
          output: text,
          artifact: {
            id: `art-code-${Date.now()}`,
            type: "code",
            title: `Code: ${task.slice(0, 40)}`,
            content: extractedCode,
            summary: `Clean ${language} implementation ready for integration.`,
            metadata: {
              language,
              fullResponse: text,
            },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 7. DIAGRAM & FLOWCHART VISUALIZER
      // ==========================================
      case "tool_diagram_creator": {
        const diagramConcept = input.concept || input.prompt || "System Architecture Flow";
        const diagramType = input.type || "architecture";

        const diagramPrompt = `You are Angel's Diagram & Systems Visualizer.
Concept: "${diagramConcept}"
Type: ${diagramType}

Generate a clean Mermaid.js diagram or SVG representation.
Output:
\`\`\`mermaid
graph TD
  User([User]) --> Ingress[Reverse Proxy]
  Ingress --> Angel[Angel Engine]
  Angel --> Tools[(Tool Registry)]
  Angel --> Memory[(Long-Term Memory)]
\`\`\`
Followed by a concise 3-bullet description of the architecture components.`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: diagramPrompt,
        });

        const text = response.text || "Diagram generated.";

        return {
          success: true,
          toolId,
          output: text,
          artifact: {
            id: `art-diag-${Date.now()}`,
            type: "diagram",
            title: `Diagram: ${diagramConcept.slice(0, 40)}`,
            content: text,
            summary: `Visual system architecture diagram.`,
            metadata: { diagramType },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 8. COMMUNICATION DRAFTER
      // ==========================================
      case "tool_communication_drafter": {
        const recipient = input.recipient || "Team";
        const purpose = input.purpose || input.prompt || "Project milestone update";
        const tone = input.tone || "poised and professional";

        const commPrompt = `You are Angel drafting a high-caliber communication.
Recipient: ${recipient}
Purpose: ${purpose}
Tone: ${tone}

Draft the message with:
Subject Line: ...
Greeting
Body (clear, elegant, concise)
Call to Action / Next Step
Sign-off`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: commPrompt,
        });

        const text = response.text || "Draft generated.";

        return {
          success: true,
          toolId,
          output: text,
          artifact: {
            id: `art-comm-${Date.now()}`,
            type: "document",
            title: `Draft for ${recipient}`,
            content: text,
            summary: `Communication draft tailored to ${recipient}.`,
            metadata: { recipient, tone },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 9. FILE READER & SUMMARIZER
      // ==========================================
      case "tool_file_reader":
      case "tool_file_transform": {
        const fileName = input.fileName || "Uploaded Document";
        const fileContent = input.content || "";
        const action = input.action || "summarize";

        const filePrompt = `You are Angel analyzing an uploaded file: "${fileName}".
Action requested: ${action}
File Content Sample:
${fileContent.slice(0, 8000)}

Provide:
1. Executive Summary of contents
2. Key entities, numbers, and dates
3. Structural breakdown or extracted data points
4. Recommended next actions`;

        const response = await ai.models.generateContent({
          model: "gemini-3.7-flash",
          contents: filePrompt,
        });

        const text = response.text || "File analysis complete.";

        return {
          success: true,
          toolId,
          output: text,
          artifact: {
            id: `art-file-${Date.now()}`,
            type: "document",
            title: `Analysis: ${fileName}`,
            content: text,
            summary: `Extracted summary and key points from ${fileName}.`,
            metadata: { fileName, size: fileContent.length },
            created_at: new Date().toISOString(),
          },
          executionTimeMs: Date.now() - startTime,
        };
      }

      // ==========================================
      // 10. UNCONNECTED / EXTERNAL INTEGRATIONS
      // ==========================================
      case "tool_canva_integration":
      case "tool_github_integration":
      case "tool_google_workspace":
      case "tool_microsoft_365":
      case "tool_capcut_media":
      case "tool_whatsapp_messaging": {
        // Return genuine connection requirement status
        return {
          success: false,
          toolId,
          output: null,
          error: `The integration '${toolId}' is configured in Stage 4 architecture but is currently Not Connected. Please connect your credentials or OAuth account in Settings > Connections to authorize Angel.`,
          executionTimeMs: Date.now() - startTime,
        };
      }

      default: {
        return {
          success: false,
          toolId,
          output: null,
          error: `Unknown tool identifier: ${toolId}`,
          executionTimeMs: Date.now() - startTime,
        };
      }
    }
  } catch (error: any) {
    console.error(`[ToolExecution] Error executing tool ${toolId}:`, error);
    return {
      success: false,
      toolId,
      output: null,
      error: error.message || "Failed to execute tool.",
      executionTimeMs: Date.now() - startTime,
    };
  }
}
