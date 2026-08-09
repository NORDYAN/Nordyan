/**
 * Minimal in-memory rate limit for initial production testing.
 * Resets on process restart. No Supabase schema required.
 */

export type RateLimitConfig = {
  maxPerMinute: number;
  maxPerDay: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: 'per_minute' | 'per_day' };

type UserBucket = {
  minuteWindowStart: number;
  minuteCount: number;
  dayWindowStart: number;
  dayCount: number;
};

const DEFAULT_LIMITS: RateLimitConfig = {
  maxPerMinute: 6,
  maxPerDay: 40,
};

function startOfUtcDay(now: number): number {
  const date = new Date(now);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function createMemoryRateLimiter(limits: RateLimitConfig = DEFAULT_LIMITS) {
  const buckets = new Map<string, UserBucket>();

  return {
    check(userId: string, now: number = Date.now()): RateLimitResult {
      const minuteWindowStart = now - (now % 60_000);
      const dayWindowStart = startOfUtcDay(now);
      const existing = buckets.get(userId);

      const bucket: UserBucket = existing
        ? { ...existing }
        : {
            minuteWindowStart,
            minuteCount: 0,
            dayWindowStart,
            dayCount: 0,
          };

      if (bucket.minuteWindowStart !== minuteWindowStart) {
        bucket.minuteWindowStart = minuteWindowStart;
        bucket.minuteCount = 0;
      }

      if (bucket.dayWindowStart !== dayWindowStart) {
        bucket.dayWindowStart = dayWindowStart;
        bucket.dayCount = 0;
      }

      if (bucket.minuteCount >= limits.maxPerMinute) {
        buckets.set(userId, bucket);
        return { ok: false, reason: 'per_minute' };
      }

      if (bucket.dayCount >= limits.maxPerDay) {
        buckets.set(userId, bucket);
        return { ok: false, reason: 'per_day' };
      }

      bucket.minuteCount += 1;
      bucket.dayCount += 1;
      buckets.set(userId, bucket);
      return { ok: true };
    },
    /** Test helper */
    reset(): void {
      buckets.clear();
    },
    limits,
  };
}

export const coachGenerateRateLimiter = createMemoryRateLimiter();
