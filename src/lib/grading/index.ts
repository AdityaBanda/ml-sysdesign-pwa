import type { PromptData } from "../content/schemas";

export type AnswerValue =
  | { type: "mcq"; selected: number | number[] }
  | { type: "fill"; text: string }
  | { type: "order"; ordered: string[] }
  | { type: "match"; assignments: Array<{ left: string; right: string }> };

export interface GradeResult {
  correct: boolean;
  feedback?: string;
  expected?: unknown;
}

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");

export function grade(prompt: PromptData, answer: AnswerValue): GradeResult {
  if (prompt.type !== answer.type) {
    return { correct: false, feedback: "Answer type mismatch" };
  }

  switch (prompt.type) {
    case "mcq": {
      const a = answer as Extract<AnswerValue, { type: "mcq" }>;
      const correct = Array.isArray(a.selected)
        ? false // multi-select not used in current content; default false
        : a.selected === prompt.answer;
      return { correct, expected: prompt.answer, feedback: prompt.explanation };
    }
    case "fill": {
      const a = answer as Extract<AnswerValue, { type: "fill" }>;
      const expected = prompt.answers.map(norm);
      const got = norm(a.text ?? "");
      return {
        correct: expected.includes(got),
        expected: prompt.answers,
        feedback: prompt.explanation,
      };
    }
    case "order": {
      const a = answer as Extract<AnswerValue, { type: "order" }>;
      const correct =
        a.ordered.length === prompt.items.length &&
        a.ordered.every((v, i) => v === prompt.items[i]);
      return { correct, expected: prompt.items, feedback: prompt.explanation };
    }
    case "match": {
      const a = answer as Extract<AnswerValue, { type: "match" }>;
      const expectedMap = new Map(prompt.pairs.map((p) => [p.left, p.right]));
      const correct =
        a.assignments.length === prompt.pairs.length &&
        a.assignments.every((p) => expectedMap.get(p.left) === p.right);
      return { correct, expected: prompt.pairs, feedback: prompt.explanation };
    }
  }
}
