import { describe, expect, it } from "vitest";
import { effectiveHearts, loseHeart, MAX_HEARTS, REGEN_MS } from "./hearts";
import { applyActivity } from "./streak";
import { levelFromXp, xpForLesson, xpForCaseStage } from "./xp";

describe("xp", () => {
  it("levelFromXp grows gently", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(50)).toBe(2);
    expect(levelFromXp(200)).toBe(3);
    expect(levelFromXp(450)).toBe(4);
  });

  it("xpForLesson rewards no-mistake bonus", () => {
    expect(xpForLesson(5, 0)).toBe(5 * 10 + 5);
    expect(xpForLesson(5, 1)).toBe(4 * 10);
  });

  it("xpForCaseStage adds stage bonus + no-mistake bonus", () => {
    expect(xpForCaseStage(3, 0)).toBe(50 + 30 + 10);
    expect(xpForCaseStage(3, 2)).toBe(50 + 10);
  });
});

describe("hearts", () => {
  const NOW = new Date("2026-06-20T12:00:00Z").getTime();

  it("regenerates over time", () => {
    const start = {
      hearts: 1,
      refilledAt: new Date(NOW - 2 * REGEN_MS).toISOString(),
    };
    const eff = effectiveHearts(start, NOW);
    expect(eff.hearts).toBe(3);
  });

  it("caps at max", () => {
    const start = {
      hearts: 4,
      refilledAt: new Date(NOW - 100 * REGEN_MS).toISOString(),
    };
    const eff = effectiveHearts(start, NOW);
    expect(eff.hearts).toBe(MAX_HEARTS);
  });

  it("loseHeart decrements and starts timer when full", () => {
    const start = { hearts: MAX_HEARTS, refilledAt: new Date(NOW).toISOString() };
    const next = loseHeart(start, NOW);
    expect(next.hearts).toBe(MAX_HEARTS - 1);
    expect(new Date(next.refilledAt).getTime()).toBe(NOW);
  });
});

describe("streak", () => {
  it("starts a streak from null lastActive", () => {
    const r = applyActivity({ current: 0, longest: 0, lastActive: null, today: "2026-06-20" });
    expect(r.current).toBe(1);
    expect(r.longest).toBe(1);
  });

  it("increments on consecutive days", () => {
    const r = applyActivity({ current: 4, longest: 4, lastActive: "2026-06-19", today: "2026-06-20" });
    expect(r.current).toBe(5);
    expect(r.longest).toBe(5);
  });

  it("does nothing same day", () => {
    const r = applyActivity({ current: 4, longest: 4, lastActive: "2026-06-20", today: "2026-06-20" });
    expect(r.current).toBe(4);
    expect(r.bumpedToday).toBe(false);
  });

  it("resets after a missed day, longest preserved", () => {
    const r = applyActivity({ current: 7, longest: 9, lastActive: "2026-06-17", today: "2026-06-20" });
    expect(r.current).toBe(1);
    expect(r.longest).toBe(9);
  });
});
