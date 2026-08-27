import React from "react";

interface AngelLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  showText?: boolean;
}

export const AngelLogo: React.FC<AngelLogoProps> = ({
  size = "md",
  className = "",
  showText = false,
}) => {
  const sizeMap = {
    xs: "w-5 h-5",
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
    "2xl": "w-24 h-24",
  };

  return (
    <div id="angel-logo-container" className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Glowing Electric Cyan Concentric Hexagon with Center Node */}
      <div className={`relative flex items-center justify-center shrink-0 ${sizeMap[size]}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(0,229,255,0.65)] select-none"
        >
          <defs>
            {/* Primary Neon Cyan Gradient */}
            <linearGradient id="neonCyanMain" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#70F8FF" />
              <stop offset="30%" stopColor="#00E5FF" />
              <stop offset="70%" stopColor="#00C8F8" />
              <stop offset="100%" stopColor="#0096D6" />
            </linearGradient>

            {/* Inner Core Glow Gradient */}
            <radialGradient id="cyanCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor="#70F8FF" />
              <stop offset="80%" stopColor="#00E5FF" />
              <stop offset="100%" stopColor="#0096D6" />
            </radialGradient>

            {/* Ambient Cyan Aura Glow Filter */}
            <filter id="cyanGlow" x="-30%" y="-30%" width="160%" height="160%">
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
            <radialGradient id="backdropCyanGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.28" />
              <stop offset="65%" stopColor="#00C8F8" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Ambient Aura */}
          <circle cx="50" cy="50" r="42" fill="url(#backdropCyanGlow)" />

          {/* Outer Neon Hexagon */}
          <polygon
            points="50,9 85.5,29.5 85.5,70.5 50,91 14.5,70.5 14.5,29.5"
            stroke="url(#neonCyanMain)"
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#cyanGlow)"
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

          {/* Inner Concentric Hexagon */}
          <polygon
            points="50,25 71.6,37.5 71.6,62.5 50,75 28.4,62.5 28.4,37.5"
            stroke="url(#neonCyanMain)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#cyanGlow)"
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
          <circle
            cx="50"
            cy="50"
            r="5.5"
            fill="url(#cyanCoreGlow)"
            filter="url(#cyanGlow)"
          />

          {/* Central Bright Spark Highlight */}
          <circle cx="50" cy="50" r="2" fill="#FFFFFF" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="font-semibold tracking-[0.25em] text-sm uppercase text-neutral-900 dark:text-neutral-100 font-serif">
            ANGEL
          </span>
        </div>
      )}
    </div>
  );
};

