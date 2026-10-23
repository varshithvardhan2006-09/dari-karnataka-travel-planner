"use client";

import React, { useState, useEffect } from "react";
import { useLang } from "@/lib/i18n/useLang";

interface ProgressStepsProps {
  days: number;
  placeCount: number;
}

interface StepItem {
  key: string;
  en: string;
  kn: string;
}

const STEPS: StepItem[] = [
  {
    key: "step_matches",
    en: "Matched places to your interests",
    kn: "ನಿಮ್ಮ ಆಸಕ್ತಿಗಳಿಗೆ ತಕ್ಕಂತೆ ಸ್ಥಳಗಳನ್ನು ಹೊಂದಿಸಲಾಗಿದೆ",
  },
  {
    key: "step_group",
    en: "Grouped nearby places into days",
    kn: "ಸಮೀಪದ ಸ್ಥಳಗಳನ್ನು ದಿನವಾರು ಗುಂಪು ಮಾಡಲಾಗಿದೆ",
  },
  {
    key: "step_ai",
    en: "Writing the day plans",
    kn: "ದಿನದ ಪ್ರವಾಸ ಯೋಜನೆಯನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ",
  },
  {
    key: "step_costs",
    en: "Checking times and costs",
    kn: "ಸಮಯ ಮತ್ತು ವೆಚ್ಚಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ",
  },
  {
    key: "step_phrases",
    en: "Adding Kannada phrases",
    kn: "ಸ್ಥಳೀಯ ಕನ್ನಡ ನುಡಿಗಟ್ಟುಗಳನ್ನು ಸೇರಿಸಲಾಗುತ್ತಿದೆ",
  },
];

export default function ProgressSteps({ days, placeCount }: ProgressStepsProps) {
  const { lang } = useLang();
  // Step advances on a smooth realistic timer (approx 1.8s per step)
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start w-full">
      {/* Left Column: Progress Steps */}
      <div className="lg:col-span-6 flex flex-col justify-center">
        <div className="mb-2">
          <span className="text-xs font-bold tracking-wider uppercase text-[#8E1F2F]">
            {lang === "kn" ? "ನಿಮ್ಮ ಪ್ರವಾಸ ರೂಪಿಸಲಾಗುತ್ತಿದೆ" : "BUILDING YOUR TRIP"}
          </span>
        </div>

        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#14202B] tracking-tight mb-8">
          {lang === "kn"
            ? `${placeCount} ಸ್ಥಳಗಳಲ್ಲಿ ${days} ದಿನಗಳ ಯೋಜನೆ`
            : `Arranging ${days} days across ${placeCount} places`}
        </h1>

        {/* Steps List */}
        <div className="space-y-5">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isActive = idx === currentStepIndex;
            const isPending = idx > currentStepIndex;

            return (
              <div key={step.key} className="flex items-center gap-4">
                {/* Status Indicator Icon */}
                <div className="flex-shrink-0">
                  {isCompleted && (
                    <div className="w-7 h-7 rounded-full bg-[#1E6B52] flex items-center justify-center text-white shadow-2xs">
                      <svg
                        className="w-4 h-4 stroke-[3]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {isActive && (
                    <div className="w-7 h-7 rounded-full border-2 border-[#8E1F2F] flex items-center justify-center relative">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#8E1F2F] animate-ping absolute" />
                      <div className="w-2.5 h-2.5 rounded-full bg-[#8E1F2F]" />
                    </div>
                  )}

                  {isPending && (
                    <div className="w-7 h-7 rounded-full border-2 border-[#DCE1DD] bg-transparent" />
                  )}
                </div>

                {/* Step Text */}
                <span
                  className={`text-base transition-colors ${
                    isCompleted || isActive
                      ? "font-semibold text-[#14202B]"
                      : "text-[#586673]"
                  }`}
                >
                  {lang === "kn" ? step.kn : step.en}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footnote matching mockup */}
        <p className="text-xs text-[#586673] mt-10 max-w-md leading-relaxed">
          {lang === "kn"
            ? "ಇದು ಸಾಮಾನ್ಯವಾಗಿ ೧೦ ಸೆಕೆಂಡುಗಳಿಗಿಂತ ಕಡಿಮೆ ಸಮಯ ತೆಗೆದುಕೊಳ್ಳುತ್ತದೆ. AI ನಿರತವಾಗಿದ್ದರೆ ಸಿದ್ಧಪಡಿಸಿದ ಮಾದರಿ ಪ್ರವಾಸವನ್ನು ತೋರಿಸಲಾಗುತ್ತದೆ."
            : "This usually takes under 10 seconds. If the AI is busy we show a ready-made sample instead."}
        </p>
      </div>

      {/* Right Column: Animated Skeleton Placeholder Cards */}
      <div className="lg:col-span-6 space-y-4">
        {[1, 2, 3].map((card) => (
          <div
            key={card}
            className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs space-y-3 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded-md w-1/3" />
            <div className="h-3.5 bg-gray-100 rounded-md w-full" />
            <div className="h-3.5 bg-gray-100 rounded-md w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
