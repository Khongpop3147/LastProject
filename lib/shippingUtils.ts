import { getDistanceTier } from "./distance";

/**
 * Calculate delivery date based on shipping method and distance
 * Delivery operates 7 days a week (no weekends off)
 * @param shippingMethod - 'standard' or 'express'
 * @param distanceKm - Distance in kilometers
 * @returns Formatted Thai date string
 */
export function calculateDeliveryDate(
  shippingMethod: "standard" | "express",
  distanceKm: number = 0
): string {
  const today = new Date();
  const { tier } = getDistanceTier(distanceKm);

  let daysToAdd = 0;

  if (shippingMethod === "express") {
    // Express: 1-2 days based on distance
    daysToAdd = tier === "near" ? 1 : 2;
  } else {
    // Standard: 5-7 days based on distance
    if (tier === "near") {
      daysToAdd = 5;
    } else if (tier === "medium") {
      daysToAdd = 6;
    } else {
      daysToAdd = 7;
    }
  }

  // Add days (delivery operates 7 days a week, no weekends off)
  const deliveryDate = new Date(today);
  deliveryDate.setDate(deliveryDate.getDate() + daysToAdd);

  return formatThaiDate(deliveryDate);
}

/**
 * Format date to Thai format with day of week
 * Example: "วันจันทร์ที่ 25 เมษายน 2568"
 */
export function formatThaiDate(date: Date): string {
  const thaiDays = [
    "วันอาทิตย์",
    "วันจันทร์",
    "วันอังคาร",
    "วันพุธ",
    "วันพฤหัสบดี",
    "วันศุกร์",
    "วันเสาร์",
  ];

  const thaiMonths = [
    "มกราคม",
    "กุมภาพันธ์",
    "มีนาคม",
    "เมษายน",
    "พฤษภาคม",
    "มิถุนายน",
    "กรกฎาคม",
    "สิงหาคม",
    "กันยายน",
    "ตุลาคม",
    "พฤศจิกายน",
    "ธันวาคม",
  ];

  const dayOfWeek = thaiDays[date.getDay()];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543; // Convert to Buddhist Era

  return `${dayOfWeek}ที่ ${day} ${month} ${year}`;
}

/**
 * Calculate estimated delivery date range
 * @param shippingMethod - 'standard' or 'express'
 * @param distanceKm - Distance in kilometers
 * @returns Object with min and max delivery dates
 */
export function calculateDeliveryDateRange(
  shippingMethod: "standard" | "express",
  distanceKm: number = 0
): { minDate: string; maxDate: string; days: string } {
  const today = new Date();
  const { tier } = getDistanceTier(distanceKm);

  let minDays = 0;
  let maxDays = 0;

  if (shippingMethod === "express") {
    minDays = 1;
    maxDays = tier === "near" ? 1 : 2;
  } else {
    if (tier === "near") {
      minDays = 5;
      maxDays = 5;
    } else if (tier === "medium") {
      minDays = 6;
      maxDays = 6;
    } else {
      minDays = 7;
      maxDays = 7;
    }
  }

  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + minDays);

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);

  const daysText = minDays === maxDays ? `${minDays} วัน` : `${minDays}-${maxDays} วัน`;

  return {
    minDate: formatThaiDate(minDate),
    maxDate: formatThaiDate(maxDate),
    days: daysText,
  };
}
