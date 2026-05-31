import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

const CATEGORY_LABEL: Record<string, string> = {
  TSHIRT: "T-Shirt",
  HOODIE: "Hoodie",
  SWEATSHIRT: "Sweatshirt",
  LONG_SLEEVE: "Long Sleeve"
};

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) notFound();

  const image = product.images[0] || product.colors[0]?.mockupImage;

  return (
    <div className="container-px py-12">
      <Link href="/products" className="text-sm text-brand-600 hover:underline">← Back to catalog</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-2">
        <div className="card aspect-square overflow-hidden bg-slate-100 dark:bg-slate-800">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full place-items-center text-slate-400">No image</div>
          )}
        </div>

        <div>
          <Badge tone="brand">{CATEGORY_LABEL[product.category]}</Badge>
          <h1 className="mt-3 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-semibold text-brand-600">
            From {formatCurrency(product.basePrice)}
          </p>
          <p className="mt-4 text-slate-600 dark:text-slate-300">{product.description}</p>

          <div className="mt-6">
            <h3 className="text-sm font-semibold">Colors</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.colors.map((c) => (
                <span key={c.color} className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm dark:border-slate-700">
                  <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.colorHex }} />
                  {c.color}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold">Sizes</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <span key={s} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300">
            Printable areas: Front, Back, Left & Right sleeves.
            <span className="block">+{formatCurrency(product.printAreaPrice)} per print location.</span>
          </div>

          <div className="mt-8">
            <Link href={`/customize/${product.slug}`}>
              <Button size="lg" className="w-full sm:w-auto">Customize this product →</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
