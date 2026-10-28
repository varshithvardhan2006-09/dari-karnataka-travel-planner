"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang } from "@/lib/i18n/useLang";
import {
  Category,
  StartCity,
  BudgetFit,
  Pace,
  Travellers,
  PlanRequest,
  Place,
} from "@/lib/schema";
import dynamic from "next/dynamic";
import { getCandidates, countMatchingPlaces } from "@/lib/candidates";
import { estimateCostRange, PEOPLE_COUNT_MAP } from "@/lib/cost";
import placesData from "../../data/places.json";

const PlannerMap = dynamic(() => import("./PlannerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[320px] bg-[#F1F3F0] rounded-2xl border border-[#DCE1DD] flex items-center justify-center text-xs text-[#586673] animate-pulse">
      Loading interactive Karnataka map...
    </div>
  ),
});

const allPlaces = placesData as Place[];

interface CategoryTileConfig {
  id: Category;
  labelEn: string;
  labelKn: string;
  icon: string;
}

const CATEGORY_TILES: CategoryTileConfig[] = [
  { id: "heritage", labelEn: "Heritage", labelKn: "ಪರಂಪರೆ", icon: "🏛️" },
  { id: "food", labelEn: "Food", labelKn: "ಆಹಾರ", icon: "🍴" },
  { id: "nature", labelEn: "Nature", labelKn: "ಪ್ರಕೃತಿ", icon: "🍃" },
  { id: "spiritual", labelEn: "Spiritual", labelKn: "ಆಧ್ಯಾತ್ಮಿಕ", icon: "🛕" },
  { id: "adventure", labelEn: "Adventure", labelKn: "ಸಾಹಸ", icon: "⛰️" },
  { id: "beach", labelEn: "Beaches", labelKn: "ಕಡಲತೀರ", icon: "🌊" },
  { id: "wildlife", labelEn: "Wildlife", labelKn: "ವನ್ಯಜೀವಿ", icon: "🐘" },
  { id: "coffee", labelEn: "Coffee estates", labelKn: "ಕಾಫಿ ತೋಟ", icon: "☕" },
];

const PRESETS = [
  {
    label: "Weekend in Mysuru",
    days: 2,
    city: "Mysuru",
    interests: ["heritage", "food"] as Category[],
    pace: "relaxed" as Pace,
  },
  {
    label: "Hampi in 3 days",
    days: 3,
    city: "Hampi",
    interests: ["heritage", "adventure"] as Category[],
    pace: "balanced" as Pace,
  },
  {
    label: "Coastal escape",
    days: 4,
    city: "Gokarna",
    interests: ["beach", "nature"] as Category[],
    pace: "relaxed" as Pace,
  },
  {
    label: "Coffee and hills",
    days: 3,
    city: "Madikeri",
    interests: ["nature", "coffee"] as Category[],
    pace: "relaxed" as Pace,
  },
];

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const MONTH_NAMES_KN = [
  "ಜನ", "ಫೆಬ್ರ", "ಮಾರ್ಚ್", "ಏಪ್ರಿ", "ಮೇ", "ಜೂನ್",
  "ಜುಲೈ", "ಆಗ", "ಸೆಪ್ಟೆಂ", "ಅಕ್ಟೋ", "ನವೆಂ", "ಡಿಸೆಂ"
];

const PRESET_LABELS: Record<string, { en: string; kn: string }> = {
  "Weekend in Mysuru": { en: "Weekend in Mysuru", kn: "ಮೈಸೂರಿನಲ್ಲಿ ವಾರಾಂತ್ಯ" },
  "Hampi in 3 days": { en: "Hampi in 3 days", kn: "೩ ದಿನಗಳಲ್ಲಿ ಹಂಪಿ" },
  "Coastal escape": { en: "Coastal escape", kn: "ಕರಾವಳಿ ಪ್ರವಾಸ" },
  "Coffee and hills": { en: "Coffee and hills", kn: "ಕಾಫಿ ಮತ್ತು ಗಿರಿಧಾಮಗಳು" },
};

const TRAVELLER_CONFIG: { id: Travellers; labelEn: string; labelKn: string }[] = [
  { id: "solo", labelEn: "Solo", labelKn: "ಒಬ್ಬರೇ" },
  { id: "couple", labelEn: "Couple", labelKn: "ದಂಪತಿ" },
  { id: "family", labelEn: "Family", labelKn: "ಕುಟುಂಬ" },
  { id: "friends", labelEn: "Friends", labelKn: "ಸ್ನೇಹಿತರು" },
];

const BUDGET_TIERS = [
  { id: "budget" as BudgetFit, sym: "₹", titleEn: "Budget", titleKn: "ಮಿತವ್ಯಯ", subEn: "under 2.5k", subKn: "₹ ೨,೫೦೦ ಕ್ಕಿಂತ ಕಡಿಮೆ" },
  { id: "mid" as BudgetFit, sym: "₹₹", titleEn: "Mid-range", titleKn: "ಮಧ್ಯಮ", subEn: "2.5k to 5k", subKn: "₹ ೨.೫k ರಿಂದ ೫k" },
  { id: "premium" as BudgetFit, sym: "₹₹₹", titleEn: "Premium", titleKn: "ಐಷಾರಾಮಿ", subEn: "above 5k", subKn: "₹ ೫,೦೦೦ ಕ್ಕಿಂತ ಹೆಚ್ಚು" },
];

const PACE_TIERS = [
  { id: "relaxed" as Pace, titleEn: "Relaxed", titleKn: "ನಿರಾಳ", subEn: "2 to 3", subKn: "೨ ರಿಂದ ೩" },
  { id: "balanced" as Pace, titleEn: "Balanced", titleKn: "ಸಮತೋಲಿತ", subEn: "3 to 4", subKn: "೩ ರಿಂದ ೪" },
  { id: "packed" as Pace, titleEn: "Packed", titleKn: "ಚುರುಕಾದ", subEn: "5+", subKn: "೫+" },
];

const FOOD_OPTIONS = [
  { id: "any" as const, labelEn: "Any", labelKn: "ಯಾವುದಾದರೂ" },
  { id: "veg" as const, labelEn: "Veg", labelKn: "ಸಸ್ಯಾಹಾರಿ" },
  { id: "nonveg" as const, labelEn: "Non-veg", labelKn: "ಮಾಂಸಾಹಾರಿ" },
];

const TRANSPORT_OPTIONS = [
  { id: "cab" as const, labelEn: "Cab", labelKn: "ಕ್ಯಾಬ್" },
  { id: "own_car" as const, labelEn: "Own car", labelKn: "ಸ್ವಂತ ಕಾರು" },
  { id: "bus_train" as const, labelEn: "Bus & train", labelKn: "ಬಸ್ ಮತ್ತು ರೈಲು" },
];

const BEST_SEASON_MONTHS = [10, 11, 12, 1, 2]; // Oct to Feb in Karnataka

export default function PlannerForm() {
  const { lang } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Primary state initialized from URL searchParams if present
  const [interests, setInterests] = useState<Category[]>(() => {
    if (!searchParams) return ["heritage", "food"];
    const qInterests = searchParams.get("interests");
    if (qInterests) {
      const parsed = qInterests
        .split(",")
        .filter((c) => CATEGORY_TILES.some((tile) => tile.id === c)) as Category[];
      if (parsed.length > 0) return parsed.slice(0, 4);
    }
    return ["heritage", "food"];
  });

  const [days, setDays] = useState<number>(() => {
    if (!searchParams) return 4;
    const qDays = parseInt(searchParams.get("days") || "", 10);
    return !isNaN(qDays) && qDays >= 1 && qDays <= 7 ? qDays : 4;
  });

  const [startCity, setStartCity] = useState<StartCity>(() => {
    if (!searchParams) return "Bengaluru";
    const qCity = searchParams.get("city") || searchParams.get("start_city");
    return qCity && qCity.trim().length > 0 ? (qCity.trim() as StartCity) : "Bengaluru";
  });

  const [budget, setBudget] = useState<BudgetFit>(() => {
    if (!searchParams) return "mid";
    const qBudget = searchParams.get("budget") as BudgetFit;
    return qBudget && BUDGET_TIERS.some((b) => b.id === qBudget) ? qBudget : "mid";
  });

  const [pace, setPace] = useState<Pace>("relaxed");
  const [travellers, setTravellers] = useState<Travellers>("couple");
  const [peopleCount, setPeopleCount] = useState<number>(2);

  const [month, setMonth] = useState<number>(() => {
    if (!searchParams) return 11;
    const qMonth = parseInt(searchParams.get("month") || "", 10);
    return !isNaN(qMonth) && qMonth >= 1 && qMonth <= 12 ? qMonth : 11;
  });

  // Optional filters (safe & backwards compatible)
  const [foodPref, setFoodPref] = useState<"any" | "veg" | "nonveg">("any");
  const [transportMode, setTransportMode] = useState<"cab" | "own_car" | "bus_train">("cab");
  const [lowWalking, setLowWalking] = useState<boolean>(false);
  const [showAllMatches, setShowAllMatches] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  // Timers started by handleSubmit, tracked so they can be cleared on unmount
  const navigationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Prefetch trip route to ensure instantaneous navigation when clicking Generate
  useEffect(() => {
    try {
      router.prefetch("/trip");
    } catch {
      // ignore
    }
  }, [router]);

  useEffect(() => {
    const timers = navigationTimersRef.current;
    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Toggle category tiles (max 4)
  const toggleInterest = (category: Category) => {
    if (interests.includes(category)) {
      setInterests(interests.filter((c) => c !== category));
    } else {
      if (interests.length >= 4) return;
      setInterests([...interests, category]);
    }
  };

  // Apply preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setDays(preset.days);
    setStartCity(preset.city);
    setInterests(preset.interests);
    setPace(preset.pace);
  };

  const planRequest: PlanRequest = useMemo(
    () => ({
      interests,
      days,
      start_city: startCity,
      budget,
      pace,
      travellers,
      month,
      lang,
      people_count: peopleCount,
      food_preference: foodPref,
      transport_mode: transportMode,
      low_walking: lowWalking,
    }),
    [
      interests,
      days,
      startCity,
      budget,
      pace,
      travellers,
      month,
      lang,
      peopleCount,
      foodPref,
      transportMode,
      lowWalking,
    ]
  );

  const matchedCandidates = useMemo(() => {
    return getCandidates(planRequest, allPlaces);
  }, [planRequest]);

  const totalMatchingPlacesCount = useMemo(() => {
    return countMatchingPlaces(interests, allPlaces);
  }, [interests]);

  const costRange = useMemo(() => {
    return estimateCostRange(days, budget, peopleCount, transportMode);
  }, [days, budget, peopleCount, transportMode]);

  const handleSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (interests.length === 0 || submitting) return;

    setSubmitting(true);
    const params = new URLSearchParams({
      interests: interests.slice(0, 4).join(","),
      days: days.toString(),
      start_city: startCity,
      budget,
      pace,
      travellers,
      month: month.toString(),
      lang,
      people_count: peopleCount.toString(),
      food_preference: foodPref,
      transport_mode: transportMode,
      low_walking: lowWalking ? "1" : "0",
    });

    const targetUrl = `/trip?${params.toString()}`;

    // 1. Immediately attempt Next.js client transition
    try {
      router.push(targetUrl);
    } catch (err) {
      console.warn("Client router navigation failed, using direct location:", err);
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = targetUrl;
      return;
    }

    // 2. Fallback timer: if the App Router client transition has not landed on
    // /trip within 1.2s (RSC prefetch stall or connection lag), fall back to a
    // direct browser navigation so the user is never stuck on "Generating...".
    const fallbackTimer = setTimeout(() => {
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/trip")) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = targetUrl;
      }
    }, 1200);

    // 3. Safety reset timer: restore the button state so it is never permanently
    // frozen if the browser stays on this page.
    const safetyTimer = setTimeout(() => {
      setSubmitting(false);
    }, 4000);

    navigationTimersRef.current.push(fallbackTimer, safetyTimer);
  };

  // The outer bottom padding clears the fixed mobile action bar, which would
  // otherwise sit on top of the submit buttons at small widths.
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-0">
      {/* LEFT COLUMN: Form Controls (7 cols) */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#DCE1DD] shadow-xs space-y-8">
        {/* Quick-start preset chips */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#8E1F2F]">
            <span>✦</span>
            <span>{lang === "kn" ? "ತ್ವರಿತ ಆಯ್ಕೆಗಳು:" : "Quick start"}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-[#F1F3F0] hover:bg-gray-200 text-[#14202B] transition-colors cursor-pointer"
              >
                {lang === "kn" ? PRESET_LABELS[p.label]?.kn || p.label : p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. What do you enjoy? (Interest Tiles matching mockup 02) */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span
                id="interests-group-label"
                className="block font-heading font-bold text-base text-[#14202B]"
              >
                {lang === "kn" ? "ನಿಮ್ಮ ಆಸಕ್ತಿಗಳೇನು?" : "What do you enjoy?"}
              </span>
              <span className="text-xs text-[#586673]">
                {interests.length >= 4
                  ? lang === "kn" ? "ಗರಿಷ್ಠ ೪" : "Max 4"
                  : lang === "kn" ? "೧ ರಿಂದ ೪ ಆರಿಸಿ" : "Pick 1 to 4"}
              </span>
            </div>
            <p className="text-xs text-[#586673] mb-3">
              {lang === "kn"
                ? "ಒಂದರಿಂದ ನಾಲ್ಕು ಆಯ್ಕೆಮಾಡಿ. ಸಂಖ್ಯೆಗಳು ಲಭ್ಯವಿರುವ ಸ್ಥಳಗಳನ್ನು ತೋರಿಸುತ್ತವೆ."
                : "Pick one to four. Numbers show how many places we have."}
            </p>

            <div
              role="group"
              aria-labelledby="interests-group-label"
              className="grid grid-cols-2 sm:grid-cols-4 gap-3"
            >
              {CATEGORY_TILES.map((cat) => {
                const selected = interests.includes(cat.id);
                const placeCount = allPlaces.filter((p) => p.categories.includes(cat.id)).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInterest(cat.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between min-h-[90px] ${
                      selected
                        ? "bg-[#F9EBEB] border-[#8E1F2F] text-[#8E1F2F] shadow-2xs"
                        : "bg-white border-[#DCE1DD] text-[#14202B] hover:border-gray-400"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xl">{cat.icon}</span>
                      {selected && (
                        <span className="w-4 h-4 rounded-full bg-[#8E1F2F] text-white flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm">
                        {lang === "kn" ? cat.labelKn : cat.labelEn}
                      </div>
                      <div className="text-[11px] text-[#586673] mt-0.5">
                        {lang === "kn"
                          ? `${placeCount} ಸ್ಥಳಗಳು`
                          : `${placeCount} ${placeCount === 1 ? "place" : "places"}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Days Slider & Travellers Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Days Slider */}
            <div>
              <label
                htmlFor="planner-days"
                className="block font-heading font-bold text-sm text-[#14202B] mb-1"
              >
                {lang === "kn" ? "ಎಷ್ಟು ದಿನಗಳು?" : "How many days?"}
              </label>
              <p className="text-xs text-[#586673] mb-3">
                {lang === "kn" ? "೧ ರಿಂದ ೭ ದಿನಗಳು" : "Choose 1 to 7"}
              </p>

              <div className="flex items-center gap-3">
                <span className="font-heading font-extrabold text-3xl text-[#8E1F2F]">
                  {days}
                </span>
                <span className="text-xs font-semibold text-[#14202B]">
                  {days === 1 ? (lang === "kn" ? "ದಿನ" : "day") : (lang === "kn" ? "ದಿನಗಳು" : "days")}
                </span>
              </div>
              <input
                id="planner-days"
                type="range"
                min={1}
                max={7}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                aria-valuetext={`${days} ${days === 1 ? "day" : "days"}`}
                className="w-full mt-3 accent-[#8E1F2F] cursor-pointer"
              />
            </div>

            {/* Who is travelling? */}
            <div>
              <span
                id="travellers-group-label"
                className="block font-heading font-bold text-sm text-[#14202B] mb-1"
              >
                {lang === "kn" ? "ಯಾರು ಪ್ರಯಾಣಿಸುತ್ತಿದ್ದಾರೆ?" : "Who is travelling?"}
              </span>
              <p className="text-xs text-[#586673] mb-3">
                {lang === "kn" ? "ಗುಂಪಿಗೆ ಅನುಗುಣವಾಗಿ ವೆಚ್ಚ ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತದೆ" : "Costs are worked out for the group"}
              </p>

              <div
                role="group"
                aria-labelledby="travellers-group-label"
                className="flex flex-wrap gap-1.5 mb-3"
              >
                {TRAVELLER_CONFIG.map((tr) => (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => {
                      setTravellers(tr.id);
                      setPeopleCount(PEOPLE_COUNT_MAP[tr.id] || 2);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      travellers === tr.id
                        ? "bg-[#14202B] text-white"
                        : "bg-[#F1F3F0] text-[#14202B] hover:bg-gray-200"
                    }`}
                  >
                    {lang === "kn" ? tr.labelKn : tr.labelEn}
                  </button>
                ))}
              </div>

              {/* People Stepper */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={peopleCount <= 1}
                  onClick={() => setPeopleCount((c) => Math.max(1, c - 1))}
                  className="w-8 h-8 rounded-lg bg-[#F1F3F0] border border-[#DCE1DD] font-bold text-sm text-[#14202B] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  -
                </button>
                <span className="text-sm font-bold text-[#14202B] px-2">
                  {peopleCount} {peopleCount === 1 ? (lang === "kn" ? "ವ್ಯಕ್ತಿ" : "person") : (lang === "kn" ? "ಜನರು" : "people")}
                </span>
                <button
                  type="button"
                  disabled={peopleCount >= 10}
                  onClick={() => setPeopleCount((c) => Math.min(10, c + 1))}
                  className="w-8 h-8 rounded-lg bg-[#F1F3F0] border border-[#DCE1DD] font-bold text-sm text-[#14202B] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 3. Budget & Pace Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Budget */}
            <div>
              <span
                id="budget-group-label"
                className="block font-heading font-bold text-sm text-[#14202B] mb-1"
              >
                {lang === "kn" ? "ಬಜೆಟ್" : "Budget"}
              </span>
              <p className="text-xs text-[#586673] mb-3">
                {lang === "kn" ? "ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ ದಿನಕ್ಕೆ, ವಾಸ್ತವ್ಯ ಮತ್ತು ಊಟ ಸೇರಿ" : "Rs per person per day, stay and food included"}
              </p>
              <div
                role="group"
                aria-labelledby="budget-group-label"
                className="grid grid-cols-3 gap-2"
              >
                {BUDGET_TIERS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    aria-pressed={budget === b.id}
                    onClick={() => setBudget(b.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      budget === b.id
                        ? "bg-[#FDF2CC] border-[#F2B705] text-[#14202B] shadow-2xs font-bold"
                        : "bg-white border-[#DCE1DD] text-[#586673] hover:border-gray-400"
                    }`}
                  >
                    <div className="text-xs text-[#8C6D05] font-bold">{b.sym}</div>
                    <div className="text-xs font-bold text-[#14202B] mt-0.5">{lang === "kn" ? b.titleKn : b.titleEn}</div>
                    <div className="text-[10px] text-[#586673]">{lang === "kn" ? b.subKn : b.subEn}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div>
              <span
                id="pace-group-label"
                className="block font-heading font-bold text-sm text-[#14202B] mb-1"
              >
                {lang === "kn" ? "ಪ್ರವಾಸದ ವೇಗ" : "Pace"}
              </span>
              <p className="text-xs text-[#586673] mb-3">
                {lang === "kn" ? "ದಿನಕ್ಕೆ ನಿಲುಗಡೆಗಳು" : "Stops per day"}
              </p>
              <div
                role="group"
                aria-labelledby="pace-group-label"
                className="grid grid-cols-3 gap-2"
              >
                {PACE_TIERS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={pace === p.id}
                    onClick={() => setPace(p.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      pace === p.id
                        ? "bg-[#FDF2CC] border-[#F2B705] text-[#14202B] shadow-2xs font-bold"
                        : "bg-white border-[#DCE1DD] text-[#586673] hover:border-gray-400"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#14202B]">{lang === "kn" ? p.titleKn : p.titleEn}</div>
                    <div className="text-[10px] text-[#586673] mt-0.5">{lang === "kn" ? p.subKn : p.subEn}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Month Picker with Best Season Dots */}
          <div className="pt-2">
            <span
              id="month-group-label"
              className="block font-heading font-bold text-sm text-[#14202B] mb-1"
            >
              {lang === "kn" ? "ಯಾವ ತಿಂಗಳಲ್ಲಿ ಪ್ರಯಾಣ?" : "When are you travelling?"}
            </span>
            <p className="text-xs text-[#586673] mb-3">
              {lang === "kn" ? "ಹಸಿರು ಚುಕ್ಕೆ ನಿಮ್ಮ ಆಸಕ್ತಿಗಳಿಗೆ ಉತ್ತಮ ತಿಂಗಳುಗಳನ್ನು ಸೂಚಿಸುತ್ತದೆ" : "A green dot marks the best months for your interests"}
            </p>
            <div
              role="group"
              aria-labelledby="month-group-label"
              className="grid grid-cols-6 sm:grid-cols-12 gap-1.5"
            >
              {MONTH_NAMES.map((mName, mIdx) => {
                const monthNum = mIdx + 1;
                const isSelected = month === monthNum;
                const isBest = BEST_SEASON_MONTHS.includes(monthNum);

                return (
                  <button
                    key={mName}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setMonth(monthNum)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                      isSelected
                        ? "bg-[#8E1F2F] text-white border-[#8E1F2F] shadow-2xs"
                        : "bg-white border-[#DCE1DD] text-[#14202B] hover:bg-gray-50"
                    }`}
                  >
                    <span>{lang === "kn" ? MONTH_NAMES_KN[mIdx] : mName}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isBest
                          ? isSelected
                            ? "bg-white"
                            : "bg-[#1E6B52]"
                          : "bg-transparent"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Optional Filters (mockup 02 Part 2) */}
          <div className="pt-4 border-t border-[#F1F3F0] space-y-4">
            <h4 className="font-heading font-bold text-sm text-[#14202B]">
              {lang === "kn" ? "ಹೆಚ್ಚುವರಿ ಆದ್ಯತೆಗಳು" : "Optional preferences"}
            </h4>

            {/* Food preference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#14202B]">
                {lang === "kn" ? "ಆಹಾರ ಆದ್ಯತೆ (ಊಟದ ನಿಲುಗಡೆಗಳು)" : "Food preference (filters meal stops)"}
              </span>
              <div className="flex items-center gap-1.5">
                {FOOD_OPTIONS.map((pref) => (
                  <button
                    key={pref.id}
                    type="button"
                    onClick={() => setFoodPref(pref.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      foodPref === pref.id
                        ? "bg-[#8E1F2F] text-white"
                        : "bg-[#F1F3F0] text-[#14202B] hover:bg-gray-200"
                    }`}
                  >
                    {lang === "kn" ? pref.labelKn : pref.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Getting around */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#14202B]">
                {lang === "kn" ? "ಸಾರಿಗೆ ವಿಧಾನ (ಪ್ರಯಾಣ ಸಮಯ ಮತ್ತು ವೆಚ್ಚ)" : "Getting around (changes travel time and cost)"}
              </span>
              <div className="flex items-center gap-1.5">
                {TRANSPORT_OPTIONS.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setTransportMode(mode.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-colors ${
                      transportMode === mode.id
                        ? "bg-[#8E1F2F] text-white"
                        : "bg-[#F1F3F0] text-[#14202B] hover:bg-gray-200"
                    }`}
                  >
                    {lang === "kn" ? mode.labelKn : mode.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Low walking switch */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium text-[#14202B]">
                  {lang === "kn" ? "ಕಡಿಮೆ ನಡಿಗೆ" : "Low walking"}
                </div>
                <div className="text-[11px] text-[#586673]">
                  {lang === "kn" ? "ಹಿರಿಯರು ಮತ್ತು ಮಕ್ಕಳಿಗೆ ಸೂಕ್ತ" : "Better for seniors and young children"}
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={lowWalking}
                aria-label={lang === "kn" ? "ಕಡಿಮೆ ನಡಿಗೆ" : "Low walking"}
                onClick={() => setLowWalking(!lowWalking)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  lowWalking ? "bg-[#1E6B52]" : "bg-[#DCE1DD]"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    lowWalking ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Mobile Match Count Badge (visible only on < lg screens where the right column is hidden) */}
          <div className="block lg:hidden pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8E1F2F] bg-[#F9EBEB] px-3 py-1.5 rounded-lg border border-[#F2D6D6]">
              <span>📍</span>
              <span>
                {lang === "kn"
                  ? `${totalMatchingPlacesCount} ಸ್ಥಳಗಳು ನಿಮ್ಮ ಆಸಕ್ತಿಗಳಿಗೆ ಹೊಂದುತ್ತವೆ`
                  : `${totalMatchingPlacesCount} Karnataka places match your interests`}
              </span>
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="submit"
              disabled={interests.length === 0 || submitting}
              className="w-full sm:w-auto justify-center px-8 py-3.5 rounded-xl font-bold text-sm bg-[#8E1F2F] hover:bg-[#781926] text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>✦</span>
              <span>{submitting ? (lang === "kn" ? "ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ..." : "Generating...") : (lang === "kn" ? "ನನ್ನ ಪ್ರವಾಸ ಯೋಜನೆ ರಚಿಸಿ" : "Generate my itinerary")}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const sampleUrl = "/trip?sample=heritage";
                try {
                  router.push(sampleUrl);
                } catch {
                  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                  window.location.href = sampleUrl;
                }
              }}
              className="w-full sm:w-auto text-center px-5 py-3.5 rounded-xl font-semibold text-sm bg-white border border-[#DCE1DD] text-[#14202B] hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
            >
              {lang === "kn" ? "ಮಾದರಿ ಪ್ರವಾಸ ನೋಡಿ" : "Surprise me"}
            </button>
          </div>
        </form>
      </div>

      {/* RIGHT COLUMN: Sticky Brief & Top Matches Panel (5 cols) */}
      <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-8 space-y-5">
        {/* Live Karnataka Map preview */}
        <div className="bg-white rounded-2xl p-4 border border-[#DCE1DD] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#8E1F2F] bg-[#F9EBEB] px-2.5 py-1 rounded-md">
              {lang === "kn"
                ? `${totalMatchingPlacesCount} ಸ್ಥಳಗಳು ಹೊಂದುತ್ತವೆ`
                : `${totalMatchingPlacesCount} ${totalMatchingPlacesCount === 1 ? "place matches" : "places match"}`}
            </span>
            <span className="text-[11px] text-[#586673] font-medium">
              {lang === "kn" ? "ನೈಜ ನಕ್ಷೆ" : "Real-time Map"}
            </span>
          </div>
          <PlannerMap selectedCategories={interests} height="h-[320px]" />
        </div>

        {/* Your Trip Brief Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-xs space-y-3">
          <h3 className="font-heading font-bold text-base text-[#14202B]">
            {lang === "kn" ? "ನಿಮ್ಮ ಪ್ರವಾಸದ ಸಾರಾಂಶ" : "Your trip brief"}
          </h3>

          <div className="space-y-2 text-xs divide-y divide-[#F1F3F0]">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">{lang === "kn" ? "ಪ್ರವಾಸ" : "Trip"}</span>
              <span className="font-semibold text-[#14202B]">
                {lang === "kn" ? `${startCity} ನಿಂದ ${days} ದಿನಗಳು` : `${days} days from ${startCity}`}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">{lang === "kn" ? "ಪ್ರಯಾಣಿಕರು" : "Travellers"}</span>
              <span className="font-semibold text-[#14202B]">
                {lang === "kn" ? (TRAVELLER_CONFIG.find(t => t.id === travellers)?.labelKn || travellers) : travellers} ({peopleCount})
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">{lang === "kn" ? "ಆಸಕ್ತಿಗಳು" : "Interests"}</span>
              <span className="font-semibold text-[#14202B]">
                {interests.map(i => lang === "kn" ? (CATEGORY_TILES.find(c => c.id === i)?.labelKn || i) : i).join(", ")}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">{lang === "kn" ? "ವೆಚ್ಚ ಮತ್ತು ವೇಗ" : "Spend"}</span>
              <span className="font-semibold text-[#14202B]">
                {lang === "kn" ? (BUDGET_TIERS.find(b => b.id === budget)?.titleKn || budget) : budget}, {lang === "kn" ? (PACE_TIERS.find(p => p.id === pace)?.titleKn || pace) : pace}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">{lang === "kn" ? "ತಿಂಗಳು" : "Month"}</span>
              <span className="font-semibold text-[#14202B]">
                {lang === "kn" ? MONTH_NAMES_KN[month - 1] : MONTH_NAMES[month - 1]} {BEST_SEASON_MONTHS.includes(month) && (lang === "kn" ? "· ಉತ್ತಮ ಕಾಲ" : "· Best season")}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DCE1DD]">
            <div className="text-[11px] text-[#586673]">
              {lang === "kn" ? `${peopleCount} ಜನರಿಗೆ ಅಂದಾಜು ಒಟ್ಟು` : `Estimated total for ${peopleCount}`}
            </div>
            <div className="font-heading font-extrabold text-2xl text-[#14202B]">
              {costRange.text}
            </div>
          </div>
        </div>

        {/* Top Matches Panel */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-xs space-y-3">
          <h4 className="font-heading font-bold text-sm text-[#14202B]">
            {lang === "kn" ? "ಪ್ರಮುಖ ಹೊಂದಾಣಿಕೆಗಳು" : "Top matches"}
          </h4>

          <div className="space-y-2.5">
            {(showAllMatches ? matchedCandidates : matchedCandidates.slice(0, 5)).map((place) => (
              <div
                key={place.id}
                className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2] text-xs"
              >
                <div>
                  <div className="font-bold text-[#14202B]">{lang === "kn" ? (place.name_kn || place.name_en) : place.name_en}</div>
                  <div className="text-[11px] text-[#586673]">{place.city}</div>
                </div>
                <span className="text-[#1E6B52] font-bold">✓</span>
              </div>
            ))}
          </div>

          {matchedCandidates.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllMatches(!showAllMatches)}
              className="text-xs font-semibold text-[#8E1F2F] hover:underline cursor-pointer"
            >
              {showAllMatches
                ? (lang === "kn" ? "ಕಡಿಮೆ ತೋರಿಸಿ" : "Show fewer")
                : (lang === "kn" ? `+ ${matchedCandidates.length - 5} ಇತರ ಸ್ಥಳಗಳು` : `+ ${matchedCandidates.length - 5} more places`)}
            </button>
          )}
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM BAR (mockup 02) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md p-3.5 border-t border-[#DCE1DD] shadow-lg flex items-center justify-between gap-3">
        <div>
          <div className="font-bold text-xs text-[#14202B]">
            {lang === "kn"
              ? `${totalMatchingPlacesCount} ಸ್ಥಳಗಳು ಹೊಂದುತ್ತವೆ`
              : `${totalMatchingPlacesCount} ${totalMatchingPlacesCount === 1 ? "place matches" : "places match"}`}
          </div>
          <div className="text-[11px] text-[#586673]">
            {lang === "kn" ? `ಸುಮಾರು ${costRange.text}` : `about ${costRange.text}`}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={interests.length === 0 || submitting}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#8E1F2F] text-white shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
        >
          {submitting
            ? (lang === "kn" ? "ಸಿದ್ಧವಾಗುತ್ತಿದೆ..." : "Generating...")
            : (lang === "kn" ? "ರಚಿಸಿ" : "Generate")}
        </button>
      </div>
    </div>
  );
}