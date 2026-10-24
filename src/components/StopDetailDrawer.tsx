"use client";

import React, { useEffect, useMemo } from "react";
import { Stop, Place } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import PlaceImage from "./PlaceImage";
import { playKannadaSpeech } from "@/lib/speech";
import placesData from "../../data/places.json";

const allPlaces = placesData as Place[];

interface StopDetailDrawerProps {
  stop: Stop | null;
  isOpen: boolean;
  onClose: () => void;
  onSwapWith?: (alternative: Place) => void;
  onRemoveStop?: (placeId: string) => void;
}

export default function StopDetailDrawer({
  stop,
  isOpen,
  onClose,
  onSwapWith,
  onRemoveStop,
}: StopDetailDrawerProps) {
  const { lang, t } = useLang();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const place = stop?.place;

  // Find 2 to 3 similar alternatives from the same area or category
  const alternatives = useMemo(() => {
    if (!place) return [];
    return allPlaces
      .filter(
        (p) =>
          p.id !== place.id &&
          (p.region === place.region || p.categories.some((c) => place.categories.includes(c)))
      )
      .slice(0, 3);
  }, [place]);

  const playPhraseAudio = (text: string) => {
    playKannadaSpeech(text);
  };

  if (!isOpen || !stop || !place) return null;

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;

  return (
    <div className="fixed inset-0 z-[1200] flex justify-end">
      {/* Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-y-auto animate-in slide-in-from-right duration-300">
        {/* Header Bar with Close Button */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-[#DCE1DD] flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8E1F2F] bg-[#F9EBEB] px-2.5 py-1 rounded-md">
              {stop.start}
            </span>
            <span className="text-xs font-semibold text-[#586673]">
              {(stop.duration_min / 60).toFixed(1).replace(/\.0$/, "")} hours needed
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#F1F3F0] text-[#14202B] hover:bg-gray-200 flex items-center justify-center font-bold text-sm cursor-pointer transition-colors"
            aria-label="Close details"
          >
            ✕
          </button>
        </div>

        {/* Hero Image / Scene Slot */}
        <div className="h-56 relative w-full overflow-hidden bg-gray-100">
          <PlaceImage place={place} size="md" />
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Title and Category */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading font-extrabold text-2xl text-[#14202B]">
                  {lang === "kn" ? place.name_kn : place.name_en}
                </h2>
                <div className="text-sm font-semibold text-[#8E1F2F] mt-0.5">
                  {lang === "kn" ? place.name_en : place.name_kn}
                </div>
              </div>
              <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase bg-[#FDF2CC] text-[#8C6D05] shrink-0">
                {place.categories[0]}
              </span>
            </div>
            <p className="text-sm text-[#14202B]/85 mt-3 leading-relaxed">
              {lang === "kn" ? place.desc_kn || place.desc_en : place.desc_en}
            </p>
          </div>

          {/* Fact Grid (Entry, Time, Best time, Opening hours, Crowd, Season) */}
          <div className="bg-[#F7F9F6] rounded-2xl p-4 border border-[#E2E7E2] space-y-3">
            <h3 className="font-heading font-bold text-xs uppercase tracking-wider text-[#586673]">
              Visiting Facts
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                <div className="text-[#586673] text-[11px]">Entry fee</div>
                <div className="font-bold text-[#14202B] mt-0.5">
                  {place.entry_inr === 0 ? "Free" : `About ₹${place.entry_inr}`}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                <div className="text-[#586673] text-[11px]">Time needed</div>
                <div className="font-bold text-[#14202B] mt-0.5">
                  {(place.duration_min / 60).toFixed(1).replace(/\.0$/, "")} hours
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                <div className="text-[#586673] text-[11px]">Best time</div>
                <div className="font-bold text-[#14202B] mt-0.5">
                  {place.best_time_en || "Morning before 11 AM"}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                <div className="text-[#586673] text-[11px]">Opening hours</div>
                <div className="font-bold text-[#14202B] mt-0.5">
                  {place.opening_hours || "08:30 AM – 06:00 PM"}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                <div className="text-[#586673] text-[11px]">Crowd</div>
                <div className="font-bold text-[#14202B] mt-0.5 capitalize">
                  {place.crowd || "Moderate"}
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                <div className="text-[#586673] text-[11px]">Best season</div>
                <div className="font-bold text-[#14202B] mt-0.5">
                  Oct to Feb (Pleasant)
                </div>
              </div>
            </div>

            <div className="text-[11px] text-[#586673] pt-1 flex items-center gap-1.5">
              <span className="text-[#1E6B52] font-bold">✓</span>
              <span>Estimates from our dataset. Prices change, so check before you book.</span>
            </div>
          </div>

          {/* Say It Here Phrases (from phrase_ids) */}
          {stop.phrases && stop.phrases.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#14202B]">
                Say it here in Kannada
              </h3>
              <div className="space-y-2">
                {stop.phrases.map((ph) => (
                  <div
                    key={ph.id}
                    className="p-3 bg-[#FDF7E7] rounded-xl border border-[#EADBBD] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="font-bold text-base text-[#14202B]">
                        {ph.kn}
                      </div>
                      <div className="text-[#8C6D05] font-medium mt-0.5">
                        {ph.translit}
                      </div>
                      <div className="text-[#586673] mt-0.5">
                        {ph.en}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => playPhraseAudio(ph.kn)}
                      className="w-8 h-8 rounded-lg bg-[#8E1F2F] text-white flex items-center justify-center shrink-0 hover:bg-[#781926] active:scale-95 cursor-pointer shadow-2xs"
                      title="Play audio"
                    >
                      ▶
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Swap with something similar */}
          {alternatives.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-heading font-bold text-sm text-[#14202B]">
                Swap with something similar
              </h3>
              <div className="space-y-2">
                {alternatives.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 rounded-xl bg-white border border-[#DCE1DD] flex items-center justify-between gap-3 text-xs shadow-2xs hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-bold text-[#14202B]">{alt.name_en}</div>
                      <div className="text-[11px] text-[#586673]">
                        {alt.city} · {alt.entry_inr === 0 ? "Free" : `₹${alt.entry_inr}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSwapWith?.(alt)}
                      className="px-3 py-1.5 rounded-lg bg-[#F1F3F0] hover:bg-[#8E1F2F] hover:text-white text-[#14202B] font-semibold text-xs transition-colors cursor-pointer"
                    >
                      Swap
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons: Open in Google Maps & Remove Stop */}
          <div className="pt-4 border-t border-[#F1F3F0] flex items-center gap-3">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-[#8E1F2F] hover:bg-[#781926] text-white text-xs font-bold text-center shadow-xs transition-all active:scale-95"
            >
              Open in Google Maps ↗
            </a>
            <button
              type="button"
              onClick={() => {
                onRemoveStop?.(stop.place_id);
                onClose();
              }}
              className="py-3 px-4 rounded-xl bg-white border border-[#DCE1DD] text-red-700 hover:bg-red-50 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              Remove Stop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}