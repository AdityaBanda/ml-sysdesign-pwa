"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  const router = useRouter();
  async function signOut() {
    const sb = createClient();
    await sb.auth.signOut();
    router.replace("/");
  }
  return (
    <button onClick={signOut} className="btn-ghost w-full">
      Sign out
    </button>
  );
}
