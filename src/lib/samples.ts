import heritageSample from "../../data/samples/heritage.json";
import natureSample from "../../data/samples/nature.json";
import foodSample from "../../data/samples/food.json";
import mixedSample from "../../data/samples/mixed.json";
import { Plan, Category, PlanRequest, Place } from "./schema";
import { calculateTripCost } from "./cost";

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
 * Returns a customized sample plan adapted strictly to the user's requested
 * duration, budget tier, party size, and transport mode.
 */
export function getCustomizedSamplePlan(request: PlanRequest): { plan: Plan; key: string } {
  const { plan: basePlan, key } = getSamplePlanForInterests(request.interests);

  // Deep clone to avoid mutating static data
  const customized: Plan = JSON.parse(JSON.stringify(basePlan));

  // Slice or extend days to match requested days
  let slicedDays = customized.days.slice(0, request.days);
  if (slicedDays.length < request.days && customized.days.length > 0) {
    const initialLen = customized.days.length;
    while (slicedDays.length < request.days) {
      const templateDay = customized.days[slicedDays.length % initialLen];
      slicedDays.push({
        ...JSON.parse(JSON.stringify(templateDay)),
        day: slicedDays.length + 1,
      });
    }
  }

  // Ensure day numbering is strictly sequential
  slicedDays = slicedDays.map((d, idx) => ({ ...d, day: idx + 1 }));
  customized.days = slicedDays;

  // Extract places across visited stops
  const visitedPlaces: Place[] = [];
  for (const day of slicedDays) {
    for (const stop of day.stops) {
      if (stop.place) {
        visitedPlaces.push(stop.place);
      }
    }
  }

  // Calculate total route distance across stops
  let scaledKm = 0;
  for (const day of slicedDays) {
    for (const stop of day.stops) {
      if (stop.travel_from_prev?.km) {
        scaledKm += stop.travel_from_prev.km;
      }
    }
  }
  if (scaledKm === 0) {
    scaledKm = Math.max(50, 100 * slicedDays.length);
  }

  customized.cost = calculateTripCost({
    days: slicedDays.length,
    budget: request.budget,
    travellers: request.travellers,
    totalKm: scaledKm,
    visitedPlaces,
    peopleCount: request.people_count,
    transportPreference: request.transport_mode,
  });

  // Adapt title
  if (/^\d+[\s-]*(?:days?|day)?\s*/i.test(customized.title)) {
    customized.title = customized.title.replace(/^\d+[\s-]*(?:days?|day)?\s*/i, `${request.days}-Day `);
  } else {
    customized.title = `${request.days}-Day ${customized.title}`;
  }
  customized.source = "sample";
  customized.trip = {
    start_city: request.start_city,
    budget: request.budget,
    travellers: request.travellers,
    month: request.month,
    transport_mode: request.transport_mode,
  };

  return { plan: customized, key };
}

/**
 * Returns a specific sample plan by key.
 */
export function getSamplePlan(key: string): Plan {
  // Own-property check: keys such as "constructor" must not resolve to Object internals.
  return Object.hasOwn(SAMPLE_PLANS, key) ? SAMPLE_PLANS[key] : SAMPLE_PLANS.mixed;
}
