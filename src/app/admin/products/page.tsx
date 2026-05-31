"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { ProductDTO } from "@/types/api";

const CATEGORIES = ["TSHIRT", "HOODIE", "SWEATSHIRT", "LONG_SLEEVE"];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "TSHIRT",
    basePrice: "24.99",
    printAreaPrice: "5",
    images: ""
  });

  function load() {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((j) => j.success && setProducts(j.data.products))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        category: form.category,
        basePrice: parseFloat(form.basePrice),
        printAreaPrice: parseFloat(form.printAreaPrice),
        images: form.images ? form.images.split(",").map((s) => s.trim()) : []
      })
    });
    const json = await res.json();
    if (json.success) {
      setShowForm(false);
      setForm({ name: "", description: "", category: "TSHIRT", basePrice: "24.99", printAreaPrice: "5", images: "" });
      load();
    } else {
      alert(json.error || "Failed to create product");
    }
  }

  async function toggleActive(p: ProductDTO) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active })
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Close" : "+ Add product"}</Button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card grid gap-4 p-6 sm:grid-cols-2">
          <Input label="Name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
          <Input label="Base price" type="number" step="0.01" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
          <Input label="Print area price" type="number" step="0.01" value={form.printAreaPrice} onChange={(e) => setForm({ ...form, printAreaPrice: e.target.value })} />
          <div className="sm:col-span-2">
            <label className="label">Description</label>
            <textarea className="input min-h-[80px]" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Image URLs (comma separated)" value={form.images} onChange={(e) => setForm({ ...form, images: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit">Create product</Button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="card divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {(p.images[0] || p.colors[0]?.mockupImage) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0] || p.colors[0]?.mockupImage || ""} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-slate-500">{p.category} · {p.variants.length} variants</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold">{formatCurrency(p.basePrice)}</span>
                <Badge tone={p.active ? "green" : "default"}>{p.active ? "Active" : "Hidden"}</Badge>
                <Button variant="outline" size="sm" onClick={() => toggleActive(p)}>{p.active ? "Hide" : "Show"}</Button>
                <Button variant="danger" size="sm" onClick={() => remove(p.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
