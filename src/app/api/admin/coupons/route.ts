import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";
import { couponSchema } from "@/lib/validation";
import { toNumber } from "@/lib/utils";

function serialize(c: Awaited<ReturnType<typeof prisma.coupon.findMany>>[number]) {
  return {
    id: c.id,
    code: c.code,
    description: c.description,
    type: c.type,
    value: toNumber(c.value),
    minSubtotal: toNumber(c.minSubtotal),
    maxUses: c.maxUses,
    usedCount: c.usedCount,
    active: c.active,
    expiresAt: c.expiresAt?.toISOString() ?? null
  };
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return ok({ coupons: coupons.map(serialize) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);
    const data = couponSchema.parse(await req.json());
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        type: data.type,
        value: data.value,
        minSubtotal: data.minSubtotal,
        maxUses: data.maxUses ?? null,
        active: data.active,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
      }
    });
    return ok({ coupon: serialize(coupon) }, 201);
  } catch (error) {
    return handleError(error);
  }
}
