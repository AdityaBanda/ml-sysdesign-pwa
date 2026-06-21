"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

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

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setError(null);
    try {
      const sb = createClient();
      const { error } = await sb.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${location.origin}/auth/callback` },
      });
      if (error) throw error;
      // Browser redirects to Google — no further state changes here.
    } catch (e) {
      setGoogleLoading(false);
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
            Sign in with Google, or get a magic link by email.
          </p>
        </div>

        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="w-full inline-flex items-center justify-center gap-3 bg-white text-black font-bold rounded-2xl py-3 px-4 disabled:opacity-50 hover:brightness-95 transition"
        >
          <GoogleIcon />
          {googleLoading ? "Redirecting..." : "Continue with Google"}
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-duo-border" />
          <span className="text-xs uppercase tracking-wider text-duo-gray">or</span>
          <div className="flex-1 h-px bg-duo-border" />
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
          </form>
        )}

        {error && <p className="text-duo-red text-sm text-center">{error}</p>}

        <div className="text-center text-xs text-duo-gray pt-4 border-t border-duo-border">
          By continuing you agree to be lifelong-learner-curious.
          <br />
          <Link href="/" className="underline">Back home</Link>
        </div>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.583-5.036-3.71H.957v2.332A8.997 8.997 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}
