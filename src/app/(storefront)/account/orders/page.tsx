import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder } from "@/lib/orders";
import { Badge, ORDER_STATUS_TONE } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils";
import { PRINT_AREAS } from "@/types/design";

export const dynamic = "force-dynamic";

export default async function OrderHistoryPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const raw = await prisma.order.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: "desc" },
    include: { items: true, payments: true, shippingAddress: true }
  });
  const orders = raw.map(serializeOrder);

  return (
    <div className="container-px py-12">
      <h1 className="text-3xl font-bold">Order history</h1>

      {orders.length === 0 ? (
        <div className="card mt-6 p-10 text-center text-slate-500">
          You haven&apos;t placed any orders yet.
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {orders.map((o) => (
            <div key={o.id} className="card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold">{o.orderNumber}</p>
                  <p className="text-sm text-slate-500">Placed {formatDate(o.createdAt)}</p>
                </div>
                <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge>
              </div>

              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {o.items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      {(i.previews as any)?.FRONT && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={(i.previews as any).FRONT} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{i.productName}</p>
                        <p className="text-xs text-slate-500">
                          {i.color} · {i.size} · Qty {i.quantity}
                          {i.printAreas.length > 0 && ` · ${i.printAreas.map((a) => PRINT_AREAS.find((p) => p.key === a)?.label).join(", ")}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(i.lineTotal)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
                <div className="flex gap-2">
                  <Link href={`/customize/${(o.items[0]?.customization as any)?.productSlug || "tshirt"}`}>
                    <Button variant="outline" size="sm">Reorder design</Button>
                  </Link>
                  {o.payment?.receiptUrl && (
                    <a href={o.payment.receiptUrl} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm">View receipt</Button>
                    </a>
                  )}
                </div>
                <p className="text-lg font-bold">{formatCurrency(o.total)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
