import { NextRequest } from "next/server";
import { getProducts } from "@/lib/products";
import { ok, handleError } from "@/lib/api";
import type { ProductCategory } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category") as ProductCategory | null;
    const products = await getProducts(category || undefined);
    return ok({ products });
  } catch (error) {
    return handleError(error);
  }
}
