import placesData from "../../data/places.json";
import { Place, PlanRequest, Category } from "./schema";

export const START_CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Mysuru: { lat: 12.2958, lng: 76.6394 },
  Mangaluru: { lat: 12.9141, lng: 74.8560 },
  Hubballi: { lat: 15.3647, lng: 75.1240 },
  Hampi: { lat: 15.3350, lng: 76.4600 },
  Madikeri: { lat: 12.4244, lng: 75.7382 },
  Coorg: { lat: 12.4244, lng: 75.7382 },
  Chikkamagaluru: { lat: 13.3161, lng: 75.7720 },
  Udupi: { lat: 13.3409, lng: 74.7421 },
  Gokarna: { lat: 14.5479, lng: 74.3188 },
  Belagavi: { lat: 15.8497, lng: 74.4977 },
  Shivamogga: { lat: 13.9299, lng: 75.5681 },
  Hassan: { lat: 13.0033, lng: 76.1004 },
  Vijayapura: { lat: 16.8302, lng: 75.7100 },
  Kalaburagi: { lat: 17.3297, lng: 76.8343 },
  Badami: { lat: 15.9189, lng: 75.6766 },
  Dharwad: { lat: 15.4589, lng: 75.0078 },
  Bidar: { lat: 17.9104, lng: 77.5199 },
  Belur: { lat: 13.1623, lng: 75.8643 },
  Halebidu: { lat: 13.2136, lng: 75.9936 },
  Srirangapatna: { lat: 12.4237, lng: 76.6830 },
  Bhatkal: { lat: 13.9787, lng: 74.5653 },
  Sagara: { lat: 14.1670, lng: 75.0333 },
  Shravanabelagola: { lat: 12.8583, lng: 76.4856 },
  Mandya: { lat: 12.5234, lng: 76.8973 },
  Kushalnagar: { lat: 12.4583, lng: 75.9614 },
  Gundlupete: { lat: 11.8080, lng: 76.6890 },
  Murudeshwar: { lat: 14.0940, lng: 74.4899 },
  Karwar: { lat: 14.8136, lng: 74.1298 },
  Dandeli: { lat: 15.2427, lng: 74.6230 },
  Davangere: { lat: 14.4644, lng: 75.9218 },
  Tumakuru: { lat: 13.3409, lng: 77.1006 },
  Ballari: { lat: 15.1394, lng: 76.9214 },
  Chitradurga: { lat: 14.2251, lng: 76.3980 },
  Bagalkot: { lat: 16.1817, lng: 75.6958 },
  Kolar: { lat: 13.1367, lng: 78.1291 },
  Ramanagara: { lat: 12.7150, lng: 77.2813 },
  Chamarajanagar: { lat: 11.9261, lng: 76.9437 },
  Sirsi: { lat: 14.6195, lng: 74.8354 },
  Koppal: { lat: 15.3533, lng: 76.1553 },
  Pattadakal: { lat: 15.9485, lng: 75.8160 },
  Aihole: { lat: 16.0189, lng: 75.8814 },
};

/**
 * Resolves geographic coordinates for any specified starting city, town, or place in Karnataka.
 * Transparently indicates whether the location was recognized or mapped to central hub.
 */
export function getStartCityCoordinates(cityName: string): {
  lat: number;
  lng: number;
  isRecognized: boolean;
  resolvedCity: string;
} {
  if (!cityName || typeof cityName !== "string") {
    return { ...START_CITY_COORDINATES.Bengaluru, isRecognized: false, resolvedCity: "Bengaluru" };
  }

  const normalized = cityName.trim().toLowerCase();

  // 1. Direct dictionary match
  for (const [key, coords] of Object.entries(START_CITY_COORDINATES)) {
    if (key.toLowerCase() === normalized) {
      return { ...coords, isRecognized: true, resolvedCity: key };
    }
  }

  // 2. Match against curated places dataset (city, region, or name)
  const matchingPlace = (placesData as Place[]).find(
    (p) =>
      p.city.toLowerCase() === normalized ||
      p.region.toLowerCase() === normalized ||
      p.name_en.toLowerCase().includes(normalized)
  );
  if (matchingPlace) {
    return {
      lat: matchingPlace.lat,
      lng: matchingPlace.lng,
      isRecognized: true,
      resolvedCity: matchingPlace.city,
    };
  }

  // 3. Fallback to Bengaluru capital hub with transparent isRecognized: false flag
  return {
    ...START_CITY_COORDINATES.Bengaluru,
    isRecognized: false,
    resolvedCity: "Bengaluru",
  };
}

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
export function scoreCandidate(
  place: Place,
  request: Pick<PlanRequest, "interests" | "month" | "budget" | "start_city" | "days"> & {
    food_preference?: "any" | "veg" | "nonveg";
    low_walking?: boolean;
  }
): number {
  let score = 0;

  // 1. Interest match (highest weight)
  const matchingCategories = place.categories.filter((cat) =>
    request.interests.includes(cat)
  );
  if (matchingCategories.length > 0) {
    score += matchingCategories.length * 50;
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
  const startCoords = getStartCityCoordinates(request.start_city);
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

  // 6. Food preference compatibility
  if (request.food_preference === "veg" && place.is_meal) {
    score += 15;
  }

  // 7. Low walking preference (favors relaxed stops, softens strenuous multi-hour treks)
  if (request.low_walking) {
    if (place.categories.includes("adventure") && place.duration_min > 90) {
      score -= 20;
    } else if (place.duration_min <= 60) {
      score += 10;
    }
  }

  return score;
}

/**
 * Filters and ranks candidate places from data/places.json.
 * Prioritizes matching interests and meals; non-matching places never displace matching ones.
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

  // Separate places into matching/meal and non-matching places
  const matchingPlaces: { place: Place; score: number }[] = [];
  const nonMatchingPlaces: { place: Place; score: number }[] = [];

  for (const place of allPlaces) {
    const matches = place.categories.some((cat) => request.interests.includes(cat));
    const score = scoreCandidate(place, request);
    if (matches || place.is_meal) {
      matchingPlaces.push({ place, score });
    } else {
      nonMatchingPlaces.push({ place, score });
    }
  }

  // Sort descending by score within each cohort
  matchingPlaces.sort((a, b) => b.score - a.score);
  nonMatchingPlaces.sort((a, b) => b.score - a.score);

  // Interest matches always take priority; non-matching places never displace them
  if (matchingPlaces.length >= targetCandidatesCount) {
    return matchingPlaces.slice(0, targetCandidatesCount).map((item) => item.place);
  }

  // Backfill with top-scored non-matching places if matching places are insufficient
  const needed = targetCandidatesCount - matchingPlaces.length;
  const combined = [
    ...matchingPlaces,
    ...nonMatchingPlaces.slice(0, needed),
  ];
  return combined.map((item) => item.place);
}

/**
 * Counts places in data that match at least one of the selected categories.
 */
export function countMatchingPlaces(
  interests: Category[],
  allPlaces: Place[] = placesData as Place[]
): number {
  if (!interests || interests.length === 0) return 0;
  const set = new Set(interests);
  return allPlaces.filter((p) => p.categories.some((c) => set.has(c))).length;
}
