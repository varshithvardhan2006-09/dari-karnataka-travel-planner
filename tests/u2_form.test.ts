import { describe, it, expect } from "vitest";
import { countMatchingPlaces } from "../src/lib/candidates";
import { estimateCostRange } from "../src/lib/cost";
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
  });
});