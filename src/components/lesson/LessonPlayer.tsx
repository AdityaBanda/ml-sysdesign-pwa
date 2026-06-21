"use client";

import { useState } from "react";
import type { PromptData } from "@/lib/content/schemas";
import { PromptRenderer } from "./PromptRenderer";

export interface LessonPlayerProps {
  prompts: PromptData[];
  onComplete: (result: { mistakes: number }) => void;
  onWrongAnswer?: () => void;
  /** Show a progress rail at the top (true for lessons, false when used inside a stage). */
  showProgress?: boolean;
}

export function LessonPlayer({
  prompts,
  onComplete,
  onWrongAnswer,
  showProgress = true,
}: LessonPlayerProps) {
  const [index, setIndex] = useState(0);
  const [mistakes, setMistakes] = useState(0);

  const current = prompts[index];
  const total = prompts.length;

  function handleResult(correct: boolean) {
    if (!correct) {
      setMistakes((m) => m + 1);
      onWrongAnswer?.();
      return;
    }
    if (index + 1 >= total) {
      onComplete({ mistakes });
      return;
    }
    setIndex((i) => i + 1);
  }

  function handleReveal() {
    // User chose "Show answer" after a wrong attempt. Heart was already lost
    // and mistake already counted on the wrong submission; just advance.
    if (index + 1 >= total) {
      onComplete({ mistakes });
      return;
    }
    setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-6">
      {showProgress && <ProgressRail current={index} total={total} />}
      <PromptRenderer
        key={index}
        prompt={current}
        onResult={handleResult}
        onReveal={handleReveal}
      />
    </div>
  );
}

function ProgressRail({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full transition ${
            i < current ? "bg-duo-green" : i === current ? "bg-duo-blue" : "bg-duo-border"
          }`}
        />
      ))}
    </div>
  );
}
