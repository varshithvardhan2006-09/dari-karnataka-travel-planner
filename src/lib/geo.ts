import { TravelMode, TravelFromPrev } from "./schema";

export const DAY_PIN_COLORS: Record<number, string> = {
  1: "#8E1F2F", // Red
  2: "#D99A00", // Gold
  3: "#1E6B52", // Green
  4: "#2B5F8A", // Blue
  5: "#6A4C93", // Purple
  6: "#C05621", // Terracotta
  7: "#2D3748", // Dark slate
};

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

/**
 * Rounds an "HH:MM" string to the nearest 5 minutes.
 */
export function roundTimeTo5Min(timeStr: string): string {
  if (!timeStr || typeof timeStr !== "string" || !timeStr.includes(":")) {
    return "09:00";
  }
  const [hStr, mStr] = timeStr.split(":");
  const parsedH = parseInt(hStr, 10);
  const parsedM = parseInt(mStr, 10);
  if (isNaN(parsedH) || isNaN(parsedM)) {
    return "09:00";
  }
  const totalMinutes = parsedH * 60 + parsedM;
  const rounded = Math.round(totalMinutes / 5) * 5;
  const hours = ((Math.floor(rounded / 60) % 24) + 24) % 24;
  const minutes = ((rounded % 60) + 60) % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Calculates geographic bounds for a set of stops.
 */
export function getBoundsForStops(
  stops: { place: { lat: number; lng: number } }[]
): [[number, number], [number, number]] | null {
  if (!stops || stops.length === 0) return null;
  let minLat = stops[0].place.lat;
  let maxLat = stops[0].place.lat;
  let minLng = stops[0].place.lng;
  let maxLng = stops[0].place.lng;

  for (const s of stops) {
    if (s.place.lat < minLat) minLat = s.place.lat;
    if (s.place.lat > maxLat) maxLat = s.place.lat;
    if (s.place.lng < minLng) minLng = s.place.lng;
    if (s.place.lng > maxLng) maxLng = s.place.lng;
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ];
}

/**
 * Computes pin number for a stop.
 * In single-day mode: 1..n.
 * In whole-trip mode: continuously 1..N across days.
 */
export function getPinNumber(
  dayIndex: number,
  stopIndex: number,
  days: { stops: unknown[] }[],
  wholeTrip: boolean
): number {
  if (!wholeTrip) {
    return stopIndex + 1;
  }
  let count = 0;
  for (let d = 0; d < dayIndex; d++) {
    count += days[d]?.stops?.length || 0;
  }
  return count + stopIndex + 1;
}
