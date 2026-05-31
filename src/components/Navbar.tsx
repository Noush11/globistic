"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/store/cart";
import { useAuth } from "@/components/auth/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/Button";

const links = [
  { href: "/products", label: "Shop" },
  { href: "/customize/tshirt", label: "Design Studio" },
  { href: "/about", label: "About" }
];

export function Navbar() {
  const count = useCart((s) => s.count());
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="container-px flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">G</span>
          Globistic
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/cart"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
            aria-label="Cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              {(user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                <Link href="/admin"><Button variant="outline" size="sm">Admin</Button></Link>
              )}
              <Link href="/account"><Button variant="ghost" size="sm">{user.name || "Account"}</Button></Link>
              <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Link href="/login"><Button variant="ghost" size="sm">Login</Button></Link>
              <Link href="/register"><Button size="sm">Sign up</Button></Link>
            </div>
          )}

          <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-200 px-4 py-3 md:hidden dark:border-slate-800">
          <div className="flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="py-1 text-sm font-medium" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <Link href="/account" className="flex-1"><Button variant="outline" size="sm" className="w-full">Account</Button></Link>
                  <Button variant="ghost" size="sm" onClick={logout}>Logout</Button>
                </>
              ) : (
                <>
                  <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Login</Button></Link>
                  <Link href="/register" className="flex-1"><Button size="sm" className="w-full">Sign up</Button></Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
