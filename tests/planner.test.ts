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

  it("strictly rejects place IDs not in the allowed candidate set even if they exist in global dataset", () => {
    const allowedCandidates = new Set(["mysore-palace", "chamundi-hill"]);
    const modelOutput: AIModelOutput = {
      title: "Hampi in Mysuru?",
      summary: "Model returned virupaksha-temple which is in Hampi, not in allowed candidates.",
      days: [
        {
          day: 1,
          theme: "Day 1",
          stops: [
            { place_id: "mysore-palace", start: "09:00", note_en: "Allowed" },
            { place_id: "virupaksha-temple", start: "12:00", note_en: "Valid place globally but NOT in allowed candidate list" },
          ],
        },
      ],
      tips: [],
    };

    const validation = validateAIOutput(
      modelOutput,
      { ...sampleRequest, days: 1 },
      allowedCandidates
    );
    expect(validation.valid).toBe(false);
    expect(
      validation.errors.some((err) => err.includes("not in the allowed candidate list"))
    ).toBe(true);
  });

  it("scales costs and people count correctly when custom people_count is specified", () => {
    const customPeoplePlan = buildDeterministicPlan({
      ...sampleRequest,
      people_count: 6,
    });

    expect(customPeoplePlan.cost.people).toBe(6);
    // Entry cost for 6 people must be exactly 3 times that for 2 people
    const couplePlan = buildDeterministicPlan({
      ...sampleRequest,
      people_count: 2,
    });
    expect(customPeoplePlan.cost.entry).toBe(couplePlan.cost.entry * 3);
  });

  it("records stop start times correctly including inter-stop travel time", () => {
    const plan = buildDeterministicPlan(sampleRequest);
    const day1 = plan.days[0];
    expect(day1.stops.length).toBeGreaterThanOrEqual(2);

    const stop1 = day1.stops[0];
    const stop2 = day1.stops[1];

    const [h1, m1] = stop1.start.split(":").map(Number);
    const [h2, m2] = stop2.start.split(":").map(Number);

    const stop1DepartureMin = h1 * 60 + m1 + stop1.duration_min;
    const stop2StartMin = h2 * 60 + m2;

    // Stop 2 must start AFTER stop 1 departure (accounting for travel time)
    expect(stop2StartMin).toBeGreaterThanOrEqual(stop1DepartureMin);
  });

  it("strictly rejects non-sequential day numbers in validateAIOutput", () => {
    const invalidDaysOutput: AIModelOutput = {
      title: "Non-sequential Days",
      summary: "Skipping day 2",
      days: [
        {
          day: 1,
          theme: "Day 1",
          stops: [{ place_id: "mysore-palace", start: "09:00", note_en: "Note" }],
        },
        {
          day: 3, // Skipped day 2
          theme: "Day 3",
          stops: [{ place_id: "chamundi-hill", start: "09:00", note_en: "Note" }],
        },
      ],
      tips: [],
    };

    const validation = validateAIOutput(invalidDaysOutput, { ...sampleRequest, days: 2 });
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => err.includes("expected sequential day 2"))).toBe(true);
  });

  it("strictly rejects itineraries starting too late or too early", () => {
    const lateStartOutput: AIModelOutput = {
      title: "Late start",
      summary: "Starts at noon",
      days: [
        {
          day: 1,
          theme: "Day 1",
          stops: [{ place_id: "mysore-palace", start: "11:00", note_en: "Too late" }],
        },
      ],
      tips: [],
    };
    const validation = validateAIOutput(lateStartOutput, { ...sampleRequest, days: 1 });
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => err.includes("between 08:30 and 10:00"))).toBe(true);
  });

  it("strictly rejects itineraries concluding after 19:30 cutoff", () => {
    const lateFinishOutput: AIModelOutput = {
      title: "Late Finish",
      summary: "Stops past 19:30",
      days: [
        {
          day: 1,
          theme: "Day 1",
          stops: [
            { place_id: "mysore-palace", start: "09:00", note_en: "Day stop" },
            { place_id: "chamundi-hill", start: "19:00", note_en: "Chamundi duration is 90 min" },
          ],
        },
      ],
      tips: [],
    };
    const validation = validateAIOutput(lateFinishOutput, { ...sampleRequest, days: 1 });
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((err) => err.includes("19:30"))).toBe(true);
  });

  it("includes transparency note in tips when starting location is unmapped", () => {
    const unknownCityPlan = buildDeterministicPlan({
      ...sampleRequest,
      start_city: "RandomUnknownHamletXYZ",
    });
    expect(
      unknownCityPlan.tips.some((tip) => tip.includes("RandomUnknownHamletXYZ"))
    ).toBe(true);
  });
});
