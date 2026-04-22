import type { Memory } from "@/types/memory";

export type LocationFilterValue = {
  name: string;
  lat: number | null;
  lng: number | null;
  placeId: string | null;
};

const normalize = (value: string) => value.trim().toLowerCase();

const toRadians = (degrees: number) => degrees * (Math.PI / 180);

const distanceKm = (aLat: number, aLng: number, bLat: number, bLng: number) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const haversine =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
};

export const matchesLocationFilter = (memory: Memory, filter: LocationFilterValue) => {
  const filterName = normalize(filter.name);
  if (!filterName) return true;

  if (filter.placeId && memory.locationPlaceId === filter.placeId) return true;

  if (
    typeof filter.lat === "number" &&
    typeof filter.lng === "number" &&
    typeof memory.locationLat === "number" &&
    typeof memory.locationLng === "number" &&
    distanceKm(filter.lat, filter.lng, memory.locationLat, memory.locationLng) <= 50
  ) {
    return true;
  }

  const memoryLocationName = normalize(memory.locationName ?? "");
  if (!memoryLocationName) return false;
  if (memoryLocationName.includes(filterName) || filterName.includes(memoryLocationName)) return true;

  const primaryName = filterName.split(",")[0]?.trim();
  return Boolean(primaryName && primaryName.length >= 3 && memoryLocationName.includes(primaryName));
};
