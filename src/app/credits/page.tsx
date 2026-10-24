"use client";

import React from "react";
import Link from "next/link";
import placesData from "../../../data/places.json";
import { Place } from "@/lib/schema";

const allPlaces = placesData as Place[];
const placesWithImages = allPlaces.filter((p) => Boolean(p.image));

export default function CreditsPage() {
  return (
    <div className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E1F2F] hover:underline mb-3"
        >
          <span>←</span>
          <span>Back to Home</span>
        </Link>
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#14202B] tracking-tight">
          Photo Credits & Licensing
        </h1>
        <p className="text-sm text-[#586673] mt-2 max-w-2xl leading-relaxed">
          Dari is dedicated to open culture and legal compliance. All photographic media used
          across destination previews are sourced exclusively from Wikimedia Commons under free
          Creative Commons or Public Domain licenses.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[#DCE1DD] shadow-xs overflow-hidden">
        <div className="p-4 bg-[#F7F9F6] border-b border-[#DCE1DD] text-xs font-bold text-[#14202B] uppercase tracking-wider">
          Wikimedia Commons Attribution List ({placesWithImages.length} Places)
        </div>

        {placesWithImages.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#586673]">
            <p>
              Places in Dari currently use custom inline SVG scene illustrations (Palace, Hampi, Coast)
              created for the hackathon with zero external copyright dependencies.
            </p>
            <p className="mt-2 text-xs text-[#8A99A8]">
              Any Wikimedia photos added via <code className="font-mono bg-gray-100 px-1 py-0.5 rounded">scripts/fetch-images.mjs</code> will be automatically attributed here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F3F0]">
            {placesWithImages.map((place) => (
              <div key={place.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#14202B]">
                    {place.name_en} ({place.city})
                  </h3>
                  <p className="text-[#586673] mt-0.5">
                    Photo by: <strong className="text-[#14202B]">{place.image?.credit}</strong>
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
                      View Source ↗
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-[#F7F9F6] border border-[#DCE1DD] text-xs text-[#586673] leading-relaxed">
        <strong>Open Source & Dataset Honesty Note:</strong> All coordinate points, entry fees, and route
        guidelines represent estimates from our curated dataset. Prices and visiting hours may fluctuate,
        so travelers are encouraged to verify before final booking.
      </div>
    </div>
  );
}