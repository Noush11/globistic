import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { toNumber } from "@/lib/utils";
import { ok, fail, handleError } from "@/lib/api";

const schema = z.object({ code: z.string().min(1), subtotal: z.number().min(0).default(0) });

export async function POST(req: NextRequest) {
  try {
    const { code, subtotal } = schema.parse(await req.json());
    const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });

    if (!coupon || !coupon.active) return fail("Invalid coupon code.", 404);
    if (coupon.expiresAt && coupon.expiresAt < new Date()) return fail("This coupon has expired.", 400);
    if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) return fail("This coupon has reached its usage limit.", 400);

    const minSubtotal = toNumber(coupon.minSubtotal);
    if (subtotal < minSubtotal) {
      return fail(`Requires a minimum subtotal of $${minSubtotal.toFixed(2)}.`, 400);
    }

    return ok({
      type: coupon.type,
      value: toNumber(coupon.value),
      minSubtotal
    });
  } catch (error) {
    return handleError(error);
  }
}
