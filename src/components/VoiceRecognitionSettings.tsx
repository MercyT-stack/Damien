import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Fingerprint,
  Mic,
  Plus,
  RefreshCw,
  Trash2,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Users,
  Lock,
  Sparkles,
  Radio,
  Volume2,
  Activity,
  UserCheck,
  Cpu,
} from "lucide-react";
import {
  voiceIdentityService,
  voiceEngineRegistry,
} from "../services/voiceIdentityService";
import {
  VoiceRecognitionSettings,
  VoiceIdentityProfile,
  SpeakerSensitivityLevel,
} from "../types/voiceIdentityTypes";
import { VoiceEnrollmentModal } from "./VoiceEnrollmentModal";

export const VoiceRecognitionSettingsComponent: React.FC = () => {
  const [settings, setSettings] = useState<VoiceRecognitionSettings>(
    voiceIdentityService.getSettings()
  );
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [enrollTargetRole, setEnrollTargetRole] = useState<"owner" | "partner" | "family" | "colleague">("owner");
  const [enrollTargetName, setEnrollTargetName] = useState<string>("");
  const [copiedExport, setCopiedExport] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  useEffect(() => {
    setSettings(voiceIdentityService.getSettings());
  }, []);

  const updateSetting = (partial: Partial<VoiceRecognitionSettings>) => {
    const updated = voiceIdentityService.saveSettings(partial);
    setSettings(updated);
    setSaveBanner("Voice settings updated");
    setTimeout(() => setSaveBanner(null), 2000);
  };

  const handleSensitivityChange = (level: SpeakerSensitivityLevel) => {
    updateSetting({ sensitivity: level });
  };

  const handleEnrollCompleted = (profile: VoiceIdentityProfile) => {
    setSettings(voiceIdentityService.getSettings());
    setSaveBanner(`Enrolled voice profile: ${profile.name}`);
    setTimeout(() => setSaveBanner(null), 2500);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm("Are you sure you want to delete this voice biometric profile?")) {
      voiceIdentityService.deleteProfile(profileId);
      setSettings(voiceIdentityService.getSettings());
    }
  };

  const handleExportProfile = () => {
    const payload = voiceIdentityService.exportEncryptedProfile();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `angel-voice-biometrics-${Date.now()}.angelvoice`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedExport(true);
    setTimeout(() => setCopiedExport(false), 2500);
  };

  const handleImportProfile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (content) {
        const ok = voiceIdentityService.importProfileBundle(content);
        if (ok) {
          setSettings(voiceIdentityService.getSettings());
          setSaveBanner("Voice profile imported successfully");
          setTimeout(() => setSaveBanner(null), 2500);
        } else {
          alert("Invalid voice profile file.");
        }
      }
    };
    reader.readAsText(file);
  };

  const handlePurgeAll = () => {
    if (
      window.confirm(
        "Permanently delete all voice recognition data and biometrics from this device?"
      )
    ) {
      voiceIdentityService.purgeAllVoiceData();
      setSettings(voiceIdentityService.getSettings());
      setSaveBanner("All voice recognition data deleted");
      setTimeout(() => setSaveBanner(null), 2500);
    }
  };

  const primaryProfile = settings.profiles.find((p) => p.isPrimaryOwner) || settings.profiles[0];
  const engines = voiceEngineRegistry.listEngines();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Notice */}
      {saveBanner && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-amber-400" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Master Toggle: Respond Only to My Voice */}
      <div className="p-5 rounded-2xl bg-neutral-800/40 border border-neutral-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`p-3 rounded-2xl border transition-all ${
              settings.respondOnlyToMyVoice
                ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                : "bg-neutral-800 border-neutral-700 text-neutral-400"
            }`}
          >
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <div className="text-sm font-bold text-white flex items-center gap-2">
              Respond Only to My Voice
              <span
                className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  settings.respondOnlyToMyVoice
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-neutral-700 text-neutral-400"
                }`}
              >
                {settings.respondOnlyToMyVoice ? "Enforced" : "Disabled"}
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1 max-w-md leading-relaxed">
              Angel analyzes incoming audio signatures and verifies speaker timbre before
              responding or executing user commands.
            </p>
          </div>
        </div>

        <button
          id="btn-toggle-voice-recognition"
          type="button"
          onClick={() =>
            updateSetting({ respondOnlyToMyVoice: !settings.respondOnlyToMyVoice })
          }
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 active:scale-95 ${
            settings.respondOnlyToMyVoice
              ? "bg-amber-500 text-neutral-950 hover:bg-amber-400 font-black"
              : "bg-neutral-700 hover:bg-neutral-600 text-neutral-200"
          }`}
        >
          {settings.respondOnlyToMyVoice ? "Enabled (Protected)" : "Enable Speaker Lock"}
        </button>
      </div>

      {/* Primary Voice Profile Card */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Primary Enrolled Voice Profile
          </h3>

          {primaryProfile && (
            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-2 py-1 rounded-md border border-neutral-800">
              HASH: {primaryProfile.voiceprintHash}
            </span>
          )}
        </div>

        {primaryProfile ? (
          <div className="p-4 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div
                style={{ backgroundColor: `${primaryProfile.color}25`, borderColor: primaryProfile.color }}
                className="w-11 h-11 rounded-2xl flex items-center justify-center border font-bold text-sm text-white"
              >
                {primaryProfile.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <div className="text-sm font-bold text-white flex items-center gap-2">
                  {primaryProfile.name}
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Primary Owner
                  </span>
                </div>
                <div className="text-xs text-neutral-400 mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>Fundamental: ~{primaryProfile.characteristics.pitchAvgHz} Hz</span>
                  <span className="text-neutral-600">•</span>
                  <span>Centroid: ~{primaryProfile.characteristics.spectralCentroidAvg} Hz</span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-emerald-400">
                    Enrolled {new Date(primaryProfile.enrolledAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                id="btn-retrain-voice"
                type="button"
                onClick={() => {
                  setEnrollTargetRole("owner");
                  setEnrollTargetName(primaryProfile.name);
                  setIsEnrollModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                <span>Retrain Voice Profile</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-neutral-950/40 border border-dashed border-neutral-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">No Voice Profile Enrolled Yet</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
                Calibrate your microphone with 3 short vocal phrases to establish your unique voice signature.
              </p>
            </div>
            <button
              id="btn-enroll-first-voice"
              type="button"
              onClick={() => {
                setEnrollTargetRole("owner");
                setEnrollTargetName("My Voice");
                setIsEnrollModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 text-neutral-950 hover:bg-amber-400 transition shadow-md shadow-amber-500/20"
            >
              Enroll My Voice Now
            </button>
          </div>
        )}
      </div>

      {/* Verification Sensitivity */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Biometric Verification Sensitivity
          </label>
          <span className="text-xs text-neutral-400 capitalize font-semibold">
            {settings.sensitivity} Sensitivity
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              level: "low" as SpeakerSensitivityLevel,
              title: "Low Sensitivity",
              desc: "Forgiving match. Recommended for noisy rooms or hoarse vocal states.",
              badge: "Tolerant",
            },
            {
              level: "balanced" as SpeakerSensitivityLevel,
              title: "Balanced",
              desc: "Optimal balance between security and natural fluid daily interaction.",
              badge: "Recommended",
            },
            {
              level: "high" as SpeakerSensitivityLevel,
              title: "High Sensitivity",
              desc: "Strict timbre & formant verification. Maximum security threshold.",
              badge: "Strict",
            },
          ].map((item) => {
            const isSelected = settings.sensitivity === item.level;
            return (
              <button
                key={item.level}
                type="button"
                onClick={() => handleSensitivityChange(item.level)}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? "bg-amber-500/15 border-amber-500 text-white shadow-sm"
                    : "bg-neutral-950/50 border-neutral-800 text-neutral-400 hover:border-neutral-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{item.title}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                      isSelected
                        ? "bg-amber-500 text-neutral-950"
                        : "bg-neutral-800 text-neutral-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-snug">{item.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Voice Recognition Rules & Toggles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ignore Unknown Speakers */}
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Ignore Unknown Speakers
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              Silently drops speech from unrecognized background voices without interrupting you.
            </p>
          </div>
          <button
            id="toggle-ignore-unknown"
            type="button"
            onClick={() =>
              updateSetting({ ignoreUnknownSpeakers: !settings.ignoreUnknownSpeakers })
            }
            className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
              settings.ignoreUnknownSpeakers ? "bg-amber-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.ignoreUnknownSpeakers ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Optional Guest Mode */}
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-400" />
              Optional Guest Mode
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              Permits friends and guests to converse with Angel for general knowledge without biometric locking.
            </p>
          </div>
          <button
            id="toggle-guest-mode"
            type="button"
            onClick={() => updateSetting({ guestModeAllowed: !settings.guestModeAllowed })}
            className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
              settings.guestModeAllowed ? "bg-blue-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.guestModeAllowed ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Strict Verification for Sensitive Actions */}
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-emerald-400" />
              Strict Verification for Sensitive Actions
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              Requires owner voice verification before deleting memory, executing tools, or modifying data.
            </p>
          </div>
          <button
            id="toggle-strict-verification"
            type="button"
            onClick={() =>
              updateSetting({
                strictVerificationForSensitiveActions:
                  !settings.strictVerificationForSensitiveActions,
              })
            }
            className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
              settings.strictVerificationForSensitiveActions ? "bg-emerald-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.strictVerificationForSensitiveActions ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Wake Word Requirement */}
        <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Wake Word Before Listening
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
              Requires saying "Hey Angel" or "Angel" to initiate active listening and responses.
            </p>
          </div>
          <button
            id="toggle-wake-word"
            type="button"
            onClick={() =>
              updateSetting({ wakeWordRequired: !settings.wakeWordRequired })
            }
            className={`w-10 h-6 rounded-full transition-colors relative shrink-0 ${
              settings.wakeWordRequired ? "bg-amber-500" : "bg-neutral-700"
            }`}
          >
            <span
              className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${
                settings.wakeWordRequired ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Multiple Trusted Voice Profiles */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Trusted Voice Profiles ({settings.profiles.length})
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Authorize family members, partners, or team collaborators to converse with Angel
            </p>
          </div>

          <button
            id="btn-add-trusted-profile"
            type="button"
            onClick={() => {
              setEnrollTargetRole("family");
              setEnrollTargetName("");
              setIsEnrollModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Trusted Voice</span>
          </button>
        </div>

        {settings.profiles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {settings.profiles.map((profile) => (
              <div
                key={profile.id}
                className="p-3.5 rounded-xl bg-neutral-950/70 border border-neutral-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{ backgroundColor: `${profile.color}25`, borderColor: profile.color }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center border font-bold text-xs text-white shrink-0"
                  >
                    {profile.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="overflow-hidden">
                    <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                      {profile.name}
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full font-medium bg-neutral-800 text-neutral-300 capitalize">
                        {profile.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate">
                      {profile.voiceprintHash} • ~{profile.characteristics.pitchAvgHz}Hz
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteProfile(profile.id)}
                  className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                  title="Delete Voice Profile"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-500 italic">No trusted profiles added yet.</p>
        )}
      </div>

      {/* Modular Voice Tech Provider Architecture Banner */}
      <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Modular Biometric Architecture
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Plug-and-Play
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Active Provider: <strong>Angel Edge Biometric Neural Engine</strong> (Zero-Latency Local Analysis)
            </p>
          </div>
        </div>

        <span className="text-[10px] text-neutral-500 hidden sm:inline">
          Supports Picovoice Eagle, PyAnnote, Azure & Gemini
        </span>
      </div>

      {/* Privacy, Cross-Device Sync & Data Controls */}
      <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Privacy Controls & Encrypted Cross-Device Sync
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Export */}
          <button
            id="btn-export-voice-profile"
            type="button"
            onClick={handleExportProfile}
            className="p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-2 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>{copiedExport ? "Exported!" : "Export Encrypted Profile"}</span>
          </button>

          {/* Import */}
          <label className="p-3 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-2 text-xs font-semibold transition cursor-pointer">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Import Voice Package</span>
            <input
              type="file"
              accept=".json,.angelvoice"
              onChange={handleImportProfile}
              className="hidden"
            />
          </label>

          {/* Purge */}
          <button
            id="btn-purge-voice-biometrics"
            type="button"
            onClick={handlePurgeAll}
            className="p-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center gap-2 text-xs font-semibold transition"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Delete All Voice Data</span>
          </button>
        </div>
      </div>

      {/* Voice Enrollment Modal */}
      <VoiceEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnrollmentComplete={handleEnrollCompleted}
        initialRole={enrollTargetRole}
        initialName={enrollTargetName}
      />
    </div>
  );
};
