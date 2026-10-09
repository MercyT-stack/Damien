import { jsPDF } from "jspdf";
import { Message, Conversation } from "../types";

export interface ExportUserInfo {
  name?: string;
  email?: string;
  nickname?: string;
}

/**
 * Format a readable date/time string for exports
 */
export function formatExportDateTime(dateInput?: string | Date): string {
  if (!dateInput) return new Date().toLocaleString();
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return new Date().toLocaleString();
  return d.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sanitizeFilename(title: string): string {
  const sanitized = title
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 40);
  return sanitized || "angel_conversation";
}

/**
 * Trigger browser file download via Blob URL
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export conversation to a formatted JSON file
 */
export function exportConversationToJson(
  conversation: { id?: string; title?: string; created_at?: string; updated_at?: string } | null,
  messages: Message[],
  user?: ExportUserInfo
): void {
  const title = conversation?.title || "Angel Conversation";
  const filename = `${sanitizeFilename(title)}_${Date.now()}.json`;

  const exportPayload = {
    app: "Angel AI Assistant",
    version: "1.0",
    exported_at: new Date().toISOString(),
    conversation: {
      id: conversation?.id || "active-session",
      title,
      created_at: conversation?.created_at || new Date().toISOString(),
      updated_at: conversation?.updated_at || new Date().toISOString(),
      total_messages: messages.length,
    },
    user: {
      name: user?.name || "User",
      email: user?.email || undefined,
      nickname: user?.nickname || undefined,
    },
    messages: messages.map((m, index) => ({
      index: index + 1,
      id: m.id,
      role: m.role,
      sender_name: m.role === "user" ? (user?.nickname || user?.name || "User") : "Angel",
      content: m.content,
      created_at: m.created_at || new Date().toISOString(),
      formatted_time: formatExportDateTime(m.created_at),
      modality: m.metadata?.modality || (m.metadata?.voice ? "voice" : "text"),
      tool_calls: m.metadata?.toolCalls || undefined,
      sources: m.metadata?.sources || undefined,
      artifacts_count: Array.isArray(m.metadata?.artifacts) ? m.metadata.artifacts.length : 0,
    })),
  };

  const jsonString = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Export conversation to Markdown (.md)
 */
export function exportConversationToMarkdown(
  conversation: { id?: string; title?: string; created_at?: string } | null,
  messages: Message[],
  user?: ExportUserInfo
): void {
  const title = conversation?.title || "Angel Conversation";
  const filename = `${sanitizeFilename(title)}_${Date.now()}.md`;

  const userName = user?.nickname || user?.name || "User";
  const lines: string[] = [
    `# ${title}`,
    "",
    `> **Angel AI Assistant Conversation Transcript**`,
    `> Exported: ${formatExportDateTime()}`,
    `> Participant: ${userName}${user?.email ? ` (${user.email})` : ""}`,
    `> Total Messages: ${messages.length}`,
    "",
    "---",
    "",
  ];

  messages.forEach((msg, idx) => {
    const isUser = msg.role === "user";
    const sender = isUser ? userName : "Angel";
    const timeStr = formatExportDateTime(msg.created_at);
    const modality = msg.metadata?.modality === "voice" || msg.metadata?.voice ? " [Voice]" : "";

    lines.push(`### ${idx + 1}. ${sender}${modality} - ${timeStr}`);
    lines.push("");
    lines.push(msg.content || "*(No text content)*");
    lines.push("");

    if (msg.metadata?.toolCalls && msg.metadata.toolCalls.length > 0) {
      lines.push("**Tools Executed:**");
      msg.metadata.toolCalls.forEach((tc) => {
        lines.push(`- \`${tc.toolName || tc.toolId}\`: ${tc.status}${tc.resultSummary ? ` — ${tc.resultSummary}` : ""}`);
      });
      lines.push("");
    }

    if (msg.metadata?.sources && msg.metadata.sources.length > 0) {
      lines.push("**Sources:**");
      msg.metadata.sources.forEach((src) => {
        lines.push(`- [${src.title || src.url}](${src.url})`);
      });
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  });

  const content = lines.join("\n");
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  downloadBlob(blob, filename);
}

/**
 * Export conversation to a formatted PDF (.pdf) using jsPDF
 */
export function exportConversationToPdf(
  conversation: { id?: string; title?: string; created_at?: string } | null,
  messages: Message[],
  user?: ExportUserInfo
): void {
  const title = conversation?.title || "Angel Conversation";
  const filename = `${sanitizeFilename(title)}_${Date.now()}.pdf`;
  const userName = user?.nickname || user?.name || "User";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 16;
  const marginRight = 16;
  const printableWidth = pageWidth - marginLeft - marginRight;
  const marginTop = 20;
  const marginBottom = 20;

  let currentY = marginTop;

  const checkAddPage = (neededSpace: number) => {
    if (currentY + neededSpace > pageHeight - marginBottom) {
      doc.addPage();
      currentY = marginTop;
      return true;
    }
    return false;
  };

  // 1. Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(marginLeft, currentY, printableWidth, 24, 2, 2, "F");

  doc.setTextColor(56, 189, 248); // cyan-400
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("ANGEL AI ASSISTANT", marginLeft + 6, currentY + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.text("Conversation History & Transcript", marginLeft + 6, currentY + 16);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184); // slate-400
  const exportDateStr = `Exported: ${formatExportDateTime()}`;
  doc.text(exportDateStr, pageWidth - marginRight - doc.getTextWidth(exportDateStr) - 6, currentY + 9);

  const participantStr = `User: ${userName}`;
  doc.text(participantStr, pageWidth - marginRight - doc.getTextWidth(participantStr) - 6, currentY + 16);

  currentY += 30;

  // 2. Conversation Title & Stats Block
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(marginLeft, currentY, printableWidth, 14, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  const cleanTitle = title.length > 55 ? title.substring(0, 52) + "..." : title;
  doc.text(cleanTitle, marginLeft + 4, currentY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139); // slate-500
  const subtitle = `${messages.length} message${messages.length === 1 ? "" : "s"} in this session`;
  doc.text(subtitle, marginLeft + 4, currentY + 11);

  currentY += 20;

  // 3. Render Each Message
  if (messages.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text("No messages recorded in this conversation.", marginLeft + 4, currentY + 6);
  } else {
    messages.forEach((msg, idx) => {
      const isUser = msg.role === "user";
      const senderLabel = isUser ? userName : "Angel";
      const timeStr = formatExportDateTime(msg.created_at);
      const isVoice = msg.metadata?.modality === "voice" || msg.metadata?.voice;

      // Prepare text lines
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const rawContent = msg.content || "(No text content)";
      const splitContent = doc.splitTextToSize(rawContent, printableWidth - 14);
      const contentHeight = splitContent.length * 4.2;

      // Estimate total height needed
      const cardHeight = Math.max(16, contentHeight + 14);

      checkAddPage(cardHeight + 6);

      // Card Background & Border
      if (isUser) {
        doc.setFillColor(241, 245, 249); // slate-100
        doc.setDrawColor(203, 213, 225); // slate-300
      } else {
        doc.setFillColor(255, 255, 255); // white
        doc.setDrawColor(226, 232, 240); // slate-200
      }

      doc.roundedRect(marginLeft, currentY, printableWidth, cardHeight, 1.5, 1.5, "FD");

      // Left Accent Strip
      if (isUser) {
        doc.setFillColor(100, 116, 139); // slate-500
      } else {
        doc.setFillColor(6, 182, 212); // cyan-500
      }
      doc.rect(marginLeft, currentY, 2, cardHeight, "F");

      // Card Header: Role Badge + Index + Timestamp
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      if (isUser) {
        doc.setTextColor(51, 65, 85); // slate-700
      } else {
        doc.setTextColor(14, 116, 144); // cyan-700
      }
      const headerText = `${senderLabel}${isVoice ? " (Voice)" : ""} #${idx + 1}`;
      doc.text(headerText, marginLeft + 6, currentY + 6);

      // Timestamp on right
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(timeStr, pageWidth - marginRight - doc.getTextWidth(timeStr) - 4, currentY + 6);

      // Message Body Content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(splitContent, marginLeft + 6, currentY + 11);

      currentY += cardHeight + 4;
    });
  }

  // 4. Page numbering & footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    const footerText = `Page ${p} of ${totalPages}  •  Angel AI Assistant  •  Session Export`;
    const textWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - textWidth) / 2, pageHeight - 8);
  }

  // Save the PDF
  doc.save(filename);
}
