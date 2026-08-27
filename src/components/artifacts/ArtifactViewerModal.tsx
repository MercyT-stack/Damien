import React, { useState } from "react";
import { useCapability } from "../../contexts/CapabilityContext";
import Markdown from "react-markdown";
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  Code2, 
  Table, 
  BookOpen, 
  Network, 
  Presentation, 
  Play, 
  Eye, 
  ExternalLink,
  Sparkles,
  Search
} from "lucide-react";

export const ArtifactViewerModal: React.FC = () => {
  const { activeArtifactModal, setActiveArtifactModal } = useCapability();
  const [copied, setCopied] = useState(false);
  const [tabMode, setTabMode] = useState<"preview" | "raw" | "interactive">("preview");
  const [tableSearch, setTableSearch] = useState("");

  if (!activeArtifactModal) return null;

  const { title, type, content, summary, metadata, rawOutput, created_at } = activeArtifactModal;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    let mimeType = "text/plain";
    let extension = "txt";

    if (type === "document") {
      mimeType = "text/markdown";
      extension = "md";
    } else if (type === "spreadsheet") {
      mimeType = "text/csv";
      extension = "csv";
    } else if (type === "code") {
      const lang = metadata?.language || "ts";
      mimeType = "text/plain";
      extension = lang === "python" ? "py" : lang === "javascript" ? "js" : "ts";
    } else if (type === "diagram") {
      mimeType = "text/plain";
      extension = "mmd";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getIcon = () => {
    switch (type) {
      case "document":
        return <FileText className="w-5 h-5 text-blue-400" />;
      case "code":
        return <Code2 className="w-5 h-5 text-emerald-400" />;
      case "spreadsheet":
        return <Table className="w-5 h-5 text-cyan-400" />;
      case "research":
        return <BookOpen className="w-5 h-5 text-purple-400" />;
      case "diagram":
        return <Network className="w-5 h-5 text-cyan-400" />;
      case "presentation":
        return <Presentation className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div
      id="angel-artifact-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-4xl h-[90vh] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-neutral-100 animate-scaleUp">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800/80 border border-neutral-700 flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                  {type.toUpperCase()} ARTIFACT
                </span>
                <span className="text-[11px] text-neutral-400">
                  {new Date(created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-semibold text-white line-clamp-1">{title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-neutral-800/70 p-0.5 rounded-lg border border-neutral-700/60 text-xs">
              <button
                onClick={() => setTabMode("preview")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  tabMode === "preview" ? "bg-cyan-500 text-neutral-950 font-semibold" : "text-neutral-300 hover:text-white"
                }`}
              >
                Preview
              </button>
              <button
                onClick={() => setTabMode("raw")}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  tabMode === "raw" ? "bg-cyan-500 text-neutral-950 font-semibold" : "text-neutral-300 hover:text-white"
                }`}
              >
                Raw Text
              </button>
            </div>

            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            <button
              onClick={handleDownload}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
              title="Download file"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveArtifactModal(null)}
              className="p-2 rounded-xl hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors ml-1"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {summary && (
            <div className="p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/80 text-xs text-neutral-300 leading-relaxed">
              <span className="font-semibold text-cyan-400/90 mr-1.5">Overview:</span>
              {summary}
            </div>
          )}

          {tabMode === "raw" ? (
            <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {content}
            </pre>
          ) : (
            /* Specialized Preview by Artifact Type */
            <div>
              {/* SPREADSHEET / TABULAR DATA */}
              {type === "spreadsheet" && rawOutput && rawOutput.headers ? (
                <div className="space-y-4">
                  {/* Metric Stat Cards if present */}
                  {rawOutput.metrics && rawOutput.metrics.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {rawOutput.metrics.map((m: any, mIdx: number) => (
                        <div key={mIdx} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                          <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">{m.label}</span>
                          <div className="flex items-baseline justify-between">
                            <span className="text-base font-bold text-white">{m.value}</span>
                            {m.change && <span className="text-[11px] font-medium text-emerald-400">{m.change}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Search filter for rows */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
                    <input
                      type="text"
                      placeholder="Filter rows..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  {/* Interactive Table */}
                  <div className="overflow-x-auto rounded-xl border border-neutral-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-950 border-b border-neutral-800 text-neutral-400 font-medium">
                        <tr>
                          {rawOutput.headers.map((h: string, hIdx: number) => (
                            <th key={hIdx} className="p-3 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/60 text-neutral-200 font-mono">
                        {rawOutput.rows
                          .filter((row: any[]) =>
                            tableSearch ? row.some((cell) => String(cell).toLowerCase().includes(tableSearch.toLowerCase())) : true
                          )
                          .map((row: any[], rIdx: number) => (
                            <tr key={rIdx} className="hover:bg-neutral-800/40 transition-colors">
                              {row.map((cell: any, cIdx: number) => (
                                <td key={cIdx} className="p-3 whitespace-nowrap">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : type === "code" ? (
                /* CODE WORKSPACE PREVIEW */
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
                    <span>Language: <strong className="text-neutral-200 font-mono">{metadata?.language || "typescript"}</strong></span>
                    <span>Ready for production integration</span>
                  </div>
                  <pre className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-cyan-200/90 whitespace-pre-wrap leading-relaxed overflow-x-auto">
                    {content}
                  </pre>
                </div>
              ) : (
                /* MARKDOWN / DOCUMENT / RESEARCH / DIAGRAM */
                <div className="prose prose-invert max-w-none text-neutral-200 text-xs sm:text-sm leading-relaxed space-y-4">
                  <Markdown>{content}</Markdown>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-[11px] text-neutral-400">
          <span>ANGEL Capability Engine & Workspace</span>
          <button
            onClick={() => setActiveArtifactModal(null)}
            className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
