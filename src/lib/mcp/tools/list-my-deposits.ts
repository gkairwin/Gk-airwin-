import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_deposits",
  title: "List my deposits",
  description: "List the signed-in player's recent M-Pesa deposits and their payment status.",
  inputSchema: {
    limit: z.number().int().min(1).max(50).default(10).describe("How many deposits to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("deposits")
      .select("id, amount, phone, status, credited, mpesa_ref, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 10);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const text = rows.length
      ? rows
          .map(
            (d) =>
              `${new Date(d.created_at).toISOString()} · ${Number(d.amount).toFixed(2)} KES · ${d.status}` +
              (d.credited ? " · credited" : "") +
              (d.mpesa_ref ? ` · ${d.mpesa_ref}` : ""),
          )
          .join("\n")
      : "No deposits yet.";
    return { content: [{ type: "text", text }], structuredContent: { deposits: rows } };
  },
});
