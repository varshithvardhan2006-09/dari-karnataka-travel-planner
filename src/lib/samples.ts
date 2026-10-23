import heritageSample from "../../data/samples/heritage.json";
import natureSample from "../../data/samples/nature.json";
import foodSample from "../../data/samples/food.json";
import mixedSample from "../../data/samples/mixed.json";
import { Plan, Category } from "./schema";

export const SAMPLE_PLANS: Record<string, Plan> = {
  heritage: heritageSample as Plan,
  nature: natureSample as Plan,
  food: foodSample as Plan,
  mixed: mixedSample as Plan,
};

/**
 * Returns the most relevant sample plan based on requested interests.
 */
export function getSamplePlanForInterests(interests: Category[]): { plan: Plan; key: string } {
  if (interests.some((c) => c === "heritage" || c === "culture" || c === "spiritual")) {
    return { plan: SAMPLE_PLANS.heritage, key: "heritage" };
  }
  if (interests.some((c) => c === "nature" || c === "wildlife" || c === "coffee" || c === "adventure")) {
    return { plan: SAMPLE_PLANS.nature, key: "nature" };
  }
  if (interests.some((c) => c === "food" || c === "beach")) {
    return { plan: SAMPLE_PLANS.food, key: "food" };
  }
  return { plan: SAMPLE_PLANS.mixed, key: "mixed" };
}

/**
 * Returns a specific sample plan by key.
 */
export function getSamplePlan(key: string): Plan {
  return SAMPLE_PLANS[key] || SAMPLE_PLANS.mixed;
}
