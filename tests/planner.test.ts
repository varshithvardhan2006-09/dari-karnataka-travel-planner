import { describe, it, expect } from "vitest";
import { buildDeterministicPlan, validateAIOutput } from "../src/lib/planner";
import { PlanRequest, AIModelOutput } from "../src/lib/schema";

describe("Deterministic Planner and Pipeline Validation", () => {
  const sampleRequest: PlanRequest = {
    interests: ["heritage", "culture"],
    days: 4,
    start_city: "Bengaluru",
    budget: "mid",
    pace: "relaxed",
    travellers: "couple",
    month: 11,
    lang: "en",
  };

  it("(a) returns a valid complete plan with no API keys using buildDeterministicPlan", () => {
    const plan = buildDeterministicPlan(sampleRequest);

    expect(plan).toBeDefined();
    expect(plan.source).toBe("planner");
    expect(plan.days.length).toBe(4);
    expect(plan.days[0].stops.length).toBeGreaterThanOrEqual(2);

    // Verify first day has valid place and coordinates
    const firstStop = plan.days[0].stops[0];
    expect(firstStop.place).toBeDefined();
    expect(firstStop.place.id).toBeDefined();
    expect(firstStop.place.lat).toBeGreaterThan(11.0);
  });

  it("(b) strictly rejects any fake/unknown place id injected from an AI model", () => {
    const fakeModelOutput: AIModelOutput = {
      title: "Hallucinated Itinerary",
      summary: "This model hallucinates non-existent places.",
      days: [
        {
          day: 1,
          theme: "Fake Day",
          stops: [
            { place_id: "mysore-palace", start: "09:00", note_en: "Real place" },
            { place_id: "completely-fake-palace-12345", start: "11:30", note_en: "Fake place" },
          ],
        },
      ],
      tips: ["Be careful of fake places"],
    };

    const validation = validateAIOutput(fakeModelOutput, { ...sampleRequest, days: 1 });
    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((err) => err.includes("completely-fake-palace-12345"))
    ).toBe(true);
  });

  it("strictly rejects duplicate place ids across days", () => {
    const duplicateModelOutput: AIModelOutput = {
      title: "Duplicate Itinerary",
      summary: "Visiting Mysore Palace twice.",
      days: [
        {
          day: 1,
          theme: "Day 1",
          stops: [
            { place_id: "mysore-palace", start: "09:00", note_en: "First visit" },
            { place_id: "chamundi-hill", start: "12:00", note_en: "Chamundi" },
          ],
        },
        {
          day: 2,
          theme: "Day 2",
          stops: [
            { place_id: "mysore-palace", start: "09:00", note_en: "Duplicate visit" },
            { place_id: "devaraja-market", start: "12:00", note_en: "Market" },
          ],
        },
      ],
      tips: [],
    };

    const validation = validateAIOutput(duplicateModelOutput, { ...sampleRequest, days: 2 });
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => err.includes("duplicated"))).toBe(true);
  });

  it("(c) ensures costs add up perfectly in the generated plan", () => {
    const plan = buildDeterministicPlan(sampleRequest);
    const { stay, food, transport, entry, total } = plan.cost;

    expect(total).toBe(stay + food + transport + entry);
    expect(total).toBeGreaterThan(0);
    expect(plan.cost.people).toBe(2); // couple
  });

  it("produces correct day counts for 1, 3, and 7 day itineraries", () => {
    [1, 3, 7].forEach((numDays) => {
      const plan = buildDeterministicPlan({ ...sampleRequest, days: numDays });
      expect(plan.days.length).toBe(numDays);
    });
  });
});
