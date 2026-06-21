import Link from "next/link";
import { notFound } from "next/navigation";
import { Map, ArrowRight } from "lucide-react";
import { getTopic } from "@/lib/content/server";
import { BackLink } from "@/components/ui/BackLink";
import { MermaidDiagram } from "@/components/topic/MermaidDiagram";
import { HUD } from "@/components/gamification/HUD";
import { BottomNav } from "@/components/gamification/BottomNav";

export default async function TopicMentalMapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const topic = await getTopic(slug);
  if (!topic) notFound();

  const mm = topic.mental_map;
  const firstLessonHref = `/lesson/${topic.slug}/${topic.lessons[0]?.order ?? 1}`;

  return (
    <div className="min-h-screen flex flex-col">
      <HUD />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 space-y-6 pb-24">
        <BackLink href="/learn" label="Back to skill tree" />

        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-duo-green font-bold">
            <Map className="w-4 h-4" /> Mental map
          </div>
          <h1 className="text-3xl font-extrabold">{topic.title}</h1>
          {topic.intro && <p className="text-duo-gray">{topic.intro}</p>}
        </header>

        <div className="card p-4 space-y-2 border-duo-green/40">
          <p className="text-sm font-bold text-duo-green">How this works</p>
          <ol className="text-sm text-duo-gray list-decimal list-inside space-y-1">
            <li>Read the mental map below — the flow and the key concepts.</li>
            <li>Practice with the lessons (quick quizzes).</li>
            <li>Apply it in a case study.</li>
          </ol>
        </div>

        {mm ? (
          <>
            {mm.summary && (
              <section>
                <h2 className="text-lg font-extrabold mb-2">In one breath</h2>
                <p className="text-duo-gray">{mm.summary}</p>
              </section>
            )}

            <section>
              <h2 className="text-lg font-extrabold mb-2">The flow</h2>
              <MermaidDiagram chart={mm.diagram} />
            </section>

            {mm.concepts.length > 0 && (
              <section>
                <h2 className="text-lg font-extrabold mb-3">Key concepts</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {mm.concepts.map((c) => (
                    <div key={c.title} className="card p-4">
                      <h3 className="font-bold mb-1">{c.title}</h3>
                      <p className="text-sm text-duo-gray">{c.body}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <p className="text-duo-gray text-sm">
            No mental map authored for this topic yet.
          </p>
        )}

        <section className="card p-4 flex items-center justify-between gap-3 border-duo-green/40">
          <div>
            <p className="text-xs uppercase tracking-wider text-duo-gray">Next</p>
            <p className="font-bold">Practice with lesson 1: {topic.lessons[0]?.title}</p>
          </div>
          <Link href={firstLessonHref} className="btn-primary inline-flex items-center gap-2">
            Start lesson <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
