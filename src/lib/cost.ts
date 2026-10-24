import { BudgetFit, Travellers, Place, CostSummary } from "./schema";

export const PEOPLE_COUNT_MAP: Record<Travellers, number> = {
  solo: 1,
  couple: 2,
  family: 4,
  friends: 4,
};

// Daily rates per person in INR
export const TIER_DAILY_RATES: Record<BudgetFit, { stayPerPerson: number; foodPerPerson: number }> = {
  budget: {
    stayPerPerson: 1000,
    foodPerPerson: 600,
  },
  mid: {
    stayPerPerson: 2200,
    foodPerPerson: 1200,
  },
  premium: {
    stayPerPerson: 4200,
    foodPerPerson: 2000,
  },
};

// Transport rates per km in INR
export const TRANSPORT_RATES = {
  autoPerKm: 16,
  cabPerKm: 20,
  baseBookingFee: 150, // Base daily driver allowance / vehicle booking component
};

/**
 * Calculates itemized trip costs based on duration, budget tier, passenger count, total distance, and entry fees.
 * Guarantees that stay + food + transport + entry === total.
 */
export function calculateTripCost(params: {
  days: number;
  budget: BudgetFit;
  travellers: Travellers;
  totalKm: number;
  visitedPlaces: Place[];
}): CostSummary {
  const { days, budget, travellers, totalKm, visitedPlaces } = params;
  const people = PEOPLE_COUNT_MAP[travellers] || 2;
  const rates = TIER_DAILY_RATES[budget] || TIER_DAILY_RATES.mid;

  // 1. Stay cost: people * stayPerPerson * (days - 1 for nights, min 1 for multi-day, 0 for 1-day day trip)
  const nights = days > 1 ? days - 1 : 0;
  const stay = Math.round(people * rates.stayPerPerson * nights);

  // 2. Food cost: people * foodPerPerson * days
  const food = Math.round(people * rates.foodPerPerson * days);

  // 3. Transport cost: total road km * vehicle rate + daily allowances
  const isAutoSolo = people === 1 && totalKm < 40;
  const perKmRate = isAutoSolo ? TRANSPORT_RATES.autoPerKm : TRANSPORT_RATES.cabPerKm;
  const transport = Math.round(totalKm * perKmRate + days * TRANSPORT_RATES.baseBookingFee);

  // 4. Entry fees: sum of entry_inr * people
  const entryTotalPerPerson = visitedPlaces.reduce((sum, p) => sum + (p.entry_inr || 0), 0);
  const entry = Math.round(entryTotalPerPerson * people);

  // Total must exactly equal the sum of all itemized categories
  const total = stay + food + transport + entry;

  return {
    stay,
    food,
    transport,
    entry,
    total,
    people,
  };
}

/**
 * Computes estimated total rupee range [min, max] for a trip brief.
 */
export function estimateCostRange(
  days: number,
  budget: BudgetFit,
  people: number
): { min: number; max: number; text: string } {
  const rates = TIER_DAILY_RATES[budget] || TIER_DAILY_RATES.mid;
  const nights = days > 1 ? days - 1 : 0;
  const stay = people * rates.stayPerPerson * nights;
  const food = people * rates.foodPerPerson * days;
  const avgKmPerDay = 80;
  const transport = days * avgKmPerDay * 20;
  const avgEntry = days * 3 * 50 * people;
  const baseTotal = stay + food + transport + avgEntry;

  const min = Math.round((baseTotal * 0.85) / 1000) * 1000;
  const max = Math.round((baseTotal * 1.25) / 1000) * 1000;
  const minK = Math.round(min / 1000);
  const maxK = Math.round(max / 1000);
  return {
    min,
    max,
    text: `Rs ${minK}k to ${maxK}k`,
  };
}
