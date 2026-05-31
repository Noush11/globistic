import { prisma } from "./prisma";
import { toNumber } from "./utils";
import type { ProductDTO } from "@/types/api";
import type { Prisma, ProductCategory } from "@prisma/client";

type ProductWithVariants = Prisma.ProductGetPayload<{ include: { variants: true } }>;

export function serializeProduct(p: ProductWithVariants): ProductDTO {
  const colorMap = new Map<string, { color: string; colorHex: string; mockupImage: string | null }>();
  const sizes = new Set<string>();
  for (const v of p.variants) {
    if (!colorMap.has(v.color)) {
      colorMap.set(v.color, { color: v.color, colorHex: v.colorHex, mockupImage: v.mockupImage });
    }
    sizes.add(v.size);
  }
  const sizeOrder = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    category: p.category,
    basePrice: toNumber(p.basePrice),
    printAreaPrice: toNumber(p.printAreaPrice),
    active: p.active,
    images: p.images,
    variants: p.variants.map((v) => ({
      id: v.id,
      color: v.color,
      colorHex: v.colorHex,
      size: v.size,
      sku: v.sku,
      stock: v.stock,
      priceModifier: toNumber(v.priceModifier),
      mockupImage: v.mockupImage
    })),
    colors: Array.from(colorMap.values()),
    sizes: Array.from(sizes).sort(
      (a, b) => (sizeOrder.indexOf(a) + 99) - (sizeOrder.indexOf(b) + 99)
    )
  };
}

export async function getProducts(category?: ProductCategory): Promise<ProductDTO[]> {
  const products = await prisma.product.findMany({
    where: { active: true, ...(category ? { category } : {}) },
    include: { variants: true },
    orderBy: { createdAt: "asc" }
  });
  return products.map(serializeProduct);
}

export async function getProductBySlug(slug: string): Promise<ProductDTO | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { variants: true }
  });
  return product ? serializeProduct(product) : null;
}
