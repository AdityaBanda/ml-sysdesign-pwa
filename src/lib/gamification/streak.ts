/**
 * All dates in UTC. `today` and `lastActive` are 'YYYY-MM-DD' strings.
 */

export function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

export function daysBetweenUTC(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / (1000 * 60 * 60 * 24));
}

export interface StreakInput {
  current: number;
  longest: number;
  lastActive: string | null;
  today?: string;
}

export interface StreakResult {
  current: number;
  longest: number;
  lastActive: string;
  /** True when the user just bumped their streak today (vs. already had it). */
  bumpedToday: boolean;
}

/**
 * Update streak state when a user completes a learning activity.
 * Idempotent within a day.
 */
export function applyActivity(input: StreakInput): StreakResult {
  const today = input.today ?? todayUTC();
  if (!input.lastActive) {
    return {
      current: 1,
      longest: Math.max(1, input.longest),
      lastActive: today,
      bumpedToday: true,
    };
  }
  const delta = daysBetweenUTC(input.lastActive, today);
  if (delta <= 0) {
    // same day — no change
    return {
      current: input.current,
      longest: input.longest,
      lastActive: input.lastActive,
      bumpedToday: false,
    };
  }
  if (delta === 1) {
    const next = input.current + 1;
    return {
      current: next,
      longest: Math.max(input.longest, next),
      lastActive: today,
      bumpedToday: true,
    };
  }
  // missed at least one day — reset to 1
  return {
    current: 1,
    longest: input.longest,
    lastActive: today,
    bumpedToday: true,
  };
}
