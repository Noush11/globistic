import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError, notFound } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { productSchema } from "@/lib/validation";
import { serializeProduct } from "@/lib/products";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const data = productSchema.partial().parse(await req.json());

    const existing = await prisma.product.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Product not found");

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.slug !== undefined ? { slug: data.slug } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.basePrice !== undefined ? { basePrice: data.basePrice } : {}),
        ...(data.printAreaPrice !== undefined ? { printAreaPrice: data.printAreaPrice } : {}),
        ...(data.active !== undefined ? { active: data.active } : {}),
        ...(data.images !== undefined ? { images: data.images } : {})
      },
      include: { variants: true }
    });
    return ok({ product: serializeProduct(product) });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    await prisma.product.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
