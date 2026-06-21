import { redirect } from "next/navigation";
import { Award, Flame, Trophy, Sparkles, Star, GraduationCap } from "lucide-react";
import { HUD } from "@/components/gamification/HUD";
import { BottomNav } from "@/components/gamification/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { ACHIEVEMENTS } from "@/lib/gamification/achievements";
import { leagueForLevel } from "@/lib/gamification/leagues";
import SignOutButton from "./SignOutButton";

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles,
  Trophy,
  Star,
  Flame,
  GraduationCap,
  Award,
};

export default async function ProfilePage() {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) redirect("/login");
  const { data: profile } = await sb.from("profiles").select("*").eq("id", u.user.id).single();
  if (!profile) redirect("/onboarding");

  const { data: earned } = await sb
    .from("achievements")
    .select("badge_slug, earned_at")
    .eq("user_id", u.user.id);
  const earnedSet = new Set((earned ?? []).map((e) => e.badge_slug));

  const league = leagueForLevel(profile.level);

  return (
    <div className="min-h-screen flex flex-col">
      <HUD />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-6 pb-20">
        <section className="card p-6 flex items-center gap-4">
          <div className="text-5xl">{profile.avatar_url ?? "🧠"}</div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-extrabold truncate">{profile.display_name}</h1>
            <p className="text-duo-gray text-sm">
              Level {profile.level} · {league.icon} {league.title}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <Stat label="Total XP" value={profile.total_xp.toString()} />
          <Stat label="Streak" value={`${profile.current_streak}🔥`} />
          <Stat label="Best streak" value={profile.longest_streak.toString()} />
        </section>

        <section>
          <h2 className="text-lg font-extrabold mb-3">Achievements</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a) => {
              const Icon = ICONS[a.icon] ?? Sparkles;
              const got = earnedSet.has(a.slug);
              return (
                <div
                  key={a.slug}
                  className={`card p-4 flex flex-col items-center text-center gap-1 ${
                    got ? "" : "opacity-40"
                  }`}
                >
                  <Icon className={`w-7 h-7 ${got ? "text-duo-gold" : "text-duo-gray"}`} />
                  <p className="text-sm font-bold">{a.title}</p>
                  <p className="text-xs text-duo-gray">{a.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <SignOutButton />
      </main>
      <BottomNav />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4 text-center">
      <p className="text-xs uppercase tracking-wider text-duo-gray">{label}</p>
      <p className="text-2xl font-extrabold">{value}</p>
    </div>
  );
}
