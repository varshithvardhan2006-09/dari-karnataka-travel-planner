/**
 * Shared Google Maps URL generation utility for Dari Karnataka Travel Planner.
 * Generates verified coordinate-based links and safe contextual fallback search queries.
 */

export interface MapLocationTarget {
  name_en?: string;
  name_kn?: string;
  city?: string;
  lat?: number;
  lng?: number;
  address?: string;
}

/**
 * Returns a Google Maps Search URL.
 * Prefers exact verified coordinates (lat,lng) when valid,
 * otherwise falls back to contextual name + city + Karnataka query.
 */
export function getGoogleMapsSearchUrl(target: MapLocationTarget): string {
  if (
    typeof target.lat === "number" &&
    !isNaN(target.lat) &&
    typeof target.lng === "number" &&
    !isNaN(target.lng) &&
    target.lat !== 0 &&
    target.lng !== 0
  ) {
    return `https://www.google.com/maps/search/?api=1&query=${target.lat},${target.lng}`;
  }

  const queryParts = [target.name_en, target.city, "Karnataka"].filter(Boolean);
  const query = queryParts.join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Returns a Google Maps Directions URL navigating to the destination.
 */
export function getGoogleMapsDirectionsUrl(
  destination: MapLocationTarget,
  origin?: string
): string {
  const destParam =
    typeof destination.lat === "number" &&
    !isNaN(destination.lat) &&
    typeof destination.lng === "number" &&
    !isNaN(destination.lng) &&
    destination.lat !== 0 &&
    destination.lng !== 0
      ? `${destination.lat},${destination.lng}`
      : encodeURIComponent([destination.name_en, destination.city, "Karnataka"].filter(Boolean).join(", "));

  if (origin && origin.trim()) {
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin.trim())}&destination=${destParam}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destParam}&travelmode=driving`;
}
