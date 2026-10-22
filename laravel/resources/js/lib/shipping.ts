import type { ProcessingDays, ShippingRate } from "@/types/admin";

// What a rate costs for an order subtotal. Mirrors ShippingRate::costFor().
export function rateCost(rate: ShippingRate, subtotal: number): number {
  return rate.freeOver !== null && rate.freeOver !== undefined && subtotal >= rate.freeOver ? 0 : rate.price;
}

// "3–7 days", "5 days" or "" when unknown.
export function dayRange(min?: number | null, max?: number | null): string {
  if (min == null && max == null) return "";
  if (min == null || max == null || min === max) return `${min ?? max} ${(min ?? max) === 1 ? "day" : "days"}`;
  return `${min}–${max} days`;
}

// Estimated delivery once processing time is added to transit time.
export function deliveryEstimate(rate: ShippingRate, processing: ProcessingDays): string {
  if (rate.minDays == null && rate.maxDays == null) return "";
  const min = processing.min + (rate.minDays ?? rate.maxDays ?? 0);
  const max = processing.max + (rate.maxDays ?? rate.minDays ?? 0);
  return `Arrives in ${dayRange(min, max)}`;
}
