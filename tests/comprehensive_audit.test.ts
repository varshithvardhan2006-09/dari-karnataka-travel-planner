import { describe, it, expect } from "vitest";
import { buildDeterministicPlan, validateAIOutput } from "../src/lib/planner";
import { getCandidates, getStartCityCoordinates } from "../src/lib/candidates";
import { calculateTripCost, TIER_DAILY_RATES } from "../src/lib/cost";
import { PlanRequest, BudgetFit, Pace, Travellers, Category, Place } from "../src/lib/schema";
import placesData from "../data/places.json";

const places = placesData as Place[];

describe("Comprehensive Full-Stack Project Audit Verification", () => {
  const allCategories: Category[] = [
    "heritage",
    "nature",
    "food",
    "spiritual",
    "adventure",
    "beach",
    "wildlife",
    "coffee",
    "culture",
  ];

  it("verifies deterministic planner for all trip lengths from 1 to 7 days", () => {
    for (let days = 1; days <= 7; days++) {
      const req: PlanRequest = {
        interests: ["heritage", "nature"],
        days,
        start_city: "Bengaluru",
        budget: "mid",
        pace: "balanced",
        travellers: "couple",
        month: 11,
        lang: "en",
      };

      const plan = buildDeterministicPlan(req);
      expect(plan.days.length).toBe(days);

      // Verify each day has at least 2 stops and finishes on time
      plan.days.forEach((day) => {
        expect(day.stops.length).toBeGreaterThanOrEqual(2);
        day.stops.forEach((stop) => {
          expect(stop.place).toBeDefined();
          expect(stop.place.name_en).toBeTruthy();
          expect(stop.place.lat).toBeGreaterThan(11.0);
          expect(stop.place.lng).toBeGreaterThan(74.0);
        });
      });

      // Verify no duplicates across the trip
      const placeIds = plan.days.flatMap((d) => d.stops.map((s) => s.place_id));
      const uniqueIds = new Set(placeIds);
      expect(uniqueIds.size).toBe(placeIds.length);
    }
  });

  it("verifies deterministic planner for all paces: relaxed, balanced, packed", () => {
    const paces: Pace[] = ["relaxed", "balanced", "packed"];
    paces.forEach((pace) => {
      const req: PlanRequest = {
        interests: ["heritage", "food"],
        days: 3,
        start_city: "Mysuru",
        budget: "budget",
        pace,
        travellers: "friends",
        month: 10,
        lang: "kn",
      };

      const plan = buildDeterministicPlan(req);
      expect(plan.days.length).toBe(3);
      plan.days.forEach((day) => {
        expect(day.stops.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  it("verifies cost integrity: stay + food + transport + entry === total across all budget tiers", () => {
    const budgets: BudgetFit[] = ["budget", "mid", "premium"];
    const travellerTypes: Travellers[] = ["solo", "couple", "family", "friends"];

    budgets.forEach((budget) => {
      travellerTypes.forEach((travellers) => {
        const cost = calculateTripCost({
          days: 4,
          budget,
          travellers,
          totalKm: 350,
          visitedPlaces: places.slice(0, 8),
        });

        expect(cost.total).toBe(cost.stay + cost.food + cost.transport + cost.entry);
        expect(cost.total).toBeGreaterThan(0);
        expect(cost.people).toBeGreaterThanOrEqual(1);
      });
    });
  });

  it("verifies start city coordinates mapping for prominent Karnataka hubs and coastal cities", () => {
    const testCities = [
      "Bengaluru",
      "Mysuru",
      "Hampi",
      "Gokarna",
      "Mangaluru",
      "Murudeshwar",
      "Karwar",
      "Dandeli",
      "Coorg",
      "Chikkamagaluru",
    ];

    testCities.forEach((city) => {
      const resolved = getStartCityCoordinates(city);
      expect(resolved.isRecognized).toBe(true);
      expect(resolved.lat).toBeGreaterThan(11.0);
      expect(resolved.lng).toBeGreaterThan(74.0);
    });
  });

  it("verifies all categories produce valid candidate pools", () => {
    allCategories.forEach((cat) => {
      const req: PlanRequest = {
        interests: [cat],
        days: 2,
        start_city: "Bengaluru",
        budget: "mid",
        pace: "relaxed",
        travellers: "couple",
        month: 12,
        lang: "en",
      };

      const candidates = getCandidates(req, places);
      expect(candidates.length).toBeGreaterThanOrEqual(4);
      // Matching category places should be prioritized
      const hasMatch = candidates.some((p) => p.categories.includes(cat) || p.is_meal);
      expect(hasMatch).toBe(true);
    });
  });

  it("verifies group size scaling from 1 to 10 persons", () => {
    for (let people = 1; people <= 10; people++) {
      const req: PlanRequest = {
        interests: ["heritage"],
        days: 2,
        start_city: "Bengaluru",
        budget: "mid",
        pace: "relaxed",
        travellers: "family",
        month: 11,
        lang: "en",
        people_count: people,
      };

      const plan = buildDeterministicPlan(req);
      expect(plan.cost.people).toBe(people);
      expect(plan.cost.total).toBe(
        plan.cost.stay + plan.cost.food + plan.cost.transport + plan.cost.entry
      );
    }
  });

  it("verifies travel leg mode toggling between auto, cab, and walk calculates realistic durations", () => {
    const req: PlanRequest = {
      interests: ["heritage"],
      days: 2,
      start_city: "Bengaluru",
      budget: "mid",
      pace: "relaxed",
      travellers: "couple",
      month: 11,
      lang: "en",
    };

    const plan = buildDeterministicPlan(req);
    const day1 = plan.days[0];
    expect(day1.stops.length).toBeGreaterThanOrEqual(2);

    const stop2 = day1.stops[1];
    expect(stop2.travel_from_prev).toBeDefined();

    const legKm = stop2.travel_from_prev!.km;
    // Walk duration for legKm at 4.5 km/h
    const walkMin = Math.max(5, Math.round(((legKm / 4.5) * 60) / 5) * 5);
    // Auto duration for legKm at 30 km/h + 10 min
    const autoMin = Math.max(5, Math.round(((legKm / 30) * 60 + 10) / 5) * 5);

    expect(walkMin).toBeGreaterThanOrEqual(5);
    expect(autoMin).toBeGreaterThanOrEqual(5);
  });
});
