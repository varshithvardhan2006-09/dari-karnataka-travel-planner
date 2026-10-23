"use client";

import React from "react";
import PlannerForm from "@/components/PlannerForm";
import { useLang } from "@/lib/i18n/useLang";

export default function PlanPage() {
  const { t } = useLang();

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#14202B] tracking-tight">
          {t("form.title")}
        </h1>
        <p className="text-[#586673] text-sm sm:text-base mt-1.5">
          {t("form.subtitle")}
        </p>
      </div>

      {/* Main Interactive Form with Live Brief Panel */}
      <PlannerForm />
    </div>
  );
}
