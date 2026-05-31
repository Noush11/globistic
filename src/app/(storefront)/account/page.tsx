import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { Badge, ORDER_STATUS_TONE } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const orders = await prisma.order.findMany({
    where: { userId: user.sub },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { items: true }
  });

  return (
    <div className="container-px py-12">
      <h1 className="text-3xl font-bold">Hi, {user.name || "there"} 👋</h1>
      <p className="mt-1 text-slate-500">{user.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-6">
          <p className="text-sm text-slate-500">Total orders</p>
          <p className="mt-1 text-2xl font-bold">{orders.length}</p>
        </div>
        <Link href="/products" className="card flex items-center justify-between p-6 transition hover:shadow-card">
          <span className="font-medium">Start a new design</span><span>→</span>
        </Link>
        <Link href="/account/orders" className="card flex items-center justify-between p-6 transition hover:shadow-card">
          <span className="font-medium">Order history</span><span>→</span>
        </Link>
      </div>

      <h2 className="mt-12 text-xl font-bold">Recent orders</h2>
      {orders.length === 0 ? (
        <div className="card mt-4 p-8 text-center text-slate-500">
          No orders yet.
          <div className="mt-4"><Link href="/products"><Button>Browse catalog</Button></Link></div>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href="/account/orders" className="card flex items-center justify-between p-4 transition hover:shadow-card">
              <div>
                <p className="font-semibold">{o.orderNumber}</p>
                <p className="text-sm text-slate-500">{formatDate(o.createdAt)} · {o.items.length} item(s)</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge>
                <span className="font-semibold">{formatCurrency(Number(o.total))}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
