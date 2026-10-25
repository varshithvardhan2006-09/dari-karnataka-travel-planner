"use client";

import React, { useState } from "react";
import placesData from "../../data/places.json";
import { Place } from "@/lib/schema";

const allPlaces = placesData as Place[];

interface KarnatakaMapSvgProps {
  selectedRegion?: string;
  onSelectPlace?: (place: Place) => void;
}

// Convert geographic lat/lng to SVG viewBox coordinates [0..300, 0..380]
function projectToSvg(lat: number, lng: number): [number, number] {
  const minLat = 11.5;
  const maxLat = 18.5;
  const minLng = 74.0;
  const maxLng = 78.6;

  const x = ((lng - minLng) / (maxLng - minLng)) * 260 + 20;
  const y = ((maxLat - lat) / (maxLat - minLat)) * 340 + 20;
  return [Math.round(x), Math.round(y)];
}

// Approximate simplified Karnataka state border polygon with accurate coastal boundary
const KARNATAKA_BORDER_PATH =
  "M 60,75 L 105,40 L 160,25 L 210,45 L 225,95 L 205,140 L 235,175 L 255,230 L 230,270 L 210,310 L 160,355 L 115,340 L 75,295 L 45,245 L 25,185 L 38,125 Z";

export default function KarnatakaMapSvg({
  selectedRegion = "all",
  onSelectPlace,
}: KarnatakaMapSvgProps) {
  const [hoveredPlace, setHoveredPlace] = useState<Place | null>(null);

  const isPlaceHighlighted = (place: Place) => {
    if (selectedRegion === "all") return true;
    if (selectedRegion === "mysuru" && (place.region === "Mysuru" || place.region === "Hassan")) return true;
    if (selectedRegion === "hampi" && (place.region === "Hampi-Ballari" || place.region === "Badami-Bagalkot")) return true;
    if (selectedRegion === "coast" && (place.region === "Coast" || place.region === "North Kannada")) return true;
    if (selectedRegion === "hills" && (place.region === "Coorg" || place.region === "Chikkamagaluru")) return true;
    if (selectedRegion === "bengaluru" && place.region === "Bengaluru") return true;
    if (selectedRegion === "north" && (place.region === "Kalyana-Karnataka" || place.region === "Dharwad-Hubballi")) return true;
    return false;
  };

  return (
    <div className="relative w-full aspect-[4/5] max-w-[340px] mx-auto bg-[#F1F3F0]/60 rounded-2xl p-3 border border-[#DCE1DD] flex items-center justify-center">
      <svg
        viewBox="0 0 300 380"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Karnataka State Boundary Fill */}
        <path
          d={KARNATAKA_BORDER_PATH}
          fill="#DCE5DD"
          stroke="#B5C4B7"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Major River Curves (Kaveri & Krishna) */}
        <path
          d="M 65,315 Q 120,320 180,335 T 230,320"
          stroke="#9CB9AD"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4,4"
        />
        <path
          d="M 70,120 Q 140,110 190,135 T 235,130"
          stroke="#9CB9AD"
          strokeWidth="1.5"
          fill="none"
          strokeDasharray="4,4"
        />

        {/* Place Dots */}
        {allPlaces.map((place) => {
          const [cx, cy] = projectToSvg(place.lat, place.lng);
          const highlighted = isPlaceHighlighted(place);
          const isHovered = hoveredPlace?.id === place.id;

          return (
            <g
              key={place.id}
              className="cursor-pointer transition-all"
              onMouseEnter={() => setHoveredPlace(place)}
              onMouseLeave={() => setHoveredPlace(null)}
              onClick={() => onSelectPlace?.(place)}
            >
              <circle
                cx={cx}
                cy={cy}
                r={isHovered ? 6 : highlighted ? 4 : 2.5}
                fill={highlighted ? (isHovered ? "#8E1F2F" : "#C05621") : "#8A99A8"}
                stroke="#ffffff"
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>

      {/* Floating Hover Card */}
      {hoveredPlace && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/95 backdrop-blur-xs p-2 rounded-xl border border-[#DCE1DD] shadow-md text-xs pointer-events-none animate-in fade-in duration-150">
          <div className="font-bold text-[#14202B]">{hoveredPlace.name_en}</div>
          <div className="text-[11px] text-[#586673]">
            {hoveredPlace.city} · {hoveredPlace.categories[0]}
          </div>
        </div>
      )}
    </div>
  );
}
