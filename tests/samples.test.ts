import { describe, it, expect } from "vitest";
import { PlanSchema, Category, StartCity, BudgetFit, Pace, Travellers } from "@/lib/schema";
import { buildDeterministicPlan } from "@/lib/planner";
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
});
