"use client";

import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";

interface Stats {
  revenue: number;
  totalOrders: number;
  pendingCount: number;
  completedCount: number;
  customerCount: number;
  daily: { date: string; revenue: number }[];
  topProducts: { name: string; units: number; revenue: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((j) => j.success && setStats(j.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading dashboard…</p>;
  if (!stats) return <p className="text-red-500">Failed to load stats.</p>;

  const maxDaily = Math.max(1, ...stats.daily.map((d) => d.revenue));

  const cards = [
    { label: "Revenue (30d net)", value: formatCurrency(stats.revenue), tone: "text-green-600" },
    { label: "Total orders", value: stats.totalOrders, tone: "" },
    { label: "Pending orders", value: stats.pendingCount, tone: "text-amber-600" },
    { label: "Delivered", value: stats.completedCount, tone: "text-brand-600" },
    { label: "Customers", value: stats.customerCount, tone: "" }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <p className="text-sm text-slate-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.tone}`}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <h2 className="font-semibold">Daily sales (last 30 days)</h2>
          <div className="mt-6 flex h-48 items-end gap-1">
            {stats.daily.map((d) => (
              <div key={d.date} className="group relative flex-1">
                <div
                  className="rounded-t bg-brand-500 transition hover:bg-brand-600"
                  style={{ height: `${(d.revenue / maxDaily) * 100}%`, minHeight: d.revenue > 0 ? 4 : 0 }}
                />
                <div className="pointer-events-none absolute bottom-full left-1/2 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs text-white group-hover:block">
                  {d.date.slice(5)}: {formatCurrency(d.revenue)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold">Top products</h2>
          <div className="mt-4 space-y-3">
            {stats.topProducts.length === 0 && <p className="text-sm text-slate-400">No sales yet.</p>}
            {stats.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-slate-100 text-xs font-bold dark:bg-slate-800">{i + 1}</span>
                  <span className="text-sm">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatCurrency(p.revenue)}</p>
                  <p className="text-xs text-slate-400">{p.units} units</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
