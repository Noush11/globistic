import type { DesignState, PrintAreaKey } from "./design";

export interface ProductVariantDTO {
  id: string;
  color: string;
  colorHex: string;
  size: string;
  sku: string;
  stock: number;
  priceModifier: number;
  mockupImage: string | null;
}

export interface ProductDTO {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  basePrice: number;
  printAreaPrice: number;
  active: boolean;
  images: string[];
  variants: ProductVariantDTO[];
  colors: { color: string; colorHex: string; mockupImage: string | null }[];
  sizes: string[];
}

export interface CartLineDesign {
  state: DesignState;
  previews?: Partial<Record<PrintAreaKey, string>>;
  artworkUrls?: string[];
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: string;
  issues?: { path: string; message: string }[];
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
