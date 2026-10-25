import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrintItinerary } from "../src/components/PrintItinerary";
import { getSamplePlan } from "../src/lib/samples";

describe("PrintItinerary Component", () => {
  const samplePlan = getSamplePlan("mixed");

  it("renders without crashing and outputs semantic print layout", () => {
    const html = renderToStaticMarkup(
      React.createElement(PrintItinerary, {
        plan: samplePlan,
        tripStats: {
          totalKm: 280,
          totalDriveHours: 5.5,
          totalStops: 6,
          uniqueTowns: 3,
          costRangeText: "₹8,000 - ₹12,000",
          weather: {
            temp: "24°C",
            descEn: "Pleasant",
            descKn: "ಆಹ್ಲಾದಕರ",
          },
        },
        budgetParam: "mid",
        travellersParam: "couple",
        paceParam: "relaxed",
        interestsParam: "heritage,nature",
        lang: "en",
      })
    );

    // Verifies container has print classes
    expect(html).toContain("hidden print:block");
    expect(html).toContain("Dari (ದಾರಿ) · Karnataka Travel Itinerary");
    expect(html).toContain("Emergency Numbers");
    expect(html).toContain("Quick Kannada Cheat Sheet");
  });

  it("renders all days and all stops in the plan", () => {
    const html = renderToStaticMarkup(
      React.createElement(PrintItinerary, {
        plan: samplePlan,
      })
    );

    samplePlan.days.forEach((day) => {
      expect(html).toContain(`DAY ${day.day}`);
      day.stops.forEach((stop) => {
        expect(html).toContain(stop.place.name_en);
        // Verify Google Maps link exists for each stop
        expect(html).toContain("Google Maps Link");
        expect(html).toContain("google.com/maps");
      });
    });
  });

  it("includes cost breakdown table with correct total", () => {
    const html = renderToStaticMarkup(
      React.createElement(PrintItinerary, {
        plan: samplePlan,
      })
    );

    expect(html).toContain("Estimated Trip Cost Breakdown");
    expect(html).toContain("TOTAL ESTIMATED COST");
    expect(html).toContain(`₹${samplePlan.cost.total.toLocaleString("en-IN")}`);
  });

  it("renders Kannada script and transliteration for bilingual clarity", () => {
    const html = renderToStaticMarkup(
      React.createElement(PrintItinerary, {
        plan: samplePlan,
        lang: "kn",
      })
    );

    expect(html).toContain("ಕರ್ನಾಟಕ ಪ್ರವಾಸ ಕಾರ್ಯಕ್ರಮ");
    expect(html).toContain("font-kannada");
    expect(html).toContain("ನಮಸ್ಕಾರ");
  });
});
