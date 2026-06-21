"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
      setStatus("sent");
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="card max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🧠</div>
          <h1 className="text-2xl font-extrabold">Welcome back</h1>
          <p className="text-duo-gray text-sm">
            We&apos;ll send you a magic link. No passwords.
          </p>
        </div>
        {status === "sent" ? (
          <div className="text-center space-y-2">
            <div className="text-4xl">📬</div>
            <p>Check <span className="font-semibold">{email}</span> for the link.</p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-duo-bg border border-duo-border rounded-2xl px-4 py-3 outline-none focus:border-duo-green"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="btn-primary w-full disabled:opacity-50"
            >
              {status === "sending" ? "Sending..." : "Send magic link"}
            </button>
            {error && <p className="text-duo-red text-sm">{error}</p>}
          </form>
        )}
        <div className="text-center text-xs text-duo-gray pt-4 border-t border-duo-border">
          By continuing you agree to be lifelong-learner-curious.
          <br />
          <Link href="/" className="underline">Back home</Link>
        </div>
      </div>
    </main>
  );
}
