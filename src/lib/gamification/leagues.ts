export const LEAGUES = [
  { slug: "bronze", title: "Bronze League", color: "#cd7f32", icon: "🥉" },
  { slug: "silver", title: "Silver League", color: "#c0c0c0", icon: "🥈" },
  { slug: "gold", title: "Gold League", color: "#ffd700", icon: "🥇" },
  { slug: "sapphire", title: "Sapphire League", color: "#1cb0f6", icon: "💎" },
  { slug: "ruby", title: "Ruby League", color: "#ff4b4b", icon: "❤️‍🔥" },
  { slug: "diamond", title: "Diamond League", color: "#b9f2ff", icon: "💠" },
] as const;

export type LeagueSlug = (typeof LEAGUES)[number]["slug"];

export function leagueForLevel(level: number): (typeof LEAGUES)[number] {
  if (level >= 25) return LEAGUES[5];
  if (level >= 18) return LEAGUES[4];
  if (level >= 12) return LEAGUES[3];
  if (level >= 7) return LEAGUES[2];
  if (level >= 3) return LEAGUES[1];
  return LEAGUES[0];
}
