import { NextRequest } from "next/server";
import { getRequestInfo } from "@/lib/requestInfo";

type Bucket = { count: number; resetAt: number };

// Instance-local protection for warm Node instances. A multi-instance
// deployment should also place a shared limiter (Redis/Upstash or platform
// edge protection) in front of the application.
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size <= MAX_BUCKETS) return;
  const oldest = [...buckets.entries()]
    .sort((left, right) => left[1].resetAt - right[1].resetAt)
    .slice(0, buckets.size - MAX_BUCKETS);
  for (const [key] of oldest) buckets.delete(key);
}

export function getRateLimitKey(req: NextRequest, scope: string, suffix = "") {
  const { ipAddress } = getRequestInfo(req);
  const normalizedIp = ipAddress && /^[0-9a-fA-F:.]{3,64}$/.test(ipAddress) ? ipAddress : "unknown-client";
  return `${scope}:${normalizedIp}:${suffix}`;
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  const bucket = existing && existing.resetAt > now
    ? existing
    : { count: 0, resetAt: now + windowMs };
  bucket.count += 1;
  buckets.set(key, bucket);

  return {
    allowed: bucket.count <= limit,
    retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
  };
}
