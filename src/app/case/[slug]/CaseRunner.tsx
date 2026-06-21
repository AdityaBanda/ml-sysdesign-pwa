"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { StageStepper } from "@/components/case/StageStepper";
import { SolutionReveal } from "@/components/case/SolutionReveal";
import type { CaseData } from "@/lib/content/schemas";
import { completeCaseStage } from "@/app/actions/progress";

interface Props {
  caseData: CaseData;
}

export default function CaseRunner({ caseData }: Props) {
  const [stageIndex, setStageIndex] = useState(0);
  const [stageDone, setStageDone] = useState(false);
  const [stageMistakes, setStageMistakes] = useState(0);
  const [done, setDone] = useState<{ totalXp: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const stage = caseData.stages[stageIndex];
  const isFinal = stageIndex + 1 >= caseData.stages.length;

  function onStageComplete({ mistakes }: { mistakes: number }) {
    setStageMistakes(mistakes);
    setStageDone(true);
    startTransition(async () => {
      try {
        const r = await completeCaseStage({
          caseSlug: caseData.slug,
          stageIndex,
          totalStages: caseData.stages.length,
          promptCount: stage.prompts.length,
          mistakes,
        });
        if (r.isFinal) {
          setDone({ totalXp: caseData.xp });
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  function nextStage() {
    setStageDone(false);
    setStageMistakes(0);
    setStageIndex((i) => i + 1);
  }

  if (done) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="text-6xl">🏆</div>
        <h2 className="text-2xl font-extrabold">{caseData.title} solved!</h2>
        <p>You earned <span className="text-duo-gold font-bold">+{caseData.xp} XP</span></p>
        <div className="flex gap-2 justify-center pt-2">
          <Link href="/learn" className="btn-ghost">Back to tree</Link>
          <Link href="/profile" className="btn-primary">View profile</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StageStepper stages={caseData.stages} currentIndex={stageIndex} />

      {stage.intro && (
        <div className="card p-4">
          <p className="text-sm text-duo-gray uppercase tracking-wider">Goal</p>
          <p className="text-sm mt-1">{stage.intro}</p>
        </div>
      )}

      {!stageDone && (
        <LessonPlayer
          key={stageIndex}
          prompts={stage.prompts}
          onComplete={onStageComplete}
          showProgress={false}
        />
      )}

      {stageDone && (
        <SolutionReveal
          rubric={stage.rubric}
          isFinal={isFinal}
          onContinue={isFinal ? () => setDone({ totalXp: caseData.xp }) : nextStage}
        />
      )}

      {pending && <p className="text-duo-gray text-sm">Saving...</p>}
    </div>
  );
}
