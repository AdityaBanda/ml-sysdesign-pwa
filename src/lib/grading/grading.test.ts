import { describe, expect, it } from "vitest";
import { grade } from "./index";

describe("grade", () => {
  it("MCQ: correct answer", () => {
    const r = grade(
      { type: "mcq", prompt: "x", choices: ["a", "b"], answer: 1 },
      { type: "mcq", selected: 1 },
    );
    expect(r.correct).toBe(true);
  });

  it("MCQ: wrong answer", () => {
    const r = grade(
      { type: "mcq", prompt: "x", choices: ["a", "b"], answer: 1 },
      { type: "mcq", selected: 0 },
    );
    expect(r.correct).toBe(false);
  });

  it("FILL: trims and lowercases", () => {
    const r = grade(
      { type: "fill", prompt: "x", answers: ["Watch Time"] },
      { type: "fill", text: "  watch time  " },
    );
    expect(r.correct).toBe(true);
  });

  it("FILL: rejects mismatch", () => {
    const r = grade(
      { type: "fill", prompt: "x", answers: ["watch time"] },
      { type: "fill", text: "ctr" },
    );
    expect(r.correct).toBe(false);
  });

  it("ORDER: exact match wins", () => {
    const r = grade(
      { type: "order", prompt: "x", items: ["a", "b", "c"] },
      { type: "order", ordered: ["a", "b", "c"] },
    );
    expect(r.correct).toBe(true);
  });

  it("ORDER: shuffled fails", () => {
    const r = grade(
      { type: "order", prompt: "x", items: ["a", "b", "c"] },
      { type: "order", ordered: ["b", "a", "c"] },
    );
    expect(r.correct).toBe(false);
  });

  it("MATCH: all pairs correct", () => {
    const r = grade(
      {
        type: "match",
        prompt: "x",
        pairs: [
          { left: "L1", right: "R1" },
          { left: "L2", right: "R2" },
        ],
      },
      {
        type: "match",
        assignments: [
          { left: "L1", right: "R1" },
          { left: "L2", right: "R2" },
        ],
      },
    );
    expect(r.correct).toBe(true);
  });

  it("MATCH: one wrong fails the whole prompt", () => {
    const r = grade(
      {
        type: "match",
        prompt: "x",
        pairs: [
          { left: "L1", right: "R1" },
          { left: "L2", right: "R2" },
        ],
      },
      {
        type: "match",
        assignments: [
          { left: "L1", right: "R2" },
          { left: "L2", right: "R1" },
        ],
      },
    );
    expect(r.correct).toBe(false);
  });
});
