import Link from "next/link";
import { getProductBySlug, getProducts } from "@/lib/products";
import { Customizer } from "@/components/customizer/Customizer";
import type { ProductCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

// Allow friendly aliases like /customize/tshirt to resolve to the first
// product in that category.
const CATEGORY_ALIAS: Record<string, ProductCategory> = {
  tshirt: "TSHIRT",
  "t-shirt": "TSHIRT",
  hoodie: "HOODIE",
  sweatshirt: "SWEATSHIRT",
  "long-sleeve": "LONG_SLEEVE",
  longsleeve: "LONG_SLEEVE"
};

export default async function CustomizePage({ params }: { params: { slug: string } }) {
  let product = await getProductBySlug(params.slug).catch(() => null);

  if (!product) {
    const category = CATEGORY_ALIAS[params.slug.toLowerCase()];
    if (category) {
      const list = await getProducts(category).catch(() => []);
      product = list[0] ?? null;
    }
  }

  if (!product) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="text-2xl font-bold">Product not available</h1>
        <p className="mt-2 text-slate-500">
          We couldn&apos;t find that product. The demo catalog may need seeding.
        </p>
        <Link href="/products" className="mt-4 inline-block text-brand-600 hover:underline">
          ← Browse the catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="container-px py-8">
      <div className="mb-6">
        <Link href={`/products/${product.slug}`} className="text-sm text-brand-600 hover:underline">
          ← Back to product
        </Link>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Design Studio</h1>
      </div>
      <Customizer product={product} />
    </div>
  );
}
