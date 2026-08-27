import React from "react";
import { motion } from "motion/react";
import { VoiceState } from "../types";

interface AngelVoiceEmblemProps {
  state: VoiceState;
  volume: number; // 0 to 1
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
}

export const AngelVoiceEmblem: React.FC<AngelVoiceEmblemProps> = ({
  state,
  volume,
  size = "lg",
  className = "",
  onClick,
}) => {
  const sizeMap = {
    sm: "w-16 h-16",
    md: "w-28 h-28",
    lg: "w-44 h-44",
    xl: "w-64 h-64",
  };

  const isSpeaking = state === "speaking";
  const isListening = state === "listening";
  const isProcessing = state === "processing";
  const isPaused = state === "paused";
  const isError = state === "error";

  // Dynamic scale following audio volume rhythm smoothly
  const audioScale = !isPaused && (isSpeaking || isListening) && volume > 0.01
    ? 1 + Math.min(volume * 0.35, 0.35)
    : 1;

  const glowOpacity = isPaused
    ? 0.1
    : isSpeaking
    ? 0.65 + Math.min(volume * 0.45, 0.45)
    : isListening
    ? 0.35
    : 0.2;

  return (
    <div
      id="angel-voice-emblem"
      onClick={onClick}
      className={`relative flex items-center justify-center cursor-pointer select-none transition-transform active:scale-95 ${sizeMap[size]} ${className}`}
    >
      {/* Outer Audio Ripple Ring 1 (Cyan) */}
      {!isPaused && isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-400/40"
          animate={{
            scale: [1, 1.35 + volume * 0.4, 1.7 + volume * 0.5],
            opacity: [0.7, 0.25, 0],
          }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}

      {/* Outer Audio Ripple Ring 2 */}
      {!isPaused && isSpeaking && (
        <motion.div
          className="absolute inset-0 rounded-full border border-cyan-500/25"
          animate={{
            scale: [1, 1.25 + volume * 0.3, 1.55 + volume * 0.4],
            opacity: [0.6, 0.2, 0],
          }}
          transition={{
            duration: 1.4,
            delay: 0.35,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      )}

      {/* Processing Orbit Shimmer */}
      {!isPaused && isProcessing && (
        <motion.div
          className="absolute inset-[-8px] rounded-full border-2 border-t-cyan-400 border-r-cyan-500/40 border-b-transparent border-l-transparent"
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}

      {/* Ambient Glow Core */}
      <div
        className="absolute inset-2 rounded-full transition-all duration-300 blur-xl pointer-events-none"
        style={{
          backgroundColor: isError
            ? "rgba(239, 68, 68, 0.35)"
            : isPaused
            ? "rgba(6, 182, 212, 0.1)"
            : "rgba(0, 229, 255, 0.4)",
          opacity: glowOpacity,
        }}
      />

      {/* Main Orb Background with Smooth Rhythm Scaling */}
      <motion.div
        className="relative w-full h-full rounded-full flex items-center justify-center bg-gradient-to-b from-neutral-900 via-neutral-950 to-black border border-cyan-500/35 shadow-[0_0_25px_rgba(0,229,255,0.25)] overflow-hidden"
        animate={{ scale: audioScale }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Subtle radial cyan backdrop */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent pointer-events-none" />

        {/* Central Neon Cyan Hexagon Logo SVG */}
        <svg
          viewBox="0 0 100 100"
          className="w-3/5 h-3/5 drop-shadow-[0_0_14px_rgba(0,229,255,0.7)] select-none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Primary Neon Cyan Gradient */}
            <linearGradient id="liveNeonCyanMain" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#70F8FF" />
              <stop offset="30%" stopColor="#00E5FF" />
              <stop offset="70%" stopColor="#00C8F8" />
              <stop offset="100%" stopColor="#0096D6" />
            </linearGradient>

            {/* Inner Core Glow Gradient */}
            <radialGradient id="liveCyanCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#70F8FF" />
              <stop offset="80%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#0096D6" />
            </radialGradient>

            {/* Ambient Cyan Aura Glow Filter */}
            <filter id="liveCyanGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.8" result="blur" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0   0 0 0 0 0.9   0 0 0 0 1   0 0 0 0.95 0"
                result="coloredBlur"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle soft backdrop bloom */}
            <radialGradient id="liveBackdropCyanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity={isSpeaking ? 0.45 + volume * 0.4 : 0.25} />
              <stop offset="65%" stopColor="#00C8F8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Aura */}
          <circle cx="50" cy="50" r="42" fill="url(#liveBackdropCyanGlow)" />

          {/* Outer Neon Hexagon */}
          <polygon
            points="50,9 85.5,29.5 85.5,70.5 50,91 14.5,70.5 14.5,29.5"
            stroke="url(#liveNeonCyanMain)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#liveCyanGlow)"
          />

          {/* Outer Hexagon Specular Core Stroke */}
          <polygon
            points="50,9 85.5,29.5 85.5,70.5 50,91 14.5,70.5 14.5,29.5"
            stroke="#E0FBFF"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />

          {/* Inner Concentric Hexagon with dynamic breathing on speech */}
          <motion.polygon
            points="50,25 71.6,37.5 71.6,62.5 50,75 28.4,62.5 28.4,37.5"
            stroke="url(#liveNeonCyanMain)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#liveCyanGlow)"
            animate={
              isSpeaking
                ? { scale: [1, 1.08 + volume * 0.2, 1] }
                : isListening
                ? { scale: [0.96, 1.04, 0.96] }
                : { scale: 1 }
            }
            transition={{
              duration: isSpeaking ? 0.35 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ originX: "50px", originY: "50px" }}
          />

          {/* Inner Hexagon Specular Core */}
          <polygon
            points="50,25 71.6,37.5 71.6,62.5 50,75 28.4,62.5 28.4,37.5"
            stroke="#E0FBFF"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Center Glowing Dot / Node */}
          <motion.circle
            cx="50"
            cy="50"
            r={isSpeaking ? 5.5 + volume * 2.5 : 5.5}
            fill="url(#liveCyanCoreGlow)"
            filter="url(#liveCyanGlow)"
          />

          {/* Central Bright Spark Highlight */}
          <circle cx="50" cy="50" r={isSpeaking ? 2 + volume * 0.8 : 2} fill="#FFFFFF" />
        </svg>
      </motion.div>
    </div>
  );
};

