"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { effectiveHearts, loseHeart, type HeartState } from "@/lib/gamification/hearts";
import { applyActivity } from "@/lib/gamification/streak";
import { levelFromXp, xpForCaseStage, xpForLesson } from "@/lib/gamification/xp";
import { ACHIEVEMENTS, newlyEarned } from "@/lib/gamification/achievements";

interface CompleteLessonInput {
  lessonId: string;
  topicSlug: string;
  promptCount: number;
  mistakes: number;
}

export async function completeLesson(input: CompleteLessonInput) {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const userId = u.user.id;

  const { data: profile } = await sb.from("profiles").select("*").eq("id", userId).single();
  if (!profile) throw new Error("profile missing");

  const xp = xpForLesson(input.promptCount, input.mistakes);
  const newTotalXp = profile.total_xp + xp;
  const newLevel = levelFromXp(newTotalXp);

  const streak = applyActivity({
    current: profile.current_streak,
    longest: profile.longest_streak,
    lastActive: profile.last_active_date,
  });

  // record progress
  const { error: progressErr } = await sb.from("progress").upsert(
    {
      user_id: userId,
      kind: "lesson",
      ref_id: input.lessonId,
      status: "completed",
      best_score: Math.max(0, input.promptCount - input.mistakes),
      mistakes: input.mistakes,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,kind,ref_id" },
  );
  if (progressErr) {
    console.error("[completeLesson] progress upsert failed", progressErr);
    throw new Error(`progress upsert failed: ${progressErr.message}`);
  }

  // xp event
  const { error: xpErr } = await sb
    .from("xp_events")
    .insert({ user_id: userId, source: `lesson:${input.lessonId}`, amount: xp });
  if (xpErr) console.error("[completeLesson] xp_events insert failed", xpErr);

  // update profile
  await sb
    .from("profiles")
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      current_streak: streak.current,
      longest_streak: streak.longest,
      last_active_date: streak.lastActive,
    })
    .eq("id", userId);

  // achievements
  const topicCompleted = await isTopicCompleted(userId, input.topicSlug);
  const { data: earnedRows } = await sb.from("achievements").select("badge_slug").eq("user_id", userId);
  const earnedSlugs = new Set((earnedRows ?? []).map((r) => r.badge_slug));
  const unlocked = newlyEarned({
    earnedSlugs,
    level: newLevel,
    currentStreak: streak.current,
    justCompleted: { kind: "lesson", mistakes: input.mistakes, topicCompleted },
  });
  if (unlocked.length > 0) {
    await sb.from("achievements").insert(unlocked.map((a) => ({ user_id: userId, badge_slug: a.slug })));
  }

  revalidatePath("/learn");
  revalidatePath("/profile");

  return {
    xp,
    newLevel,
    leveledUp: newLevel > profile.level,
    streak,
    achievements: unlocked.map((a) => ({ ...a })),
  };
}

interface CompleteCaseStageInput {
  caseSlug: string;
  stageIndex: number;
  totalStages: number;
  promptCount: number;
  mistakes: number;
}

export async function completeCaseStage(input: CompleteCaseStageInput) {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const userId = u.user.id;

  const { data: profile } = await sb.from("profiles").select("*").eq("id", userId).single();
  if (!profile) throw new Error("profile missing");

  const xp = xpForCaseStage(input.promptCount, input.mistakes);
  const newTotalXp = profile.total_xp + xp;
  const newLevel = levelFromXp(newTotalXp);
  const isFinal = input.stageIndex + 1 >= input.totalStages;

  const streak = applyActivity({
    current: profile.current_streak,
    longest: profile.longest_streak,
    lastActive: profile.last_active_date,
  });

  await sb.from("progress").upsert(
    {
      user_id: userId,
      kind: "case",
      ref_id: input.caseSlug,
      stage_index: input.stageIndex + 1,
      status: isFinal ? "completed" : "in_progress",
      mistakes: input.mistakes,
      completed_at: isFinal ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,kind,ref_id" },
  );

  await sb
    .from("xp_events")
    .insert({ user_id: userId, source: `case:${input.caseSlug}:stage:${input.stageIndex}`, amount: xp });

  await sb
    .from("profiles")
    .update({
      total_xp: newTotalXp,
      level: newLevel,
      current_streak: streak.current,
      longest_streak: streak.longest,
      last_active_date: streak.lastActive,
    })
    .eq("id", userId);

  let achievements: Array<{ slug: string; title: string; description: string; icon: string }> = [];
  if (isFinal) {
    const { data: earnedRows } = await sb
      .from("achievements")
      .select("badge_slug")
      .eq("user_id", userId);
    const earnedSlugs = new Set((earnedRows ?? []).map((r) => r.badge_slug));
    const unlocked = newlyEarned({
      earnedSlugs,
      level: newLevel,
      currentStreak: streak.current,
      justCompleted: { kind: "case", mistakes: input.mistakes },
    });
    if (unlocked.length > 0) {
      await sb.from("achievements").insert(unlocked.map((a) => ({ user_id: userId, badge_slug: a.slug })));
    }
    achievements = unlocked.map((a) => ({ ...a }));
  }

  revalidatePath("/learn");
  revalidatePath("/profile");

  return { xp, newLevel, leveledUp: newLevel > profile.level, isFinal, achievements };
}

export async function loseHeartAction() {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("not authenticated");
  const userId = u.user.id;

  const { data: profile } = await sb.from("profiles").select("hearts, hearts_refilled_at").eq("id", userId).single();
  if (!profile) throw new Error("profile missing");

  const state: HeartState = { hearts: profile.hearts, refilledAt: profile.hearts_refilled_at };
  const next = loseHeart(state);
  await sb
    .from("profiles")
    .update({ hearts: next.hearts, hearts_refilled_at: next.refilledAt })
    .eq("id", userId);
  return next;
}

export async function refreshHeartsAction() {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const userId = u.user.id;
  const { data: profile } = await sb.from("profiles").select("hearts, hearts_refilled_at").eq("id", userId).single();
  if (!profile) return null;
  const state: HeartState = { hearts: profile.hearts, refilledAt: profile.hearts_refilled_at };
  const next = effectiveHearts(state);
  if (next.hearts !== profile.hearts || next.refilledAt !== profile.hearts_refilled_at) {
    await sb
      .from("profiles")
      .update({ hearts: next.hearts, hearts_refilled_at: next.refilledAt })
      .eq("id", userId);
  }
  return next;
}

async function isTopicCompleted(userId: string, topicSlug: string) {
  const sb = await createClient();
  const { data: lessons } = await sb.from("lessons").select("id").eq("topic_slug", topicSlug);
  if (!lessons || lessons.length === 0) return false;
  const ids = lessons.map((l) => l.id as string);
  const { data: done } = await sb
    .from("progress")
    .select("ref_id")
    .eq("user_id", userId)
    .eq("kind", "lesson")
    .eq("status", "completed")
    .in("ref_id", ids);
  return (done?.length ?? 0) === lessons.length;
}
