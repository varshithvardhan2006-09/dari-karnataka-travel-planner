"use client";

import React, { useEffect, useMemo } from "react";
import { Stop, Place } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import PlaceImage from "./PlaceImage";
import { playKannadaSpeech } from "@/lib/speech";
import { getGoogleMapsSearchUrl, getGoogleMapsDirectionsUrl } from "@/lib/maps";
import placesData from "../../data/places.json";

const allPlaces = placesData as Place[];

interface StopDetailDrawerProps {
  stop: Stop | null;
  isOpen: boolean;
  onClose: () => void;
  onSwapWith?: (alternative: Place) => void;
  onRemoveStop?: (placeId: string) => void;
  onShowToLocal?: (place: Place) => void;
}

export default function StopDetailDrawer({
  stop,
  isOpen,
  onClose,
  onSwapWith,
  onRemoveStop,
  onShowToLocal,
}: StopDetailDrawerProps) {
  const { lang } = useLang();

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

  const playPhraseAudio = (text: string, translit?: string) => {
    playKannadaSpeech(text, { translit });
  };

  if (!isOpen || !stop || !place) return null;

  // Accurate & precise Google Maps Search & Directions URLs using shared maps utility
  const googleMapsSearchUrl = getGoogleMapsSearchUrl(place);
  const googleMapsDirectionsUrl = getGoogleMapsDirectionsUrl(place);

  return (
    <div className="fixed inset-0 z-[1200] flex justify-end">
      {/* Scrim Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel (Fixed full height with locked header, scrollable body, and locked footer) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Stop details"
        className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* 1. Header Bar with Close Button (Fixed at top) */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md px-5 sm:px-6 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 border-b border-[#DCE1DD] flex items-center justify-between z-10">
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

        {/* 2. Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Image / Scene Slot */}
          <div className="h-56 relative w-full overflow-hidden bg-gray-100 shrink-0">
            <PlaceImage place={place} size="md" />
          </div>

          <div className="p-6 space-y-6">
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

            {/* Fact Grid (Entry, Time, Best time, Opening hours, Crowd, Location Coordinates) */}
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

                {place.best_time_en && (
                  <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                    <div className="text-[#586673] text-[11px]">Best time</div>
                    <div className="font-bold text-[#14202B] mt-0.5">
                      {place.best_time_en}
                    </div>
                  </div>
                )}

                {place.opening_hours && (
                  <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                    <div className="text-[#586673] text-[11px]">Opening hours</div>
                    <div className="font-bold text-[#14202B] mt-0.5">
                      {place.opening_hours}
                    </div>
                  </div>
                )}

                {place.crowd && (
                  <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                    <div className="text-[#586673] text-[11px]">Crowd</div>
                    <div className="font-bold text-[#14202B] mt-0.5 capitalize">
                      {place.crowd}
                    </div>
                  </div>
                )}

                <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD]">
                  <div className="text-[#586673] text-[11px]">Best season</div>
                  <div className="font-bold text-[#14202B] mt-0.5">
                    Oct to Feb (Pleasant)
                  </div>
                </div>

                {/* Precise GPS Coordinates Card */}
                <div className="p-2.5 bg-white rounded-xl border border-[#DCE1DD] col-span-2 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[#586673] text-[11px]">Location & Coordinates</div>
                    <div className="font-bold text-[#14202B] text-xs mt-0.5">
                      {place.city} · {place.lat.toFixed(4)}°N, {place.lng.toFixed(4)}°E
                    </div>
                  </div>
                  <a
                    href={googleMapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-[#F9EBEB] text-[#8E1F2F] hover:bg-[#8E1F2F] hover:text-white transition-colors text-xs font-bold flex items-center gap-1 shrink-0"
                  >
                    <span>View Map</span>
                    <span>↗</span>
                  </a>
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
                        onClick={() => playPhraseAudio(ph.kn, ph.translit)}
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
                <div className="flex items-center justify-between">
                  <h3 className="font-heading font-bold text-sm text-[#14202B]">
                    Swap with something similar
                  </h3>
                  <span className="text-xs text-[#586673]">
                    {alternatives.length} options
                  </span>
                </div>
                <div className="space-y-2.5">
                  {alternatives.map((alt) => (
                    <div
                      key={alt.id}
                      className="p-3 rounded-xl bg-white border border-[#DCE1DD] flex items-center justify-between gap-3 text-xs shadow-2xs hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-[#14202B]">{alt.name_en}</div>
                        <div className="text-[11px] text-[#586673] mt-0.5">
                          {alt.city} · {alt.entry_inr === 0 ? "Free" : `₹${alt.entry_inr}`} · <span className="capitalize">{alt.categories[0]}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a
                          href={getGoogleMapsSearchUrl(alt)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1.5 rounded-lg border border-[#DCE1DD] hover:bg-gray-100 text-[#586673] hover:text-[#14202B] text-[11px] font-semibold transition-colors"
                          title={`View ${alt.name_en} on Google Maps`}
                        >
                          Maps ↗
                        </a>
                        <button
                          type="button"
                          onClick={() => onSwapWith?.(alt)}
                          className="px-3 py-1.5 rounded-lg bg-[#F1F3F0] hover:bg-[#8E1F2F] hover:text-white text-[#14202B] font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Swap
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Sticky Action Footer (Always 100% visible, fully padded, never cut off!) */}
        <div className="shrink-0 bg-white/95 backdrop-blur-md px-5 sm:px-6 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] border-t border-[#DCE1DD] shadow-lg z-20 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (place) {
                onShowToLocal?.(place);
              }
            }}
            className="w-full py-3 px-4 rounded-xl bg-[#6B1421] hover:bg-[#520f19] text-white text-xs font-bold text-center shadow-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span className="text-sm">🌐</span>
            <span>{lang === "kn" ? "ಸ್ಥಳೀಯ ಚಾಲಕರಿಗೆ ತೋರಿಸಿ (Show to Local)" : "Show to Local Driver (ಸ್ಥಳೀಯರಿಗೆ ತೋರಿಸಿ)"}</span>
          </button>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <a
              href={googleMapsSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-xl bg-[#8E1F2F] hover:bg-[#781926] text-white text-xs font-bold text-center shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <svg
                className="w-4 h-4 fill-current shrink-0"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>Open in Google Maps ↗</span>
            </a>

            <a
              href={googleMapsDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 rounded-xl bg-[#F1F3F0] hover:bg-gray-200 text-[#14202B] text-xs font-bold text-center transition-all active:scale-95 flex items-center justify-center gap-1 shrink-0"
              title="Get driving directions in Google Maps"
            >
              <span>Directions 🧭</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onRemoveStop?.(stop.place_id);
                onClose();
              }}
              className="py-3 px-3.5 rounded-xl bg-white border border-[#DCE1DD] text-red-700 hover:bg-red-50 text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
