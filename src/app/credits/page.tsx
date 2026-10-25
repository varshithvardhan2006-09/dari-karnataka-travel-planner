"use client";

import React from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";
import placesData from "../../../data/places.json";
import { Place } from "@/lib/schema";

const allPlaces = placesData as Place[];
const placesWithImages = allPlaces.filter((p) => Boolean(p.image));

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
          {lang === "kn" ? "ಚಿತ್ರ ಕೃಪೆ ಮತ್ತು ಪರವಾನಗಿ" : "Photo Credits & Licensing"}
        </h1>
        <p className="text-sm text-[#586673] mt-2 max-w-2xl leading-relaxed">
          {lang === "kn"
            ? "ದಾರಿ ಮುಕ್ತ ಸಂಸ್ಕೃತಿ ಮತ್ತು ಕೃತಿಸ್ವಾಮ್ಯ ನಿಯಮಗಳಿಗೆ ಬದ್ಧವಾಗಿದೆ. ತಾಣಗಳ ಮುನ್ನೋಟದಲ್ಲಿ ಬಳಸಲಾದ ಎಲ್ಲಾ ಛಾಯಾಚಿತ್ರಗಳು ವಿಕಿಮೀಡಿಯಾ ಕಾಮನ್ಸ್‌ನಿಂದ ಮುಕ್ತ ಕ್ರಿಯೇಟಿವ್ ಕಾಮನ್ಸ್ ಅಥವಾ ಪಬ್ಲಿಕ್ ಡೊಮೇನ್ ಪರವಾನಗಿಗಳ ಅಡಿಯಲ್ಲಿ ಪಡೆದುಕೊಳ್ಳಲಾಗಿದೆ."
            : "Dari is dedicated to open culture and legal compliance. All photographic media used across destination previews are sourced exclusively from Wikimedia Commons under free Creative Commons or Public Domain licenses."}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DCE1DD] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F7F9F6] border-b border-[#DCE1DD] text-xs font-bold text-[#14202B] uppercase tracking-wider">
          {lang === "kn"
            ? `ವಿಕಿಮೀಡಿಯಾ ಕಾಮನ್ಸ್ ಗುಣಲಕ್ಷಣ ಪಟ್ಟಿ (${placesWithImages.length} ಸ್ಥಳಗಳು)`
            : `Wikimedia Commons Attribution List (${placesWithImages.length} Places)`}
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
            {lang === "kn" ? "ಅಧಿಕೃತ ಡೇಟಾ ಮೂಲಗಳು (Primary Data Sources)" : "Primary Data Sources & Authority"}
          </h2>
          <p className="text-xs text-[#586673] mt-1 leading-relaxed">
            {lang === "kn"
              ? "ದಾರಿ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆಗೆ ಸ್ಥಳಗಳ ಹೆಸರುಗಳು ಅಥವಾ ಶುಲ್ಕಗಳನ್ನು ಊಹಿಸಲು ಅವಕಾಶ ನೀಡುವುದಿಲ್ಲ. ನಮ್ಮ ಡೇಟಾಸೆಟ್ ಈ ಕೆಳಗಿನ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಮತ್ತು ಮುಕ್ತ ಮೂಲಗಳಿಂದ ದೃಢೀಕರಿಸಲ್ಪಟ್ಟಿದೆ:"
              : "Dari does not allow AI to hallucinate or invent places or fees. All 39 destinations and route metadata are grounded in verified government and open authoritative sources:"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2]">
            <div className="font-bold text-[#8E1F2F]">Karnataka Tourism (KSTDC)</div>
            <div className="text-[#586673] mt-1">Official tourism circuits, regional zoning, and visiting hour guidelines.</div>
            <a href="https://karnatakatourism.org" target="_blank" rel="noopener noreferrer" className="text-[#8E1F2F] hover:underline font-semibold mt-2 inline-block">karnatakatourism.org ↗</a>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2]">
            <div className="font-bold text-[#8E1F2F]">Archaeological Survey of India (ASI)</div>
            <div className="text-[#586673] mt-1">UNESCO World Heritage ticket tariffs and monument regulations for Hampi, Pattadakal, and Hoysala monuments.</div>
            <a href="https://asi.nic.in" target="_blank" rel="noopener noreferrer" className="text-[#8E1F2F] hover:underline font-semibold mt-2 inline-block">asi.nic.in ↗</a>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2]">
            <div className="font-bold text-[#8E1F2F]">Mysore Palace Board & Temple Trusts</div>
            <div className="text-[#586673] mt-1">Verified palace entry fees and temple sanctum darshan hours.</div>
            <a href="https://mysorepalace.karnataka.gov.in" target="_blank" rel="noopener noreferrer" className="text-[#8E1F2F] hover:underline font-semibold mt-2 inline-block">mysorepalace.karnataka.gov.in ↗</a>
          </div>

          <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2]">
            <div className="font-bold text-[#8E1F2F]">OpenStreetMap (OSM) & IMD Weather</div>
            <div className="text-[#586673] mt-1">Geocoded GPS coordinates and regional seasonal climate data.</div>
            <a href="https://www.openstreetmap.org" target="_blank" rel="noopener noreferrer" className="text-[#8E1F2F] hover:underline font-semibold mt-2 inline-block">openstreetmap.org ↗</a>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#DCE1DD] text-xs text-[#586673] leading-relaxed">
        <strong>{lang === "kn" ? "ಮುಕ್ತ ಮೂಲ ಮತ್ತು ಡೇಟಾಸೆಟ್ ಪ್ರಾಮಾಣಿಕತೆಯ ಟಿಪ್ಪಣಿ:" : "Open Source & Dataset Honesty Note:"}</strong>{" "}
        {lang === "kn"
          ? "ಎಲ್ಲಾ ನಕ್ಷೆಯ ನಿರ್ದೇಶಾಂಕಗಳು, ಪ್ರವೇಶ ಶುಲ್ಕಗಳು ಮತ್ತು ಮಾರ್ಗಸೂಚಿಗಳು ನಮ್ಮ ಕ್ಯುರೇಟೆಡ್ ಡೇಟಾಸೆಟ್‌ನಿಂದ ಪಡೆದ ಅಂದಾಜುಗಳಾಗಿವೆ. ದರಗಳು ಮತ್ತು ಭೇಟಿಯ ಸಮಯಗಳು ಬದಲಾಗಬಹುದು, ಆದ್ದರಿಂದ ಅಂತಿಮ ಬುಕಿಂಗ್ ಮಾಡುವ ಮುನ್ನ ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ."
          : "All coordinate points, entry fees, and route guidelines represent estimates from our curated dataset. Prices and visiting hours may fluctuate, so travelers are encouraged to verify before final booking."}
      </div>
    </div>
  );
}
