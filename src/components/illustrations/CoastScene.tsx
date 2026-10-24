import React from "react";

export default function CoastScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full object-cover ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="coastSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEE4B3" />
          <stop offset="50%" stopColor="#F9BE7E" />
          <stop offset="100%" stopColor="#E58A54" />
        </linearGradient>
        <linearGradient id="arabianSea" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E6B52" />
          <stop offset="60%" stopColor="#185642" />
          <stop offset="100%" stopColor="#0F3B2C" />
        </linearGradient>
        <radialGradient id="coastSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9E5" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FEE4B3" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky */}
      <rect width="400" height="300" fill="url(#coastSky)" />

      {/* Sunset over Arabian Sea */}
      <circle cx="310" cy="170" r="50" fill="url(#coastSun)" />
      <circle cx="310" cy="170" r="26" fill="#FFFBE8" />

      {/* Distant Headland (Om Beach / Gokarna cliffs) */}
      <path
        d="M0 195 Q90 180 180 195 T340 195 L400 200 L400 300 L0 300 Z"
        fill="#0F382B"
        opacity="0.3"
      />

      {/* Arabian Sea Waves */}
      <path
        d="M0 200 C80 195 140 210 220 200 C300 192 350 205 400 200 L400 300 L0 300 Z"
        fill="url(#arabianSea)"
      />

      {/* Shoreline Sand Curve */}
      <path
        d="M-10 260 C60 250 140 270 240 260 C320 252 380 270 410 265 L410 300 L-10 300 Z"
        fill="#C48E4D"
      />

      {/* Silhouette Coconut Palm Tree */}
      <path
        d="M70 300 C68 250 72 200 80 140 C83 140 85 250 82 300 Z"
        fill="#0D261E"
      />
      {/* Palm fronds */}
      <path
        d="M80 140 Q40 115 10 135 Q50 130 80 140
           M80 140 Q60 90 40 80 Q65 110 80 140
           M80 140 Q95 70 120 75 Q100 105 80 140
           M80 140 Q130 95 155 120 Q120 125 80 140
           M80 140 Q110 155 130 180 Q105 160 80 140
           M80 140 Q30 150 15 175 Q45 155 80 140"
        stroke="#0D261E"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}