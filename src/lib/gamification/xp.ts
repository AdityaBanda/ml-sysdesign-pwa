export const XP_PER_CORRECT_PROMPT = 10;
export const XP_PER_CASE_STAGE = 50;
export const FIRST_TRY_BONUS = 5;

export function levelFromXp(totalXp: number): number {
  // Gentle curve: each level = ~50 XP with sqrt growth.
  return Math.max(1, Math.floor(Math.sqrt(totalXp / 50)) + 1);
}

export function xpForNextLevel(level: number): number {
  // Inverse of levelFromXp: total XP threshold for level (level + 1).
  return Math.pow(level, 2) * 50;
}

export function xpForLesson(promptCount: number, mistakes: number): number {
  const correct = Math.max(0, promptCount - mistakes);
  const base = correct * XP_PER_CORRECT_PROMPT;
  const bonus = mistakes === 0 ? FIRST_TRY_BONUS : 0;
  return base + bonus;
}

export function xpForCaseStage(promptCount: number, mistakes: number): number {
  const stageBonus = XP_PER_CASE_STAGE;
  const promptXp = Math.max(0, promptCount - mistakes) * XP_PER_CORRECT_PROMPT;
  const noMistakeBonus = mistakes === 0 ? FIRST_TRY_BONUS * 2 : 0;
  return stageBonus + promptXp + noMistakeBonus;
}
