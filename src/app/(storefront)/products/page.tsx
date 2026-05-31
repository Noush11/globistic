import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import type { ProductCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const tabs = [
  { key: "", label: "All" },
  { key: "TSHIRT", label: "T-Shirts" },
  { key: "HOODIE", label: "Hoodies" },
  { key: "SWEATSHIRT", label: "Sweatshirts" },
  { key: "LONG_SLEEVE", label: "Long Sleeve" }
];

export default async function ProductsPage({
  searchParams
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category as ProductCategory | undefined;
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts(category && category.length ? category : undefined);
  } catch {
    products = [];
  }

  return (
    <div className="container-px py-12">
      <h1 className="text-3xl font-bold">Catalog</h1>
      <p className="mt-2 text-slate-500">Choose a garment to start customizing.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = (searchParams.category || "") === t.key;
          return (
            <Link
              key={t.key}
              href={t.key ? `/products?category=${t.key}` : "/products"}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand-600 text-white"
                  : "border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      {products.length === 0 ? (
        <div className="card mt-10 p-12 text-center text-slate-500">
          No products yet. Run <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">npm run db:seed</code> to load the demo catalog.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
