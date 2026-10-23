"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n/useLang";

export interface ErrorStateProps {
  type: "busy" | "few_matches" | "fallback_sample";
  matchCount?: number;
  days?: number;
  interests?: string[];
  budget?: string;
  month?: number;
  sampleTheme?: string;
  retryAfterS?: number;
  onRetry?: () => void;
  onOpenSample?: () => void;
  onWidenInterests?: () => void;
  onRegenerate?: () => void;
}

export default function ErrorState({
  type,
  matchCount = 3,
  days = 4,
  interests = ["beaches"],
  budget = "premium",
  month = 11,
  sampleTheme = "Heritage",
  retryAfterS = 30,
  onRetry,
  onOpenSample,
  onWidenInterests,
  onRegenerate,
}: ErrorStateProps) {
  const { lang, t } = useLang();
  const router = useRouter();

  const monthName = t(`form.months.${month}`, "November");
  const budgetName = t(`form.budget_tiers.${budget}`, "Mid-range");
  const interestsList = interests
    .map((item) => t(`form.categories.${item}`, item))
    .join(lang === "kn" ? " ಮತ್ತು " : ", ");

  if (type === "busy") {
    const rawDesc = t("errors.busy_desc", "Too many requests in the last minute. Try again in {seconds} seconds, or open a ready-made trip while you wait.");
    const desc = rawDesc.replace("{seconds}", String(retryAfterS));

    return (
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DCE1DD] shadow-sm max-w-md w-full">
        {/* Yellow Exclamation Badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#FEF7D6] text-[#8C6D05] flex items-center justify-center text-2xl font-bold mb-6 select-none">
          !
        </div>

        <h3 className="font-heading font-bold text-2xl text-[#14202B] mb-3">
          {t("errors.busy_title", "The AI is busy right now")}
        </h3>

        <p className="text-sm text-[#586673] leading-relaxed mb-8">
          {desc}
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onRetry || (() => window.location.reload())}
            className="w-fit px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#8E1F2F] hover:bg-[#781926] text-white active:scale-95 transition-all shadow-xs cursor-pointer min-h-[42px]"
          >
            {t("errors.busy_retry", "Try again")}
          </button>

          <button
            type="button"
            onClick={onOpenSample || (() => router.push("/trip?sample=heritage"))}
            className="w-fit px-6 py-2.5 rounded-xl font-semibold text-sm bg-white border border-[#DCE1DD] text-[#14202B] hover:bg-[#F2F4F1] active:scale-95 transition-all cursor-pointer min-h-[42px]"
          >
            {t("errors.busy_sample", "Open a sample trip")}
          </button>
        </div>
      </div>
    );
  }

  if (type === "few_matches") {
    const rawTitle = t("errors.few_matches_title", "Only {count} places match");
    const title = rawTitle.replace("{count}", String(matchCount));

    const rawDesc = t(
      "errors.few_matches_desc",
      "{interests} in {month} with a {budget} budget leaves few places. Add Nature or Spiritual to get a fuller {days}-day plan."
    );
    const desc = rawDesc
      .replace("{count}", String(matchCount))
      .replace("{interests}", interestsList || (lang === "kn" ? "ಆಯ್ಕೆಗಳು" : "Selected interests"))
      .replace("{month}", monthName)
      .replace("{budget}", budgetName)
      .replace("{days}", String(days));

    return (
      <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DCE1DD] shadow-sm max-w-md w-full">
        {/* Blue Question Mark Badge */}
        <div className="w-12 h-12 rounded-2xl bg-[#E1ECF5] text-[#2B5F8A] flex items-center justify-center text-2xl font-bold mb-6 select-none">
          ?
        </div>

        <h3 className="font-heading font-bold text-2xl text-[#14202B] mb-3">
          {title}
        </h3>

        <p className="text-sm text-[#586673] leading-relaxed mb-8">
          {desc}
        </p>

        <button
          type="button"
          onClick={onWidenInterests || (() => router.push("/plan"))}
          className="w-fit px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#8E1F2F] hover:bg-[#781926] text-white active:scale-95 transition-all shadow-xs cursor-pointer min-h-[42px]"
        >
          {t("errors.few_matches_action", "Widen my interests")}
        </button>
      </div>
    );
  }

  // Fallback Sample
  const rawDesc = t(
    "errors.fallback_desc",
    "We could not reach the AI, so this is a saved {days}-day {theme} sample. Your choices are kept. Regenerate when you are back online."
  );
  const desc = rawDesc
    .replace("{days}", String(days))
    .replace("{theme}", sampleTheme);

  return (
    <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#DCE1DD] shadow-sm max-w-md w-full">
      {/* Green Check Mark Badge */}
      <div className="w-12 h-12 rounded-2xl bg-[#DDEFE7] text-[#1E6B52] flex items-center justify-center text-2xl font-bold mb-6 select-none">
        ✓
      </div>

      <h3 className="font-heading font-bold text-2xl text-[#14202B] mb-3">
        {t("errors.fallback_title", "Showing a ready-made trip")}
      </h3>

      <p className="text-sm text-[#586673] leading-relaxed mb-8">
        {desc}
      </p>

      <button
        type="button"
        onClick={onRegenerate || (() => window.location.reload())}
        className="w-fit px-6 py-2.5 rounded-xl font-semibold text-sm bg-[#8E1F2F] hover:bg-[#781926] text-white active:scale-95 transition-all shadow-xs cursor-pointer min-h-[42px]"
      >
        {t("errors.fallback_action", "Regenerate")}
      </button>
    </div>
  );
}
