// Simple in-memory rate limiting (in production, use Redis or similar)
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_IMAGES_PER_DAY = parseInt(process.env.MAX_IMAGES_PER_DAY || "300");
const RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetTime) {
    // Create new entry or reset expired entry
    const newEntry: RateLimitEntry = {
      count: 0,
      resetTime: now + RESET_INTERVAL,
    };
    rateLimitStore.set(identifier, newEntry);
    return {
      allowed: true,
      remaining: MAX_IMAGES_PER_DAY,
      resetTime: newEntry.resetTime,
    };
  }

  if (entry.count >= MAX_IMAGES_PER_DAY) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }

  return {
    allowed: true,
    remaining: MAX_IMAGES_PER_DAY - entry.count,
    resetTime: entry.resetTime,
  };
}

export function incrementRateLimit(
  identifier: string,
  count: number = 1
): void {
  const entry = rateLimitStore.get(identifier);
  if (entry) {
    entry.count += count;
  }
}

export function getRateLimitInfo(identifier: string): {
  count: number;
  remaining: number;
  resetTime: number;
} {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    return {
      count: 0,
      remaining: MAX_IMAGES_PER_DAY,
      resetTime: now + RESET_INTERVAL,
    };
  }

  return {
    count: entry.count,
    remaining: MAX_IMAGES_PER_DAY - entry.count,
    resetTime: entry.resetTime,
  };
}
