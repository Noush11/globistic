"use client";

import { useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Customer {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  lifetimeValue: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      fetch(`/api/admin/customers?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((j) => j.success && setCustomers(j.data.customers))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
        <input className="input w-64" placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-100 text-left text-slate-500 dark:border-slate-800">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Email</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Orders</th>
                <th className="p-4 text-right">Lifetime value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="p-4 font-medium">{c.name || "—"}</td>
                  <td className="p-4 text-slate-500">{c.email}</td>
                  <td className="p-4 text-slate-500">{formatDate(c.createdAt)}</td>
                  <td className="p-4 text-right">{c.orderCount}</td>
                  <td className="p-4 text-right font-semibold">{formatCurrency(c.lifetimeValue)}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-slate-400">No customers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
