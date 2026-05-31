import { getProductBySlug } from "@/lib/products";
import { ok, notFound, handleError } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await getProductBySlug(params.slug);
    if (!product) return notFound("Product not found");
    return ok({ product });
  } catch (error) {
    return handleError(error);
  }
}
