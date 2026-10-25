"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

const BEST_SEASON_MONTHS = [10, 11, 12, 1, 2]; // Oct to Feb in Karnataka

export default function PlannerForm() {
  const { lang } = useLang();
  const router = useRouter();

  // Primary state
  const [interests, setInterests] = useState<Category[]>(["heritage", "food"]);
  const [days, setDays] = useState<number>(4);
  const [startCity, setStartCity] = useState<StartCity>("Bengaluru");
  const [budget, setBudget] = useState<BudgetFit>("mid");
  const [pace, setPace] = useState<Pace>("relaxed");
  const [travellers, setTravellers] = useState<Travellers>("couple");
  const [peopleCount, setPeopleCount] = useState<number>(2);
  const [month, setMonth] = useState<number>(11);

  // Optional filters (safe & backwards compatible)
  const [foodPref, setFoodPref] = useState<"any" | "veg" | "nonveg">("any");
  const [transportMode, setTransportMode] = useState<"cab" | "own_car" | "bus_train">("cab");
  const [lowWalking, setLowWalking] = useState<boolean>(false);
  const [showAllMatches, setShowAllMatches] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

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
    }),
    [interests, days, startCity, budget, pace, travellers, month, lang]
  );

  const matchedCandidates = useMemo(() => {
    return getCandidates(planRequest, allPlaces);
  }, [planRequest]);

  const totalMatchingPlacesCount = useMemo(() => {
    return countMatchingPlaces(interests, allPlaces);
  }, [interests]);

  const costRange = useMemo(() => {
    return estimateCostRange(days, budget, peopleCount);
  }, [days, budget, peopleCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interests.length === 0 || submitting) return;

    setSubmitting(true);
    const params = new URLSearchParams({
      interests: interests.join(","),
      days: days.toString(),
      start_city: startCity,
      budget,
      pace,
      travellers,
      month: month.toString(),
      lang,
    });

    router.push(`/trip?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. What do you enjoy? (Interest Tiles matching mockup 02) */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <label className="block font-heading font-bold text-base text-[#14202B]">
                {lang === "kn" ? "ನಿಮ್ಮ ಆಸಕ್ತಿಗಳೇನು?" : "What do you enjoy?"}
              </label>
              <span className="text-xs text-[#586673]">
                {interests.length >= 4 ? "Max 4" : "Pick 1 to 4"}
              </span>
            </div>
            <p className="text-xs text-[#586673] mb-3">
              {lang === "kn"
                ? "ಒಂದರಿಂದ ನಾಲ್ಕು ಆಯ್ಕೆಮಾಡಿ. ಸಂಖ್ಯೆಗಳು ಲಭ್ಯವಿರುವ ಸ್ಥಳಗಳನ್ನು ತೋರಿಸುತ್ತವೆ."
                : "Pick one to four. Numbers show how many places we have."}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORY_TILES.map((cat) => {
                const selected = interests.includes(cat.id);
                const placeCount = allPlaces.filter((p) => p.categories.includes(cat.id)).length;

                return (
                  <button
                    key={cat.id}
                    type="button"
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
              <label className="block font-heading font-bold text-sm text-[#14202B] mb-1">
                {lang === "kn" ? "ಎಷ್ಟು ದಿನಗಳು?" : "How many days?"}
              </label>
              <p className="text-xs text-[#586673] mb-3">Choose 1 to 7</p>

              <div className="flex items-center gap-3">
                <span className="font-heading font-extrabold text-3xl text-[#8E1F2F]">
                  {days}
                </span>
                <span className="text-xs font-semibold text-[#14202B]">
                  {days === 1 ? "day" : "days"}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={7}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full mt-3 accent-[#8E1F2F] cursor-pointer"
              />
            </div>

            {/* Who is travelling? */}
            <div>
              <label className="block font-heading font-bold text-sm text-[#14202B] mb-1">
                {lang === "kn" ? "ಯಾರು ಪ್ರಯಾಣಿಸುತ್ತಿದ್ದಾರೆ?" : "Who is travelling?"}
              </label>
              <p className="text-xs text-[#586673] mb-3">Costs are worked out for the group</p>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(["solo", "couple", "family", "friends"] as Travellers[]).map((tr) => (
                  <button
                    key={tr}
                    type="button"
                    onClick={() => {
                      setTravellers(tr);
                      setPeopleCount(PEOPLE_COUNT_MAP[tr] || 2);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize cursor-pointer transition-colors ${
                      travellers === tr
                        ? "bg-[#14202B] text-white"
                        : "bg-[#F1F3F0] text-[#14202B] hover:bg-gray-200"
                    }`}
                  >
                    {tr}
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
                  {peopleCount} {peopleCount === 1 ? "person" : "people"}
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
              <label className="block font-heading font-bold text-sm text-[#14202B] mb-1">
                Budget
              </label>
              <p className="text-xs text-[#586673] mb-3">
                Rs per person per day, stay and food included
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "budget" as BudgetFit, sym: "₹", title: "Budget", sub: "under 2.5k" },
                  { id: "mid" as BudgetFit, sym: "₹₹", title: "Mid-range", sub: "2.5k to 5k" },
                  { id: "premium" as BudgetFit, sym: "₹₹₹", title: "Premium", sub: "above 5k" },
                ].map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBudget(b.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      budget === b.id
                        ? "bg-[#FDF2CC] border-[#F2B705] text-[#14202B] shadow-2xs font-bold"
                        : "bg-white border-[#DCE1DD] text-[#586673] hover:border-gray-400"
                    }`}
                  >
                    <div className="text-xs text-[#8C6D05] font-bold">{b.sym}</div>
                    <div className="text-xs font-bold text-[#14202B] mt-0.5">{b.title}</div>
                    <div className="text-[10px] text-[#586673]">{b.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pace */}
            <div>
              <label className="block font-heading font-bold text-sm text-[#14202B] mb-1">
                Pace
              </label>
              <p className="text-xs text-[#586673] mb-3">Stops per day</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "relaxed" as Pace, title: "Relaxed", sub: "2 to 3" },
                  { id: "balanced" as Pace, title: "Balanced", sub: "3 to 4" },
                  { id: "packed" as Pace, title: "Packed", sub: "5+" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPace(p.id)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      pace === p.id
                        ? "bg-[#FDF2CC] border-[#F2B705] text-[#14202B] shadow-2xs font-bold"
                        : "bg-white border-[#DCE1DD] text-[#586673] hover:border-gray-400"
                    }`}
                  >
                    <div className="text-xs font-bold text-[#14202B]">{p.title}</div>
                    <div className="text-[10px] text-[#586673] mt-0.5">{p.sub}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Month Picker with Best Season Dots */}
          <div className="pt-2">
            <label className="block font-heading font-bold text-sm text-[#14202B] mb-1">
              When are you travelling?
            </label>
            <p className="text-xs text-[#586673] mb-3">
              A green dot marks the best months for your interests
            </p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
              {MONTH_NAMES.map((mName, mIdx) => {
                const monthNum = mIdx + 1;
                const isSelected = month === monthNum;
                const isBest = BEST_SEASON_MONTHS.includes(monthNum);

                return (
                  <button
                    key={mName}
                    type="button"
                    onClick={() => setMonth(monthNum)}
                    className={`py-2 px-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center border ${
                      isSelected
                        ? "bg-[#8E1F2F] text-white border-[#8E1F2F] shadow-2xs"
                        : "bg-white border-[#DCE1DD] text-[#14202B] hover:bg-gray-50"
                    }`}
                  >
                    <span>{mName}</span>
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
              Optional preferences
            </h4>

            {/* Food preference */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#14202B]">
                Food preference (filters meal stops)
              </span>
              <div className="flex items-center gap-1.5">
                {(["any", "veg", "nonveg"] as const).map((pref) => (
                  <button
                    key={pref}
                    type="button"
                    onClick={() => setFoodPref(pref)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold capitalize cursor-pointer transition-colors ${
                      foodPref === pref
                        ? "bg-[#8E1F2F] text-white"
                        : "bg-[#F1F3F0] text-[#14202B] hover:bg-gray-200"
                    }`}
                  >
                    {pref === "nonveg" ? "Non-veg" : pref}
                  </button>
                ))}
              </div>
            </div>

            {/* Getting around */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-medium text-[#14202B]">
                Getting around (changes travel time and cost)
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { id: "cab" as const, label: "Cab" },
                  { id: "own_car" as const, label: "Own car" },
                  { id: "bus_train" as const, label: "Bus & train" },
                ].map((mode) => (
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
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Low walking switch */}
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-medium text-[#14202B]">
                  Low walking
                </div>
                <div className="text-[11px] text-[#586673]">
                  Better for seniors and young children
                </div>
              </div>
              <button
                type="button"
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

          {/* Submit Action */}
          <div className="pt-4 flex items-center gap-4">
            <button
              type="submit"
              disabled={interests.length === 0 || submitting}
              className="px-8 py-3.5 rounded-xl font-bold text-sm bg-[#8E1F2F] hover:bg-[#781926] text-white shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >
              <span>✦</span>
              <span>Generate my itinerary</span>
            </button>
            <button
              type="button"
              onClick={() => router.push("/trip?sample=heritage")}
              className="px-5 py-3.5 rounded-xl font-semibold text-sm bg-white border border-[#DCE1DD] text-[#14202B] hover:bg-gray-50 transition-all cursor-pointer shadow-2xs"
            >
              Surprise me
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
              Real-time Map
            </span>
          </div>
          <PlannerMap selectedCategories={interests} height="h-[320px]" />
        </div>

        {/* Your Trip Brief Summary */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-xs space-y-3">
          <h3 className="font-heading font-bold text-base text-[#14202B]">
            Your trip brief
          </h3>

          <div className="space-y-2 text-xs divide-y divide-[#F1F3F0]">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">Trip</span>
              <span className="font-semibold text-[#14202B]">
                {days} days from {startCity}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">Travellers</span>
              <span className="font-semibold text-[#14202B] capitalize">
                {travellers} ({peopleCount})
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">Interests</span>
              <span className="font-semibold text-[#14202B] capitalize">
                {interests.join(", ")}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">Spend</span>
              <span className="font-semibold text-[#14202B] capitalize">
                {budget}, {pace}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[#586673]">Month</span>
              <span className="font-semibold text-[#14202B]">
                {MONTH_NAMES[month - 1]} {BEST_SEASON_MONTHS.includes(month) && "· Best season"}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-[#DCE1DD]">
            <div className="text-[11px] text-[#586673]">
              Estimated total for {peopleCount}
            </div>
            <div className="font-heading font-extrabold text-2xl text-[#14202B]">
              {costRange.text}
            </div>
          </div>
        </div>

        {/* Top Matches Panel */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-xs space-y-3">
          <h4 className="font-heading font-bold text-sm text-[#14202B]">
            Top matches
          </h4>

          <div className="space-y-2.5">
            {(showAllMatches ? matchedCandidates : matchedCandidates.slice(0, 5)).map((place) => (
              <div
                key={place.id}
                className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2] text-xs"
              >
                <div>
                  <div className="font-bold text-[#14202B]">{place.name_en}</div>
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
                ? "Show fewer"
                : `+ ${matchedCandidates.length - 5} more places`}
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
            about {costRange.text}
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={interests.length === 0 || submitting}
          className="px-5 py-2.5 rounded-xl font-bold text-xs bg-[#8E1F2F] text-white shadow-xs active:scale-95 cursor-pointer disabled:opacity-50"
        >
          Generate
        </button>
      </div>
    </div>
  );
}