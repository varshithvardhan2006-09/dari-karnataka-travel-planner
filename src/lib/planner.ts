import placesData from "../../data/places.json";
import {
  PlanRequest,
  Plan,
  Place,
  AIModelOutput,
} from "./schema";
import { getCandidates, calculateHaversineKm, getStartCityCoordinates } from "./candidates";
import { enrichPlan } from "./enrich";
import { estimateRoadDistanceKm, estimateTravelTimeMin, addMinutesToTime } from "./geo";

const allPlaces = placesData as Place[];
const validPlaceIdSet = new Set(allPlaces.map((p) => p.id));

const MAX_LEG_KM = 90; // about 2 h 15 min by road between two stops on the same day
const DAY_END_MIN = 19 * 60 + 30;

export const PACE_STOP_LIMITS = {
  relaxed: { min: 2, max: 3, target: 3 },
  balanced: { min: 3, max: 4, target: 4 },
  packed: { min: 4, max: 6, target: 5 },
};

/**
 * Validates a raw plan output from the AI model.
 * Returns valid boolean and list of actionable error strings for retry prompting.
 * When allowedCandidateIds is provided, strictly enforces that all places belong to the candidate whitelist.
 */
export function validateAIOutput(
  rawPlan: AIModelOutput,
  request: PlanRequest,
  allowedCandidateIds?: Set<string> | string[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const candidateSet = allowedCandidateIds
    ? allowedCandidateIds instanceof Set
      ? allowedCandidateIds
      : new Set(allowedCandidateIds)
    : null;

  // 1. Day count check
  if (!rawPlan.days || rawPlan.days.length !== request.days) {
    errors.push(
      `Expected exactly ${request.days} days, but received ${rawPlan.days?.length || 0}.`
    );
  }

  const seenPlaceIds = new Set<string>();
  const limits = PACE_STOP_LIMITS[request.pace] || PACE_STOP_LIMITS.balanced;

  (rawPlan.days || []).forEach((dayItem) => {
    // 2. Stop count per day check
    if (dayItem.stops.length < limits.min || dayItem.stops.length > limits.max) {
      errors.push(
        `Day ${dayItem.day} has ${dayItem.stops.length} stops; expected between ${limits.min} and ${limits.max} for ${request.pace} pace.`
      );
    }

    let previousPlace: Place | null = null;
    let dayDrivingMin = 0;

    dayItem.stops.forEach((stop, stopIdx) => {
      // 3. Place ID must exist in candidate whitelist (or dataset fallback)
      const allowedSet = candidateSet || validPlaceIdSet;
      if (!allowedSet.has(stop.place_id)) {
        const errorMsg = candidateSet
          ? `Day ${dayItem.day} stop ${stopIdx + 1} has place_id "${stop.place_id}" which is not in the allowed candidate list for this trip.`
          : `Day ${dayItem.day} stop ${stopIdx + 1} has unknown place_id "${stop.place_id}". You may ONLY use IDs from the candidate list.`;
        errors.push(errorMsg);
        return;
      }

      // 4. No duplicate places across the entire trip
      if (seenPlaceIds.has(stop.place_id)) {
        errors.push(
          `Place "${stop.place_id}" is duplicated. Every stop across the entire trip must be unique.`
        );
      }
      seenPlaceIds.add(stop.place_id);

      const place = allPlaces.find((p) => p.id === stop.place_id);
      if (place && previousPlace) {
        const roadKm = estimateRoadDistanceKm(
          previousPlace.lat,
          previousPlace.lng,
          place.lat,
          place.lng
        );
        dayDrivingMin += estimateTravelTimeMin(roadKm);
      }
      if (place) previousPlace = place;

      // 5. Start time check
      if (stop.start) {
        const [h, m] = stop.start.split(":").map(Number);
        const startMinutes = h * 60 + m;
        if (startMinutes < 8 * 60 + 30) {
          errors.push(
            `Stop "${stop.place_id}" on Day ${dayItem.day} starts at ${stop.start}, which is earlier than 08:30.`
          );
        }
      }
    });

    // 6. Max driving limit per day (4 hours = 240 mins)
    if (dayDrivingMin > 240) {
      errors.push(
        `Day ${dayItem.day} has ${dayDrivingMin} minutes of driving, exceeding the 240 minute daily driving limit.`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Builds a deterministic itinerary with NO AI required.
 * Uses greedy nearest-neighbour geographic clustering and realistic time windows.
 */
export function buildDeterministicPlan(request: PlanRequest): Plan {
  const limits = PACE_STOP_LIMITS[request.pace] || PACE_STOP_LIMITS.balanced;
  const stopsPerDay = limits.target;

  // Retrieve candidate pool
  let pool = getCandidates(request, allPlaces);

  // If pool is small, backfill with remaining best-scored places
  if (pool.length < request.days * stopsPerDay) {
    const poolIds = new Set(pool.map((p) => p.id));
    const extra = allPlaces.filter((p) => !poolIds.has(p.id));
    pool = [...pool, ...extra];
  }

  const unusedPlaces = [...pool];
  const startCoords = getStartCityCoordinates(request.start_city);
  const seenPlaceIds = new Set<string>();

  const rawDays: {
    day: number;
    theme: string;
    stops: { place_id: string; start: string; note_en: string }[];
  }[] = [];

  let currentAnchorLat = startCoords.lat;
  let currentAnchorLng = startCoords.lng;

  for (let dayNum = 1; dayNum <= request.days; dayNum++) {
    const dayStops: { place_id: string; start: string; note_en: string }[] = [];
    const countForToday = Math.min(stopsPerDay, Math.max(limits.min, unusedPlaces.length));

    // Sort unused places by distance to current anchor
    unusedPlaces.sort((a, b) => {
      const distA = calculateHaversineKm(currentAnchorLat, currentAnchorLng, a.lat, a.lng);
      const distB = calculateHaversineKm(currentAnchorLat, currentAnchorLng, b.lat, b.lng);
      return distA - distB;
    });

    let dayClock = "09:00";
    let lastPlace: Place | null = null;
    const dayRegions: string[] = [];

    for (let s = 0; s < countForToday && unusedPlaces.length > 0; s++) {
      let chosenIndex = 0;

      // Keep each day geographically sensible: after the first stop, only consider
      // places within MAX_LEG_KM road distance of the previous stop and that still
      // finish before DAY_END. If nothing qualifies, end the day early.
      if (lastPlace) {
        const lp: Place = lastPlace;
        const eligible = unusedPlaces.findIndex((p) => {
          const roadKm = estimateRoadDistanceKm(lp.lat, lp.lng, p.lat, p.lng);
          if (roadKm > MAX_LEG_KM) return false;
          const [h, m] = addMinutesToTime(
            dayClock,
            estimateTravelTimeMin(roadKm) + p.duration_min
          )
            .split(":")
            .map(Number);
          return h * 60 + m <= DAY_END_MIN;
        });
        if (eligible === -1) break;
        chosenIndex = eligible;
      }

      // Around lunch (12:30 to 14:00), prefer a meal stop if available within the nearby candidates
      const [currH, currM] = dayClock.split(":").map(Number);
      const clockMin = currH * 60 + currM;
      if (clockMin >= 12 * 60 && clockMin <= 14 * 60) {
        const mealIndex = unusedPlaces.findIndex(
          (p, idx) =>
            idx < 6 &&
            (p.is_meal || p.categories.includes("food")) &&
            !seenPlaceIds.has(p.id) &&
            (!lastPlace ||
              estimateRoadDistanceKm(lastPlace.lat, lastPlace.lng, p.lat, p.lng) <= MAX_LEG_KM)
        );
        if (mealIndex !== -1) {
          chosenIndex = mealIndex;
        }
      }

      // Purge any seen places from chosen index
      while (unusedPlaces.length > 0 && seenPlaceIds.has(unusedPlaces[chosenIndex]?.id)) {
        unusedPlaces.splice(chosenIndex, 1);
        if (chosenIndex >= unusedPlaces.length) chosenIndex = 0;
      }
      if (unusedPlaces.length === 0) break;

      const place = unusedPlaces.splice(chosenIndex, 1)[0];
      if (!place || seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);

      dayStops.push({
        place_id: place.id,
        start: dayClock,
        note_en: place.desc_en,
      });

      if (!dayRegions.includes(place.region)) {
        dayRegions.push(place.region);
      }

      // Compute travel time to advance the clock
      if (lastPlace) {
        const roadKm = estimateRoadDistanceKm(lastPlace.lat, lastPlace.lng, place.lat, place.lng);
        const travelMin = estimateTravelTimeMin(roadKm);
        dayClock = addMinutesToTime(dayClock, travelMin);
      }

      // Add visit duration
      dayClock = addMinutesToTime(dayClock, place.duration_min);
      lastPlace = place;
    }

    if (lastPlace) {
      currentAnchorLat = lastPlace.lat;
      currentAnchorLng = lastPlace.lng;
    }

    const regionTitle = dayRegions.join(" & ") || request.start_city;
    rawDays.push({
      day: dayNum,
      theme: `${regionTitle} Highlights`,
      stops: dayStops,
    });
  }

  const rawOutput: AIModelOutput = {
    title: `${request.days} Days ${request.interests.join(" & ")} Journey`,
    summary: `Curated ${request.pace} route covering ${request.start_city} and premier Karnataka cultural sights.`,
    days: rawDays,
    tips: [
      "Start mornings by 08:30 to enjoy peaceful monuments before peak tourist traffic.",
      "Dress respectfully when entering active sanctums and historic temples.",
      "Sample local Karnataka breakfast specialities including Tatte Idli and Benne Dosa.",
    ],
  };

  return enrichPlan(rawOutput, request, "planner");
}
