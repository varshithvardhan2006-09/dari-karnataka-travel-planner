import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 text-center max-w-xl mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-[#F9EBEB] text-[#8E1F2F] flex items-center justify-center font-extrabold text-2xl mb-4 shadow-sm">
        ೪೦೪
      </div>
      <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-[#14202B] tracking-tight">
        This link has expired or took a detour
      </h1>
      <p className="text-sm font-semibold text-[#8E1F2F] mt-1">
        ಈ ಪುಟ ಕಾಣುತ್ತಿಲ್ಲ ಅಥವಾ ಲಿಂಕ್ ಅವಧಿ ಮುಗಿದಿದೆ
      </p>
      <p className="text-xs text-[#586673] mt-3 leading-relaxed">
        The destination you are looking for does not exist or the shared link is no longer valid.
        Let's get you back on the right route.
      </p>

      <div className="flex items-center gap-3 mt-8">
        <Link
          href="/"
          className="px-6 py-3 rounded-xl bg-[#8E1F2F] hover:bg-[#781926] text-white text-xs font-bold transition-all shadow-xs active:scale-95"
        >
          Go to Home
        </Link>
        <Link
          href="/plan"
          className="px-6 py-3 rounded-xl bg-white border border-[#DCE1DD] hover:bg-gray-50 text-[#14202B] text-xs font-bold transition-all shadow-2xs active:scale-95"
        >
          Plan a New Trip
        </Link>
      </div>
    </div>
  );
}