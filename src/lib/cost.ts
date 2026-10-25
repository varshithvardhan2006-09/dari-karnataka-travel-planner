import { BudgetFit, Travellers, Place, CostSummary, TransportPreference } from "./schema";

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
 * Accurately respects custom group sizes and chosen transport preferences.
 * Guarantees that stay + food + transport + entry === total.
 */
export function calculateTripCost(params: {
  days: number;
  budget: BudgetFit;
  travellers: Travellers;
  totalKm: number;
  visitedPlaces: Place[];
  peopleCount?: number;
  transportPreference?: TransportPreference;
}): CostSummary {
  const { days, budget, travellers, totalKm, visitedPlaces, peopleCount, transportPreference } = params;
  const safeDays = Math.max(1, typeof days === "number" && !isNaN(days) ? days : 1);
  const safeKm = Math.max(0, typeof totalKm === "number" && !isNaN(totalKm) ? totalKm : 0);
  const people = (peopleCount && peopleCount >= 1 && peopleCount <= 10)
    ? peopleCount
    : PEOPLE_COUNT_MAP[travellers] || 2;
  const rates = TIER_DAILY_RATES[budget] || TIER_DAILY_RATES.mid;

  // 1. Stay cost: people * stayPerPerson * (days - 1 for nights, min 1 for multi-day, 0 for 1-day day trip)
  const nights = safeDays > 1 ? safeDays - 1 : 0;
  const stay = Math.round(people * rates.stayPerPerson * nights);

  // 2. Food cost: people * foodPerPerson * days
  const food = Math.round(people * rates.foodPerPerson * safeDays);

  // 3. Transport cost: based on total road km and selected transport mode
  let transport = 0;
  if (transportPreference === "own_car") {
    // Fuel + toll estimation (~₹13/km + ₹100 daily parking/toll)
    transport = Math.round(safeKm * 13 + safeDays * 100);
  } else if (transportPreference === "bus_train") {
    // KSRTC / train public transit (~₹4/km per person + ₹100 daily local auto)
    transport = Math.round(safeKm * 4 * people + safeDays * 100);
  } else {
    // Cab or Auto
    const isAutoSolo = people === 1 && safeKm < 40;
    const perKmRate = isAutoSolo ? TRANSPORT_RATES.autoPerKm : TRANSPORT_RATES.cabPerKm;
    transport = Math.round(safeKm * perKmRate + safeDays * TRANSPORT_RATES.baseBookingFee);
  }

  // 4. Entry fees: sum of entry_inr * people
  const safePlaces = Array.isArray(visitedPlaces) ? visitedPlaces : [];
  const entryTotalPerPerson = safePlaces.reduce((sum, p) => sum + (p.entry_inr || 0), 0);
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
  people: number,
  transportPreference?: TransportPreference
): { min: number; max: number; text: string } {
  const safeDays = Math.max(1, typeof days === "number" && !isNaN(days) ? days : 1);
  const safePeople = Math.max(1, typeof people === "number" && !isNaN(people) ? people : 2);
  const rates = TIER_DAILY_RATES[budget] || TIER_DAILY_RATES.mid;
  const nights = safeDays > 1 ? safeDays - 1 : 0;
  const stay = safePeople * rates.stayPerPerson * nights;
  const food = safePeople * rates.foodPerPerson * safeDays;
  const avgKmPerDay = 80;

  let transport = 0;
  if (transportPreference === "own_car") {
    transport = safeDays * avgKmPerDay * 13 + safeDays * 100;
  } else if (transportPreference === "bus_train") {
    transport = safeDays * avgKmPerDay * 4 * safePeople + safeDays * 100;
  } else {
    transport = safeDays * avgKmPerDay * 20 + safeDays * TRANSPORT_RATES.baseBookingFee;
  }

  const avgEntry = safeDays * 3 * 50 * safePeople;
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
