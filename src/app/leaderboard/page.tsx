import { redirect } from "next/navigation";
import { HUD } from "@/components/gamification/HUD";
import { BottomNav } from "@/components/gamification/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { leagueForLevel } from "@/lib/gamification/leagues";

export default async function LeaderboardPage() {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) redirect("/login");

  const { data: rows } = await sb
    .from("leaderboard_weekly")
    .select("*")
    .order("week_xp", { ascending: false })
    .limit(3);

  const me = u.user.id;

  return (
    <div className="min-h-screen flex flex-col">
      <HUD />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-4 pb-20">
        <header>
          <h1 className="text-2xl font-extrabold">Weekly League</h1>
          <p className="text-duo-gray text-sm">
            Top 3 XP earners this week. Resets every Monday UTC.
          </p>
        </header>
        <ol className="space-y-2">
          {(rows ?? []).map((r, idx) => {
            const isMe = r.user_id === me;
            const league = leagueForLevel(r.level ?? 1);
            return (
              <li
                key={r.user_id}
                className={`card p-3 flex items-center gap-3 ${isMe ? "border-duo-green" : ""}`}
              >
                <div className="w-8 text-center font-extrabold text-duo-gray">{idx + 1}</div>
                <div className="text-2xl">{league.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className={`font-bold truncate ${isMe ? "text-duo-green" : ""}`}>
                    {r.display_name ?? "Anonymous"}
                    {isMe && <span className="text-xs ml-2 text-duo-green">(you)</span>}
                  </p>
                  <p className="text-xs text-duo-gray">
                    Lv {r.level ?? 1} · {r.current_streak ?? 0}🔥
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-duo-gold">{r.week_xp ?? 0}</p>
                  <p className="text-[10px] text-duo-gray">XP</p>
                </div>
              </li>
            );
          })}
          {(!rows || rows.length === 0) && (
            <p className="text-duo-gray text-sm text-center py-12">
              No XP earned this week — be the first!
            </p>
          )}
        </ol>
      </main>
      <BottomNav />
    </div>
  );
}
