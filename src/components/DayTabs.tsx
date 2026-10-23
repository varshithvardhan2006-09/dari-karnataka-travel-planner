"use client";

import React from "react";
import { DayPlan } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";

interface DayTabsProps {
  days: DayPlan[];
  selectedDay: number;
  onSelectDay: (dayNumber: number) => void;
}

export default function DayTabs({ days, selectedDay, onSelectDay }: DayTabsProps) {
  const { t } = useLang();

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {days.map((dayPlan) => {
        const isSelected = dayPlan.day === selectedDay;
        // Extract city/region or theme for active tab label
        const firstStopCity = dayPlan.stops[0]?.place?.city || "";
        const label = isSelected && firstStopCity
          ? `${t("common.day")} ${dayPlan.day} · ${firstStopCity}`
          : `${t("common.day")} ${dayPlan.day}`;

        return (
          <button
            key={dayPlan.day}
            type="button"
            onClick={() => onSelectDay(dayPlan.day)}
            className={`min-h-[40px] px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap cursor-pointer border ${
              isSelected
                ? "bg-[#14202B] text-white border-[#14202B] shadow-xs"
                : "bg-white text-[#14202B] border-[#DCE1DD] hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
