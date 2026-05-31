import { customAlphabet } from "nanoid";
import { toNumber } from "./utils";
import type { Prisma } from "@prisma/client";

const orderId = customAlphabet("0123456789ABCDEFGHJKMNPQRSTVWXYZ", 8);

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  return `GLB-${year}-${orderId()}`;
}

type OrderWithRelations = Prisma.OrderGetPayload<{
  include: { items: true; payments: true; shippingAddress: true };
}>;

export function serializeOrder(o: OrderWithRelations) {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    customerName: o.customerName,
    customerEmail: o.customerEmail,
    customerPhone: o.customerPhone,
    subtotal: toNumber(o.subtotal),
    discountAmount: toNumber(o.discountAmount),
    shippingAmount: toNumber(o.shippingAmount),
    taxAmount: toNumber(o.taxAmount),
    total: toNumber(o.total),
    currency: o.currency,
    shippingMethod: o.shippingMethod,
    trackingNumber: o.trackingNumber,
    createdAt: o.createdAt.toISOString(),
    shippingAddress: o.shippingAddress,
    items: o.items.map((i) => ({
      id: i.id,
      productName: i.productName,
      color: i.color,
      size: i.size,
      printAreas: i.printAreas,
      quantity: i.quantity,
      unitPrice: toNumber(i.unitPrice),
      lineTotal: toNumber(i.lineTotal),
      previews: i.previews,
      customization: i.customization
    })),
    payment: o.payments[0]
      ? {
          status: o.payments[0].status,
          amount: toNumber(o.payments[0].amount),
          cardBrand: o.payments[0].cardBrand,
          cardLast4: o.payments[0].cardLast4,
          receiptUrl: o.payments[0].squareReceiptUrl
        }
      : null
  };
}
