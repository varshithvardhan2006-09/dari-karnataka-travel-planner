"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/useLang";
import { Category, StartCity, BudgetFit, Pace, Travellers, PlanRequest, Place } from "@/lib/schema";
import { getCandidates } from "@/lib/candidates";
import placesData from "../../data/places.json";

const CATEGORY_KEYS: { id: Category; labelKey: string }[] = [
  { id: "heritage", labelKey: "form.categories.heritage" },
  { id: "nature", labelKey: "form.categories.nature" },
  { id: "food", labelKey: "form.categories.food" },
  { id: "spiritual", labelKey: "form.categories.spiritual" },
  { id: "adventure", labelKey: "form.categories.adventure" },
  { id: "beach", labelKey: "form.categories.beach" },
  { id: "wildlife", labelKey: "form.categories.wildlife" },
  { id: "coffee", labelKey: "form.categories.coffee" },
  { id: "culture", labelKey: "form.categories.culture" },
];

const POPULAR_START_CITIES: string[] = [
  "Bengaluru",
  "Mysuru",
  "Mangaluru",
  "Hubballi",
  "Hampi",
  "Madikeri",
  "Chikkamagaluru",
  "Udupi",
  "Gokarna",
  "Belagavi",
  "Shivamogga",
  "Hassan",
  "Vijayapura",
  "Kalaburagi",
  "Badami",
  "Bidar",
];
const BUDGET_TIERS: BudgetFit[] = ["budget", "mid", "premium"];
const PACE_TIERS: Pace[] = ["relaxed", "balanced", "packed"];
const TRAVELLERS_LIST: Travellers[] = ["solo", "couple", "family", "friends"];
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function PlannerForm() {
  const { t, lang } = useLang();
  const router = useRouter();

  // Form State initialized to match mockup default (4 days, Bengaluru, couple, mid, relaxed, November, Heritage + Food)
  const [interests, setInterests] = useState<Category[]>(["heritage", "food"]);
  const [days, setDays] = useState<number>(4);
  const [startCity, setStartCity] = useState<StartCity>("Bengaluru");
  const [customCity, setCustomCity] = useState<string>("");
  const [isCustomCity, setIsCustomCity] = useState<boolean>(false);
  const [budget, setBudget] = useState<BudgetFit>("mid");
  const [pace, setPace] = useState<Pace>("relaxed");
  const [travellers, setTravellers] = useState<Travellers>("couple");
  const [month, setMonth] = useState<number>(11);
  const [submitting, setSubmitting] = useState(false);

  // Toggle category chips (max 4)
  const toggleInterest = (category: Category) => {
    if (interests.includes(category)) {
      setInterests(interests.filter((c) => c !== category));
    } else {
      if (interests.length >= 4) return;
      setInterests([...interests, category]);
    }
  };

  // Live candidates computation
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
    return getCandidates(planRequest, placesData as Place[]);
  }, [planRequest]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (interests.length === 0 || submitting) return;

    setSubmitting(true);
    // Encode parameters into URL query params for stateful navigation & direct API hydration
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
      {/* Left Column: Form Controls */}
      <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-8 border border-[#DCE1DD] shadow-xs">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 1. Interests */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <label className="block font-semibold text-[#14202B] text-base">
                {t("form.interests_label")}{" "}
                <span className="font-normal text-[#586673] text-sm">
                  {t("form.interests_hint")}
                </span>
              </label>
              {interests.length >= 4 && (
                <span className="text-xs text-[#8E1F2F] font-medium">Max 4 selected</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_KEYS.map((cat) => {
                const selected = interests.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleInterest(cat.id)}
                    className={`min-h-[40px] px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border ${
                      selected
                        ? "bg-[#8E1F2F] text-white border-[#8E1F2F] shadow-2xs"
                        : "bg-white text-[#14202B] border-[#DCE1DD] hover:border-gray-400"
                    }`}
                  >
                    {t(cat.labelKey)}
                  </button>
                );
              })}
            </div>
            {interests.length === 0 && (
              <p className="mt-2 text-xs text-[#8E1F2F]">
                {t("form.submit_disabled")}
              </p>
            )}
          </div>

          {/* 2. Days Stepper & Starting City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#14202B] text-sm mb-2">
                {t("form.days_label")}
              </label>
              <div className="flex items-center w-full max-w-[180px] rounded-xl border border-[#DCE1DD] bg-white overflow-hidden shadow-2xs">
                <button
                  type="button"
                  disabled={days <= 1}
                  onClick={() => setDays((d) => Math.max(1, d - 1))}
                  className="w-12 h-11 flex items-center justify-center text-lg font-bold text-[#14202B] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  aria-label="Decrease days"
                >
                  -
                </button>
                <div className="flex-1 text-center font-bold text-[#14202B] text-base">
                  {days}
                </div>
                <button
                  type="button"
                  disabled={days >= 7}
                  onClick={() => setDays((d) => Math.min(7, d + 1))}
                  className="w-12 h-11 flex items-center justify-center text-lg font-bold text-[#14202B] hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
                  aria-label="Increase days"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#14202B] text-sm mb-2">
                {t("form.start_city_label")}
              </label>
              <select
                value={isCustomCity ? "Other" : startCity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "Other") {
                    setIsCustomCity(true);
                    setStartCity(customCity || "Bengaluru");
                  } else {
                    setIsCustomCity(false);
                    setStartCity(val);
                  }
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-[#DCE1DD] bg-white text-sm font-medium text-[#14202B] shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#8E1F2F]"
              >
                {POPULAR_START_CITIES.map((city) => (
                  <option key={city} value={city}>
                    {t(`form.cities.${city}`, city)}
                  </option>
                ))}
                <option value="Other">
                  {t("form.cities.Other", "Other / Enter Location")}
                </option>
              </select>

              {isCustomCity && (
                <input
                  type="text"
                  value={customCity}
                  onChange={(e) => {
                    const text = e.target.value;
                    setCustomCity(text);
                    setStartCity(text.trim() || "Bengaluru");
                  }}
                  placeholder={t("form.cities.custom_placeholder", "Enter any Karnataka city or town...")}
                  className="mt-2.5 w-full h-11 px-3.5 rounded-xl border border-[#8E1F2F]/40 bg-white text-sm font-medium text-[#14202B] shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#8E1F2F] animate-in fade-in duration-200"
                  autoFocus
                />
              )}
            </div>
          </div>

          {/* 3. Budget Segmented Control */}
          <div>
            <div className="mb-2">
              <label className="font-semibold text-[#14202B] text-sm">
                {t("form.budget_label")}
              </label>
              <span className="text-[#586673] text-xs ml-2">
                {t("form.budget_sub")}
              </span>
            </div>
            <div className="grid grid-cols-3 rounded-xl border border-[#DCE1DD] bg-white overflow-hidden shadow-2xs divide-x divide-[#DCE1DD]">
              {BUDGET_TIERS.map((b) => {
                const active = budget === b;
                return (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setBudget(b)}
                    className={`py-3 px-2 sm:px-4 text-center transition-all cursor-pointer relative ${
                      active
                        ? "bg-[#FDF2CC] text-[#14202B] font-semibold"
                        : "hover:bg-gray-50 text-[#14202B]/80"
                    }`}
                  >
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#F2B705]" />
                    )}
                    <div className="text-sm font-bold">{t(`form.budget_tiers.${b}`)}</div>
                    <div className="text-xs text-[#586673] mt-0.5">
                      {t(`form.budget_tiers.${b}_sub`)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Pace Segmented Control */}
          <div>
            <label className="block font-semibold text-[#14202B] text-sm mb-2">
              {t("form.pace_label")}
            </label>
            <div className="grid grid-cols-3 rounded-xl border border-[#DCE1DD] bg-white overflow-hidden shadow-2xs divide-x divide-[#DCE1DD]">
              {PACE_TIERS.map((p) => {
                const active = pace === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPace(p)}
                    className={`py-3 px-2 sm:px-4 text-center transition-all cursor-pointer relative ${
                      active
                        ? "bg-[#FDF2CC] text-[#14202B] font-semibold"
                        : "hover:bg-gray-50 text-[#14202B]/80"
                    }`}
                  >
                    {active && (
                      <span className="absolute bottom-0 left-0 right-0 h-1 bg-[#F2B705]" />
                    )}
                    <div className="text-sm font-bold">{t(`form.pace_tiers.${p}`)}</div>
                    <div className="text-xs text-[#586673] mt-0.5">
                      {t(`form.pace_tiers.${p}_sub`)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Travellers & Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block font-semibold text-[#14202B] text-sm mb-2">
                {t("form.travellers_label")}
              </label>
              <div className="flex flex-wrap gap-2">
                {TRAVELLERS_LIST.map((tr) => {
                  const active = travellers === tr;
                  return (
                    <button
                      key={tr}
                      type="button"
                      onClick={() => setTravellers(tr)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer border ${
                        active
                          ? "bg-[#8E1F2F] text-white border-[#8E1F2F] shadow-2xs"
                          : "bg-white text-[#14202B] border-[#DCE1DD] hover:border-gray-400"
                      }`}
                    >
                      {t(`form.traveller_types.${tr}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#14202B] text-sm mb-2">
                {t("form.month_label")}
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full h-11 px-3.5 rounded-xl border border-[#DCE1DD] bg-white text-sm font-medium text-[#14202B] shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#8E1F2F]"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {t(`form.months.${m}`)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={interests.length === 0 || submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-xl font-semibold text-white bg-[#8E1F2F] hover:bg-[#781926] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] transition-all shadow-sm min-h-[48px] text-base"
            >
              {submitting ? "Preparing itinerary..." : t("form.submit_button")}
            </button>
          </div>
        </form>
      </div>

      {/* Right Column: Live "Your trip brief" side panel */}
      <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-8 border border-[#DCE1DD] shadow-xs sticky top-8">
        <h2 className="font-heading font-bold text-xl text-[#14202B] mb-6">
          {t("brief.title")}
        </h2>

        {/* TRIP */}
        <div className="mb-5 pb-5 border-b border-[#DCE1DD]/60">
          <span className="text-xs font-bold tracking-wider text-[#586673] uppercase">
            {t("brief.tag_trip")}
          </span>
          <p className="font-semibold text-base text-[#14202B] mt-1">
            {days} {t("common.days")} from {t(`form.cities.${startCity}`, startCity)},{" "}
            {t(`form.traveller_types.${travellers}`).toLowerCase()}
          </p>
        </div>

        {/* INTERESTS */}
        <div className="mb-5 pb-5 border-b border-[#DCE1DD]/60">
          <span className="text-xs font-bold tracking-wider text-[#586673] uppercase">
            {t("brief.tag_interests")}
          </span>
          <div className="flex flex-wrap gap-2 mt-2">
            {interests.length > 0 ? (
              interests.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-[#F9EBEB] text-[#8E1F2F]"
                >
                  {t(`form.categories.${cat}`)}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#8E1F2F] italic">None selected</span>
            )}
          </div>
        </div>

        {/* SPEND */}
        <div className="mb-5 pb-5 border-b border-[#DCE1DD]/60">
          <span className="text-xs font-bold tracking-wider text-[#586673] uppercase">
            {t("brief.tag_spend")}
          </span>
          <p className="font-semibold text-base text-[#14202B] mt-1 capitalize">
            {t(`form.budget_tiers.${budget}`)}, {t(`form.pace_tiers.${pace}`)} {t("form.pace_label").toLowerCase()}
          </p>
        </div>

        {/* PLACES THAT MATCH */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold tracking-wider text-[#586673] uppercase">
              {t("brief.tag_places")}
            </span>
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-[#DDEFE7] text-[#1E6B52]">
              {matchedCandidates.length}
            </span>
          </div>

          {matchedCandidates.length > 0 ? (
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1.5 divide-y divide-dashed divide-[#DCE1DD]/60 scrollbar-thin">
              {matchedCandidates.map((place, idx) => (
                <div
                  key={place.id}
                  className="flex items-center justify-between text-sm py-1.5 first:pt-0"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span className="text-xs font-bold text-[#8E1F2F]/60 w-5 shrink-0 text-right">
                      {idx + 1}.
                    </span>
                    <span
                      className="font-medium text-[#14202B] truncate"
                      title={lang === "kn" ? place.name_kn : place.name_en}
                    >
                      {lang === "kn" ? place.name_kn : place.name_en}
                    </span>
                  </div>
                  <span className="text-xs text-[#586673] shrink-0 font-medium bg-[#F2F4F1] px-2 py-0.5 rounded-md">
                    {place.city}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#586673] italic">
              {t("brief.no_matches")}
            </p>
          )}
        </div>

        {/* Honest Dataset Estimate Notice */}
        <div className="mt-5 pt-4 border-t border-[#DCE1DD] flex items-start gap-2.5 text-xs text-[#586673] bg-[#F7F9F6] p-3 rounded-xl border border-[#E2E7E2]">
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] shrink-0 mt-0.5">
            ✓
          </span>
          <p className="leading-relaxed">
            <strong className="text-[#14202B] font-semibold">{t("common.accuracy_badge")}:</strong>{" "}
            {t("common.accuracy_disclaimer")}
          </p>
        </div>
      </div>
    </div>
  );
}
