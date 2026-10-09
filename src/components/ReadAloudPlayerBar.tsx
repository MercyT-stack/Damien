import React from "react";
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Square,
  SkipBack,
  SkipForward,
  Gauge,
  Sliders,
  ChevronDown,
} from "lucide-react";
import { UseReadAloudReturn } from "../hooks/useReadAloud";

interface ReadAloudPlayerBarProps {
  player: UseReadAloudReturn;
  className?: string;
}

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const ReadAloudPlayerBar: React.FC<ReadAloudPlayerBarProps> = ({
  player,
  className = "",
}) => {
  const {
    playbackState,
    isPlaying,
    isPaused,
    isConversationMode,
    activeMessageIndex,
    totalConversationMessages,
    currentSentence,
    speechRate,
    setSpeechRate,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    pause,
    resume,
    stop,
    nextMessage,
    prevMessage,
  } = player;

  const [showVoiceSelect, setShowVoiceSelect] = React.useState(false);

  if (playbackState === "idle") {
    return null;
  }

  const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);

  return (
    <div
      id="read-aloud-player-bar"
      className={`sticky bottom-2 z-30 mx-auto w-full max-w-2xl px-3 py-2.5 rounded-2xl bg-neutral-900/95 dark:bg-neutral-950/95 backdrop-blur-md border border-cyan-500/30 text-white shadow-xl shadow-cyan-950/20 animate-fadeIn ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
        {/* Left: Status & Audio wave */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-3.5">
                <span className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: "60%" }} />
                <span className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: "100%", animationDelay: "150ms" }} />
                <span className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
                <span className="w-1 bg-cyan-400 rounded-full animate-pulse" style={{ height: "80%", animationDelay: "450ms" }} />
              </div>
            ) : (
              <Volume2 className="w-4 h-4 opacity-70" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                {isConversationMode
                  ? `Reading History (${activeMessageIndex + 1}/${totalConversationMessages})`
                  : "Reading Message Aloud"}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono">
                Web Speech API
              </span>
            </div>
            <p className="text-xs text-neutral-300 truncate max-w-xs sm:max-w-md italic mt-0.5">
              {currentSentence ? `"${currentSentence}"` : "Auditory playback in progress..."}
            </p>
          </div>
        </div>

        {/* Right: Controls & Speed */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Conversation Prev/Next */}
          {isConversationMode && (
            <div className="flex items-center gap-1 border-r border-neutral-800 pr-2">
              <button
                id="btn-read-aloud-prev"
                onClick={prevMessage}
                disabled={activeMessageIndex <= 0}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition"
                title="Previous message"
                aria-label="Previous message"
              >
                <SkipBack className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-read-aloud-next"
                onClick={nextMessage}
                disabled={activeMessageIndex >= totalConversationMessages - 1}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:pointer-events-none transition"
                title="Next message"
                aria-label="Next message"
              >
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Play/Pause */}
          {isPlaying ? (
            <button
              id="btn-read-aloud-pause"
              onClick={pause}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition font-bold"
              title="Pause playback"
              aria-label="Pause playback"
            >
              <Pause className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              id="btn-read-aloud-resume"
              onClick={resume}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500 text-neutral-950 hover:bg-cyan-400 transition font-bold"
              title="Resume playback"
              aria-label="Resume playback"
            >
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          )}

          {/* Stop */}
          <button
            id="btn-read-aloud-stop"
            onClick={stop}
            className="p-2 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition"
            title="Stop playback"
            aria-label="Stop playback"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
          </button>

          {/* Speed Selector */}
          <div className="relative">
            <select
              id="select-read-aloud-speed"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="appearance-none bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium py-1 pl-2 pr-5 rounded-lg border border-neutral-700 cursor-pointer focus:outline-none focus:border-cyan-500"
              title="Speech Rate"
            >
              {SPEED_OPTIONS.map((rate) => (
                <option key={rate} value={rate}>
                  {rate}x
                </option>
              ))}
            </select>
            <ChevronDown className="w-2.5 h-2.5 text-neutral-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Voice Dropdown if available */}
          {availableVoices.length > 0 && (
            <div className="relative">
              <button
                id="btn-read-aloud-voice-menu"
                onClick={() => setShowVoiceSelect(!showVoiceSelect)}
                className={`p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition ${
                  showVoiceSelect ? "bg-neutral-800 text-cyan-400" : ""
                }`}
                title={selectedVoice ? `Voice: ${selectedVoice.name}` : "Select Speech Voice"}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {showVoiceSelect && (
                <div className="absolute right-0 bottom-full mb-2 w-64 p-2 rounded-xl bg-neutral-900 border border-neutral-800 shadow-xl z-50 animate-fadeIn text-xs">
                  <div className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider px-2 py-1">
                    System Speech Voice
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 mt-1 pr-1 custom-scrollbar">
                    {availableVoices.map((voice) => {
                      const isSelected = voice.voiceURI === selectedVoiceURI;
                      return (
                        <button
                          key={voice.voiceURI}
                          onClick={() => {
                            setSelectedVoiceURI(voice.voiceURI);
                            setShowVoiceSelect(false);
                          }}
                          className={`w-full text-left px-2 py-1.5 rounded-lg text-xs flex items-center justify-between ${
                            isSelected
                              ? "bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30"
                              : "text-neutral-300 hover:bg-neutral-800"
                          }`}
                        >
                          <span className="truncate">{voice.name}</span>
                          <span className="text-[10px] font-mono text-neutral-500 shrink-0 ml-1">
                            {voice.lang.split(/[-_]/)[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
