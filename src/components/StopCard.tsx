"use client";

import React from "react";
import { Stop } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import PhraseCard from "./PhraseCard";

interface StopCardProps {
  stop: Stop;
  index: number;
  isFirst: boolean;
  onCardClick?: (placeId: string) => void;
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

export default function StopCard({ stop, isFirst, onCardClick }: StopCardProps) {
  const { lang, t } = useLang();
  const primaryCategory = stop.place.categories[0] || "heritage";
  const catStyle = CATEGORY_COLORS[primaryCategory] || CATEGORY_COLORS.heritage;

  const durationHours = (stop.duration_min / 60).toFixed(1).replace(/\.0$/, "");
  const durationText = `${durationHours} ${t("common.hours")}`;

  const feeText =
    stop.place.entry_inr === 0
      ? t("common.free")
      : `${t("common.about")} ₹${stop.place.entry_inr}`;

  const placeName = lang === "kn" ? stop.place.name_kn : stop.place.name_en;
  const description =
    lang === "kn"
      ? stop.place.desc_kn || stop.place.desc_en
      : stop.note_en || stop.place.desc_en;

  return (
    <div
      id={`stop-card-${stop.place_id}`}
      className="relative flex flex-col group transition-all scroll-mt-24"
      onClick={() => onCardClick?.(stop.place_id)}
    >
      {/* Travel connector chip from previous stop */}
      {!isFirst && stop.travel_from_prev && (
        <div className="flex items-center gap-3 py-3 pl-16 sm:pl-20">
          <div className="h-6 w-0.5 bg-[#DCE1DD]" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F2F4F1] border border-[#DCE1DD] text-[#586673]">
            <span>
              {stop.travel_from_prev.min} {t("common.minutes")} by {stop.travel_from_prev.mode}
            </span>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="flex items-start gap-4">
        {/* Timestamp on left */}
        <div className="w-12 sm:w-16 pt-3 text-sm font-bold text-[#14202B]">
          {stop.start}
        </div>

        {/* Card Body */}
        <div className="flex-1 bg-white rounded-2xl p-5 sm:p-6 border border-[#DCE1DD] shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading font-bold text-base sm:text-lg text-[#14202B]">
                {placeName}
              </h3>
              <p className="text-xs text-[#586673] mt-0.5">
                {durationText} · {lang === "kn" ? `ಪ್ರವೇಶ ${feeText}` : `entry ${feeText}`}
              </p>
            </div>

            {/* Category Pill */}
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold capitalize whitespace-nowrap ${catStyle.bg} ${catStyle.text}`}
            >
              {t(`form.categories.${primaryCategory}`, primaryCategory)}
            </span>
          </div>

          <p className="text-sm text-[#14202B]/85 mt-3 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Reusable Kannada Phrases for this stop (matching mockup 05) */}
      {stop.phrases && stop.phrases.length > 0 && (
        <PhraseCard phrases={stop.phrases} />
      )}
    </div>
  );
}
