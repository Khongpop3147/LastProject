export function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  inMiles = false
): number {
  const R = inMiles ? 3958.8 : 6371; // Radius of Earth in miles or kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getDistanceTier(distanceKm: number) {
  // thresholds updated per request:
  // - near: 0 - 150 km => +0 (no surcharge)
  // - medium: 150 - 400 km => +10
  // - far: >400 km => +20
  const d = Math.max(0, distanceKm);
  if (d <= 150) return { tier: "near", surcharge: 0 };
  if (d <= 400) return { tier: "medium", surcharge: 10 };
  return { tier: "far", surcharge: 20 };
}

export function calculateDeliveryFee(distanceKm: number, opts?: { base?: number; perKm?: number }) {
  // Simple pricing: base + flat surcharge by distance tier (no per-km)
  // base default: 20 THB
  const base = opts?.base ?? 20;
  const { surcharge } = getDistanceTier(Math.max(0, distanceKm));
  return base + surcharge;
}

export default haversineDistance;
