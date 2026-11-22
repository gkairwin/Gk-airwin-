import { createFileRoute } from "@tanstack/react-router";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "cache-control": "no-store",
};

export const Route = createFileRoute("/api/public/deposit")({
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
          const { data: auth, error } = await supabaseAdmin.auth.getUser(token);
          if (error || !auth.user) return json({ error: "Please sign in again" }, 401);
          const ctx = { userId: auth.user.id };

          const input = (await request.json()) as {
            action?: string;
            phone?: string;
            amount?: number;
            localId?: string;
          };
          const dep = await import("@/lib/deposits.server");
          if (input?.action === "start") {
            const data = dep.validateStart({ phone: String(input.phone ?? ""), amount: Number(input.amount) });
            return json({ data: await dep.runStartDeposit(data, ctx) });
          }
          if (input?.action === "check") {
            return json({ data: await dep.runCheckDeposit({ localId: String(input.localId ?? "") }, ctx) });
          }
          return json({ error: "Invalid request" }, 400);
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "Request failed" }, 400);
        }
      },
    },
  },
});
