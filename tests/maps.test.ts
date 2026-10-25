import { describe, it, expect } from "vitest";
import { getGoogleMapsSearchUrl, getGoogleMapsDirectionsUrl } from "../src/lib/maps";

describe("Google Maps URL Generator", () => {
  it("generates coordinate-based search URL when valid lat/lng are provided", () => {
    const url = getGoogleMapsSearchUrl({
      name_en: "Mysore Palace",
      city: "Mysuru",
      lat: 12.3052,
      lng: 76.6552,
    });
    expect(url).toBe("https://www.google.com/maps/search/?api=1&query=12.3052,76.6552");
  });

  it("generates fallback text query URL when coordinates are missing", () => {
    const url = getGoogleMapsSearchUrl({
      name_en: "Jog Falls",
      city: "Shivamogga",
    });
    expect(url).toContain("https://www.google.com/maps/search/?api=1&query=");
    expect(url).toContain("Jog%20Falls");
    expect(url).toContain("Shivamogga");
  });

  it("generates driving directions URL with coordinate destination", () => {
    const url = getGoogleMapsDirectionsUrl({
      name_en: "Hampi Virupaksha Temple",
      city: "Hampi",
      lat: 15.335,
      lng: 76.46,
    });
    expect(url).toBe("https://www.google.com/maps/dir/?api=1&destination=15.335,76.46&travelmode=driving");
  });

  it("generates directions URL with custom origin if provided", () => {
    const url = getGoogleMapsDirectionsUrl(
      {
        name_en: "Belur Chennakeshava Temple",
        city: "Hassan",
        lat: 13.1625,
        lng: 75.8596,
      },
      "Bengaluru"
    );
    expect(url).toBe(
      "https://www.google.com/maps/dir/?api=1&origin=Bengaluru&destination=13.1625,75.8596&travelmode=driving"
    );
  });
});
