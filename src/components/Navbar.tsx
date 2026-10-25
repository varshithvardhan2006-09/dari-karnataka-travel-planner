"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n/useLang";
import LangToggle from "./LangToggle";

export default function Navbar() {
  const { lang, t } = useLang();
  const pathname = usePathname() || "";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isPlan = pathname === "/plan";
  const isTrip = pathname.startsWith("/trip");
  const isCredits = pathname === "/credits";

  return (
    <header className="w-full bg-[#14202B] text-white sticky top-0 z-[1000] shadow-md border-b border-black/40 backdrop-blur-md bg-[#14202B]/95">
      {/* Karnataka Red-Gold Brand Top Strip */}
      <div className="h-[3px] w-full bg-gradient-to-r from-[#8E1F2F] via-[#F2B705] to-[#8E1F2F]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo with Karnataka Emblem Icon */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
            aria-label="Dari - Karnataka Travel Planner"
          >
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#8E1F2F] to-[#781926] text-white flex items-center justify-center font-heading font-extrabold text-base shadow-xs border border-white/20">
              ದ
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-heading font-extrabold text-2xl text-[#F2B705] tracking-tight">
                ದಾರಿ
              </span>
              <span className="font-heading font-extrabold text-2xl text-white tracking-tight">
                Dari
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/plan"
              className={`text-sm font-semibold px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                isPlan
                  ? "bg-[#8E1F2F] text-white shadow-xs"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              <span>✦</span>
              <span>{t("nav.plan_a_trip")}</span>
            </Link>
            <Link
              href="/trip?sample=heritage"
              className={`text-sm font-medium px-3.5 py-1.5 rounded-xl transition-all ${
                isTrip
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {t("nav.sample_trips")}
            </Link>
            <Link
              href="/credits"
              className={`text-sm font-medium px-3.5 py-1.5 rounded-xl transition-all ${
                isCredits
                  ? "bg-white/15 text-white font-semibold"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {lang === "kn" ? "ಚಿತ್ರ ಕೃಪೆ" : "Credits"}
            </Link>
            <Link
              href="/#about"
              className="text-sm font-medium text-white/80 hover:text-white hover:bg-white/10 px-3.5 py-1.5 rounded-xl transition-all"
            >
              {t("nav.about")}
            </Link>
          </nav>
        </div>

        {/* Right side: Language Toggle + Mobile Hamburger */}
        <div className="flex items-center gap-2.5">
          <LangToggle variant="dark" />

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 active:scale-95 transition-all cursor-pointer shadow-2xs"
            aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#14202B] border-b border-white/15 px-4 py-3 space-y-1.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/plan"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-between ${
              isPlan
                ? "bg-[#8E1F2F] text-white"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            <span>{t("nav.plan_a_trip")}</span>
            <span>✦</span>
          </Link>
          <Link
            href="/trip?sample=heritage"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isTrip
                ? "bg-white/15 text-white"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            {t("nav.sample_trips")}
          </Link>
          <Link
            href="/credits"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
              isCredits
                ? "bg-white/15 text-white"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            {lang === "kn" ? "ಚಿತ್ರ ಕೃಪೆ (Credits)" : "Credits"}
          </Link>
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3.5 py-2.5 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors"
          >
            {t("nav.about")}
          </Link>
        </div>
      )}
    </header>
  );
}
