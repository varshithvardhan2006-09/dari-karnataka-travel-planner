"use client";

import React from "react";
import type { Plan, DayPlan, Stop } from "@/lib/schema";
import { getGoogleMapsSearchUrl } from "@/lib/maps";

interface PrintItineraryProps {
  plan: Plan;
  tripStats?: {
    totalKm: number;
    totalDriveHours: number;
    totalStops: number;
    uniqueTowns: number;
    costRangeText: string;
    weather: {
      temp: string;
      descEn: string;
      descKn: string;
    };
  } | null;
  budgetParam?: string | null;
  travellersParam?: string | null;
  paceParam?: string | null;
  interestsParam?: string | null;
  lang?: "en" | "kn";
  /** "print" shows only in the browser's print view; "export" renders on screen for PDF capture. */
  mode?: "print" | "export";
}

export function PrintItinerary({
  plan,
  tripStats,
  budgetParam = "mid",
  travellersParam = "couple",
  paceParam = "relaxed",
  interestsParam,
  lang = "en",
  mode = "print",
}: PrintItineraryProps) {
  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <aside
      aria-label="Printable Itinerary Document"
      aria-hidden={mode === "export" ? true : undefined}
      className={`${
        mode === "export" ? "block w-[794px] p-6" : "hidden print:block w-full max-w-none"
      } text-[#14202B] bg-white font-sans text-xs leading-normal`}
    >
      {/* Elements marked data-pdf-block are kept whole on one page in the downloaded PDF. */}
      {/* 1. Branded Header */}
      <div data-pdf-block className="border-b-2 border-[#8E1F2F] pb-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#8E1F2F] text-white font-bold flex items-center justify-center text-sm font-kannada">
              ದಾರಿ
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#14202B] tracking-tight">
                {lang === "kn" ? "ದಾರಿ · ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಕಾರ್ಯಕ್ರಮ" : "Dari (ದಾರಿ) · Karnataka Travel Itinerary"}
              </h1>
              <p className="text-[10px] text-[#586673]">
                AI-curated travel plan for Karnataka, India · dari-karnataka-travel-planner.vercel.app
              </p>
            </div>
          </div>
          <div className="text-right text-[10px] text-[#586673]">
            <div>Printed: {currentDate}</div>
            <div className="font-semibold text-[#8E1F2F]">
              {plan.days.length}-Day Plan
            </div>
          </div>
        </div>

        {/* Trip Title & Summary */}
        <div className="mt-3 bg-[#FBF7EE] p-3 rounded-lg border border-[#E9DFCF]">
          <h2 className="text-base font-bold text-[#14202B]">{plan.title}</h2>
          <p className="text-[11px] text-[#586673] mt-1 leading-relaxed">
            {plan.summary}
          </p>
        </div>

        {/* Key Stats Bar */}
        <div className="grid grid-cols-4 gap-2 mt-3 text-center">
          <div className="p-2 rounded bg-gray-50 border border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Duration</div>
            <div className="text-xs font-bold text-[#14202B]">{plan.days.length} Days</div>
          </div>
          <div className="p-2 rounded bg-gray-50 border border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Total Distance</div>
            <div className="text-xs font-bold text-[#14202B]">
              {tripStats?.totalKm || 0} km (~{tripStats?.totalDriveHours || 0}h drive)
            </div>
          </div>
          <div className="p-2 rounded bg-gray-50 border border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Travellers</div>
            <div className="text-xs font-bold text-[#14202B]">
              {plan.cost.people} ({travellersParam || "couple"})
            </div>
          </div>
          <div className="p-2 rounded bg-gray-50 border border-gray-200">
            <div className="text-[10px] text-gray-500 uppercase font-semibold">Estimated Cost</div>
            <div className="text-xs font-bold text-[#8E1F2F]">
              ₹{(plan.cost.total || 0).toLocaleString("en-IN")} ({budgetParam || "mid"})
            </div>
          </div>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-1.5 mt-2 text-[10px]">
          <span className="px-2 py-0.5 rounded bg-gray-100 font-medium">
            Pace: {paceParam || "Relaxed"}
          </span>
          {interestsParam && (
            <span className="px-2 py-0.5 rounded bg-gray-100 font-medium">
              Interests: {interestsParam}
            </span>
          )}
          {tripStats?.weather && (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium">
              Weather: {tripStats.weather.temp} ({tripStats.weather.descEn})
            </span>
          )}
        </div>
      </div>

      {/* 2. Day-by-Day Schedule (ALL DAYS) */}
      <div className="space-y-4">
        {plan.days.map((day: DayPlan, dIdx: number) => {
          const dayKm = Math.round(
            day.stops.reduce((acc: number, s: Stop) => acc + (s.travel_from_prev?.km || 0), 0)
          );
          const firstCity = day.stops[0]?.place.city || day.theme;

          return (
            <div
              key={day.day}
              className={`space-y-2.5 ${dIdx > 0 ? "pt-2" : ""}`}
            >
              {/* Day Header Banner */}
              <div data-pdf-block className="print-avoid-break bg-[#14202B] text-white px-3 py-1.5 rounded flex items-center justify-between">
                <div className="font-bold text-xs">
                  DAY {day.day}: {day.theme || firstCity}
                </div>
                <div className="text-[10px] text-white/80">
                  {day.stops.length} stops {dayKm > 0 ? `· ~${dayKm} km travel` : ""}
                </div>
              </div>

              {/* Stops for this Day */}
              <div className="space-y-2">
                {day.stops.map((stop: Stop, sIdx: number) => {
                  const mapsUrl = getGoogleMapsSearchUrl({
                    name_en: stop.place.name_en,
                    lat: stop.place.lat,
                    lng: stop.place.lng,
                    city: stop.place.city,
                  });

                  return (
                    <div
                      key={`${day.day}-${stop.place_id}`}
                      data-pdf-block
                      className="print-avoid-break border border-gray-300 rounded-lg p-2.5 bg-white space-y-1.5"
                    >
                      {/* Stop Top Line: Stop #, Time, Name, Kannada Name, Category, City */}
                      <div className="flex items-start justify-between gap-2 border-b border-gray-100 pb-1.5">
                        <div className="flex items-start gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-[#8E1F2F] text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {sIdx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs text-[#14202B]">
                                {stop.place.name_en}
                              </span>
                              <span className="font-kannada text-xs font-semibold text-[#8E1F2F]">
                                {stop.place.name_kn}
                              </span>
                              {stop.place.categories?.[0] && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-gray-700">
                                  {stop.place.categories[0]}
                                </span>
                              )}
                              <span className="text-[10px] text-gray-500">
                                · {stop.place.city}
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Start Time: <strong className="text-gray-800">{stop.start || "09:00"}</strong>
                              {" · "}Duration: {(stop.duration_min / 60).toFixed(1)} hrs ({stop.duration_min} min)
                              {" · "}Entry: {stop.place.entry_inr === 0 ? "Free" : `₹${stop.place.entry_inr}`}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stop Tip / Note */}
                      {stop.note_en && (
                        <p className="text-[10.5px] text-gray-700 leading-snug">
                          <strong>Note:</strong> {stop.note_en}
                        </p>
                      )}

                      {/* Useful Phrases if available */}
                      {stop.phrases && stop.phrases.length > 0 && (
                        <div className="bg-amber-50/60 border border-amber-200/80 rounded p-1.5 text-[10px] space-y-1">
                          <span className="font-bold text-amber-900 block">
                            Useful Kannada Phrase:
                          </span>
                          {stop.phrases.slice(0, 2).map((phrase, pIdx: number) => (
                            <div key={pIdx} className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="font-kannada font-bold text-[#8E1F2F]">
                                {phrase.kn}
                              </span>
                              {phrase.translit && (
                                <span className="italic text-gray-600">
                                  ({phrase.translit})
                                </span>
                              )}
                              <span className="text-gray-800">
                                — &ldquo;{phrase.en}&rdquo;
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Google Maps Link */}
                      <div className="text-[9.5px] text-gray-500 pt-0.5 flex items-center justify-between">
                        <span>
                          📍 Google Maps Link: <span className="text-blue-700 underline">{mapsUrl}</span>
                        </span>
                        {stop.place.lat && stop.place.lng && (
                          <span className="text-gray-400">
                            ({stop.place.lat.toFixed(4)}, {stop.place.lng.toFixed(4)})
                          </span>
                        )}
                      </div>

                      {/* Travel leg to next stop if available */}
                      {stop.travel_from_prev && sIdx > 0 && (
                        <div className="text-[10px] bg-gray-50 px-2 py-1 rounded text-gray-600 font-medium">
                          🚗 Traveled {stop.travel_from_prev.km} km (~{stop.travel_from_prev.min} mins) from previous stop
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Cost Breakdown & Budget Summary */}
      <div data-pdf-block className="print-avoid-break mt-5 pt-3 border-t-2 border-gray-300">
        <h3 className="font-bold text-xs text-[#14202B] uppercase tracking-wide mb-2">
          Estimated Trip Cost Breakdown ({plan.cost.people} People)
        </h3>
        <table className="w-full text-left border-collapse border border-gray-300 text-[11px]">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-1.5 border-r border-gray-300 font-bold">Category</th>
              <th className="p-1.5 border-r border-gray-300">Description</th>
              <th className="p-1.5 text-right font-bold">Estimated Cost</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="p-1.5 border-r border-gray-300 font-medium">🏨 Accommodation</td>
              <td className="p-1.5 border-r border-gray-300 text-gray-600">
                {plan.days.length > 1
                  ? `${plan.days.length - 1} ${plan.days.length === 2 ? "night" : "nights"} for ${plan.cost.people} travellers (${budgetParam || "mid"} tier)`
                  : "Day trip, no overnight stay"}
              </td>
              <td className="p-1.5 text-right font-semibold">₹{(plan.cost.stay || 0).toLocaleString("en-IN")}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-1.5 border-r border-gray-300 font-medium">🍽️ Food & Dining</td>
              <td className="p-1.5 border-r border-gray-300 text-gray-600">
                Breakfast, lunch, snacks & dinner across {plan.days.length} days
              </td>
              <td className="p-1.5 text-right font-semibold">₹{(plan.cost.food || 0).toLocaleString("en-IN")}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-1.5 border-r border-gray-300 font-medium">🚗 Transport & Fuel</td>
              <td className="p-1.5 border-r border-gray-300 text-gray-600">
                Cab / private vehicle / transit for {tripStats?.totalKm || 0} km
              </td>
              <td className="p-1.5 text-right font-semibold">₹{(plan.cost.transport || 0).toLocaleString("en-IN")}</td>
            </tr>
            <tr className="border-b border-gray-200">
              <td className="p-1.5 border-r border-gray-300 font-medium">🎟️ Entry Tickets & Activities</td>
              <td className="p-1.5 border-r border-gray-300 text-gray-600">
                Monuments, temple entry, camera fees & state parks
              </td>
              <td className="p-1.5 text-right font-semibold">₹{(plan.cost.entry || 0).toLocaleString("en-IN")}</td>
            </tr>
            <tr className="bg-gray-100 font-bold text-xs">
              <td className="p-1.5 border-r border-gray-300 text-[#8E1F2F]">TOTAL ESTIMATED COST</td>
              <td className="p-1.5 border-r border-gray-300 text-gray-600">
                Based on Karnataka seasonal rates & {budgetParam || "mid"} standard
              </td>
              <td className="p-1.5 text-right text-[#8E1F2F]">₹{(plan.cost.total || 0).toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Emergency Contacts & Local Assistance */}
      <div data-pdf-block className="print-avoid-break mt-4 p-2.5 rounded border border-gray-300 bg-gray-50 text-[10px] space-y-1">
        <div className="font-bold text-xs text-[#14202B]">
          Emergency Numbers (all India)
        </div>
        <div className="grid grid-cols-4 gap-2 pt-1 text-gray-700">
          <div>
            <strong>Police / Emergency:</strong> 112
          </div>
          <div>
            <strong>Ambulance:</strong> 108
          </div>
          <div>
            <strong>Women Helpline:</strong> 1091 / 181
          </div>
          <div>
            <strong>Railway Helpline:</strong> 139
          </div>
        </div>
      </div>

      {/* 5. Essential Kannada Phrase Guide */}
      <div data-pdf-block className="print-avoid-break mt-3 p-2.5 rounded border border-gray-300 bg-white text-[10px] space-y-1">
        <div className="font-bold text-xs text-[#8E1F2F]">
          Quick Kannada Cheat Sheet
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 text-gray-800">
          <div>• <strong>ನಮಸ್ಕಾರ (Namaskara)</strong> — Hello / Greetings</div>
          <div>• <strong>ಧನ್ಯವಾದ (Dhanyavada)</strong> — Thank you</div>
          <div>• <strong>ಎಷ್ಟು? (Eshtu?)</strong> — How much?</div>
          <div>• <strong>ಇದು ಎಲ್ಲಿ ಇದೆ? (Idu elli ide?)</strong> — Where is this?</div>
          <div>• <strong>ದಯವಿಟ್ಟು ಸಹಾಯ ಮಾಡಿ (Dayavittu sahaya maadi)</strong> — Please help</div>
          <div>• <strong>ಊಟ ಚೆನ್ನಾಗಿದೆ (Oota chennagide)</strong> — Food is good</div>
        </div>
      </div>

      {/* 6. Footer */}
      <div data-pdf-block className="print-avoid-break mt-4 pt-2 border-t border-gray-200 text-center text-[9px] text-gray-400">
        Plan generated by Dari (ದಾರಿ) Karnataka AI Travel Planner · Have a memorable and safe journey through Karnataka!
      </div>
    </aside>
  );
}
