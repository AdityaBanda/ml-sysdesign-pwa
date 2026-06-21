"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const AVATARS = ["🧠", "🦊", "🐼", "🦉", "🐙", "🦄", "🤖", "🐳"];
const GOALS = [
  { mins: 5, xp: 30, label: "Casual" },
  { mins: 10, xp: 60, label: "Regular" },
  { mins: 20, xp: 120, label: "Serious" },
  { mins: 30, xp: 180, label: "Insane" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [goal, setGoal] = useState(GOALS[1]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const sb = createClient();
      const { data } = await sb.auth.getUser();
      if (!data.user) router.replace("/login");
      else if (!name) setName(data.user.email?.split("@")[0] ?? "Learner");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const sb = createClient();
      const { data: u } = await sb.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await sb
        .from("profiles")
        .update({
          display_name: name || "Learner",
          avatar_url: avatar,
          daily_xp_goal: goal.xp,
        })
        .eq("id", u.user.id);
      if (error) throw error;
      router.replace("/learn");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="card max-w-md w-full p-8 space-y-6">
        <Stepper step={step} total={3} />
        {step === 0 && (
          <Section title="What should we call you?">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-duo-bg border border-duo-border rounded-2xl px-4 py-3 outline-none focus:border-duo-green"
            />
            <button onClick={() => setStep(1)} className="btn-primary w-full" disabled={!name.trim()}>
              Continue
            </button>
          </Section>
        )}
        {step === 1 && (
          <Section title="Pick an avatar">
            <div className="grid grid-cols-4 gap-3">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => setAvatar(a)}
                  className={`text-4xl p-3 rounded-2xl border-2 transition ${
                    avatar === a
                      ? "border-duo-green bg-duo-green/10"
                      : "border-duo-border hover:border-duo-gray"
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(2)} className="btn-primary w-full">
              Continue
            </button>
          </Section>
        )}
        {step === 2 && (
          <Section title="Pick a daily goal">
            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g.mins}
                  onClick={() => setGoal(g)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition ${
                    goal.mins === g.mins
                      ? "border-duo-green bg-duo-green/10"
                      : "border-duo-border hover:border-duo-gray"
                  }`}
                >
                  <span className="font-bold">{g.label}</span>
                  <span className="text-duo-gray text-sm">
                    {g.mins} min/day · {g.xp} XP
                  </span>
                </button>
              ))}
            </div>
            <button onClick={save} disabled={saving} className="btn-primary w-full disabled:opacity-50">
              {saving ? "Saving..." : "Start learning"}
            </button>
            {error && <p className="text-duo-red text-sm">{error}</p>}
          </Section>
        )}
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold text-center">{title}</h1>
      {children}
    </div>
  );
}

function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-full ${i <= step ? "bg-duo-green" : "bg-duo-border"}`}
        />
      ))}
    </div>
  );
}
