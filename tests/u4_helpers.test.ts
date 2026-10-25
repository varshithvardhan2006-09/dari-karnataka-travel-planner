import { describe, it, expect } from "vitest";
import { roundTimeTo5Min, getPinNumber, getBoundsForStops } from "../src/lib/geo";
import { buildDeterministicPlan } from "../src/lib/planner";
import { PlanRequest, Place } from "../src/lib/schema";
import { calculateTripCost } from "../src/lib/cost";
import placesData from "../data/places.json";

describe("U4 Helpers & Guarantees", () => {
  it("rounds stop start times cleanly to the nearest 5 minutes", () => {
    expect(roundTimeTo5Min("09:00")).toBe("09:00");
    expect(roundTimeTo5Min("09:02")).toBe("09:00");
    expect(roundTimeTo5Min("09:03")).toBe("09:05");
    expect(roundTimeTo5Min("11:58")).toBe("12:00");
    expect(roundTimeTo5Min("14:47")).toBe("14:45");
  });

  it("calculates pin numbering correctly in single day vs whole trip mode", () => {
    const mockDays = [
      { stops: [{}, {}, {}] }, // 3 stops on Day 1
      { stops: [{}, {}, {}, {}] }, // 4 stops on Day 2
    ];

    // Single day mode: restarts at 1 for each day
    expect(getPinNumber(0, 0, mockDays, false)).toBe(1);
    expect(getPinNumber(0, 2, mockDays, false)).toBe(3);
    expect(getPinNumber(1, 0, mockDays, false)).toBe(1);
    expect(getPinNumber(1, 3, mockDays, false)).toBe(4);

    // Whole trip mode: continuous 1..N across days
    expect(getPinNumber(0, 0, mockDays, true)).toBe(1);
    expect(getPinNumber(0, 2, mockDays, true)).toBe(3);
    expect(getPinNumber(1, 0, mockDays, true)).toBe(4); // Day 2 starts at 4
    expect(getPinNumber(1, 3, mockDays, true)).toBe(7); // Day 2 ends at 7
  });

  it("calculates accurate geographic bounds for stops", () => {
    const mockStops = [
      { place: { lat: 12.97, lng: 77.59 } },
      { place: { lat: 15.33, lng: 75.12 } },
      { place: { lat: 13.34, lng: 74.74 } },
    ];

    const bounds = getBoundsForStops(mockStops);
    expect(bounds).toBeDefined();
    expect(bounds![0][0]).toBe(12.97); // minLat
    expect(bounds![1][0]).toBe(15.33); // maxLat
    expect(bounds![0][1]).toBe(74.74); // minLng
    expect(bounds![1][1]).toBe(77.59); // maxLng
  });

  it("strictly guarantees zero duplicate places across multi-day trips", () => {
    const requests: PlanRequest[] = [
      {
        interests: ["heritage", "culture"],
        days: 3,
        start_city: "Bengaluru",
        budget: "mid",
        pace: "packed",
        travellers: "couple",
        month: 11,
        lang: "en",
      },
      {
        interests: ["nature", "wildlife", "beach"],
        days: 5,
        start_city: "Bengaluru",
        budget: "budget",
        pace: "balanced",
        travellers: "solo",
        month: 12,
        lang: "en",
      },
      {
        interests: ["heritage", "spiritual", "food"],
        days: 7,
        start_city: "Bengaluru",
        budget: "premium",
        pace: "relaxed",
        travellers: "family",
        month: 10,
        lang: "kn",
      },
    ];

    requests.forEach((req) => {
      const plan = buildDeterministicPlan(req);
      const visitedIds = plan.days.flatMap((d) => d.stops.map((s) => s.place_id));
      const uniqueIds = new Set(visitedIds);
      expect(uniqueIds.size).toBe(visitedIds.length);
    });
  });

  it("verifies cost calculation respects custom group sizes and transport modes", () => {
    const places = placesData as Place[];
    const costFor6 = calculateTripCost({
      days: 3,
      budget: "mid",
      travellers: "couple",
      totalKm: 250,
      visitedPlaces: places.slice(0, 6),
      peopleCount: 6,
      transportPreference: "own_car",
    });

    expect(costFor6.people).toBe(6);
    expect(costFor6.stay + costFor6.food + costFor6.transport + costFor6.entry).toBe(costFor6.total);
    // 6 people stay and food should be 3x that of 2 people
    const costFor2 = calculateTripCost({
      days: 3,
      budget: "mid",
      travellers: "couple",
      totalKm: 250,
      visitedPlaces: places.slice(0, 6),
      peopleCount: 2,
      transportPreference: "own_car",
    });
    expect(costFor6.stay).toBe(costFor2.stay * 3);
    expect(costFor6.food).toBe(costFor2.food * 3);
  });

  it("handles edge cases (negative or NaN km/days) safely without crashing", () => {
    const places = placesData as Place[];
    const safeCost = calculateTripCost({
      days: -2,
      budget: "mid",
      travellers: "couple",
      totalKm: NaN,
      visitedPlaces: places.slice(0, 2),
      peopleCount: 0,
    });

    expect(safeCost.people).toBe(2);
    expect(safeCost.stay).toBeGreaterThanOrEqual(0);
    expect(safeCost.food).toBeGreaterThanOrEqual(0);
    expect(safeCost.transport).toBeGreaterThanOrEqual(0);
    expect(safeCost.entry).toBeGreaterThanOrEqual(0);
    expect(safeCost.stay + safeCost.food + safeCost.transport + safeCost.entry).toBe(safeCost.total);
    expect(isNaN(safeCost.total)).toBe(false);
  });
});
