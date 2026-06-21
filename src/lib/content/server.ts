import { createClient } from "@/lib/supabase/server";
import type { CaseData, PromptData, TopicData } from "./schemas";
import { loadAllContent, loadCase, loadTopic } from "./loader";

/**
 * Try Supabase first; fall back to local filesystem if the row isn't present
 * (useful before you've run `pnpm ingest`).
 */

export interface LessonRow {
  id: string;
  topic_slug: string;
  order: number;
  title: string;
  prompts: PromptData[];
}

export async function getTopics(): Promise<TopicData[]> {
  try {
    const sb = await createClient();
    const { data: topics } = await sb.from("topics").select("*").order("order");
    if (topics && topics.length > 0) {
      const { data: lessons } = await sb.from("lessons").select("*").order("order");
      const byTopic = new Map<string, LessonRow[]>();
      (lessons ?? []).forEach((l) => {
        const arr = byTopic.get(l.topic_slug) ?? [];
        arr.push(l as LessonRow);
        byTopic.set(l.topic_slug, arr);
      });
      return topics.map((t) => ({
        slug: t.slug,
        title: t.title,
        order: t.order,
        prereq_slugs: t.prereq_slugs ?? [],
        intro: t.intro ?? undefined,
        mental_map: t.mental_map ?? undefined,
        lessons: (byTopic.get(t.slug) ?? []).map((l) => ({
          order: l.order,
          title: l.title,
          prompts: l.prompts,
        })),
      }));
    }
  } catch {
    // fall through to fs
  }
  return loadAllContent().topics;
}

export async function getTopic(slug: string): Promise<TopicData | null> {
  const all = await getTopics();
  const fromDb = all.find((t) => t.slug === slug);
  const fromFs = loadTopic(slug);
  if (!fromDb) return fromFs;
  // Supabase may be missing the mental_map column until the migration is run.
  // Fall back to the filesystem-authored mental map whenever the DB lacks one.
  return { ...fromDb, mental_map: fromDb.mental_map ?? fromFs?.mental_map };
}

export async function getCases(): Promise<CaseData[]> {
  try {
    const sb = await createClient();
    const { data } = await sb.from("cases").select("*").order("difficulty");
    if (data && data.length > 0) {
      return data.map((c) => ({
        slug: c.slug,
        title: c.title,
        difficulty: c.difficulty,
        prerequisites: c.prerequisites ?? [],
        xp: c.xp_reward,
        summary: c.summary ?? undefined,
        stages: c.stages,
      }));
    }
  } catch {
    // fall through
  }
  return loadAllContent().cases;
}

export async function getCase(slug: string): Promise<CaseData | null> {
  const all = await getCases();
  return all.find((c) => c.slug === slug) ?? loadCase(slug);
}

export async function getLessonByOrder(topicSlug: string, order: number) {
  try {
    const sb = await createClient();
    const { data } = await sb
      .from("lessons")
      .select("*")
      .eq("topic_slug", topicSlug)
      .eq("order", order)
      .single();
    if (data) return data as LessonRow;
  } catch {
    // ignore
  }
  const topic = loadTopic(topicSlug);
  const lesson = topic?.lessons.find((l) => l.order === order);
  if (!lesson) return null;
  return {
    id: `${topicSlug}#${order}`,
    topic_slug: topicSlug,
    order: lesson.order,
    title: lesson.title,
    prompts: lesson.prompts,
  } satisfies LessonRow;
}
