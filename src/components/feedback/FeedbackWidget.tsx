"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { MessageSquare, X, Star } from "lucide-react";
import { submitFeedback } from "@/app/actions/feedback";
import { cn } from "@/lib/utils";

type Status = "idle" | "sending" | "sent" | "error";

export function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setOpen(false);
    setTimeout(() => {
      setRating(0);
      setHover(0);
      setMessage("");
      setStatus("idle");
      setError(null);
    }, 200);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 3) {
      setError("Please share a little more detail.");
      return;
    }
    setStatus("sending");
    setError(null);
    try {
      await submitFeedback({ rating, message, page: pathname });
      setStatus("sent");
      setTimeout(reset, 1500);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Could not send feedback.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-20 right-4 z-40 bg-duo-green text-black rounded-full p-3 shadow-lg hover:brightness-110 transition md:bottom-6"
      >
        <MessageSquare className="w-5 h-5" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 p-4"
          onClick={reset}
        >
          <div
            className="card w-full max-w-md p-6 space-y-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={reset}
              aria-label="Close"
              className="absolute top-3 right-3 text-duo-gray hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-xl font-extrabold">Help shape this app 🙏</h2>
              <p className="text-sm text-duo-gray mt-1">
                You&apos;re an early user — tell me what works, what doesn&apos;t, what&apos;s missing.
              </p>
            </div>

            {status === "sent" ? (
              <div className="text-center py-6 space-y-2">
                <div className="text-4xl">🎉</div>
                <p className="font-bold">Thanks! Got it.</p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-duo-gray mb-2">
                    How&apos;s your experience so far?
                  </p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const filled = (hover || rating) >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRating(n)}
                          onMouseEnter={() => setHover(n)}
                          onMouseLeave={() => setHover(0)}
                          aria-label={`${n} star${n > 1 ? "s" : ""}`}
                          className="p-1"
                        >
                          <Star
                            className={cn(
                              "w-7 h-7 transition",
                              filled
                                ? "fill-duo-gold stroke-duo-gold"
                                : "stroke-duo-gray",
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-wider text-duo-gray mb-2">
                    Your feedback
                  </p>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What would make this better for you?"
                    maxLength={2000}
                    className="w-full bg-duo-bg border border-duo-border rounded-2xl px-4 py-3 outline-none focus:border-duo-green text-sm resize-none"
                  />
                </div>

                {error && <p className="text-duo-red text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {status === "sending" ? "Sending..." : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
