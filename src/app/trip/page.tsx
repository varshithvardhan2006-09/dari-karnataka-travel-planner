"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import LZString from "lz-string";
import { Plan, PlanRequest, Category, StartCity, BudgetFit, Pace, Travellers } from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import DayTabs from "@/components/DayTabs";
import StopCard from "@/components/StopCard";
import PhraseCard from "@/components/PhraseCard";
import CostSummary from "@/components/CostSummary";
import ProgressSteps from "@/components/ProgressSteps";
import ErrorState from "@/components/ErrorState";
import { buildDeterministicPlan } from "@/lib/planner";
import { getSamplePlan, getSamplePlanForInterests } from "@/lib/samples";

// Dynamic import of Leaflet map with ssr: false to prevent Next.js SSR crashes
const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-white rounded-2xl border border-[#DCE1DD] flex items-center justify-center text-sm text-[#586673] animate-pulse">
      Loading Karnataka Map...
    </div>
  ),
});

function TripViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, t } = useLang();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"plan" | "map" | "phrases">("plan");
  const [selectedStopPlaceId, setSelectedStopPlaceId] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{
    type: "busy" | "few_matches" | "fallback_sample";
    matchCount?: number;
    retryAfterS?: number;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  // Extract query parameters
  const dParam = searchParams.get("d");
  const sampleParam = searchParams.get("sample");
  const simulateParam = searchParams.get("simulate");
  const interestsParam = searchParams.get("interests");
  const daysParam = searchParams.get("days");
  const startCityParam = searchParams.get("start_city");
  const budgetParam = searchParams.get("budget");
  const paceParam = searchParams.get("pace");
  const travellersParam = searchParams.get("travellers");
  const monthParam = searchParams.get("month");

  const parsedDays = daysParam ? parseInt(daysParam, 10) : 4;

  useEffect(() => {
    let isCancelled = false;

    async function loadOrGeneratePlan() {
      setLoading(true);
      setErrorState(null);

      // Case 0: Simulation hooks for testing acceptance criteria
      if (simulateParam === "busy") {
        setErrorState({ type: "busy", retryAfterS: 30 });
        setLoading(false);
        return;
      }
      if (simulateParam === "few_matches") {
        setErrorState({ type: "few_matches", matchCount: 3 });
        setLoading(false);
        return;
      }
      if (simulateParam === "fallback") {
        const sample = getSamplePlan("heritage");
        setPlan(sample);
        setErrorState({ type: "fallback_sample" });
        setSelectedDay(1);
        setLoading(false);
        return;
      }

      // Case 1: Open a curated sample itinerary directly (?sample=heritage|nature|food|mixed)
      if (sampleParam) {
        const sample = getSamplePlan(sampleParam);
        if (!isCancelled) {
          setPlan(sample);
          setSelectedDay(1);
          setLoading(false);
        }
        return;
      }

      // Case 2: Decompress plan from lz-string URL parameter (?d=...)
      if (dParam) {
        try {
          const decompressed = LZString.decompressFromEncodedURIComponent(dParam);
          if (decompressed) {
            const parsedPlan = JSON.parse(decompressed) as Plan;
            if (!isCancelled) {
              setPlan(parsedPlan);
              setSelectedDay(1);
              setLoading(false);
            }
            return;
          }
        } catch (e) {
          console.warn("Failed to decompress shared plan:", e);
        }
      }

      // Case 3: Construct request from query params (or defaults)
      const interests: Category[] = interestsParam
        ? (interestsParam.split(",") as Category[])
        : ["heritage", "food"];
      const start_city: StartCity = (startCityParam as StartCity) || "Bengaluru";
      const budget: BudgetFit = (budgetParam as BudgetFit) || "mid";
      const pace: Pace = (paceParam as Pace) || "relaxed";
      const travellers: Travellers = (travellersParam as Travellers) || "couple";
      const month = monthParam ? parseInt(monthParam, 10) : 11;

      const request: PlanRequest = {
        interests,
        days: parsedDays,
        start_city,
        budget,
        pace,
        travellers,
        month,
        lang,
      };

      try {
        // Call the API route
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        // 429 Too Many Requests -> Show Busy Error State
        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          if (!isCancelled) {
            setErrorState({
              type: "busy",
              retryAfterS: errData.retry_after_s || 30,
            });
            setLoading(false);
          }
          return;
        }

        // 422 Few Matches -> Show Widen Interests Error State
        if (res.status === 422) {
          const errData = await res.json().catch(() => ({}));
          if (!isCancelled) {
            setErrorState({
              type: "few_matches",
              matchCount: errData.match_count ?? 3,
            });
            setLoading(false);
          }
          return;
        }

        if (res.ok) {
          const json = await res.json();
          if (json.plan && !isCancelled) {
            setPlan(json.plan);
            setSelectedDay(1);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn("API request failed, falling back to deterministic planner:", err);
      }

      // Fallback: Deterministic Planner (or Sample if planner errors)
      if (!isCancelled) {
        try {
          const fallback = buildDeterministicPlan(request);
          setPlan(fallback);
        } catch {
          const { plan: samplePlan } = getSamplePlanForInterests(interests);
          setPlan(samplePlan);
          setErrorState({ type: "fallback_sample" });
        }
        setSelectedDay(1);
        setLoading(false);
      }
    }

    loadOrGeneratePlan();

    return () => {
      isCancelled = true;
    };
  }, [dParam, sampleParam, simulateParam, interestsParam, daysParam, startCityParam, budgetParam, paceParam, travellersParam, monthParam, parsedDays, lang, refreshKey]);

  // Handle Share Link with lz-string
  const handleShareLink = () => {
    if (!plan) return;
    try {
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(plan));
      const shareUrl = `${window.location.origin}/trip?d=${compressed}`;
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
          })
          .catch((err) => {
            console.warn("Clipboard API failed, attempting fallback:", err);
            fallbackCopy(shareUrl);
          });
      } else {
        fallbackCopy(shareUrl);
      }
    } catch (err) {
      console.error("Failed to copy share link:", err);
    }
  };

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (fallbackErr) {
      console.warn("Fallback copy failed:", fallbackErr);
    }
  };

  // Handle Regenerate
  const handleRegenerate = () => {
    if (dParam) {
      router.push("/plan");
    } else {
      setRefreshKey((prev) => prev + 1);
    }
  };

  // Handle Map Pin Click
  const handlePinClick = (placeId: string) => {
    const el = document.getElementById(`stop-card-${placeId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProgressSteps days={parsedDays} placeCount={parsedDays * 3} />
      </div>
    );
  }

  // Error States: AI Busy (429) or Too Few Matches (422)
  if (errorState && (errorState.type === "busy" || errorState.type === "few_matches")) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <ErrorState
          type={errorState.type}
          matchCount={errorState.matchCount}
          retryAfterS={errorState.retryAfterS}
          days={parsedDays}
          interests={interestsParam ? (interestsParam.split(",") as Category[]) : ["beach"]}
          budget={budgetParam || "premium"}
          month={monthParam ? parseInt(monthParam, 10) : 11}
          onRetry={handleRegenerate}
          onOpenSample={() => router.push("/trip?sample=heritage")}
          onWidenInterests={() => router.push("/plan")}
        />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-[#14202B]">Could not load trip</h2>
        <p className="text-sm text-[#586673] mt-2 mb-6">
          We encountered an issue preparing this itinerary.
        </p>
        <Link
          href="/plan"
          className="px-6 py-2.5 rounded-xl bg-[#8E1F2F] text-white font-medium text-sm"
        >
          Create New Plan
        </Link>
      </div>
    );
  }

  const currentDayData = plan.days.find((d) => d.day === selectedDay) || plan.days[0];

  const activeDayStops = currentDayData?.stops || [];
  const stopIndex = activeDayStops.findIndex((s) => s.place_id === selectedStopPlaceId);
  const currentStopIdx = stopIndex !== -1 ? stopIndex : 0;
  const currentActiveStop = activeDayStops[currentStopIdx] || activeDayStops[0];

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 pb-24 lg:pb-8">
      {/* Fallback Sample Alert Notification (mockup 06 Card 3) */}
      {(errorState?.type === "fallback_sample" || simulateParam === "fallback") && (
        <div className="bg-[#DDEFE7]/80 border border-[#1E6B52]/20 rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 text-[#14202B]">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-[#DDEFE7] text-[#1E6B52] flex items-center justify-center font-bold text-base shrink-0">
              ✓
            </div>
            <div>
              <h4 className="font-heading font-bold text-base text-[#14202B]">
                {t("errors.fallback_title", "Showing a ready-made trip")}
              </h4>
              <p className="text-sm text-[#586673] mt-0.5">
                {t(
                  "errors.fallback_desc",
                  "We could not reach the AI, so this is a saved sample. Your choices are kept. Regenerate when you are back online."
                )
                  .replace("{days}", String(plan.days.length))
                  .replace("{theme}", "Karnataka")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRegenerate}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#8E1F2F] text-white hover:bg-[#781926] shrink-0 active:scale-95 transition-all shadow-2xs"
          >
            {t("errors.fallback_action", "Regenerate")}
          </button>
        </div>
      )}

      {/* Sample Switcher Pills when viewing curated samples */}
      {plan.source === "sample" && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#586673]">
            {lang === "kn" ? "ಮಾದರಿ ಪ್ರವಾಸಗಳು:" : "Sample itineraries:"}
          </span>
          {[
            { key: "heritage", labelEn: "Heritage", labelKn: "ಪರಂಪರೆ" },
            { key: "nature", labelEn: "Nature & Wildlife", labelKn: "ಪ್ರಕೃತಿ" },
            { key: "food", labelEn: "Food & Coast", labelKn: "ಆಹಾರ ಮತ್ತು ಕರಾವಳಿ" },
            { key: "mixed", labelEn: "Mixed Panorama", labelKn: "ಸಂಯೋಜಿತ" },
          ].map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => router.push(`/trip?sample=${s.key}`)}
              className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-all ${
                sampleParam === s.key || (!sampleParam && s.key === "heritage")
                  ? "bg-[#14202B] text-white shadow-2xs"
                  : "bg-white border border-[#DCE1DD] text-[#586673] hover:text-[#14202B] hover:bg-gray-50"
              }`}
            >
              {lang === "kn" ? s.labelKn : s.labelEn}
            </button>
          ))}
        </div>
      )}

      {/* Top Header / Metadata & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Pills / Badges matching mockup 04, 05 & 07 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#F9EBEB] text-[#8E1F2F]">
            {plan.days.length} {lang === "kn" ? "ದಿನ" : t("common.days")}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#F9EBEB] text-[#8E1F2F]">
            {interestsParam
              ? interestsParam
                  .split(",")
                  .map((c) => t(`form.categories.${c}`, c))
                  .join(lang === "kn" ? " ಮತ್ತು " : " and ")
              : lang === "kn"
              ? "ಕರ್ನಾಟಕ ಪ್ರವಾಸ"
              : "Curated Journey"}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#FDF2CC] text-[#8C6D05]">
            {t(`form.budget_tiers.${budgetParam || "mid"}`)} {lang === "kn" ? "ಬಜೆಟ್" : ""}
          </span>
          {paceParam && (
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#E1ECF5] text-[#2B5F8A]">
              {t(`form.pace_tiers.${paceParam}`)}
            </span>
          )}

          {plan.source === "sample" && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#F2B705] text-[#14202B]">
              {t("common.sample_data")}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRegenerate}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-[#DCE1DD] text-[#14202B] hover:bg-gray-50 active:scale-95 transition-all shadow-2xs cursor-pointer min-h-[40px]"
          >
            {t("common.regenerate")}
          </button>
          <button
            type="button"
            onClick={handleShareLink}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#8E1F2F] hover:bg-[#781926] text-white active:scale-95 transition-all shadow-xs cursor-pointer min-h-[40px] flex items-center gap-1.5"
          >
            {copied ? (
              <span>✓ {t("common.copied")}</span>
            ) : (
              <span>{t("common.share_link")}</span>
            )}
          </button>
        </div>
      </div>

      {/* DESKTOP VIEW (>= lg): Side-by-side Itinerary & Sticky Map */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Day Tabs, Stop Cards, and Cost Summary */}
        <div className="lg:col-span-6 space-y-6">
          <DayTabs
            days={plan.days}
            selectedDay={selectedDay}
            onSelectDay={(dayNum) => setSelectedDay(dayNum)}
          />

          <div className="space-y-2">
            {currentDayData?.stops.map((stop, idx) => (
              <StopCard
                key={`${currentDayData.day}-${stop.place_id}`}
                stop={stop}
                index={idx}
                isFirst={idx === 0}
                onCardClick={handlePinClick}
              />
            ))}
          </div>

          <CostSummary cost={plan.cost} days={plan.days.length} />

          <div className="flex items-center justify-between text-xs text-[#586673] pt-1">
            <span>
              Plan source:{" "}
              <strong className="font-semibold text-[#14202B]">
                {plan.source}
              </strong>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span>✓</span>
              <span>{t("common.accuracy_badge")}</span>
            </span>
          </div>
        </div>

        {/* Right Column: Leaflet Map */}
        <div className="lg:col-span-6 lg:sticky lg:top-8 h-[calc(100vh-140px)] min-h-[500px]">
          <TripMap
            days={plan.days}
            selectedDay={selectedDay}
            onPinClick={handlePinClick}
          />
        </div>
      </div>

      {/* MOBILE VIEW (< lg): Controlled by Bottom Navigation Tabs */}
      <div className="block lg:hidden space-y-6">
        {/* 1. Mobile Plan Tab */}
        {activeMobileTab === "plan" && (
          <div className="space-y-6">
            <DayTabs
              days={plan.days}
              selectedDay={selectedDay}
              onSelectDay={(dayNum) => setSelectedDay(dayNum)}
            />

            <div className="space-y-2">
              {currentDayData?.stops.map((stop, idx) => (
                <StopCard
                  key={`${currentDayData.day}-${stop.place_id}`}
                  stop={stop}
                  index={idx}
                  isFirst={idx === 0}
                  onCardClick={handlePinClick}
                />
              ))}
            </div>

            <CostSummary cost={plan.cost} days={plan.days.length} />

            <div className="flex items-center justify-between text-xs text-[#586673] pt-1">
              <span>
                Plan source:{" "}
                <strong className="font-semibold text-[#14202B]">
                  {plan.source}
                </strong>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span>✓</span>
                <span>{t("common.accuracy_badge")}</span>
              </span>
            </div>
          </div>
        )}

        {/* 2. Mobile Map Tab with Interactive Bottom Sheet matching mockup 07 */}
        {activeMobileTab === "map" && (
          <div className="relative w-full h-[calc(100vh-220px)] min-h-[460px] rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-sm">
            <TripMap
              days={plan.days}
              selectedDay={selectedDay}
              onPinClick={handlePinClick}
            />

            {/* Bottom Sheet for Selected Stop */}
            {currentActiveStop && (
              <div className="absolute bottom-2 left-2 right-2 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-4 border border-[#DCE1DD] shadow-2xl animate-in slide-in-from-bottom duration-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#8E1F2F] tracking-wide">
                    {lang === "kn"
                      ? `ನಿಲುಗಡೆ ${currentStopIdx + 1} / ${activeDayStops.length}`
                      : `Stop ${currentStopIdx + 1} of ${activeDayStops.length}`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={currentStopIdx === 0}
                      onClick={() => setSelectedStopPlaceId(activeDayStops[currentStopIdx - 1]?.place_id)}
                      className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#F2F4F1] border border-[#DCE1DD] text-[#14202B] disabled:opacity-30 cursor-pointer active:scale-95"
                      aria-label="Previous stop"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={currentStopIdx >= activeDayStops.length - 1}
                      onClick={() => setSelectedStopPlaceId(activeDayStops[currentStopIdx + 1]?.place_id)}
                      className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#F2F4F1] border border-[#DCE1DD] text-[#14202B] disabled:opacity-30 cursor-pointer active:scale-95"
                      aria-label="Next stop"
                    >
                      →
                    </button>
                  </div>
                </div>

                <h3 className="font-heading font-bold text-base text-[#14202B]">
                  {lang === "kn" ? currentActiveStop.place.name_kn : currentActiveStop.place.name_en}
                </h3>
                <p className="text-xs text-[#586673] mt-0.5 mb-2.5">
                  {currentActiveStop.start} · {Math.round(currentActiveStop.duration_min / 60)} {t("common.hours")} · {currentActiveStop.place.entry_inr === 0 ? t("common.free") : `₹${currentActiveStop.place.entry_inr}`}
                </p>

                {currentActiveStop.phrases && currentActiveStop.phrases.length > 0 && (
                  <PhraseCard phrases={currentActiveStop.phrases} />
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Mobile Phrases Tab */}
        {activeMobileTab === "phrases" && (
          <div className="space-y-4">
            <div className="bg-[#FDF2CC] border border-[#F2B705]/40 rounded-2xl p-4">
              <h3 className="font-heading font-bold text-base text-[#14202B]">
                {lang === "kn" ? `ದಿನ ${selectedDay} ರ ಉಪಯುಕ್ತ ಕನ್ನಡ ನುಡಿಗಟ್ಟುಗಳು` : `Day ${selectedDay} Kannada Phrases`}
              </h3>
              <p className="text-xs text-[#8C6D05] mt-1">
                {lang === "kn"
                  ? "ನೈಸರ್ಗಿಕ ಧ್ವನಿಯನ್ನು ಆಲಿಸಲು ಸ್ಪೀಕರ್ ಗುಂಡಿಯನ್ನು ಒತ್ತಿ."
                  : "Tap the red speaker button to hear native pronunciation."}
              </p>
            </div>

            <DayTabs
              days={plan.days}
              selectedDay={selectedDay}
              onSelectDay={(dayNum) => setSelectedDay(dayNum)}
            />

            <div className="space-y-3">
              {activeDayStops.map((stop) => (
                <div key={stop.place_id} className="bg-white rounded-2xl p-4 border border-[#DCE1DD] shadow-2xs">
                  <h4 className="font-heading font-bold text-sm text-[#14202B] mb-2">
                    {lang === "kn" ? stop.place.name_kn : stop.place.name_en}
                  </h4>
                  {stop.phrases && stop.phrases.length > 0 ? (
                    <PhraseCard phrases={stop.phrases} />
                  ) : (
                    <p className="text-xs text-[#586673] italic">No specific phrases for this stop.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FIXED BOTTOM NAVIGATION BAR matching mockup 07 */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#DCE1DD] flex items-center justify-around h-16 lg:hidden shadow-lg"
      >
        <button
          type="button"
          onClick={() => setActiveMobileTab("plan")}
          className={`flex-1 h-full flex flex-col items-center justify-center relative text-xs font-semibold cursor-pointer transition-colors ${
            activeMobileTab === "plan" ? "text-[#8E1F2F]" : "text-[#586673] hover:text-[#14202B]"
          }`}
        >
          {activeMobileTab === "plan" && (
            <span className="absolute top-0 left-6 right-6 h-0.5 bg-[#8E1F2F]" />
          )}
          <span>{lang === "kn" ? "ಯೋಜನೆ" : "Plan"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("map")}
          className={`flex-1 h-full flex flex-col items-center justify-center relative text-xs font-semibold cursor-pointer transition-colors ${
            activeMobileTab === "map" ? "text-[#8E1F2F]" : "text-[#586673] hover:text-[#14202B]"
          }`}
        >
          {activeMobileTab === "map" && (
            <span className="absolute top-0 left-6 right-6 h-0.5 bg-[#8E1F2F]" />
          )}
          <span>{lang === "kn" ? "ನಕ್ಷೆ" : "Map"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("phrases")}
          className={`flex-1 h-full flex flex-col items-center justify-center relative text-xs font-semibold cursor-pointer transition-colors ${
            activeMobileTab === "phrases" ? "text-[#8E1F2F]" : "text-[#586673] hover:text-[#14202B]"
          }`}
        >
          {activeMobileTab === "phrases" && (
            <span className="absolute top-0 left-6 right-6 h-0.5 bg-[#8E1F2F]" />
          )}
          <span>{lang === "kn" ? "ನುಡಿಗಟ್ಟುಗಳು" : "Phrases"}</span>
        </button>
      </nav>
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-[#586673]">
          Loading trip planner...
        </div>
      }
    >
      <TripViewContent />
    </Suspense>
  );
}
