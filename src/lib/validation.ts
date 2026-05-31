import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name is too short").max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  phone: z.string().max(30).optional()
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(100)
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2).max(120),
  line1: z.string().min(2).max(160),
  line2: z.string().max(160).optional().or(z.literal("")),
  city: z.string().min(1).max(80),
  state: z.string().min(1).max(80),
  postalCode: z.string().min(2).max(20),
  country: z.string().min(2).max(2).default("US"),
  phone: z.string().max(30).optional().or(z.literal(""))
});

export const cartItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  color: z.string(),
  size: z.string(),
  quantity: z.number().int().min(1).max(1000),
  printAreas: z
    .array(z.enum(["FRONT", "BACK", "LEFT_SLEEVE", "RIGHT_SLEEVE"]))
    .default([]),
  designData: z.any().optional(),
  previews: z.record(z.string()).optional(),
  artworkUrls: z.array(z.string()).optional()
});

export const createOrderSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Your cart is empty"),
  customer: z.object({
    name: z.string().min(2).max(120),
    email: z.string().email(),
    phone: z.string().max(30).optional().or(z.literal(""))
  }),
  shippingAddress: shippingAddressSchema,
  shippingMethod: z.enum(["STANDARD", "EXPRESS"]).default("STANDARD"),
  couponCode: z.string().optional(),
  // Square payment token (nonce) from the Web Payments SDK
  sourceId: z.string().min(1, "Payment token is required")
});

export const productSchema = z.object({
  name: z.string().min(2).max(160),
  slug: z.string().min(2).max(160).optional(),
  description: z.string().min(1),
  category: z.enum(["TSHIRT", "HOODIE", "SWEATSHIRT", "LONG_SLEEVE"]),
  basePrice: z.number().min(0),
  printAreaPrice: z.number().min(0).default(5),
  active: z.boolean().default(true),
  images: z.array(z.string()).default([])
});

export const couponSchema = z.object({
  code: z.string().min(2).max(40),
  description: z.string().max(200).optional(),
  type: z.enum(["PERCENTAGE", "FIXED"]),
  value: z.number().min(0),
  minSubtotal: z.number().min(0).default(0),
  maxUses: z.number().int().min(1).optional().nullable(),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().nullable()
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
