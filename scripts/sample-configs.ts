import {
  Category,
  StartCity,
  BudgetFit,
  Pace,
  Travellers,
  PlanRequest,
} from "../src/lib/schema";

export interface SampleConfig {
  /** File written under data/samples/. */
  file: string;
  /** Key used by getSamplePlan() and the ?sample= query parameter. */
  key: string;
  title: string;
  summary: string;
  req: PlanRequest;
}

/**
 * Canonical definitions of the four curated sample itineraries.
 *
 * Shared by `scripts/generate-samples.ts`, which writes the JSON, and by
 * `tests/samples.test.ts`, which checks the committed JSON still matches.
 * Changing a request here changes the expected output, so regenerate with
 * `npm run generate:samples` afterwards.
 */
export const SAMPLE_CONFIGS: SampleConfig[] = [
  {
    file: "heritage.json",
    key: "heritage",
    title: "3-Day Royal Karnataka & Hoysala Heritage Trail",
    summary:
      "A regal journey through Bengaluru palaces, Mysuru's royal court, and the intricate Hoysala stone temples of Belur and Halebidu.",
    req: {
      interests: ["heritage", "culture"] as Category[],
      days: 3,
      start_city: "Bengaluru" as StartCity,
      budget: "mid" as BudgetFit,
      pace: "relaxed" as Pace,
      travellers: "couple" as Travellers,
      month: 11,
      lang: "en",
    },
  },
  {
    file: "nature.json",
    key: "nature",
    title: "3-Day Western Ghats Wildlife & Coffee Mist Retreat",
    summary:
      "Breathe in the lush flora of Bandipur forests, encounter elephants at Dubare, and explore misty Coorg coffee plantations.",
    req: {
      interests: ["nature", "wildlife", "coffee"] as Category[],
      days: 3,
      start_city: "Mysuru" as StartCity,
      budget: "mid" as BudgetFit,
      pace: "relaxed" as Pace,
      travellers: "family" as Travellers,
      month: 10,
      lang: "en",
    },
  },
  {
    file: "food.json",
    key: "food",
    title: "3-Day Karavali Coast & Culinary Pilgrimage",
    summary:
      "Savour authentic coastal delicacies, crisp ghee roasts, fresh seafood, and unwind at serene golden beaches from Mangaluru to Gokarna.",
    req: {
      interests: ["food", "beach"] as Category[],
      days: 3,
      start_city: "Mangaluru" as StartCity,
      budget: "budget" as BudgetFit,
      pace: "balanced" as Pace,
      travellers: "friends" as Travellers,
      month: 12,
      lang: "en",
    },
  },
  {
    file: "mixed.json",
    key: "mixed",
    title: "4-Day Karnataka Grand Panorama",
    summary:
      "The complete Karnataka experience: majestic palaces, aromatic street foods, serene waterfalls, and centuries of vibrant living culture.",
    req: {
      interests: ["heritage", "nature", "food"] as Category[],
      days: 4,
      start_city: "Bengaluru" as StartCity,
      budget: "mid" as BudgetFit,
      pace: "balanced" as Pace,
      travellers: "couple" as Travellers,
      month: 1,
      lang: "en",
    },
  },
];
