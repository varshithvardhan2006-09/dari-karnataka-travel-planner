import { describe, it, expect } from "vitest";
import { calculateTripCost, PEOPLE_COUNT_MAP } from "../src/lib/cost";
import { Place } from "../src/lib/schema";

describe("Trip cost calculations", () => {
  const dummyPlaces: Place[] = [
    {
      id: "place-1",
      name_en: "Place 1",
      name_kn: "ಸ್ಥಳ ೧",
      region: "Mysuru",
      city: "Mysuru",
      lat: 12.3,
      lng: 76.6,
      categories: ["heritage"],
      duration_min: 90,
      entry_inr: 100,
      best_months: [11],
      budget_fit: ["mid"],
      desc_en: "Desc",
      desc_kn: "ವಿವರಣೆ",
      tip_en: "Tip",
      phrase_ids: [],
      verified: true,
    },
    {
      id: "place-2",
      name_en: "Place 2",
      name_kn: "ಸ್ಥಳ ೨",
      region: "Mysuru",
      city: "Mysuru",
      lat: 12.4,
      lng: 76.7,
      categories: ["food"],
      duration_min: 60,
      entry_inr: 50,
      best_months: [11],
      budget_fit: ["mid"],
      desc_en: "Desc",
      desc_kn: "ವಿವರಣೆ",
      tip_en: "Tip",
      phrase_ids: [],
      verified: true,
    },
  ];

  it("guarantees that total is the exact mathematical sum of stay + food + transport + entry", () => {
    const cost = calculateTripCost({
      days: 4,
      budget: "mid",
      travellers: "couple",
      totalKm: 280,
      visitedPlaces: dummyPlaces,
    });

    expect(cost.total).toBe(cost.stay + cost.food + cost.transport + cost.entry);
  });

  it("accurately maps traveller counts", () => {
    expect(PEOPLE_COUNT_MAP.solo).toBe(1);
    expect(PEOPLE_COUNT_MAP.couple).toBe(2);
    expect(PEOPLE_COUNT_MAP.family).toBe(4);
    expect(PEOPLE_COUNT_MAP.friends).toBe(4);
  });

  it("calculates zero lodging stay cost for a 1-day trip", () => {
    const cost = calculateTripCost({
      days: 1,
      budget: "budget",
      travellers: "solo",
      totalKm: 30,
      visitedPlaces: dummyPlaces,
    });

    expect(cost.stay).toBe(0);
    expect(cost.total).toBe(cost.food + cost.transport + cost.entry);
  });

  it("scales entry costs directly with the number of travellers", () => {
    const soloCost = calculateTripCost({
      days: 2,
      budget: "mid",
      travellers: "solo",
      totalKm: 100,
      visitedPlaces: dummyPlaces,
    });

    const coupleCost = calculateTripCost({
      days: 2,
      budget: "mid",
      travellers: "couple",
      totalKm: 100,
      visitedPlaces: dummyPlaces,
    });

    // Total entry per person = 100 + 50 = 150
    expect(soloCost.entry).toBe(150);
    expect(coupleCost.entry).toBe(300);
  });

  it("ensures budget tiers order properly: budget < mid < premium", () => {
    const budgetCost = calculateTripCost({
      days: 3,
      budget: "budget",
      travellers: "couple",
      totalKm: 150,
      visitedPlaces: dummyPlaces,
    });

    const midCost = calculateTripCost({
      days: 3,
      budget: "mid",
      travellers: "couple",
      totalKm: 150,
      visitedPlaces: dummyPlaces,
    });

    const premiumCost = calculateTripCost({
      days: 3,
      budget: "premium",
      travellers: "couple",
      totalKm: 150,
      visitedPlaces: dummyPlaces,
    });

    expect(budgetCost.total).toBeLessThan(midCost.total);
    expect(midCost.total).toBeLessThan(premiumCost.total);
  });

  it("calculates transport cost based on transport preferences (cab vs own_car vs bus_train)", () => {
    const cabCost = calculateTripCost({
      days: 3,
      budget: "mid",
      travellers: "couple",
      totalKm: 200,
      visitedPlaces: dummyPlaces,
      transportPreference: "cab",
    });

    const carCost = calculateTripCost({
      days: 3,
      budget: "mid",
      travellers: "couple",
      totalKm: 200,
      visitedPlaces: dummyPlaces,
      transportPreference: "own_car",
    });

    const busCost = calculateTripCost({
      days: 3,
      budget: "mid",
      travellers: "couple",
      totalKm: 200,
      visitedPlaces: dummyPlaces,
      transportPreference: "bus_train",
    });

    // own_car (~13/km) and bus_train should be less than cab (~20/km) for 200km
    expect(carCost.transport).toBeLessThan(cabCost.transport);
    expect(busCost.transport).toBeLessThan(cabCost.transport);
    // Invariants must hold
    expect(cabCost.total).toBe(cabCost.stay + cabCost.food + cabCost.transport + cabCost.entry);
    expect(carCost.total).toBe(carCost.stay + carCost.food + carCost.transport + carCost.entry);
    expect(busCost.total).toBe(busCost.stay + busCost.food + busCost.transport + busCost.entry);
  });

  it("accurately applies custom peopleCount when specified", () => {
    const group5Cost = calculateTripCost({
      days: 3,
      budget: "mid",
      travellers: "couple", // overridden by peopleCount
      peopleCount: 5,
      totalKm: 150,
      visitedPlaces: dummyPlaces,
    });

    expect(group5Cost.people).toBe(5);
    expect(group5Cost.entry).toBe(150 * 5); // 150/person * 5 people
    expect(group5Cost.total).toBe(group5Cost.stay + group5Cost.food + group5Cost.transport + group5Cost.entry);
  });
});
