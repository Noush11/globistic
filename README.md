# Globistic — Custom Apparel Printing Platform

A modern, production-ready full-stack web application for a custom apparel
printing business. Customers design t-shirts, hoodies, sweatshirts and long
sleeve shirts in an interactive studio — uploading artwork, adding text,
positioning designs across front/back/sleeves with a live preview — then check
out securely. A full admin dashboard manages products, orders, customers,
coupons and analytics.

> The original static marketing site has been preserved under [`legacy/`](./legacy).

---

## ✨ Features

**Storefront**
- Product catalog (T-Shirt, Hoodie, Sweatshirt, Long Sleeve) with colors, sizes, pricing
- Interactive **design studio**: upload PNG/JPG/SVG/transparent art, add text
  (font, color, size, bold/italic), drag, resize, rotate, layer & delete
- Print areas: **Front, Back, Left Sleeve, Right Sleeve** with view switching
- **Live preview** + **dynamic pricing** (product, print locations, design
  complexity, quantity, automatic bulk discounts)
- Cart with persisted customization, quantity updates, remove
- Accounts: register, login, forgot/reset password, order history, reorder
- Checkout: contact + shipping, Standard/Express shipping, coupons,
  **Square** card payments, order confirmation

**Admin**
- Dashboard: revenue, orders, pending/completed, customers, daily sales chart, top products
- Product management (add/edit/hide/delete, pricing, variants)
- Order management: view designs & previews, download artwork, update status
  (Pending → Paid → In Production → Printed → Shipped → Delivered / Cancelled), refunds
- Customer management with search & lifetime value
- Coupon system: percentage / fixed discounts, min subtotal, usage limits, expiry

**Platform**
- JWT auth (httpOnly cookies) + bcrypt password hashing + role-based access control
- Rate limiting, Zod input validation, server-authoritative pricing
- AWS S3 design uploads (presigned URLs) with local data-URL fallback
- Transactional email (order/payment/shipping/reset) via SMTP
- Dark / light mode, fully responsive mobile-first UI

---

## 🧱 Tech Stack

| Layer      | Technology |
|------------|------------|
| Framework  | Next.js 14 (App Router), React 18, TypeScript |
| Styling    | Tailwind CSS, next-themes (dark/light) |
| Database   | PostgreSQL + Prisma ORM |
| Auth       | JWT (`jose`) + bcrypt, httpOnly cookies, middleware |
| Payments   | Square (Web Payments SDK + Payments API) |
| Storage    | AWS S3 (presigned uploads) |
| Email      | Nodemailer (SMTP) |
| State      | Zustand (cart) |
| Validation | Zod |

---

## 🚀 Getting Started

### ▶️ Quickest preview — one command (Docker)

No local Node or Postgres setup required. With Docker installed:

```bash
docker compose up --build
```

This builds the app, starts PostgreSQL, syncs the schema, seeds the demo
catalog, and serves everything at **http://localhost:3000**.

- Admin: `admin@globistic.com` / `Admin123!` → `/admin`
- Customer: `demo@globistic.com` / `Demo123!`

It runs in graceful preview mode (no Square/AWS/SMTP keys needed): card payments
use a Square sandbox test nonce, uploads fall back to in-browser data URLs, and
emails are logged to the container console. Stop with `Ctrl+C`; remove the
database volume with `docker compose down -v`.

---

### Manual setup

### 1. Prerequisites
- Node.js 18.18+
- PostgreSQL 14+
- (Optional) Square sandbox account, AWS S3 bucket, SMTP credentials

### 2. Install
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
# then fill in DATABASE_URL, JWT_SECRET, Square / AWS / SMTP keys
```

### 4. Set up the database
```bash
npm run prisma:generate        # generate Prisma client
npm run prisma:migrate         # create tables (dev)
npm run db:seed                # load demo catalog, admin & coupons
```

### 5. Run
```bash
npm run dev
# http://localhost:3000
```

**Seeded logins**
- Admin: `admin@globistic.com` / `Admin123!` → `/admin`
- Customer: `demo@globistic.com` / `Demo123!`

> The app runs end-to-end **without** Square/AWS/SMTP configured: uploads fall
> back to in-browser data URLs, payments use a sandbox test nonce, and emails
> are logged to the console. Configure the real services for production.

---

## 🗂️ Project Structure

```
prisma/
  schema.prisma            # full data model (users, products, variants,
                           # orders, order items, designs, payments,
                           # coupons, shipping addresses, reset tokens)
  seed.ts                  # demo catalog + admin + coupons
src/
  app/
    (storefront)/          # public store (home, products, customize, cart,
                           # checkout, account, auth pages)
    admin/                 # protected admin dashboard
    api/                   # REST API route handlers
  components/
    ui/                    # Button, Input, Select, Badge primitives
    customizer/            # design studio (canvas + controls)
    checkout/              # Square payment form
    auth/                  # client auth context
  lib/                     # prisma, auth, jwt, square, s3, email,
                           # pricing, validation, rate-limit, guards
  store/                   # zustand cart
  types/                   # design + API types
  middleware.ts            # route protection for /admin & /account
legacy/                    # original static HTML site
```

---

## 🔌 API Overview (REST)

| Method | Endpoint | Description |
|-------:|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/auth/me` | Current user |
| POST | `/api/auth/forgot-password` | Request reset link |
| POST | `/api/auth/reset-password` | Set new password |
| GET  | `/api/products` | List products (`?category=`) |
| GET  | `/api/products/[slug]` | Product detail |
| POST | `/api/uploads` | Presigned S3 upload URL |
| POST | `/api/coupons/validate` | Validate a coupon |
| POST | `/api/orders` | Create order + charge (Square) |
| GET  | `/api/orders` | Current user's orders |
| GET  | `/api/admin/stats` | Dashboard analytics |
| GET  | `/api/admin/orders` | List/search orders |
| PATCH| `/api/admin/orders/[id]` | Update status/tracking |
| POST | `/api/admin/orders/[id]/refund` | Refund payment |
| GET/POST | `/api/admin/products` | List/create products |
| PATCH/DELETE | `/api/admin/products/[id]` | Edit/delete product |
| GET  | `/api/admin/customers` | List/search customers |
| GET/POST | `/api/admin/coupons` | List/create coupons |
| DELETE | `/api/admin/coupons/[id]` | Delete coupon |

All API responses use the envelope `{ success: boolean, data? , error? }`.

---

## 💳 Square Setup
1. Create an app at <https://developer.squareup.com>.
2. Copy the **Sandbox** Application ID, Access Token and Location ID.
3. Set `SQUARE_*` and `NEXT_PUBLIC_SQUARE_*` in `.env`.
4. Test card (sandbox): `4111 1111 1111 1111`, any future expiry, any CVV, ZIP `94103`.

## ☁️ AWS S3 Setup
1. Create a bucket and an IAM user with `s3:PutObject`/`s3:GetObject`.
2. Allow CORS `PUT` from your app origin.
3. Set `AWS_*` and `S3_BUCKET` in `.env`.

---

## 📦 Deployment

### Vercel (recommended)
1. Push to GitHub and import the repo into Vercel.
2. Add all `.env` variables in the project settings.
3. Build command `npm run build` (runs `prisma generate`), output is automatic.
4. Run migrations against your production database:
   ```bash
   npx prisma migrate deploy
   npm run db:seed   # optional, first deploy only
   ```
   Use a managed Postgres (Neon, Supabase, RDS). For serverless, add
   `?pgbouncer=true&connection_limit=1` or use Prisma Accelerate.

### Docker / Node host
```bash
npm ci
npm run build
npx prisma migrate deploy
npm run start        # serves on PORT (default 3000)
```

---

## 🔐 Security Notes
- Passwords hashed with bcrypt (cost 12); JWTs signed (HS256) in httpOnly cookies.
- Role-based access enforced in middleware **and** server handlers/layouts.
- Prices and coupons are **recomputed server-side** on order creation — the
  client total is never trusted.
- Rate limiting on auth, upload and order endpoints; Zod validation on all input.
- Set strong `JWT_SECRET` / `APP_SECRET` in production.

---

## 📄 License
Proprietary — © Globistic Custom Apparel.
