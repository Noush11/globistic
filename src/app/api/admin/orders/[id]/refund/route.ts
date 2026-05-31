import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ok, fail, handleError, notFound } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { refundPayment, isSquareConfigured } from "@/lib/square";
import { toNumber } from "@/lib/utils";

const schema = z.object({ amount: z.number().min(0).optional() });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    const { amount } = schema.parse(await req.json().catch(() => ({})));

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { payments: true }
    });
    if (!order) return notFound("Order not found");

    const payment = order.payments.find((p) => p.status === "COMPLETED");
    if (!payment || !payment.squarePaymentId) return fail("No completed payment to refund.", 400);

    const refundAmount = amount ?? toNumber(payment.amount) - toNumber(payment.refundedAmount);
    if (refundAmount <= 0) return fail("Nothing left to refund.", 400);

    if (isSquareConfigured() && !payment.squarePaymentId.startsWith("TEST_")) {
      await refundPayment({ paymentId: payment.squarePaymentId, amount: refundAmount });
    }

    const newRefunded = toNumber(payment.refundedAmount) + refundAmount;
    const fullyRefunded = newRefunded >= toNumber(payment.amount);

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          refundedAmount: newRefunded,
          status: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED"
        }
      }),
      prisma.order.update({
        where: { id: order.id },
        data: fullyRefunded ? { status: "CANCELLED" } : {}
      })
    ]);

    return ok({ refunded: refundAmount, fullyRefunded });
  } catch (error) {
    return handleError(error);
  }
}
