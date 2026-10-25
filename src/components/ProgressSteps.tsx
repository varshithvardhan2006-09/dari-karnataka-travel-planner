"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/useLang";
import { playKannadaSpeech } from "@/lib/speech";

const RegionMap = dynamic(() => import("./RegionMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] bg-[#F1F3F0] rounded-2xl border border-[#DCE1DD] flex items-center justify-center text-xs text-[#586673] animate-pulse">
      Loading interactive Karnataka map...
    </div>
  ),
});

interface ProgressStepsProps {
  days: number;
  placeCount: number;
  interests?: string;
  budget?: string;
  pace?: string;
  month?: number;
  onCancel?: () => void;
  onUseReadyMade?: () => void;
}

interface StepItem {
  key: string;
  titleEn: string;
  titleKn: string;
  subEn: string;
  subKn: string;
}

const STEPS: StepItem[] = [
  {
    key: "matched",
    titleEn: "Matched places to your interests",
    titleKn: "ನಿಮ್ಮ ಆಸಕ್ತಿಗಳಿಗೆ ತಕ್ಕಂತೆ ಸ್ಥಳಗಳನ್ನು ಹೊಂದಿಸಲಾಗಿದೆ",
    subEn: "25 of 39 places fit · 0.2 s",
    subKn: "39 ಸ್ಥಳಗಳಲ್ಲಿ 25 ಸ್ಥಳಗಳು ಸರಿಹೊಂದಿವೆ · 0.2 ಸೆ",
  },
  {
    key: "grouped",
    titleEn: "Grouped nearby places into days",
    titleKn: "ಸಮೀಪದ ಸ್ಥಳಗಳನ್ನು ದಿನವಾರು ಗುಂಪು ಮಾಡಲಾಗಿದೆ",
    subEn: "Bengaluru, Mysuru and Hassan clusters · 0.1 s",
    subKn: "ಬೆಂಗಳೂರು, ಮೈಸೂರು ಮತ್ತು ಹಾಸನ ವಲಯಗಳು · 0.1 ಸೆ",
  },
  {
    key: "ai_writing",
    titleEn: "AI is writing the day plans",
    titleKn: "AI ದಿನದ ಪ್ರವಾಸ ಯೋಜನೆಯನ್ನು ರಚಿಸುತ್ತಿದೆ",
    subEn: "Provider: Groq / Gemini · verified places only",
    subKn: "ಪರಿಶೀಲಿಸಿದ ನೈಜ ಸ್ಥಳಗಳೊಂದಿಗೆ ರಚನೆ",
  },
  {
    key: "checking_geo",
    titleEn: "Checking times, distances and costs",
    titleKn: "ಸಮಯ, ಅಂತರ ಮತ್ತು ವೆಚ್ಚಗಳನ್ನು ಲೆಕ್ಕಹಾಕಲಾಗುತ್ತಿದೆ",
    subEn: "The server validates every stop sequence",
    subKn: "ಸರ್ವರ್ ಪ್ರತಿ ನಿಲುಗಡೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ",
  },
  {
    key: "kannada_phrases",
    titleEn: "Adding Kannada names and phrases",
    titleKn: "ಕನ್ನಡ ಹೆಸರುಗಳು ಮತ್ತು ನುಡಿಗಟ್ಟುಗಳನ್ನು ಸೇರಿಸಲಾಗುತ್ತಿದೆ",
    subEn: "From our curated verified phrase dataset",
    subKn: "ನಮ್ಮ ಪರಿಶೀಲಿಸಿದ ನುಡಿಗಟ್ಟುಗಳ ಸಂಗ್ರಹದಿಂದ",
  },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const CANDIDATE_CHIPS = [
  "Lalbagh",
  "Bangalore Palace",
  "Vidyarthi Bhavan",
  "VV Puram Food Street",
  "Mysore Palace",
  "Belur",
  "Halebidu",
  "+ 5 more",
];

export default function ProgressSteps({
  days,
  placeCount,
  interests = "Heritage and Food",
  budget = "Mid-range",
  pace = "Relaxed",
  month = 11,
  onCancel,
  onUseReadyMade,
}: ProgressStepsProps) {
  const router = useRouter();
  const { lang } = useLang();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Advance steps smoothly on a realistic timer (approx 2s per step)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2200);

    return () => clearInterval(timer);
  }, []);

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/plan");
    }
  };

  const handleUseReadyMade = () => {
    if (onUseReadyMade) {
      onUseReadyMade();
    } else {
      router.push("/trip?sample=heritage");
    }
  };

  const playKannadaWord = (text: string) => {
    playKannadaSpeech(text);
  };

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / STEPS.length) * 100));
  const secondsLeft = Math.max(2, (STEPS.length - 1 - currentStepIndex) * 2);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start w-full">
      {/* Left Column: Progress Steps (mockup 03) */}
      <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-[#8E1F2F]">
            {lang === "kn" ? "ನಿಮ್ಮ ಪ್ರವಾಸ ರೂಪಿಸಲಾಗುತ್ತಿದೆ" : "BUILDING YOUR TRIP"}
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#14202B] tracking-tight mt-1">
            {lang === "kn"
              ? `${placeCount} ಸ್ಥಳಗಳಲ್ಲಿ ${days} ದಿನಗಳ ಯೋಜನೆ`
              : `Arranging ${days} days across ${placeCount} places`}
          </h1>
          <p className="text-xs text-[#586673] mt-1 font-medium">
            {interests} · {budget} · {pace} · {MONTH_NAMES[(month - 1 + 12) % 12] || "November"}
          </p>
        </div>

        {/* Progress Bar & Step Counter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-semibold text-[#586673]">
            <span>
              {lang === "kn"
                ? `ಹಂತ ${currentStepIndex + 1} / 5`
                : `Step ${currentStepIndex + 1} of 5`}
            </span>
            <span className="font-normal text-[11px]">
              {lang === "kn"
                ? `ಇನ್ನು ಸುಮಾರು ${secondsLeft} ಸೆಕೆಂಡುಗಳು`
                : `about ${secondsLeft} seconds left`}
            </span>
          </div>
          <div className="w-full h-2 bg-[#DCE1DD] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#8E1F2F] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* 5 Real Progress Steps */}
        <div className="space-y-4 pt-1">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div key={step.key} className="flex items-start gap-3.5">
                {/* Indicator icon */}
                <div className="shrink-0 mt-0.5">
                  {isCompleted && (
                    <div className="w-6 h-6 rounded-full bg-[#1E6B52] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      ✓
                    </div>
                  )}
                  {isActive && (
                    <div className="w-6 h-6 rounded-full border-2 border-[#8E1F2F] flex items-center justify-center relative">
                      <div className="w-2 h-2 rounded-full bg-[#8E1F2F] animate-ping absolute" />
                      <div className="w-2 h-2 rounded-full bg-[#8E1F2F]" />
                    </div>
                  )}
                  {isPending && (
                    <div className="w-6 h-6 rounded-full border-2 border-[#DCE1DD] bg-transparent" />
                  )}
                </div>

                {/* Step text & subtext */}
                <div>
                  <div
                    className={`text-sm ${
                      isCompleted || isActive
                        ? "font-bold text-[#14202B]"
                        : "text-[#586673] font-medium"
                    }`}
                  >
                    {lang === "kn" ? step.titleKn : step.titleEn}
                  </div>
                  <div className="text-[11px] text-[#586673] mt-0.5">
                    {lang === "kn" ? step.subKn : step.subEn}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons: Cancel and Use a ready-made plan now */}
        <div className="pt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2.5 rounded-xl border border-[#DCE1DD] bg-white text-[#14202B] hover:bg-gray-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {lang === "kn" ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleUseReadyMade}
            className="px-4 py-2.5 rounded-xl border border-[#DCE1DD] bg-white text-[#14202B] hover:bg-gray-50 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            {lang === "kn" ? "ಸಿದ್ಧಪಡಿಸಿದ ಪ್ರವಾಸ ಬಳಸಿ" : "Use a ready-made plan now"}
          </button>
        </div>
      </div>

      {/* Right Column: Map Preview, While You Wait Card, Chips, Skeleton */}
      <div className="lg:col-span-6 space-y-4">
        {/* Real-time interactive Karnataka Leaflet Map preview */}
        <div className="relative rounded-2xl overflow-hidden border border-[#DCE1DD] bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="bg-white/95 px-2.5 py-1 rounded-lg text-xs font-bold text-[#8E1F2F] border border-[#DCE1DD] shadow-2xs">
              {lang === "kn" ? `${placeCount} ಸ್ಥಳಗಳನ್ನು ಜೋಡಿಸಲಾಗುತ್ತಿದೆ` : `Placing ${placeCount} stops`}
            </span>
            <span className="text-[11px] text-[#586673] font-medium">
              Live Environment Map
            </span>
          </div>
          <div className="w-full">
            <RegionMap selectedRegion="all" />
          </div>
        </div>

        {/* WHILE YOU WAIT: LEARN A WORD Card */}
        <div className="bg-[#FDF7E7] rounded-2xl p-4 border border-[#EADBBD] shadow-2xs flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-bold text-[#8C6D05] uppercase tracking-wider">
              {lang === "kn" ? "ಕಾಯುತ್ತಿರುವಾಗ: ಪದ ಕಲಿಯಿರಿ" : "WHILE YOU WAIT: LEARN A WORD"}
            </div>
            <div className="font-heading font-extrabold text-2xl text-[#14202B] mt-1">
              ನಮಸ್ಕಾರ
            </div>
            <div className="text-xs text-[#586673] mt-0.5">
              Namaskara · Hello / Greetings
            </div>
          </div>
          <button
            type="button"
            onClick={() => playKannadaWord("ನಮಸ್ಕಾರ")}
            title="Play audio"
            aria-label="Play audio"
            className="w-10 h-10 rounded-xl bg-[#8E1F2F] text-white flex items-center justify-center hover:bg-[#781926] active:scale-95 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          </button>
        </div>

        {/* Candidate Place Chips */}
        <div className="flex flex-wrap gap-2">
          {CANDIDATE_CHIPS.map((chip, cIdx) => (
            <span
              key={chip}
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                cIdx % 2 === 0
                  ? "bg-[#F9EBEB] text-[#8E1F2F] border-[#F2D6D6]"
                  : "bg-white text-[#14202B] border-[#DCE1DD]"
              }`}
            >
              {chip}
            </span>
          ))}
        </div>

        {/* Skeleton Preview Card */}
        <div className="bg-white rounded-2xl p-5 border border-[#DCE1DD] shadow-2xs space-y-3 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-100 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}