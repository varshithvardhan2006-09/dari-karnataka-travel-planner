import React from "react";

export default function PalaceScene({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full h-full object-cover ${className}`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="palaceSky" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F9D476" />
          <stop offset="55%" stopColor="#E58E45" />
          <stop offset="100%" stopColor="#C05621" />
        </linearGradient>
        <radialGradient id="palaceSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF7D6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#F9D476" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky Background */}
      <rect width="400" height="300" fill="url(#palaceSky)" />

      {/* Radiant Sun Glow */}
      <circle cx="280" cy="110" r="60" fill="url(#palaceSun)" />
      <circle cx="280" cy="110" r="28" fill="#FFFBEA" />

      {/* Distant Hills */}
      <path
        d="M-20 220 Q60 170 160 210 T360 190 T420 230 L420 300 L-20 300 Z"
        fill="#7B2329"
        opacity="0.35"
      />

      {/* Mysuru Palace Silhouette */}
      <path
        d="M20 300 L20 220 L35 220 L35 200 L45 200 L45 180 Q55 160 65 180 L65 200 L75 200 L75 220 L110 220
           L110 190 L125 190 L125 160 Q145 130 165 160 L165 190 L175 190 L175 220
           L185 220 L185 150 L195 150 L195 110 L200 80 L205 110 L205 150 L215 150 L215 220
           L225 220 L225 190 L235 190 L235 160 Q255 130 275 160 L275 190 L290 190 L290 220
           L325 220 L325 200 L335 200 L335 180 Q345 160 355 180 L355 200 L365 200 L365 220 L380 220 L380 300 Z"
        fill="#3D0B12"
      />

      {/* Foreground Courtyard and Arches */}
      <rect x="0" y="240" width="400" height="60" fill="#2A060C" />
      <path
        d="M40 240 Q55 215 70 240 M90 240 Q105 215 120 240 M140 240 Q155 215 170 240 M230 240 Q245 215 260 240 M280 240 Q295 215 310 240 M330 240 Q345 215 360 240"
        stroke="#E58E45"
        strokeWidth="3"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}