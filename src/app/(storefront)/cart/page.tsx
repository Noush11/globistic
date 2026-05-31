"use client";

import Link from "next/link";
import { useCart } from "@/store/cart";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { PRINT_AREAS } from "@/types/design";

export default function CartPage() {
  const { items, removeItem, updateQuantity, lineTotal, unitPrice, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-px py-24 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-slate-500">Start designing to add custom apparel.</p>
        <Link href="/products" className="mt-6 inline-block">
          <Button size="lg">Browse catalog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-px py-12">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card flex gap-4 p-4">
              <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {item.thumbnail && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.thumbnail} alt={item.productName} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{item.productName}</h3>
                    <p className="text-sm text-slate-500">{item.color} · {item.size}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-sm text-red-500 hover:underline">
                    Remove
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.printAreas.length > 0 ? (
                    item.printAreas.map((a) => (
                      <Badge key={a} tone="brand">{PRINT_AREAS.find((p) => p.key === a)?.label}</Badge>
                    ))
                  ) : (
                    <Badge>Blank</Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</Button>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">{formatCurrency(unitPrice(item))} ea</p>
                    <p className="font-semibold">{formatCurrency(lineTotal(item))}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card h-fit p-6">
          <h2 className="text-lg font-bold">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-medium">{formatCurrency(subtotal())}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-slate-500">Shipping</span>
            <span className="text-slate-400">Calculated at checkout</span>
          </div>
          <Link href="/checkout">
            <Button className="mt-6 w-full" size="lg">Proceed to checkout</Button>
          </Link>
          <Link href="/products" className="mt-3 block text-center text-sm text-brand-600 hover:underline">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
