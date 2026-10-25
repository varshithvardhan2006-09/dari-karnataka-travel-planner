import { describe, it, expect } from "vitest";
import placesData from "../data/places.json";
import phrasesData from "../data/phrases.json";
import { PlaceSchema, PhraseSchema, Place, Phrase, PlanRequestSchema } from "../src/lib/schema";

describe("Dataset validation with Zod", () => {
  const places = placesData as Place[];
  const phrases = phrasesData as Phrase[];

  it("contains at least 34 curated Karnataka places", () => {
    expect(places.length).toBeGreaterThanOrEqual(34);
  });

  it("ensures every place conforms strictly to PlaceSchema", () => {
    places.forEach((place) => {
      const result = PlaceSchema.safeParse(place);
      if (!result.success) {
        console.error("Validation error for place:", place.id, result.error.format());
      }
      expect(result.success).toBe(true);
    });
  });

  it("ensures all coordinates lie within Karnataka geographical bounds", () => {
    places.forEach((place) => {
      // Karnataka roughly spans 11.5°N to 18.5°N and 74.0°E to 78.6°E
      expect(place.lat).toBeGreaterThan(11.0);
      expect(place.lat).toBeLessThan(19.0);
      expect(place.lng).toBeGreaterThan(73.5);
      expect(place.lng).toBeLessThan(79.0);
    });
  });

  it("ensures place IDs are unique", () => {
    const ids = places.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("ensures every phrase conforms strictly to PhraseSchema", () => {
    phrases.forEach((phrase) => {
      const result = PhraseSchema.safeParse(phrase);
      expect(result.success).toBe(true);
    });
  });

  it("ensures all phrase_ids referenced by places exist in phrases.json", () => {
    const phraseIdSet = new Set(phrases.map((p) => p.id));
    places.forEach((place) => {
      place.phrase_ids.forEach((id) => {
        expect(phraseIdSet.has(id)).toBe(true);
      });
    });
  });

  it("ensures unverified places are properly flagged with verified:false", () => {
    const unverified = places.filter((p) => !p.verified);
    expect(unverified.length).toBeGreaterThan(0);
  });

  it("strictly requires integer values for days and month in PlanRequestSchema", () => {
    const fractionalDays = PlanRequestSchema.safeParse({
      interests: ["heritage"],
      days: 3.5, // fractional
      start_city: "Bengaluru",
      budget: "mid",
      pace: "relaxed",
      travellers: "couple",
      month: 11,
      lang: "en",
    });
    expect(fractionalDays.success).toBe(false);

    const fractionalMonth = PlanRequestSchema.safeParse({
      interests: ["heritage"],
      days: 3,
      start_city: "Bengaluru",
      budget: "mid",
      pace: "relaxed",
      travellers: "couple",
      month: 10.5, // fractional
      lang: "en",
    });
    expect(fractionalMonth.success).toBe(false);
  });

  it("validates all optional extended preferences in PlanRequestSchema", () => {
    const validExtended = PlanRequestSchema.safeParse({
      interests: ["heritage", "nature"],
      days: 4,
      start_city: "Mysuru",
      budget: "premium",
      pace: "balanced",
      travellers: "family",
      month: 12,
      lang: "en",
      people_count: 5,
      food_preference: "veg",
      transport_mode: "own_car",
      low_walking: true,
    });
    expect(validExtended.success).toBe(true);
    if (validExtended.success) {
      expect(validExtended.data.people_count).toBe(5);
      expect(validExtended.data.food_preference).toBe("veg");
      expect(validExtended.data.transport_mode).toBe("own_car");
      expect(validExtended.data.low_walking).toBe(true);
    }
  });
});
