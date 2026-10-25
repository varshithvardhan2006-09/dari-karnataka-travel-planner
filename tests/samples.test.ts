import { describe, it, expect } from "vitest";
import { PlanSchema, Category, StartCity, BudgetFit, Pace, Travellers, PlanRequest } from "@/lib/schema";
import { buildDeterministicPlan } from "@/lib/planner";
import { getCustomizedSamplePlan } from "@/lib/samples";
import fs from "fs";
import path from "path";

describe("Sample Itineraries Schema Validation", () => {
  const samplesDir = path.resolve(process.cwd(), "data/samples");

  const sampleConfigs = [
    {
      file: "heritage.json",
      title: "3-Day Royal Karnataka & Hoysala Heritage Trail",
      summary: "A regal journey through Bengaluru palaces, Mysuru's royal court, and the intricate Hoysala stone temples of Belur and Halebidu.",
      req: {
        interests: ["heritage", "culture"] as Category[],
        days: 3,
        start_city: "Bengaluru" as StartCity,
        budget: "mid" as BudgetFit,
        pace: "relaxed" as Pace,
        travellers: "couple" as Travellers,
        month: 11,
        lang: "en" as const,
      },
    },
    {
      file: "nature.json",
      title: "3-Day Western Ghats Wildlife & Coffee Mist Retreat",
      summary: "Breathe in the lush flora of Bandipur forests, encounter elephants at Dubare, and explore misty Coorg coffee plantations.",
      req: {
        interests: ["nature", "wildlife", "coffee"] as Category[],
        days: 3,
        start_city: "Mysuru" as StartCity,
        budget: "mid" as BudgetFit,
        pace: "relaxed" as Pace,
        travellers: "family" as Travellers,
        month: 10,
        lang: "en" as const,
      },
    },
    {
      file: "food.json",
      title: "3-Day Karavali Coast & Culinary Pilgrimage",
      summary: "Savour authentic coastal delicacies, crisp ghee roasts, fresh seafood, and unwind at serene golden beaches from Mangaluru to Gokarna.",
      req: {
        interests: ["food", "beach"] as Category[],
        days: 3,
        start_city: "Mangaluru" as StartCity,
        budget: "budget" as BudgetFit,
        pace: "balanced" as Pace,
        travellers: "friends" as Travellers,
        month: 12,
        lang: "en" as const,
      },
    },
    {
      file: "mixed.json",
      title: "4-Day Karnataka Grand Panorama",
      summary: "The complete Karnataka experience: majestic palaces, aromatic street foods, serene waterfalls, and centuries of vibrant living culture.",
      req: {
        interests: ["heritage", "nature", "food"] as Category[],
        days: 4,
        start_city: "Bengaluru" as StartCity,
        budget: "mid" as BudgetFit,
        pace: "balanced" as Pace,
        travellers: "couple" as Travellers,
        month: 1,
        lang: "en" as const,
      },
    },
  ];

  it("generates and validates all 4 sample itineraries", () => {
    if (!fs.existsSync(samplesDir)) {
      fs.mkdirSync(samplesDir, { recursive: true });
    }

    sampleConfigs.forEach(({ file, title, summary, req }) => {
      const plan = buildDeterministicPlan(req);
      plan.source = "sample";
      plan.title = title;
      plan.summary = summary;

      const result = PlanSchema.safeParse(plan);
      if (!result.success) {
        console.error(`Validation failed for ${file}:`, result.error.issues);
      }
      expect(result.success).toBe(true);

      const filePath = path.join(samplesDir, file);
      fs.writeFileSync(filePath, JSON.stringify(plan, null, 2), "utf-8");

      // Verify file read back
      const readContent = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      const parsedRead = PlanSchema.safeParse(readContent);
      expect(parsedRead.success).toBe(true);
      expect(readContent.source).toBe("sample");
      expect(readContent.days.length).toBe(req.days);
      expect(readContent.cost.total).toBe(
        readContent.cost.stay +
          readContent.cost.food +
          readContent.cost.transport +
          readContent.cost.entry
      );
    });
  });

  it("customizes emergency sample plans to match requested days, people count, and budget", () => {
    const singleDayRequest: PlanRequest = {
      interests: ["heritage"],
      days: 1,
      start_city: "Bengaluru",
      budget: "budget",
      pace: "relaxed",
      travellers: "solo",
      month: 11,
      lang: "en",
      people_count: 5,
    };

    const { plan: customized1Day } = getCustomizedSamplePlan(singleDayRequest);

    // Must be sliced to 1 day exactly
    expect(customized1Day.days.length).toBe(1);
    expect(customized1Day.days[0].day).toBe(1);
    expect(customized1Day.cost.people).toBe(5);
    // 1-day trip has 0 lodging stay cost
    expect(customized1Day.cost.stay).toBe(0);
    expect(customized1Day.cost.total).toBe(
      customized1Day.cost.stay +
        customized1Day.cost.food +
        customized1Day.cost.transport +
        customized1Day.cost.entry
    );
    expect(customized1Day.source).toBe("sample");

    const multiDayRequest: PlanRequest = {
      interests: ["nature", "wildlife"],
      days: 5,
      start_city: "Mysuru",
      budget: "premium",
      pace: "packed",
      travellers: "friends",
      month: 12,
      lang: "en",
      people_count: 4,
      transport_mode: "own_car",
    };

    const { plan: customized5Day } = getCustomizedSamplePlan(multiDayRequest);
    expect(customized5Day.days.length).toBe(5);
    // Days must be sequentially numbered 1 to 5
    expect(customized5Day.days.map((d) => d.day)).toEqual([1, 2, 3, 4, 5]);
    expect(customized5Day.cost.people).toBe(4);
    expect(customized5Day.cost.total).toBe(
      customized5Day.cost.stay +
        customized5Day.cost.food +
        customized5Day.cost.transport +
        customized5Day.cost.entry
    );
  });
});
