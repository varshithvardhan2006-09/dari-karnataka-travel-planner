import placesData from "../../data/places.json";
import phrasesData from "../../data/phrases.json";
import {
  AIModelOutput,
  PlanRequest,
  Plan,
  Place,
  Phrase,
  Stop,
  DayPlan,
} from "./schema";
import { computeTravelLeg, addMinutesToTime, roundTimeTo5Min } from "./geo";
import { calculateTripCost, PEOPLE_COUNT_MAP } from "./cost";
import { getStartCityCoordinates } from "./candidates";

const placesMap = new Map<string, Place>(
  (placesData as Place[]).map((p) => [p.id, p])
);

const phrasesMap = new Map<string, Phrase>(
  (phrasesData as Phrase[]).map((ph) => [ph.id, ph])
);

/**
 * Enriches raw model or planner schedule with places data, phrases, geo travel legs, and deterministic costs.
 * Accurately accounts for departure hub legs, inter-day transfers, and user preferences.
 */
export function enrichPlan(
  rawPlan: AIModelOutput,
  request: PlanRequest,
  source: "ai-groq" | "ai-gemini" | "planner" | "sample" = "planner"
): Plan {
  const people = (request.people_count && request.people_count >= 1 && request.people_count <= 10)
    ? request.people_count
    : PEOPLE_COUNT_MAP[request.travellers] || 2;
  const allVisitedPlaces: Place[] = [];
  let totalTripKm = 0;

  const startCoords = getStartCityCoordinates(request.start_city);
  let previousDayLastPlace: Place | null = null;

  const days: DayPlan[] = rawPlan.days.map((dayItem, dayIdx) => {
    let dayTravelTotalMin = 0;
    const enrichedStops: Stop[] = [];

    let currentClock = "09:00";

    for (let i = 0; i < dayItem.stops.length; i++) {
      const stopRef = dayItem.stops[i];
      const place = placesMap.get(stopRef.place_id);

      if (!place) {
        throw new Error(`Unknown place_id in plan output: "${stopRef.place_id}"`);
      }

      allVisitedPlaces.push(place);

      // Collect phrases for this stop
      const phrases: Phrase[] = (place.phrase_ids || [])
        .map((pid) => phrasesMap.get(pid))
        .filter((ph): ph is Phrase => Boolean(ph));

      // Calculate travel from previous stop / starting city
      let travelFromPrev = undefined;
      if (i > 0) {
        const prevPlace = placesMap.get(dayItem.stops[i - 1].place_id);
        if (prevPlace) {
          const leg = computeTravelLeg(
            prevPlace.lat,
            prevPlace.lng,
            place.lat,
            place.lng,
            people
          );
          travelFromPrev = leg;
          dayTravelTotalMin += leg.min;
          totalTripKm += leg.km;

          // Advance clock by travel time
          currentClock = addMinutesToTime(currentClock, leg.min);
        }
      } else {
        // Stop 0 of the day: account for departure hub or inter-day leg
        if (dayIdx === 0) {
          // Transfer from starting city
          const hubLeg = computeTravelLeg(
            startCoords.lat,
            startCoords.lng,
            place.lat,
            place.lng,
            people
          );
          totalTripKm += hubLeg.km;
        } else if (previousDayLastPlace) {
          // Transfer from previous overnight destination
          const interDayLeg = computeTravelLeg(
            previousDayLastPlace.lat,
            previousDayLastPlace.lng,
            place.lat,
            place.lng,
            people
          );
          totalTripKm += interDayLeg.km;
        }
      }

      currentClock = roundTimeTo5Min(currentClock);

      // Format start time - verify no overlap with previous stop plus travel
      let startTime = currentClock;
      if (stopRef.start && stopRef.start.length === 5) {
        const roundedStart = roundTimeTo5Min(stopRef.start);
        const [reqH, reqM] = roundedStart.split(":").map(Number);
        const [curH, curM] = currentClock.split(":").map(Number);
        if (reqH * 60 + reqM >= curH * 60 + curM) {
          startTime = roundedStart;
        }
      }

      // Note text
      const noteEn = stopRef.note_en || place.desc_en;

      enrichedStops.push({
        place_id: place.id,
        start: startTime,
        duration_min: place.duration_min,
        note_en: noteEn,
        travel_from_prev: travelFromPrev,
        place,
        phrases,
      });

      // Advance clock by stop visit duration rounded to 5 mins
      currentClock = roundTimeTo5Min(addMinutesToTime(startTime, place.duration_min));
    }

    if (enrichedStops.length > 0) {
      previousDayLastPlace = enrichedStops[enrichedStops.length - 1].place;
    }

    return {
      day: dayItem.day,
      theme: dayItem.theme || `Day ${dayItem.day} Exploration`,
      stops: enrichedStops,
      travel_total_min: dayTravelTotalMin,
    };
  });

  // Calculate comprehensive cost
  const cost = calculateTripCost({
    days: request.days,
    budget: request.budget,
    travellers: request.travellers,
    totalKm: totalTripKm,
    visitedPlaces: allVisitedPlaces,
    peopleCount: request.people_count,
    transportPreference: request.transport_mode,
  });

  return {
    title: rawPlan.title || `${request.days} Days Karnataka Itinerary`,
    summary: rawPlan.summary || `A personalized ${request.pace} journey through Karnataka tailored to your interests.`,
    days,
    cost,
    tips: rawPlan.tips && rawPlan.tips.length > 0
      ? rawPlan.tips
      : [
          "Start your days early around 08:30 to beat mid-day heat and large tourist buses.",
          "Keep small currency denominations ready for parking and traditional market stalls.",
          "Respect dress guidelines at sacred temple sanctums (shoulders and knees covered).",
        ],
    source,
  };
}
