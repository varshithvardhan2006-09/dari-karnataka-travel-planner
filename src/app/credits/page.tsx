"use client";

import React from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";
import placesData from "../../../data/places.json";
import { Place } from "@/lib/schema";

const allPlaces = placesData as Place[];
const placesWithImages = allPlaces.filter((p) => Boolean(p.image));
const verifiedCount = allPlaces.filter((p) => p.verified).length;

const SOURCE_NAMES: Record<string, string> = {
  "https://karnatakatourism.org": "Karnataka Tourism (Department of Tourism, Government of Karnataka)",
  "https://asi.nic.in": "Archaeological Survey of India",
  "https://hampi.nic.in": "Hampi official portal",
  "https://coorg.nic.in": "Kodagu (Coorg) district portal",
  "https://chikkamagaluru.nic.in": "Chikkamagaluru district portal",
  "https://mysorepalace.karnataka.gov.in": "Mysore Palace Board",
  "https://mysorezoo.info": "Mysuru Zoo (Sri Chamarajendra Zoological Gardens)",
  "https://aranya.gov.in": "Karnataka Forest Department",
  "https://vidyarthibhavan.in": "Vidyarthi Bhavan (the restaurant's own site)",
};

// Counted from the dataset so the list can never drift from data/places.json.
const sourceCounts = Object.entries(
  allPlaces.reduce<Record<string, number>>((acc, p) => {
    if (p.source_url) acc[p.source_url] = (acc[p.source_url] || 0) + 1;
    return acc;
  }, {})
).sort((a, b) => b[1] - a[1]);

export default function CreditsPage() {
  const { lang } = useLang();

  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E1F2F] hover:underline mb-3"
        >
          <span>←</span>
          <span>{lang === "kn" ? "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ" : "Back to Home"}</span>
        </Link>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#14202B] tracking-tight">
          {lang === "kn" ? "ಕೃಪೆ ಮತ್ತು ಡೇಟಾ ಮೂಲಗಳು" : "Credits & Data Sources"}
        </h1>
        <p className="text-sm text-[#586673] mt-2 max-w-2xl leading-relaxed">
          {lang === "kn"
            ? "ದಾರಿ ಪ್ರಸ್ತುತ ತನ್ನದೇ ಆದ SVG ಚಿತ್ರಣಗಳನ್ನು ಬಳಸುತ್ತದೆ. ಮುಂದೆ ಸೇರಿಸುವ ಯಾವುದೇ ವಿಕಿಮೀಡಿಯಾ ಕಾಮನ್ಸ್ ಫೋಟೋಗಳನ್ನು ಅವುಗಳ ಪರವಾನಗಿಯೊಂದಿಗೆ ಕೆಳಗೆ ಪಟ್ಟಿ ಮಾಡಲಾಗುತ್ತದೆ."
            : "Dari currently uses its own SVG illustrations. Any Wikimedia Commons photos added later are listed below with their licence."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DCE1DD] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F7F9F6] border-b border-[#DCE1DD] text-xs font-bold text-[#14202B] uppercase tracking-wider">
          {placesWithImages.length === 0
            ? lang === "kn"
              ? "ಛಾಯಾಚಿತ್ರ ಕೃಪೆ"
              : "Photo credits"
            : lang === "kn"
              ? `ವಿಕಿಮೀಡಿಯಾ ಕಾಮನ್ಸ್ ಗುಣಲಕ್ಷಣ ಪಟ್ಟಿ (${placesWithImages.length} ಸ್ಥಳಗಳು)`
              : `Wikimedia Commons attribution (${placesWithImages.length} ${placesWithImages.length === 1 ? "place" : "places"})`}
        </div>

        {placesWithImages.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#586673]">
            <p>
              {lang === "kn"
                ? "ದಾರಿ ಪ್ರಸ್ತುತ ಕಸ್ಟಮ್ ಇನ್‌ಲೈನ್ SVG ಚಿತ್ರಣಗಳನ್ನು ಬಳಸುತ್ತಿದೆ (ಅರಮನೆ, ಹಂಪಿ, ಕರಾವಳಿ), ಇವುಗಳಿಗೆ ಯಾವುದೇ ಬಾಹ್ಯ ಕೃತಿಸ್ವಾಮ್ಯ ಅವಲಂಬನೆಗಳಿಲ್ಲ."
                : "Places in Dari currently use custom inline SVG scene illustrations (Palace, Hampi, Coast) with zero external copyright dependencies."}
            </p>
            <p className="mt-2 text-xs text-[#8A99A8]">
              {lang === "kn" ? (
                <>
                  <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">scripts/fetch-images.mjs</code> ಮೂಲಕ ಸೇರಿಸಲಾದ ಯಾವುದೇ ವಿಕಿಮೀಡಿಯಾ ಫೋಟೋಗಳು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.
                </>
              ) : (
                <>
                  Any Wikimedia photos added via <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">scripts/fetch-images.mjs</code> will be automatically attributed here.
                </>
              )}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F3F0]">
            {placesWithImages.map((place) => (
              <div key={place.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#14202B]">
                    {lang === "kn" ? (place.name_kn || place.name_en) : place.name_en} ({place.city})
                  </h3>
                  <p className="text-[#586673] mt-0.5">
                    {lang === "kn" ? "ಛಾಯಾಚಿತ್ರ:" : "Photo by:"} <strong className="text-[#14202B]">{place.image?.credit}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="px-2.5 py-1 rounded-md bg-[#F1F3F0] text-[#14202B] font-medium border border-[#DCE1DD]">
                    {place.image?.license}
                  </span>
                  {place.image?.source_url && (
                    <a
                      href={place.image.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8E1F2F] hover:underline font-semibold"
                    >
                      {lang === "kn" ? "ಮೂಲ ವೀಕ್ಷಿಸಿ ↗" : "View Source ↗"}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Primary Data Sources & Provenance */}
      <div className="bg-white rounded-2xl border border-[#DCE1DD] shadow-xs p-6 space-y-4">
        <div>
          <h2 className="font-heading font-bold text-lg text-[#14202B]">
            {lang === "kn" ? "ಡೇಟಾ ಮೂಲಗಳು" : "Data sources"}
          </h2>
          <p className="text-xs text-[#586673] mt-1 leading-relaxed">
            {lang === "kn"
              ? `AI ${allPlaces.length} ಆಯ್ದ ಸ್ಥಳಗಳಿಂದ ಮಾತ್ರ ಆರಿಸಬಹುದು; ಅದು ಸ್ಥಳದ ಹೆಸರು ಅಥವಾ ಶುಲ್ಕವನ್ನು ತಾನೇ ಬರೆಯುವುದಿಲ್ಲ. ಪ್ರತಿ ಸ್ಥಳವು ತನ್ನ ಮಾಹಿತಿಯ ಮೂಲ ಜಾಲತಾಣವನ್ನು ದಾಖಲಿಸುತ್ತದೆ. ${verifiedCount} ಸ್ಥಳಗಳನ್ನು ಮೂಲದೊಂದಿಗೆ ಪರಿಶೀಲಿಸಲಾಗಿದೆ; ಉಳಿದವುಗಳ ಪರಿಶೀಲನೆ ಬಾಕಿ ಇದೆ.`
              : `The AI can only choose from ${allPlaces.length} curated places; it never writes a place name or fee itself. Each place records the website its details come from. ${verifiedCount} of them have been checked against that source; the rest are still awaiting that check.`}
          </p>
        </div>

        <ul className="divide-y divide-[#F1F3F0] text-xs">
          {sourceCounts.map(([url, count]) => (
            <li key={url} className="py-2.5 flex items-center justify-between gap-3">
              <div>
                <div className="font-bold text-[#14202B]">{SOURCE_NAMES[url] ?? url}</div>
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-[#8E1F2F] hover:underline font-semibold">
                  {url.replace("https://", "")} ↗
                </a>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-md bg-[#F1F3F0] text-[#14202B] font-medium border border-[#DCE1DD]">
                {count} {lang === "kn" ? "ಸ್ಥಳಗಳು" : count === 1 ? "place" : "places"}
              </span>
            </li>
          ))}
        </ul>

        <div className="text-xs text-[#586673] leading-relaxed">
          {lang === "kn"
            ? "ನಕ್ಷೆ: © OpenStreetMap ಕೊಡುಗೆದಾರರು. ದೂರ ಮತ್ತು ಸಮಯವನ್ನು ಕೋಡ್ ಲೆಕ್ಕಹಾಕುತ್ತದೆ (ನೇರ ದೂರ × 1.3, ಗಂಟೆಗೆ 40 ಕಿ.ಮೀ). ವಾಸ್ತವ್ಯ, ಊಟ ಮತ್ತು ಪ್ರಯಾಣ ದರಗಳು RTA ದರ ಅಧಿಸೂಚನೆಗಳು, KSRTC ದರ ಪಟ್ಟಿಗಳು ಮತ್ತು KSTDC ಹೋಟೆಲ್ ದರಗಳನ್ನು ಆಧರಿಸಿದ ಯೋಜನಾ ಅಂದಾಜುಗಳು."
            : "Map tiles: © OpenStreetMap contributors. Distances and times are calculated in code (straight-line distance × 1.3, at 40 km/h). Stay, food and transport rates are planning estimates calibrated against RTA fare notifications, KSRTC fare charts and KSTDC hotel rates."}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#DCE1DD] text-xs text-[#586673] leading-relaxed">
        <strong>{lang === "kn" ? "ಸೂಚನೆ:" : "Note:"}</strong>{" "}
        {lang === "kn"
          ? "ಪ್ರವೇಶ ಶುಲ್ಕ, ಭೇಟಿಯ ಸಮಯ ಮತ್ತು ನಿರ್ದೇಶಾಂಕಗಳು ಆಯ್ದ ಡೇಟಾಸೆಟ್‌ನಿಂದ ಬಂದಿವೆ ಮತ್ತು ಬದಲಾಗಬಹುದು; ಪ್ರಯಾಣದ ಮೊದಲು ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ."
          : "Entry fees, opening hours and coordinates come from the curated dataset and can change, so confirm them before you travel."}
      </div>
    </div>
  );
}
