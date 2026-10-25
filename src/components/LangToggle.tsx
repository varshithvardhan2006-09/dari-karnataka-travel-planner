"use client";

import React from "react";
import { useLang } from "@/lib/i18n/useLang";

interface LangToggleProps {
  variant?: "light" | "dark";
}

export default function LangToggle({ variant = "dark" }: LangToggleProps) {
  const { lang, setLang } = useLang();

  if (variant === "dark") {
    return (
      <div
        role="group"
        aria-label="Language selection"
        className="inline-flex items-center rounded-xl border border-white/20 bg-white/10 p-0.5 shadow-xs backdrop-blur-xs"
      >
        <button
          type="button"
          onClick={() => setLang("en")}
          aria-pressed={lang === "en"}
          className={`min-h-[34px] min-w-[42px] px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            lang === "en"
              ? "bg-white text-[#14202B] shadow-xs"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          EN
        </button>
        <button
          type="button"
          onClick={() => setLang("kn")}
          aria-pressed={lang === "kn"}
          className={`min-h-[34px] min-w-[48px] px-2.5 py-1 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer font-kannada ${
            lang === "kn"
              ? "bg-white text-[#14202B] shadow-xs"
              : "text-white/80 hover:text-white hover:bg-white/10"
          }`}
        >
          ಕನ್ನಡ
        </button>
      </div>
    );
  }

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
