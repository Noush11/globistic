"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type { DesignState, PrintAreaKey } from "@/types/design";
import { usedPrintAreas, totalLayerCount } from "@/types/design";
import { priceLine } from "@/lib/pricing";

export interface CartItem {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId?: string;
  color: string;
  colorHex?: string;
  size: string;
  quantity: number;
  basePrice: number;
  printAreaPrice: number;
  variantModifier: number;
  printAreas: PrintAreaKey[];
  layerCount: number;
  design: DesignState;
  previews?: Partial<Record<PrintAreaKey, string>>;
  artworkUrls?: string[];
  thumbnail?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id" | "printAreas" | "layerCount">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clear: () => void;
  unitPrice: (item: CartItem) => number;
  lineTotal: (item: CartItem) => number;
  subtotal: () => number;
  count: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const printAreas = usedPrintAreas(item.design.areas);
        const layerCount = totalLayerCount(item.design.areas);
        set((s) => ({
          items: [
            ...s.items,
            { ...item, id: nanoid(), printAreas, layerCount }
          ]
        }));
      },

      removeItem: (id) =>
        set((s) => ({ items: s.items.filter((i) => i.id !== id) })),

      updateQuantity: (id, quantity) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, quantity: Math.max(1, quantity) } : i
          )
        })),

      clear: () => set({ items: [] }),

      unitPrice: (item) =>
        priceLine({
          basePrice: item.basePrice,
          printAreaPrice: item.printAreaPrice,
          variantModifier: item.variantModifier,
          printAreas: item.printAreas,
          layerCount: item.layerCount,
          quantity: item.quantity
        }).unitPrice,

      lineTotal: (item) =>
        priceLine({
          basePrice: item.basePrice,
          printAreaPrice: item.printAreaPrice,
          variantModifier: item.variantModifier,
          printAreas: item.printAreas,
          layerCount: item.layerCount,
          quantity: item.quantity
        }).lineTotal,

      subtotal: () =>
        get().items.reduce((sum, i) => sum + get().lineTotal(i), 0),

      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0)
    }),
    { name: "globistic-cart" }
  )
);
