import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { toNumber } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const q = req.nextUrl.searchParams.get("q") || "";

    const customers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] }
          : {})
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { orders: { select: { total: true, status: true } } }
    });

    return ok({
      customers: customers.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        createdAt: c.createdAt.toISOString(),
        orderCount: c.orders.length,
        lifetimeValue: c.orders
          .filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING")
          .reduce((s, o) => s + toNumber(o.total), 0)
      }))
    });
  } catch (error) {
    return handleError(error);
  }
}
