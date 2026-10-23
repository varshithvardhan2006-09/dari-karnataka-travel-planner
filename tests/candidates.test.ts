import { describe, it, expect } from "vitest";
import { getCandidates, calculateHaversineKm } from "../src/lib/candidates";
import { PlanRequest, Place, Category } from "../src/lib/schema";
import placesData from "../data/places.json";

const places = placesData as Place[];

describe("Candidate filtering and scoring", () => {
  const baseRequest: PlanRequest = {
    interests: ["heritage", "culture"],
    days: 4,
    start_city: "Bengaluru",
    budget: "mid",
    pace: "relaxed",
    travellers: "couple",
    month: 11,
    lang: "en",
  };

  it("returns an empty array when no interests are selected", () => {
    const emptyRequest: PlanRequest = {
      ...baseRequest,
      interests: [] as unknown as [Category, ...Category[]],
    };
    const candidates = getCandidates(emptyRequest, places);
    expect(candidates).toEqual([]);
  });

  it("prioritizes places matching requested interests", () => {
    const candidates = getCandidates(baseRequest, places);
    expect(candidates.length).toBeGreaterThan(0);

    // Top candidates should include heritage places like Mysore Palace or Belur
    const topPlaceCategories = candidates[0].categories;
    const hasMatchingCategory = topPlaceCategories.some((cat) =>
      baseRequest.interests.includes(cat)
    );
    expect(hasMatchingCategory).toBe(true);
  });

  it("prioritizes local places for short 1-day trips from Mysuru", () => {
    const mysuruRequest: PlanRequest = {
      ...baseRequest,
      days: 1,
      start_city: "Mysuru",
      interests: ["heritage"],
    };
    const candidates = getCandidates(mysuruRequest, places);
    const firstPlace = candidates[0];
    expect(firstPlace.region).toBe("Mysuru");
  });

  it("calculates accurate haversine distance between Bengaluru and Mysuru", () => {
    // Bengaluru ~ (12.97, 77.59), Mysuru ~ (12.30, 76.65)
    // Straight line distance is approximately 125-145 km
    const dist = calculateHaversineKm(12.9716, 77.5946, 12.3051, 76.6551);
    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(150);
  });

  it("returns more candidates for packed pace than relaxed pace", () => {
    const relaxedCandidates = getCandidates(
      { ...baseRequest, days: 5, pace: "relaxed" },
      places
    );
    const packedCandidates = getCandidates(
      { ...baseRequest, days: 5, pace: "packed" },
      places
    );
    expect(packedCandidates.length).toBeGreaterThanOrEqual(relaxedCandidates.length);
  });
});
