"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/store/cart";
import { useAuth } from "@/components/auth/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { computeCartTotals, SHIPPING_RATES } from "@/lib/pricing";
import { SquarePaymentForm, type SquarePaymentFormHandle } from "@/components/checkout/SquarePaymentForm";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, lineTotal, clear } = useCart();
  const { user } = useAuth();
  const payRef = useRef<SquarePaymentFormHandle>(null);

  const [shippingMethod, setShippingMethod] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [coupon, setCoupon] = useState<{ code: string; type: "PERCENTAGE" | "FIXED"; value: number; minSubtotal: number } | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "US"
  });

  const totals = computeCartTotals({
    lineTotals: items.map(lineTotal),
    shippingMethod,
    coupon
  });

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function applyCoupon() {
    setCouponError("");
    if (!couponCode.trim()) return;
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal: totals.subtotal })
    });
    const json = await res.json();
    if (json.success) {
      setCoupon({ code: couponCode.toUpperCase(), ...json.data });
    } else {
      setCoupon(null);
      setCouponError(json.error || "Invalid coupon");
    }
  }

  async function placeOrder() {
    setError("");
    if (!form.name || !form.email || !form.line1 || !form.city || !form.state || !form.postalCode) {
      setError("Please complete all required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const sourceId = await payRef.current?.tokenize();
      if (!sourceId) {
        setError("Please enter valid card details.");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            color: i.color,
            size: i.size,
            quantity: i.quantity,
            printAreas: i.printAreas,
            designData: i.design,
            previews: i.previews,
            artworkUrls: i.artworkUrls
          })),
          customer: { name: form.name, email: form.email, phone: form.phone },
          shippingAddress: {
            fullName: form.name,
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
            phone: form.phone
          },
          shippingMethod,
          couponCode: coupon?.code,
          sourceId
        })
      });
      const json = await res.json();
      if (json.success) {
        clear();
        router.push(`/order-confirmation/${json.data.orderNumber}`);
      } else {
        setError(json.error || "Payment failed. Please try again.");
      }
    } catch {
      setError("Something went wrong while placing your order.");
    } finally {
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
      </div>
    );
  }

  return (
    <div className="container-px py-12">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        {/* Form */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Contact information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name *" value={form.name} onChange={(e) => set("name", e.target.value)} />
              <Input label="Email *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
              <Input label="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Shipping address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Input label="Address line 1 *" value={form.line1} onChange={(e) => set("line1", e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Input label="Address line 2" value={form.line2} onChange={(e) => set("line2", e.target.value)} />
              </div>
              <Input label="City *" value={form.city} onChange={(e) => set("city", e.target.value)} />
              <Input label="State / Province *" value={form.state} onChange={(e) => set("state", e.target.value)} />
              <Input label="Postal code *" value={form.postalCode} onChange={(e) => set("postalCode", e.target.value)} />
              <Input label="Country" value={form.country} onChange={(e) => set("country", e.target.value)} />
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Shipping method</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(["STANDARD", "EXPRESS"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setShippingMethod(m)}
                  className={`rounded-xl border p-4 text-left transition ${
                    shippingMethod === m
                      ? "border-brand-500 ring-2 ring-brand-500/20"
                      : "border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{m === "STANDARD" ? "Standard" : "Express"}</span>
                    <span className="font-semibold">{formatCurrency(SHIPPING_RATES[m])}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    {m === "STANDARD" ? "5–7 business days" : "1–2 business days"}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-lg font-semibold">Payment</h2>
            <SquarePaymentForm ref={payRef} />
            <p className="mt-3 text-xs text-slate-400">🔒 Payments are processed securely by Square.</p>
          </section>
        </div>

        {/* Summary */}
        <div className="card h-fit p-6 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="mt-4 max-h-48 space-y-2 overflow-auto">
            {items.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-slate-500">{i.productName} ×{i.quantity}</span>
                <span>{formatCurrency(lineTotal(i))}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              className="input"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
            />
            <Button variant="outline" onClick={applyCoupon}>Apply</Button>
          </div>
          {couponError && <p className="mt-1 text-xs text-red-500">{couponError}</p>}
          {coupon && <div className="mt-2"><Badge tone="green">Coupon {coupon.code} applied</Badge></div>}

          <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm dark:border-slate-800">
            <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
            {totals.discountAmount > 0 && <Row label="Discount" value={`−${formatCurrency(totals.discountAmount)}`} />}
            <Row label="Shipping" value={formatCurrency(totals.shippingAmount)} />
            {totals.taxAmount > 0 && <Row label="Tax" value={formatCurrency(totals.taxAmount)} />}
            <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold dark:border-slate-800">
              <span>Total</span>
              <span className="text-brand-600">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <Button className="mt-5 w-full" size="lg" loading={submitting} onClick={placeOrder}>
            Pay {formatCurrency(totals.total)}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
