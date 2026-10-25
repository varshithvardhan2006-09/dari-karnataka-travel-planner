"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import LZString from "lz-string";
import {
  Plan,
  PlanRequest,
  Category,
  StartCity,
  BudgetFit,
  Pace,
  Travellers,
  Place,
  Stop,
} from "@/lib/schema";
import { useLang } from "@/lib/i18n/useLang";
import StopCard from "@/components/StopCard";
import PhraseCard from "@/components/PhraseCard";
import CostSummary from "@/components/CostSummary";
import ProgressSteps from "@/components/ProgressSteps";
import ErrorState from "@/components/ErrorState";
import StopDetailDrawer from "@/components/StopDetailDrawer";
import ShowToLocalModal from "@/components/ShowToLocalModal";
import { buildDeterministicPlan } from "@/lib/planner";
import { getSamplePlan, getSamplePlanForInterests } from "@/lib/samples";
import { computeTravelLeg, addMinutesToTime, roundTimeTo5Min, getPinNumber } from "@/lib/geo";
import { calculateTripCost } from "@/lib/cost";
import placesData from "../../../data/places.json";

const allPlaces = placesData as Place[];

interface SavedTripRecord {
  id: string;
  title: string;
  days: number;
  month: number;
  costText: string;
  firstCity: string;
  region: string;
  savedAt: number;
  compressed: string;
}

// Dynamic import of Leaflet map with ssr: false to prevent Next.js SSR crashes
const TripMap = dynamic(() => import("@/components/TripMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[450px] bg-white rounded-2xl border border-[#DCE1DD] flex items-center justify-center text-sm text-[#586673] animate-pulse">
      Loading Karnataka Map...
    </div>
  ),
});

const KARNATAKA_WEATHER: Record<number, { temp: string; descEn: string; descKn: string }> = {
  1: { temp: "28° / 15°", descEn: "January, pleasant", descKn: "ಜನವರಿ, ಹಿತಕರ" },
  2: { temp: "30° / 17°", descEn: "February, warm", descKn: "ಫೆಬ್ರವರಿ, ಬೆಚ್ಚಗಿನ" },
  3: { temp: "33° / 20°", descEn: "March, sunny", descKn: "ಮಾರ್ಚ್, ಬಿಸಿಲು" },
  4: { temp: "35° / 22°", descEn: "April, summer", descKn: "ಏಪ್ರಿಲ್, ಬೇಸಿಗೆ" },
  5: { temp: "33° / 22°", descEn: "May, pre-monsoon", descKn: "ಮೇ, ಮುಂಗಾರು ಪೂರ್ವ" },
  6: { temp: "29° / 20°", descEn: "June, monsoon", descKn: "ಜೂನ್, ಮುಂಗಾರು" },
  7: { temp: "27° / 19°", descEn: "July, monsoon", descKn: "ಜುಲೈ, ಮುಂಗಾರು ಮಳೆ" },
  8: { temp: "27° / 19°", descEn: "August, lush rains", descKn: "ಆಗಸ್ಟ್, ಹಸಿರು ಮಳೆ" },
  9: { temp: "28° / 19°", descEn: "September, retreat", descKn: "ಸೆಪ್ಟೆಂಬರ್, ಹಿಂಗಾರು" },
  10: { temp: "28° / 18°", descEn: "October, pleasant", descKn: "ಅಕ್ಟೋಬರ್, ಹಿತಕರ" },
  11: { temp: "26° / 15°", descEn: "November, dry", descKn: "ನವೆಂಬರ್, ಒಣ ಹವೆ" },
  12: { temp: "25° / 14°", descEn: "December, cool", descKn: "ಡಿಸೆಂಬರ್, ತಂಪಾದ ಹವೆ" },
};

function downloadIcsFile(plan: Plan, travelMonth: number = 11) {
  const year = new Date().getFullYear();
  const icsLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Dari Karnataka//Travel Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  plan.days.forEach((day, dIdx) => {
    const dayDate = new Date(year, travelMonth - 1, 10 + dIdx);
    const dateStr = dayDate.toISOString().slice(0, 10).replace(/-/g, "");

    day.stops.forEach((stop) => {
      const [h, m] = (stop.start || "09:00").split(":").map(Number);
      const startIso = `${dateStr}T${String(h).padStart(2, "0")}${String(m).padStart(2, "0")}00`;
      const endTotalMin = h * 60 + m + stop.duration_min;
      const endH = Math.floor(endTotalMin / 60) % 24;
      const endM = endTotalMin % 60;
      const endIso = `${dateStr}T${String(endH).padStart(2, "0")}${String(endM).padStart(2, "0")}00`;

      icsLines.push(
        "BEGIN:VEVENT",
        `UID:dari-${day.day}-${stop.place_id}-${Date.now()}@dari-karnataka.vercel.app`,
        `DTSTAMP:${dateStr}T000000Z`,
        `DTSTART:${startIso}`,
        `DTEND:${endIso}`,
        `SUMMARY:${stop.place.name_en}`,
        `DESCRIPTION:${stop.note_en.replace(/\n/g, " ")}`,
        `LOCATION:${stop.place.city}, Karnataka`,
        "END:VEVENT"
      );
    });
  });

  icsLines.push("END:VCALENDAR");

  const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `dari-karnataka-plan.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function TripViewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lang, t } = useLang();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeMobileTab, setActiveMobileTab] = useState<"plan" | "map" | "phrases" | "saved">("plan");
  const [selectedStopPlaceId, setSelectedStopPlaceId] = useState<string | null>(null);
  const [isSheetMinimized, setIsSheetMinimized] = useState<boolean>(false);
  const [isSheetClosed, setIsSheetClosed] = useState<boolean>(false);
  const [errorState, setErrorState] = useState<{
    type: "busy" | "few_matches" | "fallback_sample";
    matchCount?: number;
    retryAfterS?: number;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerStop, setDrawerStop] = useState<Stop | null>(null);
  const [isShowToLocalOpen, setIsShowToLocalOpen] = useState<boolean>(false);
  const [savedTrips, setSavedTrips] = useState<SavedTripRecord[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("dari_saved_trips");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

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
  const currentMonth = monthParam ? parseInt(monthParam, 10) : 11;

  useEffect(() => {
    let isCancelled = false;

    async function loadOrGeneratePlan() {
      setLoading(true);
      setErrorState(null);

      // Simulation hooks
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

      // Case 1: Curated sample
      if (sampleParam) {
        const sample = getSamplePlan(sampleParam);
        if (!isCancelled) {
          setPlan(sample);
          setSelectedDay(1);
          setLoading(false);
        }
        return;
      }

      // Case 2: Decompress from lz-string
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

      // Case 3: API call with fallback
      const interests: Category[] = interestsParam
        ? (interestsParam.split(",") as Category[])
        : ["heritage", "food"];
      const start_city: StartCity = (startCityParam as StartCity) || "Bengaluru";
      const budget: BudgetFit = (budgetParam as BudgetFit) || "mid";
      const pace: Pace = (paceParam as Pace) || "relaxed";
      const travellers: Travellers = (travellersParam as Travellers) || "couple";

      const request: PlanRequest = {
        interests,
        days: parsedDays,
        start_city,
        budget,
        pace,
        travellers,
        month: currentMonth,
        lang,
      };

      try {
        const res = await fetch("/api/plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        if (res.status === 429) {
          const errData = await res.json().catch(() => ({}));
          if (!isCancelled) {
            setErrorState({ type: "busy", retryAfterS: errData.retry_after_s || 30 });
            setLoading(false);
          }
          return;
        }

        if (res.status === 422) {
          const errData = await res.json().catch(() => ({}));
          if (!isCancelled) {
            setErrorState({ type: "few_matches", matchCount: errData.match_count ?? 3 });
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

      // Fallback: Deterministic Planner
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
  }, [
    dParam,
    sampleParam,
    simulateParam,
    interestsParam,
    daysParam,
    startCityParam,
    budgetParam,
    paceParam,
    travellersParam,
    monthParam,
    parsedDays,
    currentMonth,
    lang,
    refreshKey,
  ]);

  // Auto-save trips to localStorage (U7 My Trips)
  useEffect(() => {
    if (!plan || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("dari_saved_trips");
      const list: SavedTripRecord[] = raw ? JSON.parse(raw) : [];
      const firstCity = plan.days[0]?.stops[0]?.place.city || "Bengaluru";
      const region = plan.days[0]?.stops[0]?.place.region || "Mysuru";
      const tripId = `${plan.days.length}d-${firstCity.toLowerCase()}`;
      const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(plan));
      const record: SavedTripRecord = {
        id: tripId,
        title: plan.title,
        days: plan.days.length,
        month: currentMonth,
        costText: `Rs ${Math.round((plan.cost.total * 0.9) / 1000)}k to ${Math.round((plan.cost.total * 1.15) / 1000)}k`,
        firstCity,
        region,
        savedAt: Date.now(),
        compressed,
      };

      const filtered = list.filter((item) => item.id !== tripId);
      const updated = [record, ...filtered].slice(0, 10);
      localStorage.setItem("dari_saved_trips", JSON.stringify(updated));
      queueMicrotask(() => {
        setSavedTrips(updated);
      });
    } catch {
      // ignore
    }
  }, [plan, currentMonth]);

  // Recalculate plan travel legs, times, and costs after local edits
  const recomputePlanLocally = (updatedDays: Plan["days"]) => {
    if (!plan) return;
    const people = plan.cost.people || 2;
    let totalTripKm = 0;
    const allVisitedPlaces: Place[] = [];

    const computedDays = updatedDays.map((d) => {
      let dayTravelMin = 0;
      let clock = "09:00";

      const recomputedStops = d.stops.map((stop, sIdx) => {
        allVisitedPlaces.push(stop.place);
        let leg = undefined;
        if (sIdx > 0) {
          const prev = d.stops[sIdx - 1].place;
          leg = computeTravelLeg(prev.lat, prev.lng, stop.place.lat, stop.place.lng, people);
          dayTravelMin += leg.min;
          totalTripKm += leg.km;
          clock = addMinutesToTime(clock, leg.min);
        }
        clock = roundTimeTo5Min(clock);
        const startTime = clock;
        clock = roundTimeTo5Min(addMinutesToTime(startTime, stop.place.duration_min));

        return {
          ...stop,
          start: startTime,
          travel_from_prev: leg,
        };
      });

      return {
        ...d,
        stops: recomputedStops,
        travel_total_min: dayTravelMin,
      };
    });

    const travellersVal = (travellersParam as Travellers) || "couple";
    const budgetVal = (budgetParam as BudgetFit) || "mid";

    const newCost = calculateTripCost({
      days: plan.days.length,
      budget: budgetVal,
      travellers: travellersVal,
      totalKm: totalTripKm,
      visitedPlaces: allVisitedPlaces,
    });

    const newPlan: Plan = {
      ...plan,
      days: computedDays,
      cost: newCost,
    };

    setPlan(newPlan);
  };

  // Remove a stop
  const handleRemoveStop = (placeId: string) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d) => {
      if (d.day !== selectedDay) return d;
      return {
        ...d,
        stops: d.stops.filter((s) => s.place_id !== placeId),
      };
    });
    recomputePlanLocally(updatedDays);
  };

  // Swap stop with alternative
  const handleSwapStop = (placeId: string, specificAlternative?: Place) => {
    if (!plan) return;
    const currentDay = plan.days.find((d) => d.day === selectedDay);
    if (!currentDay) return;

    const stopToSwap = currentDay.stops.find((s) => s.place_id === placeId);
    if (!stopToSwap) return;

    const visitedSet = new Set(plan.days.flatMap((d) => d.stops.map((s) => s.place_id)));
    const alternative =
      specificAlternative ||
      allPlaces.find(
        (p) =>
          !visitedSet.has(p.id) &&
          (p.region === stopToSwap.place.region || p.city === stopToSwap.place.city)
      );

    if (!alternative) return;

    const updatedDays = plan.days.map((d) => {
      if (d.day !== selectedDay) return d;
      return {
        ...d,
        stops: d.stops.map((s) => {
          if (s.place_id !== placeId) return s;
          return {
            place_id: alternative.id,
            start: s.start,
            duration_min: alternative.duration_min,
            note_en: alternative.desc_en,
            place: alternative,
            phrases: [],
          };
        }),
      };
    });

    recomputePlanLocally(updatedDays);
  };

  // Add a suggested stop
  const handleAddStop = (place: Place) => {
    if (!plan) return;
    const updatedDays = plan.days.map((d) => {
      if (d.day !== selectedDay) return d;
      return {
        ...d,
        stops: [
          ...d.stops,
          {
            place_id: place.id,
            start: "14:00",
            duration_min: place.duration_min,
            note_en: place.desc_en,
            place,
            phrases: [],
          },
        ],
      };
    });
    recomputePlanLocally(updatedDays);
  };

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
          .catch(() => fallbackCopy(shareUrl));
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
    } catch (e) {
      console.warn("Fallback copy failed:", e);
    }
  };

  const handleRegenerate = () => {
    if (dParam) {
      router.push("/plan");
    } else {
      setRefreshKey((prev) => prev + 1);
    }
  };

  const handlePinClick = (placeId: string, openDrawer: boolean = false) => {
    setSelectedStopPlaceId(placeId);
    setIsSheetClosed(false);
    setIsSheetMinimized(false);
    const targetStop = plan?.days.flatMap((d) => d.stops).find((s) => s.place_id === placeId);
    if (targetStop) {
      setDrawerStop(targetStop);
      if (openDrawer) {
        setIsDrawerOpen(true);
      }
    }
    const el = document.getElementById(`stop-card-${placeId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // Compute Trip Stats
  const tripStats = useMemo(() => {
    if (!plan) return null;
    const totalStops = plan.days.reduce((acc, d) => acc + d.stops.length, 0);
    const uniqueTowns = new Set(plan.days.flatMap((d) => d.stops.map((s) => s.place.city))).size;
    const totalKm = Math.round(
      plan.days.reduce(
        (acc, d) =>
          acc + d.stops.reduce((sAcc, s) => sAcc + (s.travel_from_prev?.km || 0), 0),
        0
      )
    );
    const totalDriveMin = plan.days.reduce((acc, d) => acc + d.travel_total_min, 0);
    const totalDriveHours = Math.max(1, Math.round(totalDriveMin / 60));

    // Estimated cost range
    const lowCostK = Math.round((plan.cost.total * 0.9) / 1000);
    const highCostK = Math.round((plan.cost.total * 1.15) / 1000);

    const weather = KARNATAKA_WEATHER[currentMonth] || KARNATAKA_WEATHER[11];

    return {
      totalStops,
      uniqueTowns,
      totalKm,
      totalDriveHours,
      costRangeText: `Rs ${lowCostK}k to ${highCostK}k`,
      weather,
    };
  }, [plan, currentMonth]);

  // Suggested places nearby for "+ Add a stop"
  const suggestedPlaces = useMemo(() => {
    if (!plan) return [];
    const currentDay = plan.days.find((d) => d.day === selectedDay);
    if (!currentDay) return [];
    const visitedIds = new Set(plan.days.flatMap((d) => d.stops.map((s) => s.place_id)));
    const targetRegion = currentDay.stops[0]?.place.region;

    return allPlaces
      .filter((p) => !visitedIds.has(p.id) && (!targetRegion || p.region === targetRegion))
      .slice(0, 3);
  }, [plan, selectedDay]);

  if (loading) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ProgressSteps
          days={parsedDays}
          placeCount={parsedDays * 3}
          interests={interestsParam ? interestsParam.split(",").join(" & ") : "Heritage & Food"}
          budget={budgetParam || "Mid-range"}
          pace={paceParam || "Relaxed"}
          month={currentMonth}
          onCancel={() => router.push("/plan")}
          onUseReadyMade={() => router.push("/trip?sample=heritage")}
        />
      </div>
    );
  }

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
          month={currentMonth}
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
      {/* Top Header matching mockup 04 */}
      <div className="flex flex-col gap-4">
        {/* Tag pills */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#F9EBEB] text-[#8E1F2F]">
              {interestsParam
                ? interestsParam
                    .split(",")
                    .map((c) => t(`form.categories.${c}`, c))
                    .join(" & ")
                : "Heritage & Food"}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#FDF2CC] text-[#8C6D05]">
              {t(`form.budget_tiers.${budgetParam || "mid"}`, "Mid-range")}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#E1ECF5] text-[#2B5F8A]">
              {t(`form.pace_tiers.${paceParam || "relaxed"}`, "Relaxed")}
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold bg-[#DDEFE7] text-[#1E6B52]">
              Cab
            </span>
            {plan.source === "sample" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#F2B705] text-[#14202B]">
                {t("common.sample_data", "SAMPLE DATA")}
              </span>
            )}
          </div>

          {/* Action buttons: Regenerate, Calendar .ics, PDF print, Share */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRegenerate}
              title="Regenerate"
              aria-label="Regenerate plan"
              className="w-9 h-9 rounded-xl bg-white border border-[#DCE1DD] text-[#14202B] hover:bg-gray-50 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.19" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => downloadIcsFile(plan, currentMonth)}
              title="Add to calendar .ics"
              aria-label="Download calendar file"
              className="w-9 h-9 rounded-xl bg-white border border-[#DCE1DD] text-[#14202B] hover:bg-gray-50 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              title="PDF Print View"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white border border-[#DCE1DD] text-[#14202B] hover:bg-gray-50 transition-all cursor-pointer shadow-2xs active:scale-95"
            >
              PDF
            </button>

            <button
              type="button"
              onClick={() => setIsShowToLocalOpen(true)}
              title="Show to local driver"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-[#F9EBEB] text-[#8E1F2F] hover:bg-[#F2D6D6] transition-all cursor-pointer shadow-2xs active:scale-95 flex items-center gap-1.5"
            >
              <span>🌐</span>
              <span>{lang === "kn" ? "ಸ್ಥಳೀಯರಿಗೆ ತೋರಿಸಿ" : "Show to local"}</span>
            </button>

            <button
              type="button"
              onClick={handleShareLink}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#8E1F2F] hover:bg-[#781926] text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              <span>{copied ? t("common.copied", "Copied!") : t("common.share_link", "Share link")}</span>
            </button>
          </div>
        </div>

        {/* Title and Short Summary */}
        <div>
          <h1 className="font-heading font-extrabold text-2xl sm:text-3xl text-[#14202B] tracking-tight">
            {plan.title}
          </h1>
          <p className="text-sm text-[#586673] mt-1 max-w-3xl leading-relaxed">
            {plan.summary}
          </p>
        </div>

        {/* 5 Stat Cards Row matching mockup 04 */}
        {tripStats && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
            {/* Stat 1: Days */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#DCE1DD] shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F9EBEB] text-[#8E1F2F] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="truncate">
                <div className="font-heading font-bold text-sm text-[#14202B]">
                  {plan.days.length} {t("common.days", "days")}
                </div>
                <div className="text-[11px] text-[#586673] truncate">
                  {lang === "kn" ? tripStats.weather.descKn.split(",")[0] : tripStats.weather.descEn.split(",")[0]}
                </div>
              </div>
            </div>

            {/* Stat 2: Stops */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#DCE1DD] shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#E1ECF5] text-[#2B5F8A] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="truncate">
                <div className="font-heading font-bold text-sm text-[#14202B]">
                  {tripStats.totalStops} stops
                </div>
                <div className="text-[11px] text-[#586673] truncate">
                  {tripStats.uniqueTowns} towns
                </div>
              </div>
            </div>

            {/* Stat 3: Distance */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#DCE1DD] shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#DDEFE7] text-[#1E6B52] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <div className="truncate">
                <div className="font-heading font-bold text-sm text-[#14202B]">
                  {tripStats.totalKm} km
                </div>
                <div className="text-[11px] text-[#586673] truncate">
                  about {tripStats.totalDriveHours} h driving
                </div>
              </div>
            </div>

            {/* Stat 4: Estimated Cost Range */}
            <div className="bg-white p-3.5 rounded-2xl border border-[#DCE1DD] shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#FDF2CC] text-[#8C6D05] flex items-center justify-center font-bold text-sm shrink-0">
                ₹
              </div>
              <div className="truncate">
                <div className="font-heading font-bold text-sm text-[#14202B] truncate">
                  {tripStats.costRangeText}
                </div>
                <div className="text-[11px] text-[#586673] truncate">
                  for {plan.cost.people}, estimate
                </div>
              </div>
            </div>

            {/* Stat 5: Season & Weather */}
            <div className="col-span-2 sm:col-span-1 bg-white p-3.5 rounded-2xl border border-[#DCE1DD] shadow-2xs flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#F9EBEB] text-[#8E1F2F] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </div>
              <div className="truncate">
                <div className="font-heading font-bold text-sm text-[#14202B]">
                  {tripStats.weather.temp}
                </div>
                <div className="text-[11px] text-[#586673] truncate">
                  {lang === "kn" ? tripStats.weather.descKn : tripStats.weather.descEn}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Day Cards Row Acting as Tabs matching mockup 04 */}
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
          {plan.days.map((day) => {
            const isSelected = day.day === selectedDay;
            const dayCity = day.stops[0]?.place.city || day.theme;
            const stopCount = day.stops.length;
            const dayKm = Math.round(
              day.stops.reduce((acc, s) => acc + (s.travel_from_prev?.km || 0), 0)
            );

            return (
              <button
                key={day.day}
                type="button"
                onClick={() => setSelectedDay(day.day)}
                className={`flex flex-col text-left px-4 py-2.5 rounded-2xl border transition-all cursor-pointer shrink-0 min-w-[140px] ${
                  isSelected
                    ? "bg-[#14202B] text-white border-[#14202B] shadow-sm"
                    : "bg-white text-[#14202B] border-[#DCE1DD] hover:bg-gray-50"
                }`}
              >
                <div className="font-heading font-bold text-sm">
                  {t("common.day", "Day")} {day.day}
                </div>
                <div className={`text-[11px] mt-0.5 truncate ${isSelected ? "text-white/80" : "text-[#586673]"}`}>
                  {dayCity} · {stopCount} stops {dayKm > 0 ? `· ${dayKm} km` : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP VIEW (>= lg): Side-by-side Itinerary & Sticky Map */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Stops & Cost Summary */}
        <div className="lg:col-span-6 space-y-6">
          <div className="space-y-2">
            {currentDayData?.stops.map((stop, idx) => {
              const pinNumber = getPinNumber(
                currentDayData.day - 1,
                idx,
                plan.days,
                false
              );
              return (
                <StopCard
                  key={`${currentDayData.day}-${stop.place_id}`}
                  stop={stop}
                  index={idx}
                  isFirst={idx === 0}
                  pinNumber={pinNumber}
                  dayNum={currentDayData.day}
                  onCardClick={(placeId) => handlePinClick(placeId, true)}
                  onSwap={handleSwapStop}
                  onRemove={handleRemoveStop}
                />
              );
            })}
          </div>

          {/* "+ Add a stop to Day X" suggestion row matching mockup 04 */}
          {suggestedPlaces.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-[#E2E7E2] text-xs text-[#586673] flex flex-wrap items-center gap-2">
              <span className="font-semibold text-[#14202B]">
                + Add a stop to Day {selectedDay}:
              </span>
              {suggestedPlaces.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleAddStop(p)}
                  className="px-2.5 py-1 rounded-lg bg-white border border-[#DCE1DD] text-[#14202B] hover:border-[#8E1F2F] hover:text-[#8E1F2F] transition-all cursor-pointer font-medium"
                >
                  {lang === "kn" ? p.name_kn : p.name_en}
                </button>
              ))}
            </div>
          )}

          <CostSummary cost={plan.cost} days={plan.days.length} source={plan.source} />
        </div>

        {/* Right Column: Leaflet Map */}
        <div className="lg:col-span-6 lg:sticky lg:top-8 h-[calc(100vh-140px)] min-h-[500px]">
          <TripMap
            days={plan.days}
            selectedDay={selectedDay}
            selectedPlaceId={selectedStopPlaceId}
            onSelectDay={(dayNum) => setSelectedDay(dayNum)}
            onPinClick={handlePinClick}
          />
        </div>
      </div>

      {/* MOBILE VIEW (< lg): Controlled by Bottom Navigation Tabs */}
      <div className="block lg:hidden space-y-6">
        {/* 1. Mobile Plan Tab */}
        {activeMobileTab === "plan" && (
          <div className="space-y-6">
            <div className="space-y-2">
              {currentDayData?.stops.map((stop, idx) => {
                const pinNumber = getPinNumber(
                  currentDayData.day - 1,
                  idx,
                  plan.days,
                  false
                );
                return (
                  <StopCard
                    key={`${currentDayData.day}-${stop.place_id}`}
                    stop={stop}
                    index={idx}
                    isFirst={idx === 0}
                    pinNumber={pinNumber}
                    dayNum={currentDayData.day}
                    onCardClick={(placeId) => handlePinClick(placeId, true)}
                    onSwap={handleSwapStop}
                    onRemove={handleRemoveStop}
                  />
                );
              })}
            </div>

            {/* "+ Add a stop" suggestion row */}
            {suggestedPlaces.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-[#F7F9F6] border border-[#E2E7E2] text-xs text-[#586673] flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#14202B]">
                  + Add a stop:
                </span>
                {suggestedPlaces.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddStop(p)}
                    className="px-2 py-1 rounded-lg bg-white border border-[#DCE1DD] text-[#14202B] hover:text-[#8E1F2F] font-medium"
                  >
                    {lang === "kn" ? p.name_kn : p.name_en}
                  </button>
                ))}
              </div>
            )}

            <CostSummary cost={plan.cost} days={plan.days.length} source={plan.source} />
          </div>
        )}

        {/* 2. Mobile Map Tab with Interactive Bottom Sheet */}
        {activeMobileTab === "map" && (
          <div className="relative w-full h-[calc(100dvh-200px)] min-h-[460px] rounded-2xl overflow-hidden border border-[#DCE1DD] shadow-sm">
            <TripMap
              days={plan.days}
              selectedDay={selectedDay}
              selectedPlaceId={selectedStopPlaceId}
              onSelectDay={(dayNum) => setSelectedDay(dayNum)}
              onPinClick={handlePinClick}
            />

            {/* Bottom Sheet for Selected Stop */}
            {currentActiveStop && !isSheetClosed && (
              isSheetMinimized ? (
                <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-xl px-3.5 py-2.5 border border-[#DCE1DD] shadow-lg flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-[#8E1F2F]">
                      #{currentStopIdx + 1}
                    </span>
                    <span className="font-semibold text-[#14202B] truncate">
                      {lang === "kn" ? currentActiveStop.place.name_kn : currentActiveStop.place.name_en}
                    </span>
                    <span className="text-[#586673] shrink-0">
                      {currentActiveStop.start}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={currentStopIdx === 0}
                      onClick={() => setSelectedStopPlaceId(activeDayStops[currentStopIdx - 1]?.place_id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F2F4F1] border border-[#DCE1DD] text-[#14202B] disabled:opacity-30 cursor-pointer active:scale-95"
                      aria-label="Previous stop"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      disabled={currentStopIdx >= activeDayStops.length - 1}
                      onClick={() => setSelectedStopPlaceId(activeDayStops[currentStopIdx + 1]?.place_id)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F2F4F1] border border-[#DCE1DD] text-[#14202B] disabled:opacity-30 cursor-pointer active:scale-95"
                      aria-label="Next stop"
                    >
                      →
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDrawerStop(currentActiveStop);
                        setIsDrawerOpen(true);
                      }}
                      className="px-2 py-1 rounded-lg bg-[#8E1F2F] text-white font-semibold text-[11px] cursor-pointer active:scale-95 ml-1"
                    >
                      {lang === "kn" ? "ವಿವರ" : "Details"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-3 left-3 right-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-[#DCE1DD] shadow-2xl animate-in slide-in-from-bottom duration-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#8E1F2F] tracking-wide">
                        {lang === "kn"
                          ? `ನಿಲುಗಡೆ ${currentStopIdx + 1} / ${activeDayStops.length}`
                          : `Stop ${currentStopIdx + 1} of ${activeDayStops.length}`}
                      </span>
                      <span className="text-xs text-[#586673]">
                        {currentActiveStop.start}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={currentStopIdx === 0}
                        onClick={() => setSelectedStopPlaceId(activeDayStops[currentStopIdx - 1]?.place_id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F2F4F1] border border-[#DCE1DD] text-[#14202B] disabled:opacity-30 cursor-pointer active:scale-95"
                        aria-label="Previous stop"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        disabled={currentStopIdx >= activeDayStops.length - 1}
                        onClick={() => setSelectedStopPlaceId(activeDayStops[currentStopIdx + 1]?.place_id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F2F4F1] border border-[#DCE1DD] text-[#14202B] disabled:opacity-30 cursor-pointer active:scale-95"
                        aria-label="Next stop"
                      >
                        →
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSheetMinimized(true)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F2F4F1] border border-[#DCE1DD] text-[#586673] hover:text-[#14202B] cursor-pointer active:scale-95"
                        aria-label="Minimize"
                      >
                        _
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsSheetClosed(true)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#F2F4F1] border border-[#DCE1DD] text-[#586673] hover:text-[#14202B] cursor-pointer active:scale-95"
                        aria-label="Close"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <h3 className="font-heading font-bold text-base text-[#14202B] line-clamp-1">
                    {lang === "kn" ? currentActiveStop.place.name_kn : currentActiveStop.place.name_en}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-[#586673] mt-0.5 mb-2.5">
                    <span>
                      {currentActiveStop.place.entry_inr === 0
                        ? t("common.free", "Free")
                        : `₹${currentActiveStop.place.entry_inr}`}
                      {" · "}
                      {(currentActiveStop.duration_min / 60).toFixed(1).replace(/\.0$/, "")}{" "}
                      {t("common.hours", "h")}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveMobileTab("phrases")}
                      className="text-[#8E1F2F] font-semibold flex items-center gap-1 active:scale-95"
                    >
                      <span>{lang === "kn" ? "ವಾಕ್ಯಗಳು" : "Phrases"}</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}

        {/* 3. Mobile Phrases Tab */}
        {activeMobileTab === "phrases" && (
          <div className="space-y-6">
            <h3 className="font-heading font-bold text-lg text-[#14202B]">
              {lang === "kn"
                ? `ದಿನ ${selectedDay} ಕನ್ನಡ ವಾಕ್ಯಗಳು`
                : `Day ${selectedDay} Useful Phrases`}
            </h3>

            {currentDayData?.stops.map((stop) => (
              <div key={`phrase-group-${stop.place_id}`} className="space-y-2">
                <div className="text-sm font-bold text-[#14202B] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#8E1F2F]" />
                  <span>{lang === "kn" ? stop.place.name_kn : stop.place.name_en}</span>
                </div>
                {stop.phrases && stop.phrases.length > 0 ? (
                  <PhraseCard phrases={stop.phrases} />
                ) : (
                  <div className="text-xs text-[#586673] p-3 rounded-xl bg-gray-50 border border-[#DCE1DD]">
                    {lang === "kn" ? "ಈ ಸ್ಥಳಕ್ಕೆ ವಾಕ್ಯಗಳಿಲ್ಲ" : "No phrases for this stop."}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 4. Mobile Saved Tab (mockup 06 & 08) */}
        {activeMobileTab === "saved" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-[#586673] uppercase tracking-wider">
                  MY TRIPS
                </span>
                <h3 className="font-heading font-extrabold text-lg text-[#14202B]">
                  Saved on this device
                </h3>
              </div>
              <span className="text-[11px] text-[#586673]">No account needed</span>
            </div>

            {savedTrips.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#586673] bg-white rounded-2xl border border-[#DCE1DD]">
                No saved trips yet. Plans you create will automatically appear here.
              </div>
            ) : (
              <div className="space-y-3">
                {savedTrips.map((st) => (
                  <div
                    key={st.id}
                    className="p-4 rounded-2xl bg-white border border-[#DCE1DD] shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => router.push(`/trip?d=${st.compressed}`)}
                    >
                      <h4 className="font-heading font-bold text-sm text-[#14202B] hover:text-[#8E1F2F]">
                        {st.title}
                      </h4>
                      <p className="text-xs text-[#586673] mt-0.5">
                        {st.days} days · {st.costText}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/trip?d=${st.compressed}`;
                        navigator.clipboard?.writeText(url);
                        alert("Link copied!");
                      }}
                      className="w-8 h-8 rounded-lg bg-[#F1F3F0] text-[#14202B] flex items-center justify-center shrink-0 cursor-pointer"
                      title="Share trip"
                    >
                      ↗
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sticky Mobile Bottom Navigation Bar */}
        <div className="fixed bottom-0 left-0 right-0 z-[1100] bg-white border-t border-[#DCE1DD] shadow-lg flex items-center justify-around py-2 px-3">
          <button
            type="button"
            onClick={() => setActiveMobileTab("plan")}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeMobileTab === "plan" ? "text-[#8E1F2F]" : "text-[#586673]"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>{t("nav.plan", "Plan")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab("map")}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeMobileTab === "map" ? "text-[#8E1F2F]" : "text-[#586673]"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            <span>{t("nav.map", "Map")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab("phrases")}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeMobileTab === "phrases" ? "text-[#8E1F2F]" : "text-[#586673]"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            <span>{t("nav.phrases", "Phrases")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileTab("saved")}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeMobileTab === "saved" ? "text-[#8E1F2F]" : "text-[#586673]"
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <span>{lang === "kn" ? "ಉಳಿಸಲಾಗಿದೆ" : "Saved"}</span>
          </button>
        </div>
      </div>

      {/* Stop Detail Drawer (U5) */}
      <StopDetailDrawer
        stop={drawerStop}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSwapWith={(alt) => {
          if (drawerStop) {
            handleSwapStop(drawerStop.place_id, alt);
            setIsDrawerOpen(false);
          }
        }}
        onRemoveStop={(placeId) => {
          handleRemoveStop(placeId);
          setIsDrawerOpen(false);
        }}
      />

      {/* Show To Local Full-Screen View (U6) */}
      <ShowToLocalModal
        place={currentActiveStop?.place || null}
        isOpen={isShowToLocalOpen}
        onClose={() => setIsShowToLocalOpen(false)}
      />
    </div>
  );
}

export default function TripPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center p-12 text-[#586673]">
          Loading Karnataka Travel Planner...
        </div>
      }
    >
      <TripViewContent />
    </Suspense>
  );
}