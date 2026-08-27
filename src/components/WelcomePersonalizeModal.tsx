import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useMemory } from "../contexts/MemoryContext";
import { CHARACTER_AVATARS, getAvatarById } from "../config/avatars";
import { AngelLogo } from "./AngelLogo";
import { Sparkles, Check, ArrowRight, User, AtSign, Bot } from "lucide-react";

interface WelcomePersonalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WelcomePersonalizeModal: React.FC<WelcomePersonalizeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, profile, updateUsername, updateName, updateAvatar } = useAuth();
  const { memoryPreferences, updatePreferences } = useMemory();

  const [preferredNameInput, setPreferredNameInput] = useState<string>("");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>("monkey");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && user) {
      const initialName =
        memoryPreferences.preferred_name ||
        user.display_name ||
        user.name ||
        user.username ||
        "";
      setPreferredNameInput(initialName);

      const initialAvatar =
        profile?.avatar_url || user.avatar_id || "monkey";
      setSelectedAvatarId(initialAvatar);
    }
  }, [isOpen, user, profile, memoryPreferences]);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const trimmedName = preferredNameInput.trim();
      if (trimmedName) {
        // Save to user name, memory preferred_name, and companion preferences
        await updateName(trimmedName);
        await updatePreferences({
          preferred_name: trimmedName,
        });
      }

      if (selectedAvatarId) {
        await updateAvatar(selectedAvatarId);
      }

      onClose();
    } catch (err) {
      console.error("Failed to save welcome personalization:", err);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      id="welcome-personalize-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        id="welcome-personalize-modal-card"
        className="relative w-full max-w-lg rounded-3xl bg-[#111113] border border-cyan-500/40 shadow-2xl shadow-cyan-950/40 p-6 sm:p-8 animate-scaleIn overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="p-2.5 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-inner mb-3 flex items-center justify-center">
            <AngelLogo size="md" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[11px] font-semibold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Welcome to ANGEL</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white">
            How should Angel address you?
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm">
            Personalize what Angel calls you during conversations and choose your companion avatar.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Preferred Name / Nickname */}
          <div>
            <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
              Your Preferred Name or Nickname
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 w-4 h-4 text-cyan-400" />
              <input
                id="input-welcome-preferred-name"
                type="text"
                required
                autoFocus
                placeholder="e.g. Mercy, Alex, Sam"
                value={preferredNameInput}
                onChange={(e) => setPreferredNameInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm font-medium rounded-xl bg-neutral-950/90 border border-neutral-700 text-white placeholder:text-neutral-600 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 focus:outline-hidden transition"
              />
            </div>
            <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                Angel will greet you with:{" "}
                <strong className="text-cyan-300 font-semibold">
                  "{preferredNameInput.trim() ? `Hey ${preferredNameInput.trim()}, what's up?` : "Hey there!"}"
                </strong>
              </span>
            </p>
          </div>

          {/* Character Avatar Picker */}
          <div>
            <label className="block text-xs font-semibold text-neutral-200 mb-1.5">
              Choose Your Character Avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1.5 rounded-2xl bg-neutral-950/60 border border-neutral-850">
              {CHARACTER_AVATARS.map((av) => {
                const isSelected = selectedAvatarId === av.id;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setSelectedAvatarId(av.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      isSelected
                        ? "bg-cyan-500/20 border-cyan-400 ring-2 ring-cyan-500/40 shadow-xs scale-105"
                        : "bg-neutral-900/60 border-neutral-800 hover:bg-neutral-800 hover:border-neutral-700"
                    }`}
                    title={av.name}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${av.bgColor} text-lg shadow-xs`}
                    >
                      <span role="img" aria-label={av.name}>
                        {av.emoji}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] truncate max-w-full font-medium ${
                        isSelected ? "text-cyan-300 font-semibold" : "text-neutral-400"
                      }`}
                    >
                      {av.name.split(" ")[1] || av.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              id="btn-welcome-save-continue"
              type="submit"
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-neutral-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition disabled:opacity-50"
            >
              <span>Continue with Angel</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
