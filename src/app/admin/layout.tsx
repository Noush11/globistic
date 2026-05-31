import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";

const nav = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/products", label: "Products", icon: "👕" },
  { href: "/admin/customers", label: "Customers", icon: "👥" },
  { href: "/admin/coupons", label: "Coupons", icon: "🏷️" }
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!isAdmin(user)) redirect("/");

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="hidden w-60 flex-shrink-0 border-r border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 md:block">
        <Link href="/" className="flex items-center gap-2 px-2 text-lg font-bold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">G</span>
          Globistic
        </Link>
        <p className="mt-1 px-2 text-xs text-slate-400">Admin panel</p>
        <nav className="mt-6 space-y-1">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>{n.icon}</span> {n.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="mt-6 block px-3 text-sm text-brand-600 hover:underline">
          ← Back to store
        </Link>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex gap-3 overflow-x-auto md:hidden">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
                {n.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-500">{user.name || user.email}</span>
            <ThemeToggle />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
