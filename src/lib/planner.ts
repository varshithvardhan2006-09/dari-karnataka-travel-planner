import placesData from "../../data/places.json";
import { PlanRequest, Plan, Place, AIModelOutput } from "./schema";
import {
  getCandidates,
  calculateHaversineKm,
  getStartCityCoordinates,
  scoreCandidate,
} from "./candidates";
import { enrichPlan } from "./enrich";
import {
  estimateRoadDistanceKm,
  estimateTravelTimeMin,
  addMinutesToTime,
} from "./geo";

const allPlaces = placesData as Place[];
const validPlaceIdSet = new Set(allPlaces.map((p) => p.id));

const MAX_LEG_KM = 90; // about 2 h 15 min by road between two stops on the same day
const DAY_END_MIN = 19 * 60 + 30;

// When a meal place can be visited (arrival time, minutes after midnight).
const MEAL_WINDOWS: Record<string, [number, number]> = {
  breakfast: [7 * 60 + 30, 11 * 60],
  lunch: [11 * 60 + 30, 15 * 60],
  snack: [10 * 60, 18 * 60],
  dinner: [17 * 60 + 30, DAY_END_MIN],
};

function fitsMealTime(place: Place, arrivalMin: number): boolean {
  const window = place.is_meal ? MEAL_WINDOWS[place.is_meal] : undefined;
  return !window || (arrivalMin >= window[0] && arrivalMin <= window[1]);
}

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

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

  (rawPlan.days || []).forEach((dayItem, dayIdx) => {
    // 2. Sequential day numbering check
    if (dayItem.day !== dayIdx + 1) {
      errors.push(
        `Day index ${dayIdx} has invalid day number ${dayItem.day}; expected sequential day ${dayIdx + 1}.`
      );
    }

    // 3. Stop count per day check
    if (
      dayItem.stops.length < limits.min ||
      dayItem.stops.length > limits.max
    ) {
      errors.push(
        `Day ${dayItem.day} has ${dayItem.stops.length} stops; expected between ${limits.min} and ${limits.max} for ${request.pace} pace.`
      );
    }

    let previousPlace: Place | null = null;
    let prevStopStartMin = -1;
    let dayDrivingMin = 0;
    // The schedule as enrichPlan will lay it out: a stop starts at its requested
    // time or when the previous stop and the drive there are done, whichever is later.
    let clockMin = 9 * 60;

    dayItem.stops.forEach((stop, stopIdx) => {
      // 4. Place ID must exist in candidate whitelist (or dataset fallback)
      const allowedSet = candidateSet || validPlaceIdSet;
      if (!allowedSet.has(stop.place_id)) {
        const errorMsg = candidateSet
          ? `Day ${dayItem.day} stop ${stopIdx + 1} has place_id "${stop.place_id}" which is not in the allowed candidate list for this trip.`
          : `Day ${dayItem.day} stop ${stopIdx + 1} has unknown place_id "${stop.place_id}". You may ONLY use IDs from the candidate list.`;
        errors.push(errorMsg);
        return;
      }

      // 5. No duplicate places across the entire trip
      if (seenPlaceIds.has(stop.place_id)) {
        errors.push(
          `Place "${stop.place_id}" is duplicated. Every stop across the entire trip must be unique.`
        );
      }
      seenPlaceIds.add(stop.place_id);

      const place = allPlaces.find((p) => p.id === stop.place_id);
      let travelMin = 0;
      if (place && previousPlace) {
        const roadKm = estimateRoadDistanceKm(
          previousPlace.lat,
          previousPlace.lng,
          place.lat,
          place.lng
        );
        travelMin = estimateTravelTimeMin(roadKm);
        dayDrivingMin += travelMin;
      }
      if (place) previousPlace = place;

      // 6. Start time & scheduling rules
      if (stop.start) {
        const [h, m] = stop.start.split(":").map(Number);
        const startMinutes = h * 60 + m;

        // First stop of the day must start between 08:30 and 10:00
        if (stopIdx === 0) {
          if (startMinutes < 8 * 60 + 30 || startMinutes > 10 * 60) {
            errors.push(
              `Day ${dayItem.day} first stop starts at ${stop.start}; expected start between 08:30 and 10:00.`
            );
          }
        } else {
          // Chronological order check
          if (startMinutes < prevStopStartMin) {
            errors.push(
              `Day ${dayItem.day} stop ${stopIdx + 1} starts at ${stop.start}, which is earlier than previous stop start time.`
            );
          }
        }

        prevStopStartMin = startMinutes;

        // Day must conclude before 19:30, using the real start once earlier
        // stops and travel are accounted for (not just the requested time).
        const durationMin = place?.duration_min ?? 60;
        const effectiveStart = Math.max(startMinutes, clockMin + travelMin);
        const stopEndMin = effectiveStart + durationMin;
        clockMin = stopEndMin;
        if (stopEndMin > DAY_END_MIN) {
          errors.push(
            `Day ${dayItem.day} stop ${stopIdx + 1} ends at ${Math.floor(stopEndMin / 60)}:${String(stopEndMin % 60).padStart(2, "0")}, exceeding the 19:30 evening cutoff.`
          );
        }
      }
    });

    // 7. Max driving limit per day (4 hours = 240 mins)
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
  // For multi-day trips (5-7 days), target limits.min to preserve candidate density
  // across all regions and prevent stop starvation on later days.
  const stopsPerDay = request.days >= 5 ? limits.min : limits.target;

  // Retrieve candidate pool
  let pool = getCandidates(request, allPlaces);
  let broadenedPool = false;

  // If pool is small, backfill with remaining best-scored places
  if (pool.length < request.days * stopsPerDay) {
    broadenedPool = true;
    const poolIds = new Set(pool.map((p) => p.id));
    const extra = allPlaces
      .filter((p) => !poolIds.has(p.id))
      .sort((a, b) => scoreCandidate(b, request) - scoreCandidate(a, request));
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
    const remainingDays = request.days - dayNum + 1;
    const maxEvenStops = Math.max(
      limits.min,
      Math.floor(unusedPlaces.length / remainingDays)
    );
    const targetForDay = Math.min(stopsPerDay, maxEvenStops);
    const countForToday = Math.min(
      targetForDay,
      Math.max(limits.min, unusedPlaces.length)
    );

    // Sort unused places by distance to current anchor
    unusedPlaces.sort((a, b) => {
      const distA = calculateHaversineKm(
        currentAnchorLat,
        currentAnchorLng,
        a.lat,
        a.lng
      );
      const distB = calculateHaversineKm(
        currentAnchorLat,
        currentAnchorLng,
        b.lat,
        b.lng
      );
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
      const clockNow = toMinutes(dayClock);
      if (lastPlace) {
        const lp: Place = lastPlace;
        // Within reach of the previous stop, finished before the day ends, and
        // (for meal places) arriving at the right time of day.
        const fitsDay = (p: Place, maxLeg: number) => {
          const roadKm = estimateRoadDistanceKm(lp.lat, lp.lng, p.lat, p.lng);
          if (roadKm > maxLeg) return false;
          const arrival = clockNow + estimateTravelTimeMin(roadKm);
          return (
            arrival + p.duration_min <= DAY_END_MIN && fitsMealTime(p, arrival)
          );
        };
        let eligible = unusedPlaces.findIndex((p) => fitsDay(p, MAX_LEG_KM));

        // If minimum stops for the day haven't been met, relax distance threshold up to 160km
        if (eligible === -1 && dayStops.length < limits.min) {
          eligible = unusedPlaces.findIndex((p) => fitsDay(p, 160));
        }

        if (eligible === -1) break;
        chosenIndex = eligible;
      } else {
        // First stop of the day: skip meal places that do not suit the morning.
        const firstFit = unusedPlaces.findIndex((p) =>
          fitsMealTime(p, clockNow)
        );
        chosenIndex = firstFit === -1 ? 0 : firstFit;
      }

      // Around lunch (12:00 to 14:00), prefer a nearby food stop that suits lunchtime
      if (clockNow >= 12 * 60 && clockNow <= 14 * 60) {
        const mealIndex = unusedPlaces.findIndex((p, idx) => {
          if (idx >= 6 || seenPlaceIds.has(p.id)) return false;
          if (!p.is_meal && !p.categories.includes("food")) return false;
          const roadKm = lastPlace
            ? estimateRoadDistanceKm(lastPlace.lat, lastPlace.lng, p.lat, p.lng)
            : 0;
          if (roadKm > MAX_LEG_KM) return false;
          const arrival = clockNow + estimateTravelTimeMin(roadKm);
          return (
            arrival + p.duration_min <= DAY_END_MIN && fitsMealTime(p, arrival)
          );
        });
        if (mealIndex !== -1) {
          chosenIndex = mealIndex;
        }
      }

      // Purge any seen places from chosen index
      while (
        unusedPlaces.length > 0 &&
        seenPlaceIds.has(unusedPlaces[chosenIndex]?.id)
      ) {
        unusedPlaces.splice(chosenIndex, 1);
        if (chosenIndex >= unusedPlaces.length) chosenIndex = 0;
      }
      if (unusedPlaces.length === 0) break;

      const place = unusedPlaces.splice(chosenIndex, 1)[0];
      if (!place || seenPlaceIds.has(place.id)) continue;
      seenPlaceIds.add(place.id);

      // Advance clock by travel time from previous stop BEFORE recording stop arrival
      if (lastPlace) {
        const roadKm = estimateRoadDistanceKm(
          lastPlace.lat,
          lastPlace.lng,
          place.lat,
          place.lng
        );
        const travelMin = estimateTravelTimeMin(roadKm);
        dayClock = addMinutesToTime(dayClock, travelMin);
      }

      dayStops.push({
        place_id: place.id,
        start: dayClock,
        note_en: place.desc_en,
      });

      if (!dayRegions.includes(place.region)) {
        dayRegions.push(place.region);
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

  const tips = [
    "Start mornings by 08:30 to enjoy peaceful monuments before peak tourist traffic.",
    "Dress respectfully when entering active sanctums and historic temples.",
    "Sample local Karnataka breakfast specialities including Tatte Idli and Benne Dosa.",
  ];

  if (!startCoords.isRecognized) {
    tips.push(
      `Note: Starting location "${request.start_city}" was mapped to Karnataka's central hub (${startCoords.resolvedCity}) for route clustering.`
    );
  }

  if (broadenedPool) {
    tips.push(
      "Note: Route selections were broadened with premier Karnataka highlights to complete a balanced multi-day schedule."
    );
  }

  const rawOutput: AIModelOutput = {
    title: `${request.days}-Day ${request.interests
      .map((i) => i.charAt(0).toUpperCase() + i.slice(1))
      .join(" & ")} Journey`,
    summary: `Curated ${request.pace} route covering ${request.start_city} and premier Karnataka cultural sights.`,
    days: rawDays,
    tips,
  };

  return enrichPlan(rawOutput, request, "planner");
}
