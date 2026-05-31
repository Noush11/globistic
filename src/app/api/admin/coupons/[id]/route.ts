import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, handleError } from "@/lib/api";
import { requireAdmin } from "@/lib/guard";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin(req);
    await prisma.coupon.delete({ where: { id: params.id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
