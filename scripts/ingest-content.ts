/* eslint-disable no-console */
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { parseCases, parseFramework, parseTopics } from "../src/lib/content/parse";
import { createAdminClient } from "../src/lib/supabase/admin";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

async function main() {
  const root = path.resolve(process.cwd(), "content");
  const framework = parseFramework(root);
  const topics = parseTopics(root);
  const cases = parseCases(root);

  console.log(`📚 Parsed: framework "${framework.title}", ${topics.length} topics, ${cases.length} cases`);
  topics.forEach((t) => console.log(`   • topic ${t.slug} (${t.lessons.length} lessons)`));
  cases.forEach((c) => console.log(`   • case  ${c.slug} (${c.stages.length} stages)`));

  const dryRun = !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (dryRun) {
    console.log("\n⚠️  No Supabase credentials in env — dry run only.");
    console.log("   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to seed.");
    return;
  }

  const sb = createAdminClient();

  // topics
  const { error: tErr } = await sb.from("topics").upsert(
    topics.map((t) => ({
      slug: t.slug,
      title: t.title,
      order: t.order,
      prereq_slugs: t.prereq_slugs,
      intro: t.intro ?? null,
      mental_map: t.mental_map ?? null,
    })),
  );
  if (tErr) throw new Error(`topics upsert: ${tErr.message}`);

  // lessons — wipe + re-insert per topic to keep ordering clean
  for (const topic of topics) {
    const { error: dErr } = await sb.from("lessons").delete().eq("topic_slug", topic.slug);
    if (dErr) throw new Error(`lessons delete (${topic.slug}): ${dErr.message}`);
    const { error: lErr } = await sb.from("lessons").insert(
      topic.lessons.map((l) => ({
        topic_slug: topic.slug,
        order: l.order,
        title: l.title,
        prompts: l.prompts,
      })),
    );
    if (lErr) throw new Error(`lessons insert (${topic.slug}): ${lErr.message}`);
  }

  // cases
  const { error: cErr } = await sb.from("cases").upsert(
    cases.map((c) => ({
      slug: c.slug,
      title: c.title,
      difficulty: c.difficulty,
      prerequisites: c.prerequisites,
      xp_reward: c.xp,
      summary: c.summary ?? null,
      stages: c.stages,
    })),
  );
  if (cErr) throw new Error(`cases upsert: ${cErr.message}`);

  console.log("\n✅ Seeded Supabase from /content");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
