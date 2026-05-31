import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, handleError, notFound } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { serializeOrder } from "@/lib/orders";
import { sendShippingUpdate } from "@/lib/email";

const schema = z.object({
  status: z
    .enum(["PENDING", "PAID", "IN_PRODUCTION", "PRINTED", "SHIPPED", "DELIVERED", "CANCELLED"])
    .optional(),
  trackingNumber: z.string().max(100).optional(),
  notes: z.string().max(2000).optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const data = schema.parse(await req.json());

    const existing = await prisma.order.findUnique({ where: { id: params.id } });
    if (!existing) return notFound("Order not found");

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.trackingNumber !== undefined ? { trackingNumber: data.trackingNumber } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {})
      },
      include: { items: true, payments: true, shippingAddress: true }
    });

    // Email the customer on shipping-related status changes.
    if (data.status && ["SHIPPED", "DELIVERED", "IN_PRODUCTION"].includes(data.status)) {
      sendShippingUpdate({
        to: updated.customerEmail,
        orderNumber: updated.orderNumber,
        status: data.status,
        trackingNumber: updated.trackingNumber
      }).catch(() => {});
    }

    return ok({ order: serializeOrder(updated) });
  } catch (error) {
    return handleError(error);
  }
}
