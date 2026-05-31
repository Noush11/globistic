import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validation";
import { ok, fail, handleError } from "@/lib/api";
import { getUserFromRequest } from "@/lib/auth";
import { priceLine, computeCartTotals } from "@/lib/pricing";
import { toNumber } from "@/lib/utils";
import { generateOrderNumber } from "@/lib/orders";
import { createPayment, isSquareConfigured } from "@/lib/square";
import { sendOrderConfirmation, sendPaymentConfirmation } from "@/lib/email";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import type { PrintArea } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const limit = rateLimit(clientKey(req, "orders"), 15, 60_000);
    if (!limit.success) return fail("Too many requests. Please try again shortly.", 429);

    const user = await getUserFromRequest(req);
    const input = createOrderSchema.parse(await req.json());

    // ── 1. Re-price every line on the server (never trust the client) ──
    const productIds = Array.from(new Set(input.items.map((i) => i.productId)));
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { variants: true }
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const computedItems = input.items.map((item) => {
      const product = productMap.get(item.productId);
      if (!product) throw new Error("A product in your cart is no longer available.");
      const variant = item.variantId
        ? product.variants.find((v) => v.id === item.variantId)
        : product.variants.find((v) => v.color === item.color && v.size === item.size);

      const layerCount =
        item.designData?.areas
          ? Object.values(item.designData.areas).reduce(
              (sum: number, arr: any) => sum + (Array.isArray(arr) ? arr.length : 0),
              0
            )
          : item.printAreas.length;

      const pricing = priceLine({
        basePrice: toNumber(product.basePrice),
        printAreaPrice: toNumber(product.printAreaPrice),
        variantModifier: variant ? toNumber(variant.priceModifier) : 0,
        printAreas: item.printAreas as PrintArea[],
        layerCount,
        quantity: item.quantity
      });

      return { item, product, variant, pricing };
    });

    // ── 2. Validate coupon server-side ──
    let coupon = null as Awaited<ReturnType<typeof prisma.coupon.findUnique>> | null;
    const subtotal = computedItems.reduce((s, c) => s + c.pricing.lineTotal, 0);
    if (input.couponCode) {
      coupon = await prisma.coupon.findUnique({ where: { code: input.couponCode.toUpperCase() } });
      const valid =
        coupon &&
        coupon.active &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (coupon.maxUses == null || coupon.usedCount < coupon.maxUses) &&
        subtotal >= toNumber(coupon.minSubtotal);
      if (!valid) coupon = null;
    }

    const totals = computeCartTotals({
      lineTotals: computedItems.map((c) => c.pricing.lineTotal),
      shippingMethod: input.shippingMethod,
      coupon: coupon
        ? { type: coupon.type, value: toNumber(coupon.value), minSubtotal: toNumber(coupon.minSubtotal) }
        : null
    });

    // ── 3. Create the order (PENDING) with full customization snapshot ──
    const orderNumber = generateOrderNumber();
    const order = await prisma.order.create({
      data: {
        orderNumber,
        user: user ? { connect: { id: user.sub } } : undefined,
        status: "PENDING",
        customerName: input.customer.name,
        customerEmail: input.customer.email.toLowerCase(),
        customerPhone: input.customer.phone || null,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        shippingAmount: totals.shippingAmount,
        taxAmount: totals.taxAmount,
        total: totals.total,
        shippingMethod: input.shippingMethod,
        coupon: coupon ? { connect: { id: coupon.id } } : undefined,
        shippingAddress: {
          create: {
            user: user ? { connect: { id: user.sub } } : undefined,
            fullName: input.shippingAddress.fullName,
            line1: input.shippingAddress.line1,
            line2: input.shippingAddress.line2 || null,
            city: input.shippingAddress.city,
            state: input.shippingAddress.state,
            postalCode: input.shippingAddress.postalCode,
            country: input.shippingAddress.country,
            phone: input.shippingAddress.phone || null
          }
        },
        items: {
          create: computedItems.map(({ item, product, variant, pricing }) => ({
            product: { connect: { id: product.id } },
            variant: variant ? { connect: { id: variant.id } } : undefined,
            productName: product.name,
            color: item.color,
            size: item.size,
            printAreas: item.printAreas as PrintArea[],
            unitPrice: pricing.unitPrice,
            quantity: item.quantity,
            lineTotal: pricing.lineTotal,
            customization: item.designData ?? undefined,
            previews: item.previews ?? undefined,
            design:
              user && item.designData
                ? {
                    create: {
                      user: { connect: { id: user.sub } },
                      name: `${product.name} design`,
                      productId: product.id,
                      color: item.color,
                      data: item.designData,
                      previews: item.previews ?? undefined,
                      artworkUrls: item.artworkUrls ?? []
                    }
                  }
                : undefined
          }))
        }
      }
    });

    // ── 4. Charge the card via Square ──
    let paymentResult;
    try {
      if (isSquareConfigured()) {
        paymentResult = await createPayment({
          sourceId: input.sourceId,
          amount: totals.total,
          orderNumber,
          buyerEmail: input.customer.email
        });
      } else {
        // Dev/test mode: simulate a successful capture.
        paymentResult = {
          paymentId: `TEST_${orderNumber}`,
          status: "COMPLETED",
          receiptUrl: undefined,
          cardBrand: "TEST",
          last4: "0000",
          raw: { test: true }
        };
      }
    } catch (err) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
      return fail("Payment was declined. No charge was made.", 402);
    }

    const paid = paymentResult.status === "COMPLETED" || paymentResult.status === "APPROVED";

    // ── 5. Record payment + finalize ──
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: order.id,
          provider: "square",
          squarePaymentId: paymentResult!.paymentId,
          squareReceiptUrl: paymentResult!.receiptUrl,
          status: paid ? "COMPLETED" : "PENDING",
          amount: totals.total,
          cardBrand: paymentResult!.cardBrand,
          cardLast4: paymentResult!.last4,
          rawResponse: paymentResult!.raw as any
        }
      });
      await tx.order.update({
        where: { id: order.id },
        data: { status: paid ? "PAID" : "PENDING" }
      });
      if (paid && coupon) {
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } }
        });
      }
    });

    // ── 6. Notifications (best-effort) ──
    if (paid) {
      const totalStr = `$${totals.total.toFixed(2)}`;
      Promise.allSettled([
        sendOrderConfirmation({ to: input.customer.email, name: input.customer.name, orderNumber, total: totalStr }),
        sendPaymentConfirmation({ to: input.customer.email, orderNumber, total: totalStr })
      ]).catch(() => {});
    }

    return ok({ orderNumber, total: totals.total, status: paid ? "PAID" : "PENDING" }, 201);
  } catch (error) {
    return handleError(error);
  }
}

// List the authenticated user's orders.
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return fail("Authentication required", 401);
    const orders = await prisma.order.findMany({
      where: { userId: user.sub },
      orderBy: { createdAt: "desc" },
      include: { items: true, payments: true, shippingAddress: true }
    });
    const { serializeOrder } = await import("@/lib/orders");
    return ok({ orders: orders.map(serializeOrder) });
  } catch (error) {
    return handleError(error);
  }
}
