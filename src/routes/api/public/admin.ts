import { createFileRoute } from "@tanstack/react-router";
import type { AdminAction } from "@/lib/admin-data.server";
import { z } from "zod";

const id = z.string().uuid();
const inputSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("getOwnerProfile") }),
  z.object({ action: z.literal("verifyAccess") }),
  z.object({ action: z.literal("replyUnanswered") }),
  z.object({ action: z.literal("listAccounts") }),
  z.object({ action: z.literal("listChats") }),
  z.object({ action: z.literal("listManualDeposits") }),
  z.object({ action: z.literal("creditAccount"), userId: id, amount: z.number().positive().max(10000000) }),
  z.object({ action: z.literal("setSuspended"), userId: id, suspended: z.boolean() }),
  z.object({ action: z.literal("getChat"), userId: id }),
  z.object({ action: z.literal("getAccountDetails"), userId: id }),
  z.object({ action: z.literal("sendAdminReply"), userId: id, body: z.string().trim().min(1).max(2000) }),
  z.object({ action: z.literal("reviewManualDeposit"), requestId: id, approve: z.boolean() }),
]);

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
  "cache-control": "no-store",
};

export const Route = createFileRoute("/api/public/admin")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: corsHeaders }),
      POST: async ({ request }) => {
        try {
          const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
          if (!token) return Response.json({ error: "Not found" }, { status: 404, headers: corsHeaders });
          const input = inputSchema.parse(await request.json());
          const { runAdminAction } = await import("@/lib/admin-data.server");
          const data = await runAdminAction(input as AdminAction, token);
          return Response.json({ data }, { headers: corsHeaders });
        } catch (error) {
          const message = error instanceof z.ZodError ? "Invalid request" : error instanceof Error && error.message === "Not authorised" ? "Not found" : "Request failed";
          const status = message === "Not found" ? 404 : 400;
          return Response.json({ error: message }, { status, headers: corsHeaders });
        }
      },
    },
  },
});
