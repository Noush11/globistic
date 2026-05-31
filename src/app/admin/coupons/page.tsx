"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minSubtotal: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [form, setForm] = useState({ code: "", type: "PERCENTAGE", value: "10", minSubtotal: "0", maxUses: "", expiresAt: "" });

  function load() {
    fetch("/api/admin/coupons").then((r) => r.json()).then((j) => j.success && setCoupons(j.data.coupons));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: parseFloat(form.value),
        minSubtotal: parseFloat(form.minSubtotal || "0"),
        maxUses: form.maxUses ? parseInt(form.maxUses) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null
      })
    });
    const json = await res.json();
    if (json.success) {
      setForm({ code: "", type: "PERCENTAGE", value: "10", minSubtotal: "0", maxUses: "", expiresAt: "" });
      load();
    } else alert(json.error || "Failed to create coupon");
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Coupons</h1>

      <form onSubmit={create} className="card grid gap-4 p-6 sm:grid-cols-3 lg:grid-cols-6">
        <Input label="Code" required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <Select label="Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          <option value="PERCENTAGE">Percentage</option>
          <option value="FIXED">Fixed amount</option>
        </Select>
        <Input label="Value" type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} />
        <Input label="Min subtotal" type="number" step="0.01" value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} />
        <Input label="Max uses" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
        <Input label="Expires" type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
        <div className="sm:col-span-3 lg:col-span-6">
          <Button type="submit">Create coupon</Button>
        </div>
      </form>

      <div className="card divide-y divide-slate-100 dark:divide-slate-800">
        {coupons.map((c) => (
          <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <code className="rounded-lg bg-slate-100 px-2 py-1 font-mono font-bold dark:bg-slate-800">{c.code}</code>
              <Badge tone={c.active ? "green" : "default"}>{c.active ? "Active" : "Inactive"}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>{c.type === "PERCENTAGE" ? `${c.value}% off` : `${formatCurrency(c.value)} off`}</span>
              <span>Used {c.usedCount}{c.maxUses ? `/${c.maxUses}` : ""}</span>
              {c.expiresAt && <span>Exp {formatDate(c.expiresAt)}</span>}
              <Button variant="danger" size="sm" onClick={() => remove(c.id)}>Delete</Button>
            </div>
          </div>
        ))}
        {coupons.length === 0 && <div className="p-8 text-center text-slate-400">No coupons yet.</div>}
      </div>
    </div>
  );
}
