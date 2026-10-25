"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";
import LangToggle from "./LangToggle";

export default function Navbar() {
  const { lang, t } = useLang();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="w-full bg-[#F2F4F1] border-b border-[#DCE1DD]/60 sticky top-0 z-[1000] backdrop-blur-md bg-[#F2F4F1]/95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
            aria-label="Dari - Karnataka Travel Planner"
          >
            <span className="font-heading font-extrabold text-2xl text-[#8E1F2F] tracking-tight">
              ದಾರಿ
            </span>
            <span className="font-heading font-extrabold text-2xl text-[#14202B] tracking-tight">
              Dari
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/plan"
              className="text-sm font-medium text-[#14202B]/80 hover:text-[#8E1F2F] transition-colors"
            >
              {t("nav.plan_a_trip")}
            </Link>
            <Link
              href="/trip?sample=heritage"
              className="text-sm font-medium text-[#14202B]/80 hover:text-[#8E1F2F] transition-colors"
            >
              {t("nav.sample_trips")}
            </Link>
            <Link
              href="/credits"
              className="text-sm font-medium text-[#14202B]/80 hover:text-[#8E1F2F] transition-colors"
            >
              {lang === "kn" ? "ಚಿತ್ರ ಕೃಪೆ" : "Credits"}
            </Link>
            <Link
              href="/#about"
              className="text-sm font-medium text-[#14202B]/80 hover:text-[#8E1F2F] transition-colors"
            >
              {t("nav.about")}
            </Link>
          </nav>
        </div>

        {/* Right side: Language Toggle + Mobile Hamburger */}
        <div className="flex items-center gap-2.5">
          <LangToggle />

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-lg bg-white border border-[#DCE1DD] flex items-center justify-center text-[#14202B] hover:bg-gray-50 active:scale-95 transition-all cursor-pointer shadow-2xs"
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
        <div className="md:hidden bg-white/98 backdrop-blur-md border-b border-[#DCE1DD] px-4 py-3 space-y-1 shadow-md animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/plan"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#14202B] hover:bg-[#F2F4F1] hover:text-[#8E1F2F] transition-colors"
          >
            {t("nav.plan_a_trip")}
          </Link>
          <Link
            href="/trip?sample=heritage"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#14202B] hover:bg-[#F2F4F1] hover:text-[#8E1F2F] transition-colors"
          >
            {t("nav.sample_trips")}
          </Link>
          <Link
            href="/credits"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#14202B] hover:bg-[#F2F4F1] hover:text-[#8E1F2F] transition-colors"
          >
            {lang === "kn" ? "ಚಿತ್ರ ಕೃಪೆ (Credits)" : "Credits"}
          </Link>
          <Link
            href="/#about"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#14202B] hover:bg-[#F2F4F1] hover:text-[#8E1F2F] transition-colors"
          >
            {t("nav.about")}
          </Link>
        </div>
      )}
    </header>
  );
}
