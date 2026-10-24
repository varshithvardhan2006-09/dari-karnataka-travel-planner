import React from "react";

export default function HampiScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full object-cover ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="hampiSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE3A7" />
          <stop offset="60%" stopColor="#E29A4D" />
          <stop offset="100%" stopColor="#AA5C20" />
        </linearGradient>
        <radialGradient id="hampiSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF9E6" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#FDE3A7" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky Background */}
      <rect width="400" height="300" fill="url(#hampiSky)" />

      {/* Rising Sun */}
      <circle cx="100" cy="85" r="55" fill="url(#hampiSun)" />
      <circle cx="100" cy="85" r="24" fill="#FFFBE6" />

      {/* Rugged Granite Boulders Ridge (Midground) */}
      <path
        d="M-20 230 C20 180 60 190 90 210 C120 170 170 185 200 220 C230 190 280 200 310 225 C340 195 380 210 420 240 L420 300 L-20 300 Z"
        fill="#663A1E"
        opacity="0.4"
      />

      {/* Foreground Monolithic Boulders and Virupaksha Gopuram */}
      <path
        d="M-10 250 C30 220 70 230 110 260 L140 260 L140 240 L160 240 L160 210 L175 210 L175 180 L185 180 L185 150 L195 150 L195 110 L200 80 L205 110 L205 150 L215 150 L215 180 L225 180 L225 210 L240 210 L240 240 L260 240 L260 260
           C290 235 330 225 360 245 C380 230 405 240 420 255 L420 300 L-10 300 Z"
        fill="#381D0E"
      />

      {/* Boulder Rocks in the Foreground */}
      <ellipse cx="60" cy="275" rx="55" ry="32" fill="#241209" />
      <ellipse cx="120" cy="285" rx="40" ry="22" fill="#1C0D07" />
      <ellipse cx="340" cy="280" rx="65" ry="38" fill="#241209" />
    </svg>
  );
}