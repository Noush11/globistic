// Lightweight in-memory rate limiter (per-process). Suitable for a single
// instance / dev. For multi-instance production, back this with Redis/Upstash.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  bucket.count += 1;
  const success = bucket.count <= limit;
  return { success, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

// Derive a client identifier from request headers.
export function clientKey(req: Request, scope = "global"): string {
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

// Periodically prune expired buckets to avoid unbounded growth.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
  }, 5 * 60_000).unref?.();
}
