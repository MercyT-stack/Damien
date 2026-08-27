import React, { useState } from "react";
import {
  Mic,
  MicOff,
  Pause,
  Play,
  PhoneOff,
  Sliders,
  Volume2,
  Minimize2,
  Maximize2,
  Sparkles,
  MessageSquare,
  Globe,
  Radio,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useVoice } from "../contexts/VoiceContext";
import { useAuth } from "../contexts/AuthContext";
import { AngelVoiceEmblem } from "./AngelVoiceEmblem";
import { AngelLogo } from "./AngelLogo";
import { UserAvatar } from "./UserAvatar";

export const LiveVoiceOverlay: React.FC = () => {
  const {
    isVoiceActive,
    voiceState,
    isMuted,
    isPaused,
    currentVolume,
    selectedVoice,
    voiceSettings,
    liveTranscript,
    toggleMute,
    pauseVoice,
    resumeVoice,
    stopVoiceSession,
    setIsVoiceLibraryOpen,
  } = useVoice();

  const { user } = useAuth();
  const [isMinimized, setIsMinimized] = useState<boolean>(true);

  if (!isVoiceActive) return null;

  return (
    <AnimatePresence>
      {isMinimized ? (
        /* Minimized floating voice pill in bottom-right */
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          id="minimized-voice-pill"
          className="fixed bottom-24 right-6 z-40 flex items-center gap-3 p-2.5 px-4 bg-neutral-900/95 backdrop-blur-lg border border-cyan-500/40 rounded-full shadow-2xl text-neutral-100"
        >
          <AngelVoiceEmblem state={voiceState} volume={currentVolume} size="sm" />
          
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-neutral-100 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              Angel Live Voice
            </span>
            <span className="text-[10px] text-neutral-400 capitalize">
              {isPaused ? "Paused" : voiceState} • {selectedVoice.name}
            </span>
          </div>

          <div className="flex items-center gap-1 ml-2 border-l border-neutral-800 pl-2">
            <button
              id="minimized-mute-btn"
              onClick={toggleMute}
              className={`p-1.5 rounded-full text-xs transition ${
                isMuted ? "bg-red-500/20 text-red-400" : "text-neutral-400 hover:text-neutral-100"
              }`}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <button
              id="expand-voice-overlay-btn"
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-100"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              id="minimized-end-btn"
              onClick={() => stopVoiceSession(true)}
              className="p-1.5 rounded-full bg-red-600/30 text-red-300 hover:bg-red-600/50"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      ) : (
        /* Full Immersive Voice Studio View */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          id="live-voice-overlay"
          className="fixed inset-0 z-40 flex flex-col bg-neutral-950/95 backdrop-blur-xl text-neutral-100"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-950/50">
            <div className="flex items-center space-x-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-medium">
                <Radio className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
                <span>Live Audio Session</span>
              </div>
              <span className="text-xs text-neutral-400 hidden sm:inline">
                Voice: <strong className="text-neutral-200">{selectedVoice.name}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="voice-studio-settings-btn"
                onClick={() => setIsVoiceLibraryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-neutral-100 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-neutral-700 transition"
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Voice Studio</span>
              </button>

              <button
                id="minimize-voice-overlay-btn"
                onClick={() => setIsMinimized(true)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 transition"
                title="Dock Voice Overlay"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Central Voice Stage */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto w-full">
            {/* Angel Voice Animated Emblem */}
            <div className="my-6">
              <AngelVoiceEmblem state={voiceState} volume={currentVolume} size="xl" />
            </div>

            {/* Status Heading */}
            <div className="space-y-1 mb-6">
              <h2 className="text-2xl font-medium tracking-tight text-neutral-100 font-serif">
                {isPaused
                  ? "Listening Paused"
                  : voiceState === "speaking"
                  ? "Angel is speaking..."
                  : voiceState === "processing"
                  ? "Angel is thinking..."
                  : voiceState === "listening"
                  ? "Listening to you..."
                  : voiceState === "interrupted"
                  ? "Listening..."
                  : "Connecting to Angel Live..."}
              </h2>
              <p className="text-xs text-neutral-400">
                Speak naturally. Interrupt whenever you want or give voice commands.
              </p>
            </div>

            {/* Live Captions / Transcription Stream */}
            {voiceSettings.captions_enabled && (
              <div
                id="live-transcription-container"
                className="w-full max-h-56 overflow-y-auto p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left space-y-3 mb-6 shadow-inner"
              >
                {liveTranscript.user && (
                  <div className="flex items-start gap-2.5 justify-end">
                    <div className="p-3 rounded-2xl bg-white text-neutral-900 text-xs shadow-sm max-w-[85%]">
                      <div className="italic">{liveTranscript.user}</div>
                    </div>
                    <UserAvatar
                      avatarId={user?.avatar_id}
                      usernameOrEmail={user?.username || user?.email}
                      size="sm"
                      className="mt-0.5"
                    />
                  </div>
                )}

                {liveTranscript.assistant ? (
                  <div className="flex items-start gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-xl bg-neutral-900 border border-cyan-500/40 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <AngelLogo size="xs" />
                    </div>
                    <div className="flex-1 p-3.5 rounded-2xl bg-[#131314] border border-neutral-800 text-xs">
                      <div className="font-bold text-cyan-500 uppercase tracking-wider text-[11px]">
                        ANGEL
                      </div>
                      <div className="border-b border-neutral-800/80 my-2" />
                      <div className="text-neutral-200 leading-relaxed">
                        {liveTranscript.assistant}
                      </div>
                    </div>
                  </div>
                ) : (
                  !liveTranscript.user && (
                    <div className="text-xs text-neutral-400 text-center italic py-3 flex items-center justify-center gap-2">
                      <AngelLogo size="xs" />
                      <span>Live transcript with Angel will appear here as you speak...</span>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Voice Command Hints Pill */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-neutral-400">
              <span className="font-medium text-neutral-300">Spoken Commands:</span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800">
                "Angel, pause"
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800">
                "Angel, continue"
              </span>
              <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800">
                "Angel, stop"
              </span>
            </div>
          </div>

          {/* Bottom Floating Control Bar */}
          <div className="p-6 pb-10 flex items-center justify-center border-t border-neutral-800/60 bg-neutral-950/60">
            <div className="flex items-center gap-4 p-2 px-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 shadow-2xl backdrop-blur-xl">
              {/* Mute Toggle */}
              <button
                id="voice-mute-btn"
                onClick={toggleMute}
                className={`p-4 rounded-full transition-all flex items-center justify-center ${
                  isMuted
                    ? "bg-red-500/20 text-red-400 border border-red-500/40"
                    : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Pause / Resume */}
              <button
                id="voice-pause-resume-btn"
                onClick={isPaused ? resumeVoice : pauseVoice}
                className="p-4 rounded-full bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition flex items-center justify-center"
                title={isPaused ? "Resume Listening" : "Pause Listening"}
              >
                {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
              </button>

              {/* Switch to Chat/Typing */}
              <button
                id="voice-switch-to-chat-btn"
                onClick={() => setIsMinimized(true)}
                className="p-4 rounded-full bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition flex items-center justify-center"
                title="Switch to typing / dock"
              >
                <MessageSquare className="w-5 h-5" />
              </button>

              {/* End Voice Session */}
              <button
                id="voice-end-session-btn"
                onClick={() => stopVoiceSession(true)}
                className="p-4 rounded-full bg-red-600 text-white hover:bg-red-700 transition flex items-center justify-center shadow-lg shadow-red-600/30"
                title="End Voice Call"
              >
                <PhoneOff className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
