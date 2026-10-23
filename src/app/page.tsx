"use client";

import React from "react";
import Link from "next/link";
import { useLang } from "@/lib/i18n/useLang";

export default function LandingPage() {
  const { t } = useLang();

  return (
    <div className="flex-1 flex flex-col justify-between max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 gap-12">
      {/* Top Hero Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        {/* Left Column: Headlines & Call to Actions */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-xs md:text-sm font-bold tracking-wider uppercase text-[#8E1F2F]">
              {t("landing.eyebrow")}
            </span>
          </div>

          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl lg:text-6xl text-[#14202B] tracking-tight leading-[1.12] mb-6">
            {t("landing.title")}
          </h1>

          <p className="text-[#586673] text-base sm:text-lg leading-relaxed max-w-xl mb-8">
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/plan"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-semibold text-white bg-[#8E1F2F] hover:bg-[#781926] active:scale-[0.98] transition-all shadow-sm min-h-[48px]"
            >
              {t("landing.cta_plan")}
            </Link>
            <Link
              href="/trip?sample=heritage"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl font-semibold text-[#14202B] bg-white border border-[#DCE1DD] hover:bg-gray-50 active:scale-[0.98] transition-all shadow-2xs min-h-[48px]"
            >
              {t("landing.cta_sample")}
            </Link>
          </div>
        </div>

        {/* Right Column: Destination Bento Graphics */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4 h-[380px]">
          {/* Card 1: Mysuru (Tall Crimson Card) */}
          <div className="relative rounded-2xl bg-[#8E1F2F] overflow-hidden p-6 flex flex-col justify-end text-white shadow-sm group">
            {/* Architectural decorative arch illustration */}
            <div className="absolute inset-0 pointer-events-none flex items-end justify-center">
              <div className="w-36 h-64 border-[14px] border-white/10 rounded-t-full translate-y-8 transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute w-24 h-48 border-[10px] border-white/15 rounded-t-full translate-y-8 transition-transform duration-500 group-hover:scale-105" />
            </div>

            <div className="relative z-10">
              <h2 className="font-heading font-bold text-xl text-white">
                {t("landing.destinations.mysuru")}
              </h2>
              <p className="text-white/80 text-xs sm:text-sm mt-0.5">
                {t("landing.destinations.mysuru_sub")}
              </p>
            </div>
          </div>

          {/* Cards 2 & 3: Hampi (Gold) and Gokarna (Emerald) */}
          <div className="grid grid-rows-2 gap-4">
            {/* Card 2: Hampi */}
            <div className="relative rounded-2xl bg-[#B8860B] overflow-hidden p-5 flex flex-col justify-end text-white shadow-sm group">
              {/* Boulder and ruins silhouettes */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -right-4 -top-6 w-32 h-32 rounded-full bg-black/15 transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute right-8 top-10 w-24 h-24 rounded-full bg-black/10 transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute -left-6 bottom-4 w-28 h-28 rounded-full bg-white/10" />
              </div>

              <div className="relative z-10">
                <h2 className="font-heading font-bold text-xl text-white">
                  {t("landing.destinations.hampi")}
                </h2>
                <p className="text-white/85 text-xs sm:text-sm mt-0.5">
                  {t("landing.destinations.hampi_sub")}
                </p>
              </div>
            </div>

            {/* Card 3: Gokarna */}
            <div className="relative rounded-2xl bg-[#1E6B52] overflow-hidden p-5 flex flex-col justify-end text-white shadow-sm group">
              {/* Ocean waves / coastal ripples */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <svg
                  className="absolute bottom-0 left-0 w-full h-24 text-white/10 transition-transform duration-500 group-hover:scale-110"
                  viewBox="0 0 100 60"
                  preserveAspectRatio="none"
                  fill="currentColor"
                >
                  <path d="M0,35 C20,15 40,45 65,25 C85,10 95,30 100,20 L100,60 L0,60 Z" />
                </svg>
                <svg
                  className="absolute bottom-0 left-0 w-full h-18 text-white/15"
                  viewBox="0 0 100 60"
                  preserveAspectRatio="none"
                  fill="currentColor"
                >
                  <path d="M0,45 C30,25 50,55 75,35 C90,20 98,35 100,25 L100,60 L0,60 Z" />
                </svg>
              </div>

              <div className="relative z-10">
                <h2 className="font-heading font-bold text-xl text-white">
                  {t("landing.destinations.gokarna")}
                </h2>
                <p className="text-white/85 text-xs sm:text-sm mt-0.5">
                  {t("landing.destinations.gokarna_sub")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Feature Cards */}
      <section
        id="about"
        className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#DCE1DD]/50"
      >
        {/* Feature 1 */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs">
          <h3 className="font-heading font-bold text-lg text-[#14202B]">
            {t("landing.features.real_places_title")}
          </h3>
          <p className="text-[#586673] text-sm leading-relaxed mt-2.5">
            {t("landing.features.real_places_desc")}
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs">
          <h3 className="font-heading font-bold text-lg text-[#14202B]">
            {t("landing.features.kannada_title")}
          </h3>
          <p className="text-[#586673] text-sm leading-relaxed mt-2.5">
            {t("landing.features.kannada_desc")}
          </p>
        </div>

        {/* Feature 3 */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE1DD] shadow-xs">
          <h3 className="font-heading font-bold text-lg text-[#14202B]">
            {t("landing.features.route_costs_title")}
          </h3>
          <p className="text-[#586673] text-sm leading-relaxed mt-2.5">
            {t("landing.features.route_costs_desc")}
          </p>
        </div>
      </section>
    </div>
  );
}
