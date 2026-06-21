"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import type { PromptData } from "@/lib/content/schemas";
import { completeLesson, loseHeartAction } from "@/app/actions/progress";

interface Props {
  lessonId: string;
  topicSlug: string;
  prompts: PromptData[];
  nextHref: string;
  hasNext: boolean;
}

export default function LessonRunner({ lessonId, topicSlug, prompts, nextHref, hasNext }: Props) {
  const router = useRouter();
  const [done, setDone] = useState<{ xp: number; leveledUp: boolean } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onComplete({ mistakes }: { mistakes: number }) {
    startTransition(async () => {
      try {
        const r = await completeLesson({
          lessonId,
          topicSlug,
          promptCount: prompts.length,
          mistakes,
        });
        setDone({ xp: r.xp, leveledUp: r.leveledUp });
      } catch (e) {
        console.error(e);
        const msg = e instanceof Error ? e.message : "Failed to save progress";
        setSaveError(msg);
      }
    });
  }

  function onWrongAnswer() {
    loseHeartAction().catch(() => {});
  }

  if (done) {
    return (
      <div className="card p-8 text-center space-y-4">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-extrabold">Lesson complete</h2>
        <p>+{done.xp} XP earned</p>
        {done.leveledUp && <p className="text-duo-gold font-bold">⭐ Level up!</p>}
        <div className="flex gap-2 justify-center pt-2">
          <button onClick={() => router.push("/learn")} className="btn-ghost" type="button">
            Back to tree
          </button>
          <button
            onClick={() => router.push(nextHref)}
            className="btn-primary"
            type="button"
          >
            {hasNext ? "Next lesson" : "Finish"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <LessonPlayer prompts={prompts} onComplete={onComplete} onWrongAnswer={onWrongAnswer} />
      {pending && <p className="text-duo-gray text-sm mt-2">Saving progress...</p>}
      {saveError && (
        <p className="text-duo-red text-sm mt-2">
          Could not save progress: {saveError}
        </p>
      )}
    </div>
  );
}
