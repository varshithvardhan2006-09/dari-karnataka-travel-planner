"use client";

import React from "react";
import { CostSummary as CostSummaryType } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";

interface CostSummaryProps {
  cost: CostSummaryType;
  days: number;
}

export default function CostSummary({ cost, days }: CostSummaryProps) {
  const { lang, t } = useLang();

  return (
    <div className="bg-[#14202B] text-white rounded-2xl p-5 sm:p-6 shadow-md border border-white/10 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Total Amount */}
        <div>
          <p className="text-xs text-white/70">
            {lang === "kn"
              ? `${days} ದಿನಗಳು, ${cost.people} ${t("common.people")} ಅಂದಾಜು`
              : `Estimated for ${cost.people} ${cost.people === 1 ? t("common.person") : t("common.people")}, ${days} ${t("common.days")}`}
          </p>
          <div className="font-heading font-extrabold text-2xl sm:text-3xl text-white mt-1">
            ₹{cost.total.toLocaleString("en-IN")}
          </div>
        </div>

        {/* Right: Itemized Breakdown */}
        <div className="text-xs sm:text-sm text-white/80 space-y-1">
          <div className="flex items-center gap-3">
            <span>
              {t("common.stay")} ₹{cost.stay.toLocaleString("en-IN")}
            </span>
            <span className="text-white/40">·</span>
            <span>
              {t("common.food")} ₹{cost.food.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              {t("common.transport")} ₹{cost.transport.toLocaleString("en-IN")}
            </span>
            <span className="text-white/40">·</span>
            <span>
              {t("common.entry")} ₹{cost.entry.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* Accuracy & Transparency Disclaimer Note */}
      <div className="pt-3 border-t border-white/10 flex items-start gap-2 text-[11px] text-white/60 leading-relaxed">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] shrink-0 mt-0.5">
          ✓
        </span>
        <p>
          <strong className="text-white/90 font-semibold">
            {t("common.accuracy_badge")}:
          </strong>{" "}
          {t("common.accuracy_disclaimer")}
        </p>
      </div>
    </div>
  );
}
