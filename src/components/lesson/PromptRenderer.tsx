"use client";

import { useEffect, useMemo, useState } from "react";
import type { PromptData } from "@/lib/content/schemas";
import { grade, type AnswerValue } from "@/lib/grading";
import { cn } from "@/lib/utils";

export interface PromptRendererProps {
  prompt: PromptData;
  onResult: (correct: boolean) => void;
  onReveal?: () => void;
}

export function PromptRenderer({ prompt, onResult, onReveal }: PromptRendererProps) {
  const [answer, setAnswer] = useState<AnswerValue | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function submit() {
    if (!answer) return;
    const r = grade(prompt, answer);
    setSubmitted(true);
    setCorrect(r.correct);
    onResult(r.correct);
  }

  function reset() {
    setAnswer(null);
    setSubmitted(false);
    setCorrect(false);
  }

  if (revealed) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold leading-tight">{prompt.prompt}</h2>
        <CorrectAnswerPanel prompt={prompt} onContinue={() => onReveal?.()} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", submitted && !correct && "animate-shake")}>
      <h2 className="text-xl font-extrabold leading-tight">{prompt.prompt}</h2>
      <div>
        {prompt.type === "mcq" && (
          <McqInput prompt={prompt} answer={answer} setAnswer={setAnswer} disabled={submitted} />
        )}
        {prompt.type === "fill" && (
          <FillInput prompt={prompt} answer={answer} setAnswer={setAnswer} disabled={submitted} />
        )}
        {prompt.type === "order" && (
          <OrderInput prompt={prompt} answer={answer} setAnswer={setAnswer} disabled={submitted} />
        )}
        {prompt.type === "match" && (
          <MatchInput prompt={prompt} answer={answer} setAnswer={setAnswer} disabled={submitted} />
        )}
      </div>

      {submitted ? (
        <FeedbackBar
          correct={correct}
          explanation={prompt.explanation}
          onContinue={reset}
          onShowAnswer={onReveal ? () => setRevealed(true) : undefined}
        />
      ) : (
        <button onClick={submit} disabled={!answer} className="btn-primary w-full disabled:opacity-40">
          Check
        </button>
      )}
    </div>
  );
}

function FeedbackBar({
  correct,
  explanation,
  onContinue,
  onShowAnswer,
}: {
  correct: boolean;
  explanation?: string;
  onContinue: () => void;
  onShowAnswer?: () => void;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 border-2 space-y-3",
        correct ? "bg-duo-green/10 border-duo-green" : "bg-duo-red/10 border-duo-red",
      )}
    >
      <div className="flex items-center gap-2 font-extrabold">
        <span>{correct ? "✅ Nice." : "❌ Not quite."}</span>
      </div>
      {explanation && <p className="text-sm text-white/80">{explanation}</p>}
      <div className={cn("grid gap-2", !correct && onShowAnswer ? "grid-cols-2" : "grid-cols-1")}>
        <button onClick={onContinue} className="btn-primary">
          {correct ? "Continue" : "Try again"}
        </button>
        {!correct && onShowAnswer && (
          <button onClick={onShowAnswer} className="btn-ghost">
            Show answer
          </button>
        )}
      </div>
    </div>
  );
}

function CorrectAnswerPanel({
  prompt,
  onContinue,
}: {
  prompt: PromptData;
  onContinue: () => void;
}) {
  return (
    <div className="rounded-2xl border-2 border-duo-blue bg-duo-blue/10 p-4 space-y-3">
      <p className="font-extrabold text-duo-blue">💡 Correct answer</p>
      <CorrectAnswerBody prompt={prompt} />
      {prompt.explanation && (
        <div>
          <p className="text-xs uppercase tracking-wider text-duo-gray mb-1">Why</p>
          <p className="text-sm text-white/85">{prompt.explanation}</p>
        </div>
      )}
      <button onClick={onContinue} className="btn-primary w-full">
        Continue
      </button>
    </div>
  );
}

function CorrectAnswerBody({ prompt }: { prompt: PromptData }) {
  if (prompt.type === "mcq") {
    return (
      <p className="text-sm text-white/90">
        <span className="font-bold">{prompt.choices[prompt.answer]}</span>
      </p>
    );
  }
  if (prompt.type === "fill") {
    return (
      <p className="text-sm text-white/90">
        <span className="text-duo-gray">Accepted: </span>
        <span className="font-bold">{prompt.answers.join(", ")}</span>
      </p>
    );
  }
  if (prompt.type === "order") {
    return (
      <ol className="text-sm space-y-1">
        {prompt.items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-duo-gray shrink-0">{i + 1}.</span>
            <span>{it}</span>
          </li>
        ))}
      </ol>
    );
  }
  if (prompt.type === "match") {
    return (
      <ul className="text-sm space-y-1">
        {prompt.pairs.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="font-semibold">{p.left}</span>
            <span className="text-duo-gray">→</span>
            <span>{p.right}</span>
          </li>
        ))}
      </ul>
    );
  }
  return null;
}

// --- inputs ---------------------------------------------------------------

function McqInput({
  prompt,
  answer,
  setAnswer,
  disabled,
}: {
  prompt: Extract<PromptData, { type: "mcq" }>;
  answer: AnswerValue | null;
  setAnswer: (v: AnswerValue) => void;
  disabled: boolean;
}) {
  const selected = answer?.type === "mcq" ? (answer.selected as number) : -1;
  return (
    <div className="space-y-2">
      {prompt.choices.map((c, i) => (
        <button
          key={i}
          disabled={disabled}
          onClick={() => setAnswer({ type: "mcq", selected: i })}
          className={cn(
            "w-full text-left p-4 rounded-2xl border-2 transition disabled:opacity-80",
            selected === i
              ? "border-duo-blue bg-duo-blue/10"
              : "border-duo-border hover:border-duo-gray",
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function FillInput({
  prompt,
  answer,
  setAnswer,
  disabled,
}: {
  prompt: Extract<PromptData, { type: "fill" }>;
  answer: AnswerValue | null;
  setAnswer: (v: AnswerValue) => void;
  disabled: boolean;
}) {
  const text = answer?.type === "fill" ? answer.text : "";
  return (
    <input
      type="text"
      autoFocus
      disabled={disabled}
      placeholder="Type your answer..."
      value={text}
      onChange={(e) => setAnswer({ type: "fill", text: e.target.value })}
      className="w-full bg-duo-bg border-2 border-duo-border rounded-2xl px-4 py-3 outline-none focus:border-duo-blue"
    />
  );
}

function OrderInput({
  prompt,
  answer,
  setAnswer,
  disabled,
}: {
  prompt: Extract<PromptData, { type: "order" }>;
  answer: AnswerValue | null;
  setAnswer: (v: AnswerValue) => void;
  disabled: boolean;
}) {
  // Stable shuffled pool generated once per prompt instance.
  const pool = useMemo(() => shuffle([...prompt.items]), [prompt]);
  const ordered = answer?.type === "order" ? answer.ordered : [];
  const remaining = pool.filter((i) => !ordered.includes(i));

  function add(item: string) {
    setAnswer({ type: "order", ordered: [...ordered, item] });
  }
  function removeAt(i: number) {
    const next = ordered.slice();
    next.splice(i, 1);
    setAnswer({ type: "order", ordered: next });
  }

  return (
    <div className="space-y-3">
      <div className="min-h-[3rem] p-2 rounded-2xl border-2 border-dashed border-duo-border space-y-1">
        {ordered.length === 0 && <p className="text-duo-gray text-sm">Tap items below in order.</p>}
        {ordered.map((it, i) => (
          <button
            key={it}
            disabled={disabled}
            onClick={() => removeAt(i)}
            className="w-full text-left p-2 rounded-xl bg-duo-blue/10 border border-duo-blue"
          >
            <span className="text-duo-gray mr-2">{i + 1}.</span> {it}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {remaining.map((it) => (
          <button
            key={it}
            disabled={disabled}
            onClick={() => add(it)}
            className="px-3 py-2 rounded-xl border border-duo-border hover:border-duo-gray text-sm"
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
}

function MatchInput({
  prompt,
  answer,
  setAnswer,
  disabled,
}: {
  prompt: Extract<PromptData, { type: "match" }>;
  answer: AnswerValue | null;
  setAnswer: (v: AnswerValue) => void;
  disabled: boolean;
}) {
  // Each tile carries a stable index so duplicate right-side strings remain
  // independently selectable.
  const rights = useMemo(
    () => shuffle(prompt.pairs.map((p, i) => ({ value: p.right, id: i }))),
    [prompt],
  );
  const assignments = answer?.type === "match" ? answer.assignments : [];
  const [usedByLeft, setUsedByLeft] = useState<Record<string, number>>({});
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  // Reset local "used tile" tracking when the parent clears the answer
  // (e.g. after a wrong submission → retry).
  useEffect(() => {
    if (assignments.length === 0 && Object.keys(usedByLeft).length > 0) {
      setUsedByLeft({});
      setActiveLeft(null);
    }
  }, [assignments.length, usedByLeft]);

  const usedRightIds = new Set(Object.values(usedByLeft));

  function pickLeft(left: string) {
    setActiveLeft((cur) => (cur === left ? null : left));
  }

  function pickRight(rightId: number, rightValue: string) {
    if (!activeLeft || disabled) return;
    const next = assignments.filter((a) => a.left !== activeLeft);
    next.push({ left: activeLeft, right: rightValue });
    setAnswer({ type: "match", assignments: next });
    setUsedByLeft({ ...usedByLeft, [activeLeft]: rightId });
    setActiveLeft(null);
  }

  function clearLeft(left: string) {
    setAnswer({ type: "match", assignments: assignments.filter((a) => a.left !== left) });
    const next = { ...usedByLeft };
    delete next[left];
    setUsedByLeft(next);
    if (activeLeft === left) setActiveLeft(null);
  }

  function rightOf(left: string) {
    return assignments.find((a) => a.left === left)?.right;
  }

  const hint = activeLeft
    ? "Now tap a match on the right →"
    : "Tap an item on the left, then its match on the right.";

  return (
    <div className="space-y-3">
      <p className="text-sm text-duo-gray">{hint}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {prompt.pairs.map((p) => {
            const r = rightOf(p.left);
            const active = activeLeft === p.left;
            return (
              <button
                key={p.left}
                disabled={disabled}
                onClick={() => (r ? clearLeft(p.left) : pickLeft(p.left))}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border-2 transition",
                  active && "border-duo-blue bg-duo-blue/10",
                  r && !active && "border-duo-green bg-duo-green/10",
                  !active && !r && "border-duo-border hover:border-duo-gray",
                )}
              >
                <div className="font-semibold">{p.left}</div>
                {r && <div className="text-xs text-duo-gray mt-1">→ {r} · tap to clear</div>}
                {active && <div className="text-xs text-duo-blue mt-1">selected — pick a right</div>}
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {rights.map(({ value, id }) => {
            const used = usedRightIds.has(id);
            return (
              <button
                key={id}
                disabled={disabled || used || !activeLeft}
                onClick={() => pickRight(id, value)}
                className={cn(
                  "w-full text-left p-3 rounded-2xl border-2 transition",
                  used
                    ? "opacity-40 border-duo-border"
                    : activeLeft
                      ? "border-duo-blue/40 hover:border-duo-blue"
                      : "border-duo-border",
                )}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
