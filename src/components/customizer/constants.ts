import type { PrintAreaKey } from "@/types/design";

// The print box defines, as a percentage of the garment mockup, where artwork
// may be placed for each area. Layer coordinates are relative to this box.
export const PRINT_BOX: Record<PrintAreaKey, { left: number; top: number; width: number; height: number }> = {
  FRONT: { left: 30, top: 26, width: 40, height: 46 },
  BACK: { left: 30, top: 22, width: 40, height: 50 },
  LEFT_SLEEVE: { left: 8, top: 30, width: 16, height: 16 },
  RIGHT_SLEEVE: { left: 76, top: 30, width: 16, height: 16 }
};

// Fallback garment silhouette images per area (used when a variant has no mockup).
export const DEFAULT_MOCKUP =
  "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=900&q=80";
