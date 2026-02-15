import type { Venue, VenueType, UserLocation } from "../types/venue";

// Multiple endpoints - Overpass can time out; try fallbacks
const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];

const FETCH_TIMEOUT_MS = 20000; // 20s per attempt

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: {
    name?: string;
    amenity?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
    opening_hours?: string;
    website?: string;
    phone?: string;
    [key: string]: string | undefined;
  };
}

function buildQuery(
  lat: number,
  lng: number,
  radius: number,
  showPubs: boolean,
  showBars: boolean
): string {
  const amenities: string[] = [];
  if (showPubs) amenities.push("pub");
  if (showBars) amenities.push("bar");

  if (amenities.length === 0) return "";

  // Build separate queries for each amenity type - include nodes, ways, and relations
  const nodeQueries = amenities
    .map((a) => `node["amenity"="${a}"](around:${radius},${lat},${lng});`)
    .join("\n      ");
  const wayQueries = amenities
    .map((a) => `way["amenity"="${a}"](around:${radius},${lat},${lng});`)
    .join("\n      ");
  const relationQueries = amenities
    .map((a) => `relation["amenity"="${a}"](around:${radius},${lat},${lng});`)
    .join("\n      ");

  // Increased timeout to 30s for larger queries
  const query = `
    [out:json][timeout:30];
    (
      ${nodeQueries}
      ${wayQueries}
      ${relationQueries}
    );
    out center;
  `;

  return query;
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatAddress(tags: OverpassElement["tags"]): string | undefined {
  if (!tags) return undefined;

  const parts: string[] = [];
  if (tags["addr:housenumber"]) parts.push(tags["addr:housenumber"]);
  if (tags["addr:street"]) parts.push(tags["addr:street"]);
  if (tags["addr:city"]) parts.push(tags["addr:city"]);

  return parts.length > 0 ? parts.join(", ") : undefined;
}

export async function fetchNearbyVenues(
  userLocation: UserLocation,
  radius: number,
  showPubs: boolean,
  showBars: boolean
): Promise<Venue[]> {
  console.log("[PINTS] fetchNearbyVenues called with:", {
    lat: userLocation.lat,
    lng: userLocation.lng,
    radius,
    showPubs,
    showBars,
  });

  if (!showPubs && !showBars) {
    console.log("[PINTS] No venue types selected, returning empty");
    return [];
  }

  const query = buildQuery(
    userLocation.lat,
    userLocation.lng,
    radius,
    showPubs,
    showBars
  );

  if (!query) {
    console.log("[PINTS] Empty query, returning empty");
    return [];
  }

  console.log("[PINTS] Overpass query:", query);

  let lastError: Error | null = null;

  for (const apiUrl of OVERPASS_ENDPOINTS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const response = await fetch(apiUrl, {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log("[PINTS] Overpass response from", apiUrl, ":", response.status);

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const elements: OverpassElement[] = data.elements || [];

      console.log("[PINTS] Raw elements from Overpass:", elements.length);

      const venues: Venue[] = elements
        .map((element): Venue | null => {
          const lat = element.lat ?? element.center?.lat;
          const lon = element.lon ?? element.center?.lon;

          if (!lat || !lon) return null;

          const venueType: VenueType =
            element.tags?.amenity === "bar" ? "bar" : "pub";

          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            lat,
            lon
          );

          const venue: Venue = {
            id: `${element.type}-${element.id}`,
            name: element.tags?.name || "Unnamed spot",
            type: venueType,
            lat,
            lng: lon,
            distance,
            address: formatAddress(element.tags),
            openingHours: element.tags?.opening_hours,
            website: element.tags?.website,
            phone: element.tags?.phone,
            state: "default",
          };

          return venue;
        })
        .filter((venue): venue is Venue => venue !== null)
        .sort((a, b) => a.distance - b.distance);

      console.log("[PINTS] Parsed venues:", venues.length);
      if (venues.length > 0) {
        console.log("[PINTS] First venue:", venues[0]);
      }

      return venues;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn("[PINTS] Overpass attempt failed:", apiUrl, lastError.message);
    }
  }

  console.error("[PINTS] All Overpass endpoints failed");
  throw lastError ?? new Error("Overpass API: all endpoints failed");
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Build an encoded query string from venue info for Google Maps.
 * Prefers name + address, falls back to coordinates.
 */
function buildGoogleMapsQuery(venue: {
  name?: string;
  address?: string;
  lat: number;
  lng: number;
}): string {
  const parts: string[] = [];

  // Use venue name if available and not "Unnamed spot"
  if (venue.name && venue.name !== "Unnamed spot") {
    parts.push(venue.name);
  }

  // Add address if available
  if (venue.address) {
    parts.push(venue.address);
  }

  // If we have at least a name, use that query
  if (parts.length > 0) {
    return encodeURIComponent(parts.join(", "));
  }

  // Fallback to coordinates
  return `${venue.lat},${venue.lng}`;
}

export function getGoogleMapsPreviewUrl(venue: {
  name?: string;
  address?: string;
  lat: number;
  lng: number;
}): string {
  const query = buildGoogleMapsQuery(venue);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getGoogleMapsDirectionsUrl(venue: {
  name?: string;
  address?: string;
  lat: number;
  lng: number;
}): string {
  const query = buildGoogleMapsQuery(venue);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

// Legacy function for backwards compatibility
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
