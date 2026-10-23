"use client";

import React from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";
import LangToggle from "./LangToggle";

export default function Navbar() {
  const { t } = useLang();

  return (
    <header className="w-full bg-[#F2F4F1] border-b border-[#DCE1DD]/60">
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
            <a
              href="#about"
              className="text-sm font-medium text-[#14202B]/80 hover:text-[#8E1F2F] transition-colors"
            >
              {t("nav.about")}
            </a>
          </nav>
        </div>

        {/* Right side: Language Toggle */}
        <div className="flex items-center gap-3">
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
