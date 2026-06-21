import { notFound } from "next/navigation";
import { getCase } from "@/lib/content/server";
import { BackLink } from "@/components/ui/BackLink";
import CaseRunner from "./CaseRunner";

export default async function CasePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = await getCase(slug);
  if (!c) notFound();

  return (
    <main className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6 space-y-2">
        <BackLink href="/learn" label="Back to skill tree" />
        <p className="text-duo-gray text-sm uppercase tracking-wider">
          Case · Difficulty {c.difficulty} · {c.xp} XP
        </p>
        <h1 className="text-2xl font-extrabold">{c.title}</h1>
        {c.summary && <p className="text-duo-gray mt-2 text-sm">{c.summary}</p>}
      </header>
      <CaseRunner caseData={c} />
    </main>
  );
}
