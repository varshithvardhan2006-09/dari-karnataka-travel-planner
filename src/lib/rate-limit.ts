/**
 * Shared in-memory sliding-window rate limiter for API route handlers.
 *
 * Architectural note:
 * In serverless environments (e.g. Vercel) each container keeps its own window,
 * which provides fast per-container abuse protection. At multi-region production
 * scale this is complemented with distributed edge rate limiting (Upstash Redis /
 * Vercel KV) or a WAF so counters are shared across independent instances.
 */

const MAX_TRACKED_IPS = 5000;

const buckets = new Map<string, Map<string, number[]>>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterS: number;
}

export interface RateLimitOptions {
  /** Logical bucket name, so each route keeps an independent window. */
  name: string;
  /** Maximum requests permitted inside the window. */
  limit: number;
  /** Window length in milliseconds. */
  windowMs: number;
}

/**
 * Reads the caller's IP from proxy headers, falling back to loopback.
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0].trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "127.0.0.1";
}

/**
 * Records a request for the given IP and reports whether it is within the limit.
 */
export function checkRateLimit(ip: string, options: RateLimitOptions): RateLimitResult {
  const { name, limit, windowMs } = options;
  const now = Date.now();
  const windowStart = now - windowMs;

  let bucket = buckets.get(name);
  if (!bucket) {
    bucket = new Map<string, number[]>();
    buckets.set(name, bucket);
  }

  // Prune the bucket when it grows past the threshold to prevent memory growth
  if (bucket.size > MAX_TRACKED_IPS) {
    for (const [key, times] of bucket.entries()) {
      if (times.every((t) => t <= windowStart)) {
        bucket.delete(key);
      }
    }
  }

  const timestamps = (bucket.get(ip) || []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const oldestInWindow = timestamps[0];
    const retryAfterS = Math.ceil((oldestInWindow + windowMs - now) / 1000);
    bucket.set(ip, timestamps);
    return { allowed: false, retryAfterS: Math.max(1, retryAfterS) };
  }

  timestamps.push(now);
  bucket.set(ip, timestamps);
  return { allowed: true, retryAfterS: 0 };
}

/**
 * Clears every window. Exposed for deterministic unit tests.
 */
export function resetRateLimits(): void {
  buckets.clear();
}
