"use client";

import React, { useEffect } from "react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error locally without leaking stack traces to the UI
    console.warn("Application runtime error caught by boundary:", error.message);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#FDF2CC] text-[#8C6D05] flex items-center justify-center font-extrabold text-2xl mb-4 shadow-sm">
        ⚠️
      </div>
      <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#14202B] tracking-tight">
        Something went slightly off track
      </h1>
      <p className="text-sm font-semibold text-[#8C6D05] mt-1">
        ಕ್ಷಮಿಸಿ, ಸಣ್ಣ ತಾಂತ್ರಿಕ ದೋಷ ಕಂಡುಬಂದಿದೆ
      </p>
      <p className="text-xs text-[#586673] mt-3 leading-relaxed">
        We encountered a temporary issue while loading this page. You can try refreshing the route
        or return to our home planner.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-3 rounded-xl bg-[#8E1F2F] hover:bg-[#781926] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-white border border-[#DCE1DD] hover:bg-gray-50 text-[#14202B] text-xs font-bold transition-all shadow-2xs active:scale-95"
        >
          Go to Home
        </Link>
      </div>
    </div>
  );
}