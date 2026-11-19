import placesData from "../../data/places.json";
import phrasesData from "../../data/phrases.json";
import { Place, Phrase, Plan, BudgetFit, Travellers } from "./schema";
import { computeTravelLeg } from "./geo";
import { calculateTripCost } from "./cost";
import { getStartCityCoordinates } from "./candidates";

const placesMap = new Map<string, Place>((placesData as Place[]).map((p) => [p.id, p]));
const phrasesMap = new Map<string, Phrase>((phrasesData as Phrase[]).map((ph) => [ph.id, ph]));

const BUDGETS: BudgetFit[] = ["budget", "mid", "premium"];
const TRAVELLERS: Travellers[] = ["solo", "couple", "family", "friends"];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

const clip = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/**
 * Rebuilds a plan that arrived in a shared link against the curated dataset.
 *
 * A share link is untrusted: it could carry made-up place names, fees, costs
 * or arbitrarily long text. Only the place order, start times, short notes and
 * chosen travel modes are kept from the link. Places and phrases come from the
 * dataset, travel legs and the cost are recalculated, and text is trimmed.
 * Returns null when the link refers to an unknown place or is malformed.
 */
export function rehydrateSharedPlan(plan: Plan): Plan | null {
  if (plan.days.length < 1 || plan.days.length > 7) return null;
  if (plan.days.some((d, i) => d.day !== i + 1 || d.stops.length === 0 || d.stops.length > 8)) return null;

  const trip = plan.trip;
  const people = Math.min(10, Math.max(1, Math.round(plan.cost.people || 2)));
  const start = getStartCityCoordinates(trip?.start_city || "Bengaluru");
  let previousDayLast: Place | null = null;
  let totalKm = 0;
  const visited: Place[] = [];

  const days = [];
  for (const day of plan.days) {
    const stops = [];
    let travelMin = 0;
    for (let i = 0; i < day.stops.length; i++) {
      const stop = day.stops[i];
      const place = placesMap.get(stop.place_id);
      if (!place) return null;
      visited.push(place);

      const from: { lat: number; lng: number } | null =
        i > 0 ? placesMap.get(day.stops[i - 1].place_id)! : day.day === 1 ? start : previousDayLast;
      const leg = from ? computeTravelLeg(from.lat, from.lng, place.lat, place.lng, people) : undefined;
      if (leg) {
        if (i > 0 && stop.travel_from_prev?.mode) leg.mode = stop.travel_from_prev.mode;
        travelMin += leg.min;
        totalKm += leg.km;
      }

      const phrases = (place.phrase_ids || [])
        .map((id) => phrasesMap.get(id))
        .filter((ph): ph is Phrase => Boolean(ph));
      stops.push({
        place_id: place.id,
        start: TIME.test(stop.start) ? stop.start : "09:00",
        duration_min: place.duration_min,
        note_en: clip(stop.note_en, 200),
        travel_from_prev: leg,
        place,
        phrases,
      });
    }
    previousDayLast = placesMap.get(day.stops[day.stops.length - 1].place_id) ?? previousDayLast;
    days.push({ day: day.day, theme: clip(day.theme, 60), stops, travel_total_min: travelMin });
  }

  // Return leg to the starting city, as when the plan was first built.
  const last = visited[visited.length - 1];
  totalKm += computeTravelLeg(last.lat, last.lng, start.lat, start.lng, people).km;

  const cost = calculateTripCost({
    days: days.length,
    budget: trip && BUDGETS.includes(trip.budget) ? trip.budget : "mid",
    travellers: trip && TRAVELLERS.includes(trip.travellers) ? trip.travellers : "couple",
    totalKm,
    visitedPlaces: visited,
    peopleCount: people,
    transportPreference: trip?.transport_mode,
  });

  return {
    ...plan,
    title: clip(plan.title, 120),
    summary: clip(plan.summary, 400),
    tips: plan.tips.slice(0, 8).map((t) => clip(t, 200)),
    days,
    cost,
  };
}
