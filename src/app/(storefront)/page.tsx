import Link from "next/link";
import { getProducts } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const categories = [
  { key: "TSHIRT", label: "T-Shirts", emoji: "👕" },
  { key: "HOODIE", label: "Hoodies", emoji: "🧥" },
  { key: "SWEATSHIRT", label: "Sweatshirts", emoji: "🩳" },
  { key: "LONG_SLEEVE", label: "Long Sleeve", emoji: "🥋" }
];

const steps = [
  { title: "Pick a garment", desc: "Choose from premium tees, hoodies, sweatshirts & more." },
  { title: "Design it", desc: "Upload art, add text, position on front, back & sleeves." },
  { title: "Preview live", desc: "See a real-time mockup update as you design." },
  { title: "Order securely", desc: "Checkout with Square. Fast printing & shipping." }
];

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getProducts>> = [];
  try {
    products = await getProducts();
  } catch {
    products = [];
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="container-px grid gap-10 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              ✨ Design studio · live preview · fast shipping
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Custom apparel,
              <span className="bg-gradient-to-r from-brand-600 to-purple-600 bg-clip-text text-transparent"> designed by you.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-slate-600 dark:text-slate-300">
              Upload your artwork, add text, place it anywhere on the garment, and preview the
              final product in real time. Print-ready in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/customize/tshirt"><Button size="lg">Start designing</Button></Link>
              <Link href="/products"><Button size="lg" variant="outline">Browse catalog</Button></Link>
            </div>
          </div>
          <div className="relative">
            <div className="card aspect-[4/3] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1200&q=80"
                alt="Custom apparel"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-px py-16">
        <h2 className="text-2xl font-bold">Shop by category</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.key}
              href={`/products?category=${c.key}`}
              className="card flex flex-col items-center justify-center gap-2 p-8 text-center transition hover:-translate-y-1 hover:shadow-card"
            >
              <span className="text-4xl">{c.emoji}</span>
              <span className="font-semibold">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      {products.length > 0 && (
        <section className="container-px py-8">
          <div className="flex items-end justify-between">
            <h2 className="text-2xl font-bold">Popular products</h2>
            <Link href="/products" className="text-sm font-medium text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section className="container-px py-16">
        <h2 className="text-center text-2xl font-bold">How it works</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="card p-6">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 font-bold text-white">
                {i + 1}
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
