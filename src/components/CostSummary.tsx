"use client";

import React from "react";
import { CostSummary as CostSummaryType } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";

interface CostSummaryProps {
  cost: CostSummaryType;
  days: number;
  source?: "ai-groq" | "ai-gemini" | "planner" | "sample";
}

const CATEGORY_COLORS = {
  stay: "#8E1F2F", // Red
  food: "#F2B705", // Gold
  transport: "#2B5F8A", // Blue
  entry: "#1E6B52", // Green
};

export default function CostSummary({ cost, days, source }: CostSummaryProps) {
  const { lang, t } = useLang();

  const total = Math.max(1, cost.total);
  const stayPct = cost.stay / total;
  const foodPct = cost.food / total;
  const transPct = cost.transport / total;
  const entryPct = cost.entry / total;

  // Circumference for r=40 is 2 * PI * 40 ≈ 251.327
  const r = 40;
  const c = 2 * Math.PI * r;

  const stayStroke = stayPct * c;
  const foodStroke = foodPct * c;
  const transStroke = transPct * c;
  const entryStroke = entryPct * c;

  // Offsets
  const stayOffset = 0;
  const foodOffset = -stayStroke;
  const transOffset = -(stayStroke + foodStroke);
  const entryOffset = -(stayStroke + foodStroke + transStroke);

  const formattedK = (cost.total / 1000).toFixed(1).replace(/\.0$/, "");

  const sourceLabels: Record<string, { label: string; tooltip: string }> = {
    "ai-groq": {
      label: "AI (Groq)",
      tooltip: "Generated via Groq fast inference using curated Karnataka places.",
    },
    "ai-gemini": {
      label: "AI (Gemini)",
      tooltip: "Generated via Google Gemini using curated Karnataka places.",
    },
    planner: {
      label: "Ready-made planner",
      tooltip: "Generated deterministically via Dari's offline geographic clustering.",
    },
    sample: {
      label: "Sample",
      tooltip: "Pre-crafted curated route from our Karnataka dataset.",
    },
  };

  const currentSource = sourceLabels[source || "planner"] || sourceLabels.planner;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base text-[#14202B]">
          {lang === "kn" ? "ಅಂದಾಜು ವೆಚ್ಚ" : "Estimated cost"}
        </h3>
        {source && (
          <div className="relative group">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F1F3F0] text-[#14202B] border border-[#DCE1DD] cursor-help">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1E6B52]" />
              <span>{lang === "kn" ? "ಮೂಲ: " : "Plan source: "}{currentSource.label}</span>
            </span>
            <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-50 w-64 p-2.5 bg-[#14202B] text-white text-[11px] rounded-xl shadow-lg leading-snug">
              {currentSource.tooltip}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Donut Chart */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r={r}
              className="text-[#F1F3F0]"
              strokeWidth="13"
              stroke="currentColor"
              fill="transparent"
            />
            {/* Stay segment */}
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke={CATEGORY_COLORS.stay}
              strokeWidth="13"
              strokeDasharray={`${stayStroke} ${c}`}
              strokeDashoffset={stayOffset}
              fill="transparent"
            />
            {/* Food segment */}
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke={CATEGORY_COLORS.food}
              strokeWidth="13"
              strokeDasharray={`${foodStroke} ${c}`}
              strokeDashoffset={foodOffset}
              fill="transparent"
            />
            {/* Transport segment */}
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke={CATEGORY_COLORS.transport}
              strokeWidth="13"
              strokeDasharray={`${transStroke} ${c}`}
              strokeDashoffset={transOffset}
              fill="transparent"
            />
            {/* Entry segment */}
            <circle
              cx="50"
              cy="50"
              r={r}
              stroke={CATEGORY_COLORS.entry}
              strokeWidth="13"
              strokeDasharray={`${entryStroke} ${c}`}
              strokeDashoffset={entryOffset}
              fill="transparent"
            />
          </svg>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="font-heading font-extrabold text-lg text-[#14202B] leading-none">
              ₹{formattedK}k
            </span>
            <span className="text-[10px] text-[#586673] mt-0.5">
              {lang === "kn"
                ? `${days} ದಿನ, ${cost.people} ಜನರಿಗೆ`
                : `${days}d · for ${cost.people} ${cost.people === 1 ? "person" : "people"}`}
            </span>
          </div>
        </div>

        {/* Breakdown Items */}
        <div className="flex-1 w-full grid grid-cols-2 gap-2 sm:gap-3 text-[11px] sm:text-xs min-w-0">
          <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2] min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS.stay }}
              />
              <span className="text-[#586673] font-medium truncate">
                {t("common.stay", "Stay")}
              </span>
            </div>
            <span className="font-bold text-[#14202B] shrink-0 ml-1">
              ₹{cost.stay.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2] min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS.food }}
              />
              <span className="text-[#586673] font-medium truncate">
                {t("common.food", "Food")}
              </span>
            </div>
            <span className="font-bold text-[#14202B] shrink-0 ml-1">
              ₹{cost.food.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2] min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS.transport }}
              />
              <span className="text-[#586673] font-medium truncate">
                {t("common.transport", "Transport")}
              </span>
            </div>
            <span className="font-bold text-[#14202B] shrink-0 ml-1">
              ₹{cost.transport.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E2E7E2] min-w-0">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: CATEGORY_COLORS.entry }}
              />
              <span className="text-[#586673] font-medium truncate">
                {t("common.entry", "Entry fees")}
              </span>
            </div>
            <span className="font-bold text-[#14202B] shrink-0 ml-1">
              ₹{cost.entry.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Honest estimate disclaimer */}
      <div className="pt-3 border-t border-[#DCE1DD] text-[11px] text-[#586673] leading-relaxed text-center sm:text-left">
        {t(
          "common.accuracy_disclaimer",
          "Estimates from our dataset. Prices change, so check before you book."
        )}
      </div>
    </div>
  );
}