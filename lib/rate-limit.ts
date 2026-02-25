// Simple in-memory rate limiter for API routes
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean up expired entries periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetTime) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  /** True when the request should be blocked (limit exceeded). */
  limited: boolean;
  /** Number of requests remaining in the current window. */
  remaining: number;
  /** Milliseconds until the current window resets. */
  resetIn: number;
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return { limited: false, remaining: options.maxRequests - 1, resetIn: options.windowMs };
  }

  if (entry.count >= options.maxRequests) {
    return { limited: true, remaining: 0, resetIn: entry.resetTime - now };
  }

  entry.count++;
  return {
    limited: false,
    remaining: options.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}
