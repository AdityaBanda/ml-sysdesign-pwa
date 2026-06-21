"use server";

import { createClient } from "@/lib/supabase/server";

interface SubmitFeedbackInput {
  rating: number;
  message: string;
  page?: string;
}

export async function submitFeedback(input: SubmitFeedbackInput) {
  const sb = await createClient();
  const { data: u } = await sb.auth.getUser();
  if (!u.user) throw new Error("not authenticated");

  const message = input.message.trim();
  if (message.length < 3) throw new Error("message too short");
  if (message.length > 2000) throw new Error("message too long");
  const rating = Number.isFinite(input.rating)
    ? Math.min(5, Math.max(1, Math.round(input.rating)))
    : null;

  const { error } = await sb.from("feedback").insert({
    user_id: u.user.id,
    rating,
    message,
    page: input.page ?? null,
  });
  if (error) throw new Error(error.message);
  return { ok: true };
}
