export interface AchievementDef {
  slug: string;
  title: string;
  description: string;
  icon: string; // lucide icon name (rendered by component)
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { slug: "first-lesson", title: "First Steps", description: "Completed your first lesson.", icon: "Sparkles" },
  { slug: "first-case", title: "Case Cracker", description: "Solved your first ML system design case.", icon: "Trophy" },
  { slug: "no-mistakes-case", title: "Flawless Victory", description: "Solved a case with no mistakes.", icon: "Star" },
  { slug: "streak-3", title: "Warming Up", description: "3-day streak.", icon: "Flame" },
  { slug: "streak-7", title: "On Fire", description: "7-day streak.", icon: "Flame" },
  { slug: "streak-30", title: "Unstoppable", description: "30-day streak.", icon: "Flame" },
  { slug: "topic-mastered", title: "Topic Mastered", description: "Completed every lesson in a topic.", icon: "GraduationCap" },
  { slug: "level-5", title: "Apprentice", description: "Reached level 5.", icon: "Award" },
  { slug: "level-10", title: "Practitioner", description: "Reached level 10.", icon: "Award" },
];

export interface AchievementContext {
  earnedSlugs: Set<string>;
  level: number;
  currentStreak: number;
  justCompleted: { kind: "lesson" | "case"; mistakes: number; topicCompleted?: boolean };
}

export function newlyEarned(ctx: AchievementContext): AchievementDef[] {
  const out: AchievementDef[] = [];
  const has = (slug: string) => ctx.earnedSlugs.has(slug);

  if (ctx.justCompleted.kind === "lesson" && !has("first-lesson")) {
    out.push(ACHIEVEMENTS.find((a) => a.slug === "first-lesson")!);
  }
  if (ctx.justCompleted.kind === "case" && !has("first-case")) {
    out.push(ACHIEVEMENTS.find((a) => a.slug === "first-case")!);
  }
  if (ctx.justCompleted.kind === "case" && ctx.justCompleted.mistakes === 0 && !has("no-mistakes-case")) {
    out.push(ACHIEVEMENTS.find((a) => a.slug === "no-mistakes-case")!);
  }
  if (ctx.justCompleted.topicCompleted && !has("topic-mastered")) {
    out.push(ACHIEVEMENTS.find((a) => a.slug === "topic-mastered")!);
  }
  if (ctx.currentStreak >= 3 && !has("streak-3")) out.push(ACHIEVEMENTS.find((a) => a.slug === "streak-3")!);
  if (ctx.currentStreak >= 7 && !has("streak-7")) out.push(ACHIEVEMENTS.find((a) => a.slug === "streak-7")!);
  if (ctx.currentStreak >= 30 && !has("streak-30")) out.push(ACHIEVEMENTS.find((a) => a.slug === "streak-30")!);
  if (ctx.level >= 5 && !has("level-5")) out.push(ACHIEVEMENTS.find((a) => a.slug === "level-5")!);
  if (ctx.level >= 10 && !has("level-10")) out.push(ACHIEVEMENTS.find((a) => a.slug === "level-10")!);
  return out;
}
