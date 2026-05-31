import { round2 } from "./utils";
import type { PrintArea } from "@prisma/client";

// ─── Pricing engine ────────────────────────────────────────────
// Price is derived from: base garment price, number of print areas used,
// design complexity (number of layers / image vs text), and quantity.
// Bulk discounts apply automatically as quantity grows.

export const SHIPPING_RATES = {
  STANDARD: 5.99,
  EXPRESS: 14.99
} as const;

export const TAX_RATE = 0.0; // configure per jurisdiction; 0 by default

export interface LinePricingInput {
  basePrice: number;
  printAreaPrice: number; // surcharge per used print area
  variantModifier?: number; // e.g. 2XL surcharge
  printAreas: PrintArea[]; // which areas have artwork
  // complexity: total number of design layers across all areas
  layerCount?: number;
  quantity: number;
}

export interface LinePricing {
  unitPrice: number;
  lineTotal: number;
  breakdown: {
    base: number;
    printAreas: number;
    complexity: number;
    variant: number;
    bulkDiscountPerUnit: number;
  };
}

// Bulk discount tiers (percentage off the per-unit price).
function bulkDiscountRate(quantity: number): number {
  if (quantity >= 100) return 0.25;
  if (quantity >= 50) return 0.2;
  if (quantity >= 25) return 0.15;
  if (quantity >= 10) return 0.1;
  if (quantity >= 5) return 0.05;
  return 0;
}

// Complexity surcharge: small fee for designs with many layers (extra
// processing). First layer per area is free; additional layers add a little.
const COMPLEXITY_PER_EXTRA_LAYER = 1.5;

export function priceLine(input: LinePricingInput): LinePricing {
  const base = input.basePrice;
  const variant = input.variantModifier ?? 0;
  const printAreas = input.printAreas.length * input.printAreaPrice;

  const usedAreas = Math.max(1, input.printAreas.length);
  const extraLayers = Math.max(0, (input.layerCount ?? 0) - usedAreas);
  const complexity = extraLayers * COMPLEXITY_PER_EXTRA_LAYER;

  const grossUnit = base + variant + printAreas + complexity;
  const discountRate = bulkDiscountRate(input.quantity);
  const bulkDiscountPerUnit = round2(grossUnit * discountRate);
  const unitPrice = round2(grossUnit - bulkDiscountPerUnit);
  const lineTotal = round2(unitPrice * input.quantity);

  return {
    unitPrice,
    lineTotal,
    breakdown: {
      base,
      printAreas: round2(printAreas),
      complexity: round2(complexity),
      variant,
      bulkDiscountPerUnit
    }
  };
}

export interface CartTotalsInput {
  lineTotals: number[];
  shippingMethod: keyof typeof SHIPPING_RATES;
  coupon?: { type: "PERCENTAGE" | "FIXED"; value: number; minSubtotal: number } | null;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  taxAmount: number;
  total: number;
}

export function computeCartTotals(input: CartTotalsInput): CartTotals {
  const subtotal = round2(input.lineTotals.reduce((a, b) => a + b, 0));

  let discountAmount = 0;
  if (input.coupon && subtotal >= input.coupon.minSubtotal) {
    discountAmount =
      input.coupon.type === "PERCENTAGE"
        ? round2((subtotal * input.coupon.value) / 100)
        : round2(Math.min(input.coupon.value, subtotal));
  }

  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const shippingAmount = SHIPPING_RATES[input.shippingMethod] ?? SHIPPING_RATES.STANDARD;
  const taxAmount = round2(discountedSubtotal * TAX_RATE);
  const total = round2(discountedSubtotal + shippingAmount + taxAmount);

  return { subtotal, discountAmount, shippingAmount, taxAmount, total };
}
