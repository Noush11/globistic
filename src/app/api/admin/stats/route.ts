import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { toNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [paidOrders, totalOrders, pendingCount, completedCount, customerCount, recentPaid] =
      await Promise.all([
        prisma.order.findMany({ where: { status: { not: "CANCELLED" } }, select: { total: true, status: true, createdAt: true } }),
        prisma.order.count(),
        prisma.order.count({ where: { status: "PENDING" } }),
        prisma.order.count({ where: { status: "DELIVERED" } }),
        prisma.user.count({ where: { role: "CUSTOMER" } }),
        prisma.order.findMany({
          where: { status: { in: ["PAID", "IN_PRODUCTION", "PRINTED", "SHIPPED", "DELIVERED"] }, createdAt: { gte: since30 } },
          select: { total: true, createdAt: true }
        })
      ]);

    const revenue = paidOrders
      .filter((o) => o.status !== "PENDING")
      .reduce((s, o) => s + toNumber(o.total), 0);

    // Daily revenue for the last 30 days
    const dailyMap = new Map<string, number>();
    for (const o of recentPaid) {
      const key = o.createdAt.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) || 0) + toNumber(o.total));
    }
    const daily = Array.from({ length: 30 }).map((_, i) => {
      const d = new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      return { date: d, revenue: Math.round((dailyMap.get(d) || 0) * 100) / 100 };
    });

    // Top selling products
    const grouped = await prisma.orderItem.groupBy({
      by: ["productName"],
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5
    });
    const topProducts = grouped.map((g) => ({
      name: g.productName,
      units: g._sum.quantity || 0,
      revenue: toNumber(g._sum.lineTotal)
    }));

    return ok({
      revenue: Math.round(revenue * 100) / 100,
      totalOrders,
      pendingCount,
      completedCount,
      customerCount,
      daily,
      topProducts
    });
  } catch (error) {
    return handleError(error);
  }
}
