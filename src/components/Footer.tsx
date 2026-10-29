"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n/useLang";

export default function Footer() {
  const { lang } = useLang();
  const pathname = usePathname();
  const kn = lang === "kn";
  // The trip page has a fixed bottom nav on mobile; keep the footer clear of it.
  const clearBottomNav = pathname === "/trip" ? "pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6" : "pb-6";

  return (
    <footer className={`border-t border-[#DCE1DD] bg-white/60 print:hidden ${clearBottomNav}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#586673]">
        <p>© 2026 Dari (ದಾರಿ) · {kn ? "ಕರ್ನಾಟಕಕ್ಕಾಗಿ AI ಪ್ರವಾಸ ಯೋಜಕ" : "AI travel planner for Karnataka"}</p>
        <nav className="flex items-center gap-4 font-semibold">
          <Link href="/privacy" className="hover:text-[#8E1F2F]">{kn ? "ಗೌಪ್ಯತೆ" : "Privacy"}</Link>
          <Link href="/credits" className="hover:text-[#8E1F2F]">{kn ? "ಕೃಪೆ" : "Credits"}</Link>
          <a
            href="https://github.com/varshithvardhan2006-09/dari-karnataka-travel-planner"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#8E1F2F]"
          >
            GitHub ↗
          </a>
        </nav>
      </div>
    </footer>
  );
}
