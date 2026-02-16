import provincesJson from "@/data/provinces.json";
import { haversineDistance, calculateDeliveryFee } from "@/lib/distance";

const provinces =
  provincesJson as Record<string, { latitude: number; longitude: number }>;

const geocodeCache = new Map<string, { latitude: number; longitude: number } | null>();

async function geocodeProvince(provinceName: string) {
  const key = provinceName.toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
  try {
    const q = encodeURIComponent(`${provinceName}, Thailand`);
    const url = `https://nominatim.openstreetmap.org/search.php?q=${q}&format=jsonv2&limit=1`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "ICN_FREEZE/1.0 (contact)" },
    });
    const data = await resp.json();
    if (Array.isArray(data) && data.length > 0) {
      const coords = { latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) };
      geocodeCache.set(key, coords);
      return coords;
    }
  } catch (e) {
    console.warn("geocodeProvince error", e);
  }
  geocodeCache.set(key, null);
  return null;
}

export async function ensureCoords(obj: any, provinceName?: string) {
  if (obj && typeof obj.latitude === "number" && typeof obj.longitude === "number") return obj;
  if (!provinceName) return null;
  const keyExact = Object.keys(provinces).find(k => k.toLowerCase() === provinceName.toLowerCase());
  if (keyExact) return provinces[keyExact];
  return await geocodeProvince(provinceName);
}

export function computeDistanceAndFee(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const distanceKm = haversineDistance(a.latitude, a.longitude, b.latitude, b.longitude);
  const fee = calculateDeliveryFee(distanceKm);
  return { distanceKm, fee };
}

export default {
  ensureCoords,
  computeDistanceAndFee,
};
