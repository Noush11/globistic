import { PrismaClient, ProductCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const COLORS = [
  { color: "Black", colorHex: "#111111" },
  { color: "White", colorHex: "#f8f8f8" },
  { color: "Navy", colorHex: "#1f2a44" },
  { color: "Heather Grey", colorHex: "#b8bcc2" },
  { color: "Red", colorHex: "#c1272d" },
  { color: "Forest Green", colorHex: "#1f5132" }
];

const SIZES = ["S", "M", "L", "XL", "2XL"];

// 2XL carries a small surcharge.
const sizeModifier = (size: string) => (size === "2XL" ? 2 : 0);

interface SeedProduct {
  slug: string;
  name: string;
  description: string;
  category: ProductCategory;
  basePrice: number;
  printAreaPrice: number;
  image: string;
}

const PRODUCTS: SeedProduct[] = [
  {
    slug: "classic-tshirt",
    name: "Classic Cotton T-Shirt",
    description:
      "Premium 100% ring-spun cotton tee with a soft hand feel. Perfect canvas for vibrant front, back and sleeve prints.",
    category: "TSHIRT",
    basePrice: 24.99,
    printAreaPrice: 5,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
  },
  {
    slug: "premium-hoodie",
    name: "Premium Pullover Hoodie",
    description:
      "Heavyweight fleece hoodie with a double-lined hood and roomy kangaroo pocket. Warm, durable and print-ready.",
    category: "HOODIE",
    basePrice: 49.99,
    printAreaPrice: 7,
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80"
  },
  {
    slug: "crewneck-sweatshirt",
    name: "Crewneck Sweatshirt",
    description:
      "Cozy mid-weight crewneck with ribbed cuffs. A versatile staple for custom team and brand designs.",
    category: "SWEATSHIRT",
    basePrice: 39.99,
    printAreaPrice: 6,
    image: "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&w=900&q=80"
  },
  {
    slug: "long-sleeve-tee",
    name: "Long Sleeve Tee",
    description:
      "Lightweight long sleeve shirt with extended sleeve print areas — ideal for full-arm custom artwork.",
    category: "LONG_SLEEVE",
    basePrice: 29.99,
    printAreaPrice: 5,
    image: "https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?auto=format&fit=crop&w=900&q=80"
  }
];

async function main() {
  console.log("🌱 Seeding Globistic database…");

  // ── Admin user ──
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@globistic.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "SUPER_ADMIN" },
    create: {
      email: adminEmail,
      name: "Globistic Admin",
      role: "SUPER_ADMIN",
      emailVerified: true,
      passwordHash: await bcrypt.hash(adminPassword, 12)
    }
  });
  console.log(`👤 Admin: ${adminEmail} / ${adminPassword}`);

  // ── Demo customer ──
  await prisma.user.upsert({
    where: { email: "demo@globistic.com" },
    update: {},
    create: {
      email: "demo@globistic.com",
      name: "Demo Customer",
      passwordHash: await bcrypt.hash("Demo123!", 12)
    }
  });

  // ── Products + variants ──
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        basePrice: p.basePrice,
        printAreaPrice: p.printAreaPrice,
        images: [p.image]
      },
      create: {
        slug: p.slug,
        name: p.name,
        description: p.description,
        category: p.category,
        basePrice: p.basePrice,
        printAreaPrice: p.printAreaPrice,
        images: [p.image]
      }
    });

    for (const c of COLORS) {
      for (const size of SIZES) {
        const sku = `${p.slug}-${c.color.replace(/\s+/g, "").toUpperCase()}-${size}`;
        await prisma.productVariant.upsert({
          where: { sku },
          update: {},
          create: {
            productId: product.id,
            color: c.color,
            colorHex: c.colorHex,
            size,
            sku,
            stock: 100,
            priceModifier: sizeModifier(size),
            mockupImage: p.image
          }
        });
      }
    }
    console.log(`👕 ${p.name} (${COLORS.length * SIZES.length} variants)`);
  }

  // ── Sample coupons ──
  await prisma.coupon.upsert({
    where: { code: "WELCOME10" },
    update: {},
    create: { code: "WELCOME10", description: "10% off your first order", type: "PERCENTAGE", value: 10, minSubtotal: 0 }
  });
  await prisma.coupon.upsert({
    where: { code: "SAVE5" },
    update: {},
    create: { code: "SAVE5", description: "$5 off orders over $50", type: "FIXED", value: 5, minSubtotal: 50 }
  });
  console.log("🏷️  Coupons: WELCOME10, SAVE5");

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
