import { createFileRoute } from "@tanstack/react-router";
import { offlineRoundById } from "@/lib/aviator/offline";
import { z } from "zod";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "cache-control": "no-store",
};

// Registers a round from the shared deterministic schedule so the backend's
// bet/cash-out timing matches exactly what players see. Values are computed
// here from the id only — nothing from the caller is trusted.
export const Route = createFileRoute("/api/public/round")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        const json = (body: unknown, status = 200) =>
          Response.json(body, { status, headers: corsHeaders });
        try {
          const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
          if (!token) return json({ error: "Please sign in first" }, 401);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: user, error: authError } = await supabaseAdmin.auth.getUser(token);
          if (authError || !user.user) return json({ error: "Please sign in again" }, 401);
          const input = z.object({ id: z.number().int().positive().safe() }).parse(await request.json());
          const r = offlineRoundById(Number(input?.id));
          if (!r || Math.abs(r.betOpenAt - Date.now()) > 3_600_000)
            return json({ error: "Invalid round" }, 400);
          const { error } = await supabaseAdmin.from("rounds").upsert({
            id: r.id,
            crash_point: r.crashPoint,
            bet_open_at: new Date(r.betOpenAt).toISOString(),
            takeoff_at: new Date(r.takeoffAt).toISOString(),
            crash_at: new Date(r.crashAt).toISOString(),
            end_at: new Date(r.endAt).toISOString(),
          });
          if (error) return json({ error: "Could not prepare round" }, 500);
          return json({ data: { ok: true } });
        } catch {
          return json({ error: "Invalid request" }, 400);
        }
      },
    },
  },
});
