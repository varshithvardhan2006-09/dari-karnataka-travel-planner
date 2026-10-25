import { describe, it, expect } from "vitest";
import { countMatchingPlaces } from "../src/lib/candidates";
import { estimateCostRange } from "../src/lib/cost";
import { buildDeterministicPlan } from "../src/lib/planner";
import placesData from "../data/places.json";
import { Place } from "../src/lib/schema";

describe("U2 Match counter & cost range tests", () => {
  const places = placesData as Place[];

  it("accurately counts places matching chosen interests", () => {
    // Heritage + Food matches ~20-25 places in Karnataka
    const matchCount = countMatchingPlaces(["heritage", "food"], places);
    expect(matchCount).toBeGreaterThan(15);
    expect(matchCount).toBeLessThanOrEqual(places.length);

    // Empty interests returns 0
    expect(countMatchingPlaces([], places)).toBe(0);

    // Single interest
    const beachCount = countMatchingPlaces(["beach"], places);
    expect(beachCount).toBeGreaterThanOrEqual(3);
  });

  it("computes realistic cost ranges for various party sizes and durations", () => {
    // 4 days, mid budget, 2 people
    const range4d = estimateCostRange(4, "mid", 2);
    expect(range4d.min).toBeGreaterThan(15000);
    expect(range4d.max).toBeLessThan(45000);
    expect(range4d.text).toMatch(/^Rs \d+k to \d+k$/);

    // 2 days budget solo
    const range2d = estimateCostRange(2, "budget", 1);
    expect(range2d.min).toBeGreaterThan(3000);
    expect(range2d.max).toBeLessThan(15000);

    // 7 days premium family (4 people)
    const range7d = estimateCostRange(7, "premium", 4);
    expect(range7d.min).toBeGreaterThan(70000);

    // 4 days mid couple with bus_train transport preference (matching user scenario)
    const range4dBus = estimateCostRange(4, "mid", 2, "bus_train");
    expect(range4dBus.min).toBeGreaterThan(10000);
    expect(range4dBus.max).toBeLessThan(35000);
    expect(range4dBus.text).toMatch(/^Rs \d+k to \d+k$/);
  });

  it("verifies candidate matches and deterministic plan for user screenshot preferences", () => {
    // Exact categories matching screenshot showing 35 matches:
    const screenshotInterests = ["heritage", "nature", "wildlife", "coffee"] as const;
    const matchCount = countMatchingPlaces([...screenshotInterests], places);
    expect(matchCount).toBeGreaterThanOrEqual(30);

    // Verify buildDeterministicPlan successfully handles bus_train, any food, and November travel
    const plan = buildDeterministicPlan({
      interests: [...screenshotInterests],
      days: 4,
      start_city: "Bengaluru",
      budget: "mid",
      pace: "relaxed",
      travellers: "couple",
      month: 11,
      lang: "en",
      people_count: 2,
      food_preference: "any",
      transport_mode: "bus_train",
      low_walking: false,
    });

    expect(plan).toBeDefined();
    expect(plan.days.length).toBe(4);
    expect(plan.days[0].stops.length).toBeGreaterThanOrEqual(2);
  });
});