import { config } from "./config";

interface RateEntry {
  count: number;
  resetAt: number;
}

const minuteMap = new Map<string, RateEntry>();
const dailyMap = new Map<string, RateEntry>();

const MINUTE_MS = 60_000;
const DAY_MS = 86_400_000;

/** Periodically clean up expired entries (every 5 minutes) */
setInterval(() => {
  const now = Date.now();
  minuteMap.forEach((entry, key) => {
    if (now > entry.resetAt) minuteMap.delete(key);
  });
  dailyMap.forEach((entry, key) => {
    if (now > entry.resetAt) dailyMap.delete(key);
  });
}, 5 * MINUTE_MS);

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
  reason?: string;
}

export function checkRateLimit(
  ipHash: string,
  sessionId: string
): RateLimitResult {
  const now = Date.now();

  // Per-minute check (by IP)
  const minuteEntry = minuteMap.get(ipHash);
  if (minuteEntry && now < minuteEntry.resetAt) {
    if (minuteEntry.count >= config.rateLimit.perMinute) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((minuteEntry.resetAt - now) / 1000),
        reason: "Too many requests. Please wait a moment before trying again.",
      };
    }
    minuteEntry.count++;
  } else {
    minuteMap.set(ipHash, { count: 1, resetAt: now + MINUTE_MS });
  }

  // Daily check (by session)
  const dailyEntry = dailyMap.get(sessionId);
  if (dailyEntry && now < dailyEntry.resetAt) {
    if (dailyEntry.count >= config.rateLimit.dailyPerSession) {
      return {
        allowed: false,
        reason:
          "You've reached the daily message limit. Come back tomorrow or reach out directly!",
      };
    }
    dailyEntry.count++;
  } else {
    dailyMap.set(sessionId, { count: 1, resetAt: now + DAY_MS });
  }

  return { allowed: true };
}
