import React, { useState } from "react";
import { ExternalIntegration, IntegrationCategory, IntegrationScope } from "../types/integrationTypes";
import { useCapability } from "../contexts/CapabilityContext";
import {
  Plug,
  Unplug,
  Shield,
  ShieldCheck,
  Globe,
  Palette,
  GitBranch,
  Mail,
  HardDrive,
  Calendar,
  MessageCircle,
  Video,
  MapPin,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Key,
  Lock,
  Layers,
  ChevronRight,
  Info,
  RefreshCw,
  Sliders,
} from "lucide-react";

interface ConnectionsHubProps {
  onClose?: () => void;
}

export const ConnectionsHub: React.FC<ConnectionsHubProps> = () => {
  const {
    externalIntegrations,
    deviceContext,
    refreshDeviceContext,
    connectExternalIntegration,
    disconnectExternalIntegration,
    updateIntegrationScopes,
    isOnline,
  } = useCapability();

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedInteg, setSelectedInteg] = useState<ExternalIntegration | null>(null);
  const [isConfiguringScopes, setIsConfiguringScopes] = useState<boolean>(false);
  const [activeAccountInput, setActiveAccountInput] = useState<string>("user@workspace.org");
  const [activeScopes, setActiveScopes] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  const categories: Array<{ id: string; label: string }> = [
    { id: "ALL", label: "All Integrations" },
    { id: "COMMUNICATION", label: "Communication" },
    { id: "CREATIVE", label: "Creative & Design" },
    { id: "DEVELOPMENT", label: "Developer & Code" },
    { id: "STORAGE", label: "Cloud & Files" },
    { id: "CALENDAR", label: "Calendar & Schedule" },
    { id: "WEB", label: "Web & Browser" },
    { id: "TRAVEL", label: "Travel & Places" },
  ];

  const filteredIntegrations = externalIntegrations.filter((integ) => {
    if (selectedCategory === "ALL") return true;
    return integ.category === selectedCategory;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case "Mail":
        return <Mail className="w-5 h-5" />;
      case "Palette":
        return <Palette className="w-5 h-5" />;
      case "GitBranch":
        return <GitBranch className="w-5 h-5" />;
      case "MessageCircle":
        return <MessageCircle className="w-5 h-5" />;
      case "HardDrive":
        return <HardDrive className="w-5 h-5" />;
      case "Calendar":
        return <Calendar className="w-5 h-5" />;
      case "Globe":
        return <Globe className="w-5 h-5" />;
      case "Video":
        return <Video className="w-5 h-5" />;
      case "MapPin":
        return <MapPin className="w-5 h-5" />;
      default:
        return <Plug className="w-5 h-5" />;
    }
  };

  const handleOpenConnect = (integ: ExternalIntegration) => {
    setSelectedInteg(integ);
    setActiveAccountInput(integ.accountEmail || "user@workspace.org");
    const defaultScopes = integ.scopes.map((s) => s.id);
    setActiveScopes(integ.grantedScopes.length > 0 ? integ.grantedScopes : defaultScopes);
    setIsConfiguringScopes(true);
  };

  const handleConfirmConnect = async () => {
    if (!selectedInteg) return;
    setIsConnecting(true);
    try {
      await connectExternalIntegration(selectedInteg.id, activeScopes, activeAccountInput);
      setIsConfiguringScopes(false);
      setSelectedInteg(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const toggleScope = (scopeId: string) => {
    setActiveScopes((prev) =>
      prev.includes(scopeId) ? prev.filter((id) => id !== scopeId) : [...prev, scopeId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Device Intelligence Banner */}
      <div className="p-4 rounded-2xl bg-neutral-800/40 border border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-white">External World & Service Connections</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Stage 6 Universal Ecosystem
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Authorize Angel to interact directly with Canva, Gmail, GitHub, Google Workspace, and web applications.
          </p>
        </div>

        {/* Device Context Capsule */}
        {deviceContext && (
          <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-neutral-900/80 border border-neutral-800 text-xs">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                Device Environment
              </span>
              <span className="text-neutral-200 font-medium">
                {deviceContext.os} • {deviceContext.browser} ({deviceContext.deviceType})
              </span>
            </div>
            <div className="h-6 w-px bg-neutral-800" />
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                }`}
              />
              <span className="text-[11px] text-neutral-300 font-mono">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? "bg-amber-500 text-neutral-950 font-semibold shadow-xs"
                : "bg-neutral-800/60 text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredIntegrations.map((integ) => {
          const isConnected = integ.isConnected;
          return (
            <div
              key={integ.id}
              className={`p-4 rounded-2xl border transition relative flex flex-col justify-between ${
                isConnected
                  ? "bg-neutral-800/50 border-amber-500/30 hover:border-amber-500/50 shadow-sm"
                  : "bg-neutral-900/40 border-neutral-800 hover:border-neutral-700/80"
              }`}
            >
              <div>
                {/* Header: Icon, Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isConnected
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                          : "bg-neutral-800 text-neutral-400 border-neutral-700"
                      }`}
                    >
                      {getIcon(integ.icon)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{integ.name}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded uppercase font-semibold bg-neutral-800 text-neutral-400">
                          {integ.category}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-500 block">
                        by {integ.provider} • v{integ.version}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isConnected ? (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                        <CheckCircle2 className="w-3 h-3" />
                        Connected
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
                        Not Connected
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-neutral-300 mt-2.5 line-clamp-2">
                  {integ.description}
                </p>

                {/* Connected Account & Scopes preview */}
                {isConnected && (
                  <div className="mt-3 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Account:</span>
                      <span className="font-mono text-neutral-200">{integ.accountEmail}</span>
                    </div>
                    <div className="flex items-center justify-between text-neutral-400">
                      <span>Active Scopes:</span>
                      <span className="text-amber-400 font-medium">
                        {integ.grantedScopes.length} granted
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {integ.handoffSupported && integ.handoffUrlTemplate && (
                    <a
                      href={integ.handoffUrlTemplate}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Web Handoff</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleOpenConnect(integ)}
                        className="px-2.5 py-1 text-[11px] rounded-lg text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 transition flex items-center gap-1"
                        title="Manage Permissions"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Permissions</span>
                      </button>
                      <button
                        onClick={() => disconnectExternalIntegration(integ.id)}
                        className="px-2.5 py-1 text-[11px] rounded-lg text-rose-300 hover:text-rose-200 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition flex items-center gap-1 font-medium"
                      >
                        <Unplug className="w-3 h-3" />
                        <span>Disconnect</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleOpenConnect(integ)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 transition flex items-center gap-1.5 shadow-xs"
                    >
                      <Plug className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Granular Permission & Scope Configuration Modal */}
      {isConfiguringScopes && selectedInteg && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  {getIcon(selectedInteg.icon)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Authorize {selectedInteg.name}
                  </h3>
                  <span className="text-[11px] text-neutral-400">
                    Granular permission and scope control
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsConfiguringScopes(false);
                  setSelectedInteg(null);
                }}
                className="text-neutral-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Account input */}
            <div>
              <label className="text-xs font-medium text-neutral-300 block mb-1">
                Account Email / Workspace Identity
              </label>
              <input
                type="email"
                value={activeAccountInput}
                onChange={(e) => setActiveAccountInput(e.target.value)}
                placeholder="e.g. yourname@company.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-800 text-white border border-neutral-700 focus:border-amber-500 focus:outline-hidden"
              />
            </div>

            {/* Scopes Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-300">
                  Select Permitted Capabilities & Scopes
                </label>
                <span className="text-[10px] text-neutral-500">Least privilege recommended</span>
              </div>

              <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                {selectedInteg.scopes.map((scope: IntegrationScope) => {
                  const isChecked = activeScopes.includes(scope.id);
                  return (
                    <div
                      key={scope.id}
                      onClick={() => toggleScope(scope.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                        isChecked
                          ? "bg-amber-500/10 border-amber-500/40 text-white"
                          : "bg-neutral-800/40 border-neutral-800 text-neutral-300 hover:border-neutral-700"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 accent-amber-500 rounded cursor-pointer"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{scope.name}</span>
                          {scope.isSensitive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-semibold bg-rose-500/20 text-rose-300">
                              Requires Confirmation
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {scope.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  setIsConfiguringScopes(false);
                  setSelectedInteg(null);
                }}
                className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isConnecting}
                onClick={handleConfirmConnect}
                className="px-4 py-1.5 text-xs font-semibold rounded-xl bg-amber-500 text-neutral-950 hover:bg-amber-400 transition"
              >
                {isConnecting ? "Authorizing..." : "Save & Authorize"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
