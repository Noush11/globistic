#!/bin/sh
# Wait for Postgres, sync the schema, seed demo data, then start the app.
set -e

echo "⏳ Waiting for the database and syncing schema…"
until npx prisma db push --skip-generate --accept-data-loss; do
  echo "   database not ready yet — retrying in 3s"
  sleep 3
done

echo "🌱 Seeding demo catalog, admin & coupons…"
npx tsx prisma/seed.ts || echo "⚠️  Seed step reported an issue (continuing)."

echo "🚀 Starting Globistic on http://localhost:3000"
exec npm run start
