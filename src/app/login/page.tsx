"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Copy, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { detectInAppBrowser } from "@/lib/inAppBrowser";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inAppName, setInAppName] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInAppName(detectInAppBrowser(navigator.userAgent));
  }, []);

  async function signInWithGoogle() {
    setLoading(true);
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
      setLoading(false);
      setError((e as Error).message);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="card max-w-md w-full p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl">🧠</div>
          <h1 className="text-2xl font-extrabold">Welcome back</h1>
          <p className="text-duo-gray text-sm">
            Sign in with Google to start learning.
          </p>
        </div>

        {inAppName ? (
          <InAppBrowserNotice appName={inAppName} onCopy={copyLink} copied={copied} />
        ) : (
          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-3 bg-white text-black font-bold rounded-2xl py-3 px-4 disabled:opacity-50 hover:brightness-95 transition"
          >
            <GoogleIcon />
            {loading ? "Redirecting..." : "Continue with Google"}
          </button>
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

function InAppBrowserNotice({
  appName,
  onCopy,
  copied,
}: {
  appName: string;
  onCopy: () => void;
  copied: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-duo-gold bg-duo-gold/10 p-4 space-y-2">
        <div className="flex items-start gap-2">
          <ExternalLink className="w-5 h-5 text-duo-gold shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold">Open in your browser to sign in</p>
            <p className="text-sm text-white/85 mt-1">
              You&apos;re viewing this inside <strong>{appName}</strong>&apos;s in-app browser.
              Google blocks sign-in here for security. Open this page in Safari or
              Chrome and tap &quot;Continue with Google&quot;.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-sm text-duo-gray">
        <p className="font-bold text-white">How to open in your browser:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            <span className="text-white">iPhone:</span> tap the <strong>⋯</strong> or share icon → <strong>Open in Safari</strong>
          </li>
          <li>
            <span className="text-white">Android:</span> tap the <strong>⋮</strong> menu → <strong>Open in Chrome</strong> / external browser
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={onCopy}
        className="btn-ghost w-full inline-flex items-center justify-center gap-2"
      >
        {copied ? (
          <>
            <Check className="w-4 h-4 text-duo-green" />
            Link copied
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Copy link
          </>
        )}
      </button>
    </div>
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
