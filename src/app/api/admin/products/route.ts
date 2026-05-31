import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { productSchema } from "@/lib/validation";
import { serializeProduct } from "@/lib/products";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { createdAt: "desc" }
    });
    return ok({ products: products.map(serializeProduct) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = productSchema.parse(await req.json());
    const product = await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug || slugify(data.name),
        description: data.description,
        category: data.category,
        basePrice: data.basePrice,
        printAreaPrice: data.printAreaPrice,
        active: data.active,
        images: data.images
      },
      include: { variants: true }
    });
    return ok({ product: serializeProduct(product) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
