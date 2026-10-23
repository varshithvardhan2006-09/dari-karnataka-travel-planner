"use client";

import React from "react";
import { useLang } from "@/lib/i18n/useLang";

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Language selection"
      className="inline-flex items-center rounded-lg border border-[#DCE1DD] bg-white p-0.5 shadow-xs"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`min-h-[36px] min-w-[44px] px-3 py-1 rounded-md text-sm font-semibold transition-all cursor-pointer ${
          lang === "en"
            ? "bg-[#14202B] text-white shadow-xs"
            : "text-[#14202B] hover:text-black hover:bg-gray-50"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("kn")}
        aria-pressed={lang === "kn"}
        className={`min-h-[36px] min-w-[50px] px-3 py-1 rounded-md text-sm font-semibold transition-all cursor-pointer font-kannada ${
          lang === "kn"
            ? "bg-[#14202B] text-white shadow-xs"
            : "text-[#14202B] hover:text-black hover:bg-gray-50"
        }`}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
}
