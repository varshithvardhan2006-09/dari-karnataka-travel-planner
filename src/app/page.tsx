"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PalaceScene from "@/components/illustrations/PalaceScene";
import HampiScene from "@/components/illustrations/HampiScene";
import CoastScene from "@/components/illustrations/CoastScene";
import { playKannadaSpeech } from "@/lib/speech";
import phrasesData from "../../data/phrases.json";
import { Phrase } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";

const RegionMap = dynamic(() => import("@/components/RegionMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[360px] sm:h-[400px] bg-[#F1F3F0] rounded-2xl border border-[#DCE1DD] flex items-center justify-center text-xs text-[#586673] animate-pulse">
      Loading interactive Karnataka map...
    </div>
  ),
});

const phrases = phrasesData as Phrase[];

export default function LandingPage() {
  const router = useRouter();
  const { lang, t } = useLang();

  // Quick-start bar states
  const [qsInterests, setQsInterests] = useState<string>("heritage,food");
  const [qsDays, setQsDays] = useState<number>(4);
  const [qsBudget, setQsBudget] = useState<string>("mid");
  const [qsMonth, setQsMonth] = useState<number>(11);

  // Region explorer state
  const [selectedRegion, setSelectedRegion] = useState<string>("all");

  // Kannada phrase of the day state
  const [phraseOfDay, setPhraseOfDay] = useState<Phrase>(phrases[0]);
  const [isSlowAudio, setIsSlowAudio] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [isPhraseSaved, setIsPhraseSaved] = useState<boolean>(false);

  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    const selected = phrases[dayOfYear % phrases.length] || phrases[0];

    let isSaved = false;
    try {
      const savedList = JSON.parse(localStorage.getItem("dari_saved_phrases") || "[]");
      isSaved = Array.isArray(savedList) && savedList.includes(selected.id);
    } catch {
      // ignore
    }

    queueMicrotask(() => {
      setPhraseOfDay(selected);
      if (isSaved) {
        setIsPhraseSaved(true);
      }
    });
  }, []);

  const playKannadaAudio = (text: string) => {
    playKannadaSpeech(text, {
      translit: phraseOfDay.translit,
      isSlow: isSlowAudio,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => setIsPlayingAudio(false),
    });
  };

  const toggleSavePhrase = () => {
    try {
      const savedList: string[] = JSON.parse(
        localStorage.getItem("dari_saved_phrases") || "[]"
      );
      let updated: string[];
      if (savedList.includes(phraseOfDay.id)) {
        updated = savedList.filter((id) => id !== phraseOfDay.id);
        setIsPhraseSaved(false);
      } else {
        updated = [...savedList, phraseOfDay.id];
        setIsPhraseSaved(true);
      }
      localStorage.setItem("dari_saved_phrases", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleQuickStartGenerate = () => {
    router.push(
      `/plan?interests=${encodeURIComponent(qsInterests)}&days=${qsDays}&budget=${qsBudget}&month=${qsMonth}`
    );
  };

  return (
    <div className="flex-1 flex flex-col max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 gap-16">
      {/* 1. HERO SECTION (mockup 01) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Eyebrow, H1, Buttons, Ticks */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-xs md:text-sm font-bold tracking-wider uppercase text-[#8E1F2F]">
              {t("landing.eyebrow", "AI TRAVEL PLANNER FOR KARNATAKA")}
            </span>
          </div>

          {lang === "kn" ? (
            <h1 className="font-heading font-extrabold text-3xl sm:text-4xl lg:text-5xl text-[#14202B] tracking-tight leading-[1.25] mb-5 font-kannada">
              ನಿಮ್ಮಿಷ್ಟದಂತೆ ಕರ್ನಾಟಕ <br />
              <span className="text-[#8E1F2F]">ಪ್ರವಾಸ ಯೋಜಿಸಿ.</span>
            </h1>
          ) : (
            <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#14202B] tracking-tight leading-[1.12] mb-5">
              Plan Karnataka <br />
              <span className="text-[#8E1F2F]">your way.</span>
            </h1>
          )}

          <p className="text-[#586673] text-base sm:text-lg leading-relaxed max-w-xl mb-8">
            {t(
              "landing.subtitle",
              "Tell us what you enjoy, how many days you have and what you can spend. Get a day-by-day plan built only from real places, with a route on the map and Kannada phrases for every stop."
            )}
          </p>

          <div className="flex flex-wrap items-center gap-4 mb-8">
            <Link
              href="/plan"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-white bg-[#8E1F2F] hover:bg-[#781926] active:scale-[0.98] transition-all shadow-sm min-h-[48px] gap-2"
            >
              <span>{t("landing.cta_plan", "Plan my trip")}</span>
              <span>→</span>
            </Link>
            <Link
              href="/trip?sample=heritage"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-[#14202B] bg-white border border-[#DCE1DD] hover:bg-gray-50 active:scale-[0.98] transition-all shadow-2xs min-h-[48px] gap-1.5"
            >
              <span className="text-[#8E1F2F]">✦</span>
              <span>{lang === "kn" ? "ಮಾದರಿ ಪ್ರವಾಸ ನೋಡಿ" : "Surprise me"}</span>
            </Link>
          </div>

          {/* Three Tick Lines */}
          <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm text-[#586673] font-medium">
            <div className="flex items-center gap-2">
              <span className="text-[#1E6B52] font-bold">✓</span>
              <span>{lang === "kn" ? "ಸೈನ್-ಅಪ್ ಅಗತ್ಯವಿಲ್ಲ" : "No sign-up"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#1E6B52] font-bold">✓</span>
              <span>{lang === "kn" ? "ಉಚಿತ ಬಳಕೆ" : "Free to use"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[#1E6B52] font-bold">✓</span>
              <span>{lang === "kn" ? "ಕನ್ನಡದಲ್ಲೇ ಲಭ್ಯ" : "Works in Kannada"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Scene Art Collage with Floating Info Cards */}
        <div className="lg:col-span-6 relative h-[380px] sm:h-[420px] rounded-3xl overflow-hidden p-2">
          {/* Bento grid of scenes */}
          <div className="grid grid-cols-12 gap-3 h-full">
            {/* Palace card (Large Left) */}
            <div className="col-span-7 h-full rounded-2xl overflow-hidden shadow-sm relative group">
              <PalaceScene className="transition-transform duration-700 group-hover:scale-105" />
            </div>

            {/* Hampi & Coast stacked on Right */}
            <div className="col-span-5 flex flex-col gap-3 h-full">
              <div className="h-1/2 rounded-2xl overflow-hidden shadow-sm relative group">
                <HampiScene className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="h-1/2 rounded-2xl overflow-hidden shadow-sm relative group">
                <CoastScene className="transition-transform duration-700 group-hover:scale-105" />
              </div>
            </div>
          </div>

          {/* Floating Info Card 1: Route Summary (bottom left) */}
          <div className="absolute bottom-6 left-6 z-10 bg-white/95 backdrop-blur-md rounded-2xl px-4 py-2.5 shadow-lg border border-[#DCE1DD] flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#F9EBEB] text-[#8E1F2F] flex items-center justify-center font-bold text-xs shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              </svg>
            </div>
            <div>
              <div className="font-heading font-bold text-xs text-[#14202B]">
                {lang === "kn" ? "೪ ದಿನಗಳು, ೧೨ ನಿಲುಗಡೆಗಳು" : "4 days, 12 stops"}
              </div>
              <div className="text-[10px] text-[#586673]">
                {lang === "kn" ? "ಮೈಸೂರಿನಿಂದ ಹಳೇಬೀಡು" : "Mysuru to Halebidu"}
              </div>
            </div>
          </div>

          {/* Floating Info Card 2: Price (top right) */}
          <div className="absolute top-6 right-6 z-10 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-[#DCE1DD] text-xs font-bold text-[#14202B]">
            ₹ {lang === "kn" ? "ರೂ ೧೪,೮೦೦" : "Rs 14,800"} <span className="font-normal text-[#586673] text-[10px]">{lang === "kn" ? "ಇಬ್ಬರಿಗೆ" : "for 2"}</span>
          </div>

          {/* Floating Info Card 3: Kannada Greeting (bottom right, visible on tablet/desktop to avoid mobile overlap) */}
          <div className="hidden sm:flex absolute bottom-6 right-6 z-10 bg-white/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-md border border-[#DCE1DD] text-xs font-bold text-[#14202B] items-center gap-1.5">
            <span className="text-[#8E1F2F]">ನಮಸ್ಕಾರ</span>
            <span className="font-normal text-[#586673] text-[10px]">Namaskara</span>
          </div>
        </div>
      </section>

      {/* 2. QUICK-START BAR UNDER HERO (mockup 01) */}
      <section className="bg-white rounded-2xl p-4 sm:p-5 border border-[#DCE1DD] shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-center">
          {/* Interests */}
          <div className="flex flex-col">
            <label
              htmlFor="qs-interests"
              className="text-[11px] font-bold text-[#586673] uppercase tracking-wider"
            >
              {lang === "kn" ? "ಆಸಕ್ತಿಗಳು" : "INTERESTS"}
            </label>
            <select
              id="qs-interests"
              value={qsInterests}
              onChange={(e) => setQsInterests(e.target.value)}
              className="mt-1 text-sm font-semibold text-[#14202B] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="heritage,food">{lang === "kn" ? "ಪರಂಪರೆ, ಆಹಾರ" : "Heritage, Food"}</option>
              <option value="nature,wildlife">{lang === "kn" ? "ಪ್ರಕೃತಿ, ವನ್ಯಜೀವಿ" : "Nature, Wildlife"}</option>
              <option value="beach,spiritual">{lang === "kn" ? "ಕಡಲತೀರ, ಆಧ್ಯಾತ್ಮಿಕ" : "Beach, Spiritual"}</option>
              <option value="adventure,coffee">{lang === "kn" ? "ಸಾಹಸ, ಕಾಫಿ" : "Adventure, Coffee"}</option>
            </select>
          </div>

          {/* Days */}
          <div className="flex flex-col border-l border-[#F1F3F0] pl-3">
            <label
              htmlFor="qs-days"
              className="text-[11px] font-bold text-[#586673] uppercase tracking-wider"
            >
              {lang === "kn" ? "ದಿನಗಳು" : "DAYS"}
            </label>
            <select
              id="qs-days"
              value={qsDays}
              onChange={(e) => setQsDays(Number(e.target.value))}
              className="mt-1 text-sm font-semibold text-[#14202B] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={2}>2 {lang === "kn" ? "ದಿನಗಳು" : "days"}</option>
              <option value={3}>3 {lang === "kn" ? "ದಿನಗಳು" : "days"}</option>
              <option value={4}>4 {lang === "kn" ? "ದಿನಗಳು" : "days"}</option>
              <option value={5}>5 {lang === "kn" ? "ದಿನಗಳು" : "days"}</option>
              <option value={7}>7 {lang === "kn" ? "ದಿನಗಳು" : "days"}</option>
            </select>
          </div>

          {/* Budget */}
          <div className="flex flex-col border-l border-[#F1F3F0] pl-3">
            <label
              htmlFor="qs-budget"
              className="text-[11px] font-bold text-[#586673] uppercase tracking-wider"
            >
              {lang === "kn" ? "ಬಜೆಟ್" : "BUDGET"}
            </label>
            <select
              id="qs-budget"
              value={qsBudget}
              onChange={(e) => setQsBudget(e.target.value)}
              className="mt-1 text-sm font-semibold text-[#14202B] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="budget">{lang === "kn" ? "ಮಿತವ್ಯಯ" : "Budget"}</option>
              <option value="mid">{lang === "kn" ? "ಮಧ್ಯಮ" : "Mid-range"}</option>
              <option value="premium">{lang === "kn" ? "ಐಷಾರಾಮಿ" : "Premium"}</option>
            </select>
          </div>

          {/* Month */}
          <div className="flex flex-col border-l border-[#F1F3F0] pl-3">
            <label
              htmlFor="qs-month"
              className="text-[11px] font-bold text-[#586673] uppercase tracking-wider"
            >
              {lang === "kn" ? "ತಿಂಗಳು" : "MONTH"}
            </label>
            <select
              id="qs-month"
              value={qsMonth}
              onChange={(e) => setQsMonth(Number(e.target.value))}
              className="mt-1 text-sm font-semibold text-[#14202B] bg-transparent focus:outline-none cursor-pointer"
            >
              <option value={10}>{lang === "kn" ? "ಅಕ್ಟೋಬರ್" : "October"}</option>
              <option value={11}>{lang === "kn" ? "ನವೆಂಬರ್" : "November"}</option>
              <option value={12}>{lang === "kn" ? "ಡಿಸೆಂಬರ್" : "December"}</option>
              <option value={1}>{lang === "kn" ? "ಜನವರಿ" : "January"}</option>
            </select>
          </div>

          {/* Generate Button */}
          <div className="col-span-2 md:col-span-1 flex justify-end">
            <button
              type="button"
              onClick={handleQuickStartGenerate}
              className="w-full py-3 px-5 rounded-xl font-bold text-sm bg-[#8E1F2F] hover:bg-[#781926] text-white flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
            >
              <span>✦</span>
              <span>{lang === "kn" ? "ರಚಿಸಿ" : "Generate"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. FOUR HONEST TRUST CARDS (mockup 01 Part 2) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Curated places */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#F9EBEB] text-[#8E1F2F] flex items-center justify-center mb-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2l10 8H2l10-8z" />
            </svg>
          </div>
          <h3 className="font-heading font-bold text-base text-[#14202B]">
            {t("landing.features.real_places_title", "Curated places")}
          </h3>
          <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
            {t("landing.features.real_places_desc", "The AI can only pick from our list, never invent.")}
          </p>
        </div>

        {/* Card 2: Kannada built in */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#FDF2CC] text-[#8C6D05] flex items-center justify-center mb-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <h3 className="font-heading font-bold text-base text-[#14202B]">
            {t("landing.features.kannada_title", "Kannada built in")}
          </h3>
          <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
            {t("landing.features.kannada_desc", "Names, phrases and audio, written by people.")}
          </p>
        </div>

        {/* Card 3: Always answers */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#F9EBEB] text-[#8E1F2F] flex items-center justify-center mb-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
            </svg>
          </div>
          <h3 className="font-heading font-bold text-base text-[#14202B]">
            {lang === "kn" ? "ಯಾವಾಗಲೂ ಲಭ್ಯ" : "Always answers"}
          </h3>
          <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
            {lang === "kn" ? "AI ಕಾರ್ಯನಿರತವಾಗಿದ್ದರೂ, ಸಿದ್ಧಪಡಿಸಿದ ಯೋಜಕ ನೆರವಾಗುತ್ತದೆ." : "If the AI is busy, a saved planner takes over."}
          </p>
        </div>

        {/* Card 4: Honest estimates */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-2xs">
          <div className="w-8 h-8 rounded-xl bg-[#E1ECF5] text-[#2B5F8A] flex items-center justify-center mb-3">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
          </div>
          <h3 className="font-heading font-bold text-base text-[#14202B]">
            {t("landing.features.route_costs_title", "Honest estimates")}
          </h3>
          <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
            {t("landing.features.route_costs_desc", "Costs shown as ranges. Check before booking.")}
          </p>
        </div>
      </section>

      {/* 4. HOW IT WORKS (mockup 01 Part 2) */}
      <section id="about" className="space-y-4 scroll-mt-24">
        <div>
          <span className="text-[11px] font-bold text-[#586673] uppercase tracking-wider">
            {lang === "kn" ? "ಇದು ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ" : "HOW IT WORKS"}
          </span>
          <h2 className="font-heading font-extrabold text-2xl text-[#14202B] tracking-tight mt-0.5">
            {lang === "kn" ? "ಕೆಲವೇ ಸರಳ ಆಯ್ಕೆಗಳಿಂದ ಸಂಪೂರ್ಣ ಪ್ರವಾಸ ಯೋಜನೆ" : "From a few choices to a full trip"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#F9EBEB] text-[#8E1F2F] flex items-center justify-center mb-4">
              ✦
            </div>
            <h3 className="font-heading font-bold text-base text-[#14202B]">
              {lang === "kn" ? "೧. ನಿಮ್ಮಿಷ್ಟದ ಆಯ್ಕೆಗಳನ್ನು ತಿಳಿಸಿ" : "1. Choose what you like"}
            </h3>
            <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
              {lang === "kn" ? "ಆಸಕ್ತಿಗಳು, ದಿನಗಳು, ಬಜೆಟ್, ವೇಗ ಮತ್ತು ತಿಂಗಳು." : "Interests, days, budget, pace and month."}
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2CC] text-[#8C6D05] flex items-center justify-center mb-4">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="19" r="3" />
                <circle cx="18" cy="5" r="3" />
                <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12" />
              </svg>
            </div>
            <h3 className="font-heading font-bold text-base text-[#14202B]">
              {lang === "kn" ? "೨. AI ನೈಜ ಸ್ಥಳಗಳನ್ನು ಜೋಡಿಸುತ್ತದೆ" : "2. AI arranges real places"}
            </h3>
            <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
              {lang === "kn" ? "ಸರ್ವರ್ ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳಗಳನ್ನು ಮಾತ್ರ ನಿಮ್ಮ ಯೋಜನೆಗೆ ಸೇರಿಸಲಾಗುತ್ತದೆ." : "The server checks every place id before you see it."}
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs">
            <div className="w-9 h-9 rounded-xl bg-[#E1ECF5] text-[#2B5F8A] flex items-center justify-center mb-4">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <h3 className="font-heading font-bold text-base text-[#14202B]">
              {lang === "kn" ? "೩. ಕನ್ನಡದಲ್ಲೇ ಸುಲಭ ಪ್ರಯಾಣ" : "3. Travel in Kannada"}
            </h3>
            <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
              {lang === "kn" ? "ಭಾಷೆ ಬದಲಿಸಿ, ನುಡಿಗಟ್ಟುಗಳನ್ನು ಆಲಿಸಿ, ಚಾಲಕರಿಗೆ ನಿಲುಗಡೆ ತೋರಿಸಿ." : "Switch language, play phrases, show a stop to your driver."}
            </p>
          </div>
        </div>
      </section>

      {/* 5. SAMPLE TRIPS (mockup 01 Part 2 & 3) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#586673] uppercase tracking-wider">
              {lang === "kn" ? "ಮಾದರಿ ಪ್ರವಾಸಗಳು" : "SAMPLE TRIPS"}
            </span>
            <h2 className="font-heading font-extrabold text-2xl text-[#14202B] tracking-tight mt-0.5">
              {lang === "kn" ? "ಸಿದ್ಧಪಡಿಸಿದ ಮಾರ್ಗದಿಂದ ಪ್ರಾರಂಭಿಸಿ" : "Start from a ready-made route"}
            </h2>
          </div>
          <Link
            href="/trip?sample=heritage"
            className="text-xs font-semibold text-[#8E1F2F] hover:underline"
          >
            {lang === "kn" ? "ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ" : "See all"}
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Sample 1: Hoysala and royal Mysuru */}
          <Link
            href="/trip?sample=heritage"
            className="group bg-white rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-xs hover:shadow-md transition-all flex flex-col"
          >
            <div className="h-44 relative overflow-hidden">
              <PalaceScene className="transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-[#14202B] shadow-sm">
                {lang === "kn" ? "೪ ದಿನಗಳು" : "4 days"}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#14202B] group-hover:text-[#8E1F2F] transition-colors">
                  {lang === "kn" ? "ಹೊಯ್ಸಳ ಮತ್ತು ರಾಜಮನೆತನದ ಮೈಸೂರು" : "Hoysala and royal Mysuru"}
                </h3>
                <p className="text-xs text-[#586673] mt-1">
                  {lang === "kn" ? "ಮೈಸೂರು, ಬೇಲೂರು, ಹಳೇಬೀಡು" : "Mysuru, Belur, Halebidu"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F9EBEB] text-[#8E1F2F]">
                  {t("form.categories.heritage", "Heritage")}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDF2CC] text-[#8C6D05]">
                  {t("form.categories.food", "Food")}
                </span>
              </div>
            </div>
          </Link>

          {/* Sample 2: Hampi, Badami and Pattadakal */}
          <Link
            href="/trip?sample=mixed"
            className="group bg-white rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-xs hover:shadow-md transition-all flex flex-col"
          >
            <div className="h-44 relative overflow-hidden">
              <HampiScene className="transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-[#14202B] shadow-sm">
                {lang === "kn" ? "೫ ದಿನಗಳು" : "5 days"}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#14202B] group-hover:text-[#8E1F2F] transition-colors">
                  {lang === "kn" ? "ಹಂಪಿ, ಬಾದಾಮಿ ಮತ್ತು ಪಟ್ಟದಕಲ್ಲು" : "Hampi, Badami and Pattadakal"}
                </h3>
                <p className="text-xs text-[#586673] mt-1">
                  {lang === "kn" ? "ಬಂಡೆಗಳು, ದೇವಾಲಯಗಳು ಮತ್ತು ಗುಹೆಗಳು" : "Boulders, temples and caves"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F9EBEB] text-[#8E1F2F]">
                  {t("form.categories.heritage", "Heritage")}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#FDF2CC] text-[#B8860B]">
                  {t("form.categories.adventure", "Adventure")}
                </span>
              </div>
            </div>
          </Link>

          {/* Sample 3: Coastal Karnataka */}
          <Link
            href="/trip?sample=nature"
            className="group bg-white rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-xs hover:shadow-md transition-all flex flex-col"
          >
            <div className="h-44 relative overflow-hidden">
              <CoastScene className="transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-bold text-[#14202B] shadow-sm">
                {lang === "kn" ? "೪ ದಿನಗಳು" : "4 days"}
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="font-heading font-bold text-base text-[#14202B] group-hover:text-[#8E1F2F] transition-colors">
                  {lang === "kn" ? "ಕರಾವಳಿ ಕರ್ನಾಟಕ" : "Coastal Karnataka"}
                </h3>
                <p className="text-xs text-[#586673] mt-1">
                  {lang === "kn" ? "ಗೋಕರ್ಣ, ಉಡುಪಿ, ಮುರ್ಡೇಶ್ವರ" : "Gokarna, Udupi, Murudeshwar"}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#E1ECF5] text-[#2B5F8A]">
                  {t("form.categories.beach", "Beaches")}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#DDEFE7] text-[#1E6B52]">
                  {t("form.categories.spiritual", "Spiritual")}
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* 6. EXPLORE BY REGION & KANNADA PHRASE OF THE DAY (mockup 01 Part 3) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Explore by Region + SVG Map */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs space-y-5">
          <div>
            <span className="text-[11px] font-bold text-[#586673] uppercase tracking-wider">
              {lang === "kn" ? "ಪ್ರದೇಶವಾರು ಅನ್ವೇಷಿಸಿ" : "EXPLORE BY REGION"}
            </span>
            <h2 className="font-heading font-extrabold text-2xl text-[#14202B] tracking-tight mt-0.5">
              {lang === "kn" ? "ಕರ್ನಾಟಕದಲ್ಲಿ ಎಲ್ಲಿಗೆ?" : "Where in Karnataka?"}
            </h2>
          </div>

          {/* Region Chips */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: "all", label: lang === "kn" ? "ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು" : "All regions" },
              { id: "mysuru", label: lang === "kn" ? "ಮೈಸೂರು ಮತ್ತು ಹೊಯ್ಸಳ" : "Mysuru and Hoysala" },
              { id: "hampi", label: lang === "kn" ? "ಹಂಪಿ ಮತ್ತು ಬಾದಾಮಿ" : "Hampi and Badami" },
              { id: "coast", label: lang === "kn" ? "ಕರಾವಳಿ" : "Coast" },
              { id: "hills", label: lang === "kn" ? "ಕೊಡಗು ಮತ್ತು ಚಿಕ್ಕಮಗಳೂರು" : "Coorg and Chikkamagaluru" },
              { id: "bengaluru", label: lang === "kn" ? "ಬೆಂಗಳೂರು" : "Bengaluru" },
              { id: "north", label: lang === "kn" ? "ಉತ್ತರ ಕರ್ನಾಟಕ" : "North Karnataka" },
            ].map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => setSelectedRegion(reg.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  selectedRegion === reg.id
                    ? "bg-[#8E1F2F] text-white shadow-xs"
                    : "bg-[#F1F3F0] text-[#14202B] hover:bg-gray-200"
                }`}
              >
                {reg.label}
              </button>
            ))}
          </div>

          {/* Real-time interactive Leaflet OpenStreetMap */}
          <RegionMap
            selectedRegion={selectedRegion}
            onSelectPlace={(place) => router.push(`/plan?interests=${place.categories[0]}`)}
          />
        </div>

        {/* Right: Kannada Phrase of the Day */}
        <div className="lg:col-span-5 bg-[#FDF7E7] rounded-2xl p-6 border border-[#EADBBD] shadow-xs space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-[#F5E5C0] text-[#8C6D05]">
            {lang === "kn" ? "ಇಂದಿನ ಕನ್ನಡ ನುಡಿಗಟ್ಟು" : "KANNADA PHRASE OF THE DAY"}
          </div>

          <div className="pt-2">
            <h3 className="font-heading font-extrabold text-3xl text-[#14202B] tracking-tight font-kannada">
              {phraseOfDay.kn}
            </h3>
            <p className="text-sm font-semibold text-[#8C6D05] mt-1">
              {phraseOfDay.translit}
            </p>
            <p className="text-xs text-[#586673] mt-1.5 leading-relaxed">
              {phraseOfDay.en}. {lang === "kn" ? "ಸ್ಥಳೀಯರೊಂದಿಗೆ ಸುಲಭವಾಗಿ ಸಂವಹನ ನಡೆಸಲು ನೆರವಾಗುತ್ತದೆ." : "A friendly way to connect with locals."}
            </p>
          </div>

          {/* Audio & Save Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => playKannadaAudio(phraseOfDay.kn)}
              disabled={isPlayingAudio}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#8E1F2F] text-white hover:bg-[#781926] active:scale-95 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
              </svg>
              <span>{isPlayingAudio ? (lang === "kn" ? "ಪ್ಲೇ ಆಗುತ್ತಿದೆ..." : "Playing...") : (lang === "kn" ? "ಆಲಿಸಿ" : "Play")}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSlowAudio(!isSlowAudio)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isSlowAudio
                  ? "bg-[#14202B] text-white border-[#14202B]"
                  : "bg-white text-[#14202B] border-[#DCE1DD] hover:bg-gray-50"
              }`}
            >
              {lang === "kn" ? "ನಿಧಾನವಾಗಿ" : "Slow"}
            </button>

            <button
              type="button"
              onClick={toggleSavePhrase}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                isPhraseSaved
                  ? "bg-[#1E6B52] text-white border-[#1E6B52]"
                  : "bg-white text-[#14202B] border-[#DCE1DD] hover:bg-gray-50"
              }`}
            >
              <span>{isPhraseSaved ? (lang === "kn" ? "★ ಉಳಿಸಲಾಗಿದೆ" : "★ Saved") : (lang === "kn" ? "✦ ಉಳಿಸಿ" : "✦ Save")}</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}