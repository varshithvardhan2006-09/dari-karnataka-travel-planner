"use client";

import React, { useState } from "react";
import { Stop, TravelMode, Place } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import { DAY_PIN_COLORS } from "@/lib/geo";

interface StopCardProps {
  stop: Stop;
  index: number;
  isFirst: boolean;
  pinNumber?: number;
  dayNum?: number;
  onCardClick?: (placeId: string) => void;
  onSwap?: (placeId: string) => void;
  onRemove?: (placeId: string) => void;
  onToggleTravelMode?: (placeId: string, mode: TravelMode) => void;
  onShowToLocal?: (place: Place) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  heritage: { bg: "bg-[#F9EBEB]", text: "text-[#8E1F2F]" },
  food: { bg: "bg-[#FDF2CC]", text: "text-[#8C6D05]" },
  culture: { bg: "bg-[#E1ECF5]", text: "text-[#2B5F8A]" },
  spiritual: { bg: "bg-[#DDEFE7]", text: "text-[#1E6B52]" },
  nature: { bg: "bg-[#DDEFE7]", text: "text-[#1E6B52]" },
  adventure: { bg: "bg-[#FDF2CC]", text: "text-[#B8860B]" },
  beach: { bg: "bg-[#E1ECF5]", text: "text-[#2B5F8A]" },
  wildlife: { bg: "bg-[#DDEFE7]", text: "text-[#1E6B52]" },
  coffee: { bg: "bg-[#F5ECE5]", text: "text-[#734B26]" },
};

export default function StopCard({
  stop,
  index,
  isFirst,
  pinNumber,
  dayNum = 1,
  onCardClick,
  onSwap,
  onRemove,
  onToggleTravelMode,
  onShowToLocal,
}: StopCardProps) {
  const { lang, t } = useLang();
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [currentMode, setCurrentMode] = useState<TravelMode>(
    stop.travel_from_prev?.mode || "cab"
  );

  const primaryCategory = stop.place.categories[0] || "heritage";
  const catStyle = CATEGORY_COLORS[primaryCategory] || CATEGORY_COLORS.heritage;

  const durationHours = (stop.duration_min / 60).toFixed(1).replace(/\.0$/, "");
  const durationText = `${durationHours} ${t("common.hours", "h")}`;

  const feeText =
    stop.place.entry_inr === 0
      ? t("common.free", "Free")
      : `${t("common.about", "About")} ₹${stop.place.entry_inr}`;

  const placeName = lang === "kn" ? stop.place.name_kn : stop.place.name_en;
  const description =
    lang === "kn"
      ? stop.place.desc_kn || stop.place.desc_en
      : stop.note_en || stop.place.desc_en;

  const pinDisplay = pinNumber !== undefined ? pinNumber : index + 1;
  const pinBg = DAY_PIN_COLORS[dayNum] || "#8E1F2F";

  const handleModeChange = (newMode: TravelMode, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentMode(newMode);
    onToggleTravelMode?.(stop.place_id, newMode);
  };

  return (
    <div
      id={`stop-card-${stop.place_id}`}
      className="relative flex flex-col group transition-all scroll-mt-24"
    >
      {/* Travel Connector Chip between stops with Auto / Cab / Walk toggle */}
      {!isFirst && stop.travel_from_prev && (
        <div className="flex items-center gap-2 sm:gap-3 py-1.5 pl-8 sm:pl-14">
          <div className="h-5 w-0.5 bg-[#DCE1DD] ml-2 sm:ml-3 shrink-0" />
          <div className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-[#F7F9F6] border border-[#DCE1DD] text-[#586673] max-w-full">
            <svg
              className="w-3 h-3 text-[#586673] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="shrink-0">
              {stop.travel_from_prev.min} {t("common.minutes", "min")}
            </span>
            <span className="text-[#DCE1DD]">|</span>
            <div className="flex items-center gap-1 shrink-0">
              {(["auto", "cab", "walk"] as TravelMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={(e) => handleModeChange(mode, e)}
                  className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-semibold uppercase cursor-pointer transition-colors ${
                    currentMode === mode
                      ? "bg-[#14202B] text-white"
                      : "text-[#586673] hover:text-[#14202B] hover:bg-gray-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Stop Card Row */}
      <div
        className="flex items-start gap-2.5 sm:gap-4 cursor-pointer w-full min-w-0"
        onClick={() => onCardClick?.(stop.place_id)}
      >
        {/* Left Timing and Pin Number Column */}
        <div className="w-9 sm:w-14 pt-2.5 flex flex-col items-center shrink-0">
          <span className="text-[11px] sm:text-xs font-bold text-[#14202B]">{stop.start}</span>
          <div
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full text-white text-[10px] sm:text-[11px] font-bold flex items-center justify-center my-1 shadow-2xs shrink-0"
            style={{ backgroundColor: pinBg }}
          >
            {pinDisplay}
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#586673] font-medium leading-none">{durationText}</span>
        </div>

        {/* Card Body matching mockup 04 */}
        <div className="flex-1 min-w-0 bg-white rounded-2xl p-3.5 sm:p-5 border border-[#DCE1DD] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between gap-2 min-w-0">
            <div className="min-w-0 flex-1">
              <h3 className="font-heading font-bold text-sm sm:text-lg text-[#14202B] leading-snug break-words">
                {placeName}
              </h3>

              {/* Subline: Entry cost, best time, crowd */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] sm:text-xs text-[#586673] mt-1">
                <span>{feeText}</span>
                {stop.place.best_time_en && (
                  <>
                    <span>·</span>
                    <span>
                      {lang === "kn"
                        ? `ಉತ್ತಮ ಸಮಯ: ${stop.place.best_time_en}`
                        : `Best: ${stop.place.best_time_en}`}
                    </span>
                  </>
                )}
                {stop.place.crowd && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <span>{lang === "kn" ? "ಜನಸಂದಣಿ:" : "Crowd:"}</span>
                      <span className="font-semibold capitalize text-[#14202B]">
                        {stop.place.crowd}
                      </span>
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Category Pill */}
            <span
              className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-semibold capitalize whitespace-nowrap shrink-0 ${catStyle.bg} ${catStyle.text}`}
            >
              {t(`form.categories.${primaryCategory}`, primaryCategory)}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#14202B]/85 mt-2 leading-relaxed break-words">
            {description}
          </p>

          {/* Card Actions: Swap / Lock time / Remove / Drag handle */}
          <div className="mt-3 pt-2.5 border-t border-[#F1F3F0] flex flex-wrap items-center justify-between gap-y-1.5 text-[11px] sm:text-xs">
            <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5 min-w-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSwap?.(stop.place_id);
                }}
                className="inline-flex items-center gap-1 text-[#586673] hover:text-[#8E1F2F] cursor-pointer transition-colors font-medium py-0.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 16V4m0 0L3 8m4-4l4 4m6 4v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span>{lang === "kn" ? "ಬದಲಾಯಿಸಿ" : "Swap"}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLocked(!isLocked);
                }}
                className={`inline-flex items-center gap-1 cursor-pointer transition-colors font-medium py-0.5 ${
                  isLocked ? "text-[#1E6B52]" : "text-[#586673] hover:text-[#14202B]"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
                <span>
                  {isLocked
                    ? lang === "kn"
                      ? "ಲಾಕ್"
                      : "Locked"
                    : lang === "kn"
                    ? "ಸಮಯ ಲಾಕ್"
                    : "Lock time"}
                </span>
              </button>

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  `${stop.place.name_en}, ${stop.place.city}, Karnataka`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-[#586673] hover:text-[#8E1F2F] cursor-pointer transition-colors font-medium py-0.5"
                title={`Open ${stop.place.name_en} in Google Maps`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span>Maps ↗</span>
              </a>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onShowToLocal?.(stop.place);
                }}
                className="inline-flex items-center gap-1 text-[#8E1F2F] hover:text-[#6B1421] cursor-pointer transition-colors font-semibold py-0.5"
                title="Show to local driver (ಸ್ಥಳೀಯರಿಗೆ ತೋರಿಸಿ)"
              >
                <span>🌐</span>
                <span>{lang === "kn" ? "ಸ್ಥಳೀಯರಿಗೆ" : "Driver"}</span>
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove?.(stop.place_id);
                }}
                className="inline-flex items-center gap-1 text-[#586673] hover:text-red-700 cursor-pointer transition-colors font-medium py-0.5"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
                <span>{lang === "kn" ? "ತೆಗೆದುಹಾಕಿ" : "Remove"}</span>
              </button>
            </div>

            {/* Drag Handle Indicator */}
            <div
              className="text-[#DCE1DD] hover:text-[#586673] cursor-grab select-none font-mono text-xs tracking-tighter shrink-0 hidden sm:block"
              title="Drag to reorder"
            >
              ⠿⠿
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}