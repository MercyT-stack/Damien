import React, { useState, useEffect } from "react";
import {
  Bell,
  Sun,
  Moon,
  Clock,
  Globe,
  Sliders,
  Shield,
  CheckCircle2,
  Sparkles,
  MapPin,
  Flame,
  Layers,
  ArrowUpRight,
  RefreshCw,
  Cpu,
} from "lucide-react";
import {
  ProactivePreferences,
  UpgradeProposal,
} from "../types/intelligenceTypes";
import {
  loadProactivePreferences,
  saveProactivePreferences,
  fetchUpgradeProposals,
} from "../services/intelligenceService";

export const ProactiveIntelligenceSettings: React.FC = () => {
  const [prefs, setPrefs] = useState<ProactivePreferences>(loadProactivePreferences());
  const [upgrades, setUpgrades] = useState<UpgradeProposal[]>([]);
  const [loadingUpgrades, setLoadingUpgrades] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadUpgrades();
  }, []);

  const loadUpgrades = async () => {
    setLoadingUpgrades(true);
    try {
      const list = await fetchUpgradeProposals();
      setUpgrades(list);
    } catch (err) {
      console.warn("Failed to load upgrade proposals", err);
    } finally {
      setLoadingUpgrades(false);
    }
  };

  const updatePreference = <K extends keyof ProactivePreferences>(
    key: K,
    val: ProactivePreferences[K]
  ) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    saveProactivePreferences(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const updateTopic = (topicKey: keyof ProactivePreferences["topics"], val: boolean) => {
    const updated = {
      ...prefs,
      topics: {
        ...prefs.topics,
        [topicKey]: val,
      },
    };
    setPrefs(updated);
    saveProactivePreferences(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pt-1">
      {/* Master Toggle Banner */}
      <div className="p-4 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-2.5 rounded-xl ${
              prefs.enabled ? "bg-amber-500/20 text-amber-300" : "bg-neutral-700/50 text-neutral-400"
            }`}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white flex items-center gap-2">
              Proactive Intelligence & Real-Time Awareness
              <span
                className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  prefs.enabled ? "bg-emerald-500/20 text-emerald-300" : "bg-neutral-700 text-neutral-400"
                }`}
              >
                {prefs.enabled ? "Active" : "Disabled"}
              </span>
            </div>
            <div className="text-xs text-neutral-400 mt-0.5">
              Angel checks current world developments, provides morning/evening briefings, and monitors project updates
            </div>
          </div>
        </div>

        <button
          onClick={() => updatePreference("enabled", !prefs.enabled)}
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition ${
            prefs.enabled
              ? "bg-neutral-700 text-neutral-200 hover:bg-neutral-600"
              : "bg-amber-500 text-neutral-950 hover:bg-amber-400"
          }`}
        >
          {prefs.enabled ? "Pause updates" : "Enable proactivity"}
        </button>
      </div>

      {/* Briefing Schedules */}
      <div className="p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Scheduled Briefings
            </h3>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Synthesized personal overviews: top news, project milestones, weather, and focus areas
            </div>
          </div>
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Morning Briefing */}
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Morning Briefing
              </span>
              <input
                type="checkbox"
                checked={prefs.morningBriefingEnabled}
                onChange={(e) => updatePreference("morningBriefingEnabled", e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <span>Delivery Time</span>
              <input
                type="time"
                value={prefs.morningBriefingTime}
                onChange={(e) => updatePreference("morningBriefingTime", e.target.value)}
                className="bg-neutral-800 text-white px-2 py-0.5 rounded border border-neutral-700 text-xs focus:outline-hidden"
              />
            </div>
          </div>

          {/* Evening Briefing */}
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white flex items-center gap-1.5">
                <Moon className="w-3.5 h-3.5 text-indigo-400" /> Evening Recap
              </span>
              <input
                type="checkbox"
                checked={prefs.eveningBriefingEnabled}
                onChange={(e) => updatePreference("eveningBriefingEnabled", e.target.checked)}
                className="w-4 h-4 accent-amber-500 rounded"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-neutral-400 pt-1">
              <span>Delivery Time</span>
              <input
                type="time"
                value={prefs.eveningBriefingTime}
                onChange={(e) => updatePreference("eveningBriefingTime", e.target.value)}
                className="bg-neutral-800 text-white px-2 py-0.5 rounded border border-neutral-700 text-xs focus:outline-hidden"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours & Anti-Spam Boundaries */}
      <div className="p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Quiet Hours & Boundaries
        </h3>
        <div className="text-[11px] text-neutral-400">
          Angel never interrupts during quiet hours. Background tasks run silently and wait until you wake up.
        </div>

        <div className="flex items-center justify-between py-1.5">
          <span className="text-xs text-neutral-300">Enforce Quiet Hours</span>
          <input
            type="checkbox"
            checked={prefs.quietHoursEnabled}
            onChange={(e) => updatePreference("quietHoursEnabled", e.target.checked)}
            className="w-4 h-4 accent-amber-500 rounded"
          />
        </div>

        {prefs.quietHoursEnabled && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 text-xs">
              <span className="text-neutral-400">Start (Night)</span>
              <input
                type="time"
                value={prefs.quietHoursStart}
                onChange={(e) => updatePreference("quietHoursStart", e.target.value)}
                className="bg-neutral-800 text-white px-2 py-0.5 rounded border border-neutral-700 text-xs focus:outline-hidden"
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 text-xs">
              <span className="text-neutral-400">End (Morning)</span>
              <input
                type="time"
                value={prefs.quietHoursEnd}
                onChange={(e) => updatePreference("quietHoursEnd", e.target.value)}
                className="bg-neutral-800 text-white px-2 py-0.5 rounded border border-neutral-700 text-xs focus:outline-hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Topics & Monitored Domains */}
      <div className="p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" />
          Topics & Global Awareness
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { id: "ai_tech", label: "AI & Machine Learning Developments" },
            { id: "developer_ecosystem", label: "Developer Tools & Frameworks" },
            { id: "world_news", label: "Global Headlines & Current Events" },
            { id: "business_finance", label: "Markets & Tech Business" },
            { id: "project_monitoring", label: "Active Project Changes & Upgrades" },
            { id: "cultural_events", label: "Cultural Celebrations & Etiquette" },
            { id: "travel_awareness", label: "Travel Advisories & Transport" },
            { id: "weather_local", label: "Local Forecasts & Weather Alerts" },
          ].map((t) => (
            <label
              key={t.id}
              className="flex items-center justify-between p-2 rounded-lg bg-neutral-900/60 border border-neutral-800 cursor-pointer hover:border-neutral-700"
            >
              <span className="text-neutral-300 pr-2">{t.label}</span>
              <input
                type="checkbox"
                checked={prefs.topics[t.id as keyof ProactivePreferences["topics"]] ?? true}
                onChange={(e) => updateTopic(t.id as keyof ProactivePreferences["topics"], e.target.checked)}
                className="w-3.5 h-3.5 accent-amber-500 rounded"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Followed Regions & Cultural Context (Stage 9) */}
      <div className="p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Followed Regions & Cultural Context
          </h3>
          <span className="text-[11px] text-neutral-400">Regional Nuance & Local News</span>
        </div>
        <div className="text-[11px] text-neutral-400">
          Angel prioritizes developments, authentic cultural context, currencies, and local traditions for these regions:
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Global", "Nigeria", "United States", "United Kingdom", "South Korea", "Germany", "Japan", "Ghana", "France", "Canada"].map((reg) => {
            const isFollowed = (prefs.followedRegions || []).includes(reg);
            return (
              <button
                key={reg}
                onClick={() => {
                  const current = prefs.followedRegions || [];
                  const next = isFollowed ? current.filter((r) => r !== reg) : [...current, reg];
                  updatePreference("followedRegions", next);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  isFollowed
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-neutral-900 text-neutral-400 border border-neutral-800 hover:text-white"
                }`}
              >
                {isFollowed ? "✓ " : "+ "}
                {reg}
              </button>
            );
          })}
        </div>

        <div className="pt-2 border-t border-neutral-800/70 flex items-center justify-between text-xs">
          <span className="text-neutral-400">Source Verification Priority</span>
          <select
            value={prefs.sourceRankingPreference || "official_first"}
            onChange={(e) => updatePreference("sourceRankingPreference", e.target.value as any)}
            className="bg-neutral-900 text-neutral-200 px-2 py-1 rounded border border-neutral-700 text-xs focus:outline-hidden"
          >
            <option value="official_first">Primary & Official Sources First</option>
            <option value="broad_mix">Balanced Broad Multi-Source</option>
            <option value="academic_first">Academic & Specialist First</option>
          </select>
        </div>
      </div>

      {/* Conceptual System Self-Upgrade Proposals (Stage 8) */}
      <div className="p-4 rounded-2xl bg-neutral-800/25 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              System Upgrade & Architecture Proposals
            </h3>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Angel suggests architectural improvements, model upgrades, and latency optimizations for review
            </div>
          </div>
          <button
            onClick={loadUpgrades}
            className="p-1 text-neutral-400 hover:text-white rounded"
            title="Refresh proposals"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingUpgrades ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-2 pt-1">
          {upgrades.map((u) => (
            <div key={u.id} className="p-3 rounded-xl bg-neutral-900/70 border border-neutral-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white">{u.title}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300">
                  {u.status === "approved" ? "Active" : "Ready for Review"}
                </span>
              </div>
              <div className="text-neutral-400 text-[11px] leading-relaxed">{u.whatChanged}</div>
              <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60 text-[11px]">
                <span className="text-neutral-500">{u.potentialBenefit}</span>
                <span className="text-amber-300/90 font-medium">{u.recommendedAction}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
