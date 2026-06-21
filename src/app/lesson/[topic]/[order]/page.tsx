import { notFound } from "next/navigation";
import { getLessonByOrder, getTopic } from "@/lib/content/server";
import { BackLink } from "@/components/ui/BackLink";
import LessonRunner from "./LessonRunner";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ topic: string; order: string }>;
}) {
  const { topic, order } = await params;
  const orderNum = Number(order);
  const [lesson, topicData] = await Promise.all([
    getLessonByOrder(topic, orderNum),
    getTopic(topic),
  ]);
  if (!lesson) notFound();

  const hasNext = !!topicData?.lessons.find((l) => l.order === orderNum + 1);
  const nextHref = hasNext ? `/lesson/${topic}/${orderNum + 1}` : "/learn";

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6 space-y-2">
        <BackLink href="/learn" label="Back to skill tree" />
        <p className="text-duo-gray text-sm uppercase tracking-wider">{topic}</p>
        <h1 className="text-2xl font-extrabold">{lesson.title}</h1>
      </header>
      <LessonRunner
        lessonId={lesson.id}
        topicSlug={lesson.topic_slug}
        prompts={lesson.prompts}
        nextHref={nextHref}
        hasNext={hasNext}
      />
    </main>
  );
}
