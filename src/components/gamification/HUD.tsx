import Link from "next/link";
import { Flame, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { effectiveHearts } from "@/lib/gamification/hearts";
import { leagueForLevel } from "@/lib/gamification/leagues";
import { levelFromXp, xpForNextLevel } from "@/lib/gamification/xp";

export async function HUD() {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const { data: profile } = await sb.from("profiles").select("*").eq("id", u.user.id).single();
  if (!profile) return null;

  const hearts = effectiveHearts({
    hearts: profile.hearts,
    refilledAt: profile.hearts_refilled_at,
  });

  const level = levelFromXp(profile.total_xp);
  const nextLevelXp = xpForNextLevel(level);
  const prevLevelXp = level > 1 ? Math.pow(level - 1, 2) * 50 : 0;
  const progressPct = Math.min(
    100,
    Math.max(0, ((profile.total_xp - prevLevelXp) / Math.max(1, nextLevelXp - prevLevelXp)) * 100),
  );
  const league = leagueForLevel(level);

  return (
    <div className="sticky top-0 z-30 backdrop-blur bg-duo-bg/80 border-b border-duo-border">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link href="/profile" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">{profile.avatar_url ?? "🧠"}</span>
          <span className="text-xs text-duo-gray hidden sm:block">Lv {level}</span>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="h-2 bg-duo-border rounded-full overflow-hidden">
            <div
              className="h-full bg-duo-green transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-duo-gray mt-1">
            <span>{league.icon} {league.title}</span>
            <span>{profile.total_xp} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-duo-orange shrink-0" title={`${profile.current_streak}-day streak`}>
          <Flame className="w-5 h-5" />
          <span className="font-bold text-sm">{profile.current_streak}</span>
        </div>

        <div className="flex items-center gap-1 text-duo-red shrink-0" title={`${hearts.hearts} hearts`}>
          <Heart className="w-5 h-5 fill-current" />
          <span className="font-bold text-sm">{hearts.hearts}</span>
        </div>
      </div>
    </div>
  );
}
