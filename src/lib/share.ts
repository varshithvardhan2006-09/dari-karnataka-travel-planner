import placesData from "../../data/places.json";
import phrasesData from "../../data/phrases.json";
import { Place, Phrase, Plan } from "./schema";

const placesMap = new Map<string, Place>((placesData as Place[]).map((p) => [p.id, p]));
const phrasesMap = new Map<string, Phrase>((phrasesData as Phrase[]).map((ph) => [ph.id, ph]));

/**
 * Rebuilds a plan that arrived in a shared link against the curated dataset.
 *
 * A share link is untrusted: it could carry made-up place names, fees or source
 * links. Only the place IDs, times, notes and travel legs are kept from the link;
 * every place and phrase is replaced with the dataset's own record. Returns null
 * when the link refers to a place that is not in the dataset.
 */
export function rehydrateSharedPlan(plan: Plan): Plan | null {
  const days = [];
  for (const day of plan.days) {
    const stops = [];
    for (const stop of day.stops) {
      const place = placesMap.get(stop.place_id);
      if (!place) return null;
      const phrases = (place.phrase_ids || [])
        .map((id) => phrasesMap.get(id))
        .filter((ph): ph is Phrase => Boolean(ph));
      stops.push({ ...stop, duration_min: place.duration_min, place, phrases });
    }
    days.push({ ...day, stops });
  }
  return { ...plan, days };
}
