import Link from "next/link";
import { Lock, Map as MapIcon } from "lucide-react";
import { HUD } from "@/components/gamification/HUD";
import { BottomNav } from "@/components/gamification/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { getCases, getTopics } from "@/lib/content/server";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

export default async function LearnPage() {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) redirect("/login");

  const { data: profile } = await sb.from("profiles").select("display_name").eq("id", u.user.id).single();
  if (!profile?.display_name) {
    // Brand new user — push them through onboarding once.
  }

  const topics = await getTopics();
  const cases = await getCases();

  const { data: progress } = await sb
    .from("progress")
    .select("kind, ref_id, status")
    .eq("user_id", u.user.id);

  const completedLessonIds = new Set(
    (progress ?? [])
      .filter((p) => p.kind === "lesson" && p.status === "completed")
      .map((p) => p.ref_id),
  );
  const completedCaseSlugs = new Set(
    (progress ?? [])
      .filter((p) => p.kind === "case" && p.status === "completed")
      .map((p) => p.ref_id),
  );

  // Resolve possible lesson ids per (topic, order). A given lesson may be
  // referenced by Supabase UUID or by the filesystem fallback id "<topic>#<order>",
  // depending on which client wrote the progress row. We accept either.
  const lessonIdsByTopicAndOrder = new Map<string, Map<number, string[]>>();
  {
    const { data: lessonRows } = await sb.from("lessons").select("id, topic_slug, order");
    const rowIdByKey = new Map<string, string>();
    if (lessonRows) {
      for (const r of lessonRows) {
        rowIdByKey.set(`${r.topic_slug}#${r.order}`, r.id as string);
      }
    }
    for (const t of topics) {
      const map = new Map<number, string[]>();
      for (const l of t.lessons) {
        const key = `${t.slug}#${l.order}`;
        const ids = [key];
        const dbId = rowIdByKey.get(key);
        if (dbId) ids.push(dbId);
        map.set(l.order, ids);
      }
      lessonIdsByTopicAndOrder.set(t.slug, map);
    }
  }

  function isLessonDone(topicSlug: string, order: number) {
    const ids = lessonIdsByTopicAndOrder.get(topicSlug)?.get(order) ?? [];
    return ids.some((id) => completedLessonIds.has(id));
  }

  const topicCompleted = new Set<string>();
  for (const t of topics) {
    if (t.lessons.length > 0 && t.lessons.every((l) => isLessonDone(t.slug, l.order))) {
      topicCompleted.add(t.slug);
    }
  }

  function isUnlocked(prereqs: string[]) {
    return prereqs.every((p) => topicCompleted.has(p));
  }

  return (
    <div className="min-h-screen flex flex-col">
      <HUD />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 space-y-8 pb-20">
        <section>
          <h1 className="text-2xl font-extrabold mb-1">Skill tree</h1>
          <p className="text-duo-gray text-sm mb-4">
            Master each topic before tackling cases.
          </p>
          <div className="space-y-4">
            {topics.map((t, i) => {
              const unlocked = isUnlocked(t.prereq_slugs);
              const done = topicCompleted.has(t.slug);
              const completedCount = t.lessons.filter((l) => isLessonDone(t.slug, l.order)).length;
              const progressPct = t.lessons.length
                ? (completedCount / t.lessons.length) * 100
                : 0;
              return (
                <div key={t.slug} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center font-bold border-4",
                        done
                          ? "bg-duo-gold text-black border-duo-gold"
                          : unlocked
                          ? "bg-duo-green text-black border-duo-greenDark"
                          : "bg-duo-card text-duo-gray border-duo-border",
                      )}
                    >
                      {done ? "★" : unlocked ? t.order : <Lock className="w-4 h-4" />}
                    </div>
                    {i < topics.length - 1 && <div className="w-1 flex-1 bg-duo-border my-1" />}
                  </div>
                  <div className={cn("card p-4 flex-1", !unlocked && "opacity-60")}>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-extrabold">{t.title}</h3>
                      <span className="text-xs text-duo-gray">
                        {completedCount}/{t.lessons.length} lessons
                      </span>
                    </div>
                    {t.intro && <p className="text-sm text-duo-gray mt-1">{t.intro}</p>}
                    {unlocked && (
                      <>
                        <Link
                          href={`/topic/${t.slug}`}
                          className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-duo-green hover:brightness-110"
                        >
                          <MapIcon className="w-4 h-4" /> View the mental map first →
                        </Link>
                        {t.lessons.length > 0 && (
                          <div className="h-1.5 mt-3 bg-duo-bg rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full transition-all",
                                done ? "bg-duo-gold" : "bg-duo-green",
                              )}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        )}
                        <p className="mt-3 text-[10px] uppercase tracking-wider text-duo-gray">
                          Then practice
                        </p>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {t.lessons.map((l) => {
                            const lessonDone = isLessonDone(t.slug, l.order);
                            return (
                              <Link
                                key={l.order}
                                href={`/lesson/${t.slug}/${l.order}`}
                                className={cn(
                                  "text-xs px-3 py-1 rounded-full border inline-flex items-center gap-1 transition",
                                  lessonDone
                                    ? "bg-duo-green/15 border-duo-green text-duo-green hover:brightness-110"
                                    : "bg-duo-bg border-duo-border hover:border-duo-green",
                                )}
                              >
                                <span>{lessonDone ? "✓" : `${l.order}.`}</span>
                                <span>{l.title}</span>
                              </Link>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-extrabold mb-3">Cases</h2>
          <p className="text-duo-gray text-sm mb-4">
            Apply the framework to real interview-style problems.
          </p>
          <div className="grid gap-3">
            {cases.map((c) => {
              const done = completedCaseSlugs.has(c.slug);
              return (
                <Link
                  key={c.slug}
                  href={`/case/${c.slug}`}
                  className={cn(
                    "card p-4 hover:border-duo-green transition flex items-center justify-between gap-3",
                    done && "border-duo-gold",
                  )}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold">{c.title}</h3>
                      {done && <span className="text-duo-gold">★</span>}
                    </div>
                    <p className="text-sm text-duo-gray">{c.summary}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-duo-gray">DIFF</div>
                    <div className="text-xl font-extrabold">{c.difficulty}</div>
                    <div className="text-xs text-duo-gold">+{c.xp} XP</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
