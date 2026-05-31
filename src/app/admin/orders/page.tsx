"use client";

import { useEffect, useState, useCallback } from "react";
import { Badge, ORDER_STATUS_TONE } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { formatCurrency, formatDate } from "@/lib/utils";

const STATUSES = ["PENDING", "PAID", "IN_PRODUCTION", "PRINTED", "SHIPPED", "DELIVERED", "CANCELLED"];

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  customerName: string;
  customerEmail: string;
  total: number;
  trackingNumber?: string | null;
  createdAt: string;
  shippingAddress: any;
  items: any[];
  payment: any;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [q, setQ] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set("status", filter);
    if (q) params.set("q", q);
    fetch(`/api/admin/orders?${params}`)
      .then((r) => r.json())
      .then((j) => j.success && setOrders(j.data.orders))
      .finally(() => setLoading(false));
  }, [filter, q]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    load();
  }

  async function refund(id: string) {
    if (!confirm("Issue a full refund for this order?")) return;
    const res = await fetch(`/api/admin/orders/${id}/refund`, { method: "POST" });
    const json = await res.json();
    alert(json.success ? "Refund processed." : json.error);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <input
            className="input w-56"
            placeholder="Search by name, email, #"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-44">
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">No orders found.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div key={o.id} className="card overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left"
              >
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-sm text-slate-500">{o.customerName} · {o.customerEmail}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-400">{formatDate(o.createdAt)}</span>
                  <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge>
                  <span className="font-semibold">{formatCurrency(o.total)}</span>
                </div>
              </button>

              {expanded === o.id && (
                <div className="border-t border-slate-100 p-4 dark:border-slate-800">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-500">Items</h4>
                      <div className="mt-2 space-y-3">
                        {o.items.map((it) => (
                          <div key={it.id} className="flex gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                            <div className="flex gap-1">
                              {it.previews && Object.entries(it.previews).map(([area, url]) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={area} src={url as string} alt={area} className="h-14 w-14 rounded-lg object-cover" />
                              ))}
                            </div>
                            <div className="flex-1 text-sm">
                              <p className="font-medium">{it.productName}</p>
                              <p className="text-slate-500">{it.color} · {it.size} · Qty {it.quantity}</p>
                              <p className="text-slate-500">{it.printAreas.join(", ") || "Blank"}</p>
                              {it.customization?.artworkUrls?.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {it.customization.artworkUrls.map((url: string, idx: number) => (
                                    <a key={idx} href={url} download target="_blank" rel="noreferrer" className="text-xs text-brand-600 hover:underline">
                                      ⬇ artwork {idx + 1}
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold text-slate-500">Shipping</h4>
                      {o.shippingAddress && (
                        <address className="mt-2 text-sm not-italic text-slate-600 dark:text-slate-300">
                          {o.shippingAddress.fullName}<br />
                          {o.shippingAddress.line1}{o.shippingAddress.line2 ? `, ${o.shippingAddress.line2}` : ""}<br />
                          {o.shippingAddress.city}, {o.shippingAddress.state} {o.shippingAddress.postalCode}<br />
                          {o.shippingAddress.country}
                        </address>
                      )}
                      {o.payment && (
                        <p className="mt-3 text-sm text-slate-500">
                          Payment: {o.payment.status} · {o.payment.cardBrand} ••{o.payment.cardLast4}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <Select
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                          className="w-44"
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </Select>
                        <Button variant="danger" size="sm" onClick={() => refund(o.id)}>Refund</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
