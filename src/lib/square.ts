import { Client, Environment, type ApiError } from "square";
import { randomUUID } from "crypto";
import { env, isSquareConfigured } from "./env";

let squareClient: Client | null = null;

export function getSquareClient(): Client {
  if (!isSquareConfigured()) {
    throw new Error("Square is not configured. Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID.");
  }
  if (!squareClient) {
    squareClient = new Client({
      accessToken: env.square.accessToken,
      environment:
        env.square.environment === "production"
          ? Environment.Production
          : Environment.Sandbox
    });
  }
  return squareClient;
}

// Square works in the smallest currency unit (cents). BigInt is required.
export function toCents(amount: number): bigint {
  return BigInt(Math.round(amount * 100));
}

export function fromCents(amount: bigint | number): number {
  return Number(amount) / 100;
}

export interface ChargeInput {
  sourceId: string; // payment token (nonce) from Web Payments SDK
  amount: number; // in major units, e.g. 49.99
  currency?: string;
  orderNumber: string;
  buyerEmail?: string;
}

export interface ChargeResult {
  paymentId: string;
  status: string;
  receiptUrl?: string;
  cardBrand?: string;
  last4?: string;
  raw: unknown;
}

export async function createPayment(input: ChargeInput): Promise<ChargeResult> {
  const client = getSquareClient();
  const { result } = await client.paymentsApi.createPayment({
    sourceId: input.sourceId,
    idempotencyKey: randomUUID(),
    amountMoney: {
      amount: toCents(input.amount),
      currency: (input.currency || "USD") as any
    },
    locationId: env.square.locationId,
    referenceId: input.orderNumber,
    buyerEmailAddress: input.buyerEmail,
    note: `Globistic order ${input.orderNumber}`
  });

  const payment = result.payment!;
  return {
    paymentId: payment.id!,
    status: payment.status || "UNKNOWN",
    receiptUrl: payment.receiptUrl,
    cardBrand: payment.cardDetails?.card?.cardBrand,
    last4: payment.cardDetails?.card?.last4,
    raw: payment
  };
}

export interface RefundInput {
  paymentId: string;
  amount: number;
  currency?: string;
  reason?: string;
}

export async function refundPayment(input: RefundInput) {
  const client = getSquareClient();
  const { result } = await client.refundsApi.refundPayment({
    idempotencyKey: randomUUID(),
    paymentId: input.paymentId,
    amountMoney: {
      amount: toCents(input.amount),
      currency: (input.currency || "USD") as any
    },
    reason: input.reason || "Customer refund"
  });
  return result.refund;
}

export function isSquareApiError(err: unknown): err is ApiError {
  return !!err && typeof err === "object" && "errors" in (err as object);
}

export { isSquareConfigured };
