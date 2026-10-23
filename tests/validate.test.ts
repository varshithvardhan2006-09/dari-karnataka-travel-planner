import { describe, it, expect } from "vitest";
import placesData from "../data/places.json";
import phrasesData from "../data/phrases.json";
import { PlaceSchema, PhraseSchema, Place, Phrase } from "../src/lib/schema";

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
});
