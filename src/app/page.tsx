import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="text-6xl">🧠</div>
        <h1 className="text-3xl font-extrabold leading-tight">
          Learn ML System Design.<br />
          <span className="text-duo-green">One step at a time.</span>
        </h1>
        <p className="text-duo-gray">
          Bite-sized lessons, real interview cases, streaks, XP, and a skill tree.
          Just like Duolingo — but for ML system design.
        </p>
        <div className="flex flex-col gap-3 pt-4">
          <Link href="/login" className="btn-primary">Get started</Link>
          <Link href="/learn" className="btn-ghost">I already have an account</Link>
        </div>
      </div>
    </main>
  );
}
