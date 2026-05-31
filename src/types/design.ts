// Shape of the customizer state saved to the Design model (`data` JSON).

export type PrintAreaKey = "FRONT" | "BACK" | "LEFT_SLEEVE" | "RIGHT_SLEEVE";

export const PRINT_AREAS: { key: PrintAreaKey; label: string }[] = [
  { key: "FRONT", label: "Front" },
  { key: "BACK", label: "Back" },
  { key: "LEFT_SLEEVE", label: "Left Sleeve" },
  { key: "RIGHT_SLEEVE", label: "Right Sleeve" }
];

export interface BaseLayer {
  id: string;
  type: "image" | "text";
  // Position & size are stored as percentages of the print area box (0-100)
  // so previews scale across screen sizes.
  x: number;
  y: number;
  width: number; // percent of area width
  height: number; // percent of area height
  rotation: number; // degrees
  zIndex: number;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string; // S3 url or data URL
  naturalWidth?: number;
  naturalHeight?: number;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  text: string;
  fontFamily: string;
  fontSize: number; // px at 100% scale
  color: string;
  bold: boolean;
  italic: boolean;
  align: "left" | "center" | "right";
}

export type Layer = ImageLayer | TextLayer;

export type AreaLayers = Record<PrintAreaKey, Layer[]>;

export interface DesignState {
  productId: string;
  productSlug: string;
  color: string;
  size: string;
  variantId?: string;
  areas: AreaLayers;
}

export const FONT_OPTIONS = [
  "Inter",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Bebas Neue",
  "Pacifico",
  "Oswald",
  "Montserrat",
  "Impact"
];

export function emptyAreas(): AreaLayers {
  return { FRONT: [], BACK: [], LEFT_SLEEVE: [], RIGHT_SLEEVE: [] };
}

export function usedPrintAreas(areas: AreaLayers): PrintAreaKey[] {
  return (Object.keys(areas) as PrintAreaKey[]).filter((k) => areas[k].length > 0);
}

export function totalLayerCount(areas: AreaLayers): number {
  return (Object.keys(areas) as PrintAreaKey[]).reduce(
    (sum, k) => sum + areas[k].length,
    0
  );
}
