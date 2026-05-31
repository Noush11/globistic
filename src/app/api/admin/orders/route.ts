import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { serializeOrder } from "@/lib/orders";
import type { OrderStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const status = req.nextUrl.searchParams.get("status") as OrderStatus | null;
    const q = req.nextUrl.searchParams.get("q");

    const orders = await prisma.order.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(q
          ? {
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { customerEmail: { contains: q, mode: "insensitive" } },
                { customerName: { contains: q, mode: "insensitive" } }
              ]
            }
          : {})
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { items: true, payments: true, shippingAddress: true }
    });

    return ok({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return handleError(error);
  }
}
