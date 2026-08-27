import React from "react";
import { Mic, MicOff, Pause, Play, PhoneOff, Sparkles } from "lucide-react";
import { useVoice } from "../contexts/VoiceContext";
import { AngelVoiceEmblem } from "./AngelVoiceEmblem";
import { motion, AnimatePresence } from "motion/react";

export const AngelLiveBanner: React.FC = () => {
  const {
    isVoiceActive,
    voiceState,
    isMuted,
    isPaused,
    currentVolume,
    selectedVoice,
    wakeWordDetected,
    toggleMute,
    pauseVoice,
    resumeVoice,
    stopVoiceSession,
  } = useVoice();

  if (!isVoiceActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        id="angel-live-inchat-banner"
        className="sticky top-0 z-30 mb-6 p-4 rounded-2xl bg-neutral-900/95 dark:bg-neutral-900/95 border border-cyan-500/40 shadow-xl backdrop-blur-md text-neutral-100 transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left: Emblem + Live Indicator & Rhythm Transmitter */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <AngelVoiceEmblem state={voiceState} volume={currentVolume} size="sm" />

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Live Rhythm Transmitter Visualizer */}
                <div className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-neutral-950/60 border border-neutral-800 h-6">
                  {[0.4, 0.8, 1.0, 0.6, 0.9, 0.5, 0.7].map((factor, idx) => {
                    const height = voiceState === "speaking" || (!isPaused && currentVolume > 0.05)
                      ? Math.max(4, Math.min(20, Math.round(factor * (currentVolume * 30 + 6))))
                      : 3;
                    return (
                      <motion.span
                        key={idx}
                        className="w-1 rounded-full bg-gradient-to-t from-cyan-500 to-cyan-300"
                        animate={{ height }}
                        transition={{ duration: 0.1, ease: "easeOut" }}
                      />
                    );
                  })}
                </div>

                {wakeWordDetected && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-400 text-neutral-950 text-[10px] font-bold animate-bounce">
                    <Sparkles className="w-3 h-3" />
                    Wake Word Detected
                  </span>
                )}
              </div>

              <div className="text-xs text-neutral-300 mt-1 flex items-center gap-2">
                <span>
                  Voice: <strong className="text-cyan-400 font-semibold">{selectedVoice.name}</strong>
                </span>
                {isPaused && (
                  <>
                    <span className="text-neutral-500">•</span>
                    <span className="text-cyan-400/90 text-[11px] font-medium">Paused</span>
                  </>
                )}
                {voiceState === "speaking" && !isPaused && (
                  <>
                    <span className="text-neutral-500">•</span>
                    <span className="text-cyan-300 text-[11px] font-medium">Speaking</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Controls (Mute, Pause/Play, End Live) */}
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {/* Mute Toggle */}
            <button
              id="btn-live-toggle-mute"
              type="button"
              onClick={toggleMute}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isMuted
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30"
                  : "bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700"
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-cyan-400" />}
              <span className="hidden md:inline">{isMuted ? "Muted" : "Mute"}</span>
            </button>

            {/* Pause / Resume */}
            <button
              id="btn-live-toggle-pause"
              type="button"
              onClick={isPaused ? resumeVoice : pauseVoice}
              className="p-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-200 border border-neutral-700 hover:bg-neutral-700 transition"
              title={isPaused ? "Resume Live Session" : "Pause Live Session"}
            >
              {isPaused ? <Play className="w-4 h-4 text-cyan-400" /> : <Pause className="w-4 h-4 text-neutral-300" />}
            </button>

            {/* End Conversation Button */}
            <button
              id="btn-live-end-conversation"
              type="button"
              onClick={() => stopVoiceSession(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/50 flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
              title="End Live Conversation"
            >
              <PhoneOff className="w-3.5 h-3.5" />
              <span>End Live</span>
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
