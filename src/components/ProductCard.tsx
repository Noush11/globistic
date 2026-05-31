import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import type { ProductDTO } from "@/types/api";
import { Badge } from "@/components/ui/Badge";

const CATEGORY_LABEL: Record<string, string> = {
  TSHIRT: "T-Shirt",
  HOODIE: "Hoodie",
  SWEATSHIRT: "Sweatshirt",
  LONG_SLEEVE: "Long Sleeve"
};

export function ProductCard({ product }: { product: ProductDTO }) {
  const image = product.images[0] || product.variants[0]?.mockupImage;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="card group overflow-hidden transition hover:-translate-y-1 hover:shadow-card"
    >
      <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-slate-400">No image</div>
        )}
        <div className="absolute left-3 top-3">
          <Badge tone="brand">{CATEGORY_LABEL[product.category] || product.category}</Badge>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold">{product.name}</h3>
        <div className="mt-1 flex items-center justify-between">
          <p className="text-sm text-slate-500">From {formatCurrency(product.basePrice)}</p>
          <div className="flex -space-x-1">
            {product.colors.slice(0, 5).map((c) => (
              <span
                key={c.color}
                title={c.color}
                className="h-4 w-4 rounded-full border border-white shadow dark:border-slate-900"
                style={{ backgroundColor: c.colorHex }}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
