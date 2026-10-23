import placesData from "../../data/places.json";
import { Place, PlanRequest, StartCity } from "./schema";

export const START_CITY_COORDINATES: Record<StartCity, { lat: number; lng: number }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Mangaluru: { lat: 12.9141, lng: 74.8560 },
  Hubballi: { lat: 15.3647, lng: 75.1240 },
};

/**
 * Calculates straight-line great circle distance (Haversine) in kilometers.
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates candidate score based on interests, travel month, budget tier, and geographic distance.
 */
export function scoreCandidate(place: Place, request: Pick<PlanRequest, "interests" | "month" | "budget" | "start_city" | "days">): number {
  let score = 0;

  // 1. Interest match (highest weight)
  const matchingCategories = place.categories.filter((cat) =>
    request.interests.includes(cat)
  );
  if (matchingCategories.length > 0) {
    score += matchingCategories.length * 40;
  }

  // 2. Best travel month
  if (place.best_months.includes(request.month)) {
    score += 25;
  }

  // 3. Budget tier compatibility
  if (place.budget_fit.includes(request.budget)) {
    score += 20;
  }

  // 4. Distance from starting hub
  const startCoords = START_CITY_COORDINATES[request.start_city] || START_CITY_COORDINATES.Bengaluru;
  const distanceKm = calculateHaversineKm(startCoords.lat, startCoords.lng, place.lat, place.lng);

  // Proximity scoring depends on trip duration:
  // Short trips (1-2 days) strongly penalize places > 250km away.
  if (request.days <= 2) {
    if (distanceKm <= 100) score += 35;
    else if (distanceKm <= 200) score += 20;
    else if (distanceKm <= 350) score += 5;
    else score -= 40;
  } else {
    // Multi-day trips allow exploring across Karnataka
    if (distanceKm <= 150) score += 25;
    else if (distanceKm <= 300) score += 20;
    else if (distanceKm <= 500) score += 10;
  }

  // 5. Meal stop bonus (essential for creating balanced itineraries with meal times)
  if (place.is_meal) {
    score += 15;
  }

  return score;
}

/**
 * Filters and ranks candidate places from data/places.json.
 * Keeps about 2.5 times the target stops needed for the specified duration and pace.
 */
export function getCandidates(
  request: PlanRequest,
  allPlaces: Place[] = placesData as Place[]
): Place[] {
  if (!request.interests || request.interests.length === 0) {
    return [];
  }

  // Target stops per day based on pace
  const stopsPerDay = request.pace === "relaxed" ? 2.5 : request.pace === "packed" ? 5 : 3.5;
  const stopsNeeded = Math.ceil(request.days * stopsPerDay);
  const targetCandidatesCount = Math.max(8, Math.min(allPlaces.length, Math.ceil(stopsNeeded * 2.5)));

  // Score each place
  const scoredPlaces = allPlaces.map((place) => ({
    place,
    score: scoreCandidate(place, request),
  }));

  // Sort descending by score
  scoredPlaces.sort((a, b) => b.score - a.score);

  // Select top candidates
  return scoredPlaces.slice(0, targetCandidatesCount).map((item) => item.place);
}
