import { createClient } from "@supabase/supabase-js";

// Service-role client. Use ONLY from server contexts (scripts, API routes you trust).
// Never import this file from a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "createAdminClient: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  // In Node < 22 the realtime client errors at construction time when no native
  // WebSocket is available. We don't need realtime for ingest/server-only use,
  // so provide `ws` as the transport when WebSocket isn't global.
  let transport: unknown;
  if (typeof WebSocket === "undefined") {
    try {
      transport = require("ws");
    } catch {
      transport = undefined;
    }
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: transport ? { transport: transport as never } : undefined,
  });
}
