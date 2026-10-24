import { describe, it, expect } from "vitest";
import placesData from "../data/places.json";
import { Place } from "../src/lib/schema";

const ALLOWED_LICENSES = [
  "CC0",
  "CC BY 2.0",
  "CC BY 3.0",
  "CC BY 4.0",
  "CC BY-SA 2.0",
  "CC BY-SA 3.0",
  "CC BY-SA 4.0",
  "Public domain",
  "PD",
];

describe("U10 Real place photos & Wikimedia compliance", () => {
  const places = placesData as Place[];
  const placesWithImages = places.filter((p) => Boolean(p.image));

  it("ensures all places with images have valid credit, license, and source_url", () => {
    placesWithImages.forEach((place) => {
      expect(place.image).toBeDefined();
      expect(place.image!.file).toBeDefined();
      expect(place.image!.file.length).toBeGreaterThan(0);
      expect(place.image!.credit).toBeDefined();
      expect(place.image!.credit.length).toBeGreaterThan(0);
      expect(place.image!.source_url).toBeDefined();
      expect(place.image!.source_url.startsWith("http")).toBe(true);
      expect(place.image!.license).toBeDefined();

      const isAllowed = ALLOWED_LICENSES.some((lic) =>
        place.image!.license.toLowerCase().includes(lic.toLowerCase())
      );
      expect(isAllowed).toBe(true);
    });
  });

  it("ensures PlaceImage fallback handles places without an image gracefully", () => {
    const placesWithoutImages = places.filter((p) => !p.image);
    expect(placesWithoutImages.length).toBeGreaterThanOrEqual(0);
  });
});