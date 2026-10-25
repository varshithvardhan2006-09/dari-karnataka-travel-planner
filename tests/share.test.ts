import { describe, it, expect } from "vitest";
import LZString from "lz-string";
import { buildDeterministicPlan } from "../src/lib/planner";
import { PlanRequest, Plan, PlanSchema } from "../src/lib/schema";

describe("Trip URL Share with lz-string", () => {
  const sampleRequest: PlanRequest = {
    interests: ["heritage", "nature"],
    days: 3,
    start_city: "Mysuru",
    budget: "mid",
    pace: "balanced",
    travellers: "couple",
    month: 10,
    lang: "en",
  };

  it("compresses and decompresses a full Plan without losing data", () => {
    const originalPlan = buildDeterministicPlan(sampleRequest);

    // Compress
    const jsonStr = JSON.stringify(originalPlan);
    const compressed = LZString.compressToEncodedURIComponent(jsonStr);

    expect(compressed).toBeDefined();
    expect(compressed.length).toBeGreaterThan(0);

    // Decompress
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    expect(decompressed).toBeDefined();

    const restoredPlan = JSON.parse(decompressed!) as Plan;
    expect(restoredPlan.title).toBe(originalPlan.title);
    expect(restoredPlan.days.length).toBe(originalPlan.days.length);
    expect(restoredPlan.cost.total).toBe(originalPlan.cost.total);
    expect(restoredPlan.days[0].stops[0].place_id).toBe(
      originalPlan.days[0].stops[0].place_id
    );
  });

  it("safely handles corrupted or invalid share parameter strings", () => {
    const invalidInputs = [
      "not-valid-lz-data",
      "",
      "12345",
      "null",
      "undefined",
    ];

    invalidInputs.forEach((input) => {
      const decompressed = LZString.decompressFromEncodedURIComponent(input);
      let isValid = false;
      try {
        if (decompressed) {
          const parsed = JSON.parse(decompressed) as Plan;
          if (parsed && Array.isArray(parsed.days) && parsed.days.length > 0) {
            isValid = true;
          }
        }
      } catch {
        isValid = false;
      }
      expect(isValid).toBe(false);
    });
  });

  it("strictly rejects JSON payloads that fail PlanSchema runtime validation", () => {
    const invalidPlanObject = {
      title: "Broken Structure Plan",
      days: [{ day: 1, theme: "Theme", stops: "not an array" }], // malformed stops
      cost: { total: 100 }, // missing required cost fields
    };
    const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(invalidPlanObject));
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    const parsed = JSON.parse(decompressed!);
    const validation = PlanSchema.safeParse(parsed);
    expect(validation.success).toBe(false);
  });
});
