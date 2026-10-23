import { TravelMode, TravelFromPrev } from "./schema";

const EARTH_RADIUS_KM = 6371;
const ROAD_FACTOR = 1.3; // Straight-line to road distance multiplier
const AVG_SPEED_KMH = 40; // Average road speed in Karnataka (mix of city and state highways)
const BASE_TRAVEL_BUFFER_MIN = 10; // Base buffer for boarding, parking, and traffic

/**
 * Calculates straight-line great circle distance (Haversine) in kilometers.
 */
export function haversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_KM * c * 10) / 10;
}

/**
 * Calculates road distance between two coordinates in kilometers.
 * Distance: haversine distance multiplied by 1.3 (road factor).
 */
export function estimateRoadDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const straightLine = haversineDistanceKm(lat1, lon1, lat2, lon2);
  return Math.round(straightLine * ROAD_FACTOR * 10) / 10;
}

/**
 * Calculates estimated travel duration in minutes rounded to 5 minutes.
 * Time: distance divided by 40 km/h, plus 10 minutes, rounded to 5 minutes.
 */
export function estimateTravelTimeMin(km: number): number {
  if (km <= 0.2) return 0;
  const rawMinutes = (km / AVG_SPEED_KMH) * 60 + BASE_TRAVEL_BUFFER_MIN;
  return Math.max(5, Math.round(rawMinutes / 5) * 5);
}

/**
 * Determines appropriate travel mode based on distance and passenger count.
 */
export function selectTravelMode(km: number, people: number): TravelMode {
  if (people === 1 && km <= 15) {
    return "auto";
  }
  if (people <= 2 && km <= 8) {
    return "auto";
  }
  if (km > 120) {
    return "cab";
  }
  return "cab";
}

/**
 * Computes complete travel leg from previous stop to current stop.
 */
export function computeTravelLeg(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  people: number = 2
): TravelFromPrev {
  const km = estimateRoadDistanceKm(fromLat, fromLng, toLat, toLng);
  const min = estimateTravelTimeMin(km);
  const mode = selectTravelMode(km, people);
  return { km, min, mode };
}

/**
 * Adds minutes to an "HH:MM" string, returning a new "HH:MM" string.
 */
export function addMinutesToTime(timeStr: string, minutesToAdd: number): string {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) {
    return "09:00";
  }
  const [hStr, mStr] = timeStr.split(":");
  const parsedH = parseInt(hStr, 10);
  const parsedM = parseInt(mStr, 10);
  if (isNaN(parsedH) || isNaN(parsedM)) {
    return "09:00";
  }
  const totalMinutes = parsedH * 60 + parsedM + minutesToAdd;
  const hours = ((Math.floor(totalMinutes / 60) % 24) + 24) % 24;
  const minutes = ((totalMinutes % 60) + 60) % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
