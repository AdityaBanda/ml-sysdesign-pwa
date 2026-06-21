export const MAX_HEARTS = 5;
export const REGEN_MS = 30 * 60 * 1000; // 30 min per heart

export interface HeartState {
  hearts: number;
  refilledAt: string; // ISO timestamp
}

export function effectiveHearts(state: HeartState, now = Date.now()): HeartState {
  if (state.hearts >= MAX_HEARTS) {
    return { hearts: MAX_HEARTS, refilledAt: new Date(now).toISOString() };
  }
  const last = new Date(state.refilledAt).getTime();
  const elapsed = Math.max(0, now - last);
  const gained = Math.floor(elapsed / REGEN_MS);
  if (gained === 0) return state;
  const next = Math.min(MAX_HEARTS, state.hearts + gained);
  if (next === MAX_HEARTS) {
    return { hearts: next, refilledAt: new Date(now).toISOString() };
  }
  // advance the timer by the consumed regen windows
  const newRef = new Date(last + gained * REGEN_MS).toISOString();
  return { hearts: next, refilledAt: newRef };
}

export function loseHeart(state: HeartState, now = Date.now()): HeartState {
  const eff = effectiveHearts(state, now);
  const next = Math.max(0, eff.hearts - 1);
  // when going from full to partial, restart the regen clock
  const refilledAt = eff.hearts === MAX_HEARTS ? new Date(now).toISOString() : eff.refilledAt;
  return { hearts: next, refilledAt };
}

export function msUntilNextHeart(state: HeartState, now = Date.now()): number {
  if (state.hearts >= MAX_HEARTS) return 0;
  const last = new Date(state.refilledAt).getTime();
  return Math.max(0, last + REGEN_MS - now);
}
