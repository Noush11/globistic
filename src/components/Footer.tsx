import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="container-px grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">G</span>
            Globistic
          </div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Premium custom apparel printing. Design it, preview it, wear it.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Shop</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/products?category=TSHIRT" className="hover:text-brand-600">T-Shirts</Link></li>
            <li><Link href="/products?category=HOODIE" className="hover:text-brand-600">Hoodies</Link></li>
            <li><Link href="/products?category=SWEATSHIRT" className="hover:text-brand-600">Sweatshirts</Link></li>
            <li><Link href="/products?category=LONG_SLEEVE" className="hover:text-brand-600">Long Sleeve</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Company</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li><Link href="/about" className="hover:text-brand-600">About</Link></li>
            <li><Link href="/account/orders" className="hover:text-brand-600">Track Order</Link></li>
            <li><Link href="/login" className="hover:text-brand-600">Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Support</h4>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>support@globistic.com</li>
            <li>Mon–Fri, 9am–6pm</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} Globistic Custom Apparel. All rights reserved.
      </div>
    </footer>
  );
}
