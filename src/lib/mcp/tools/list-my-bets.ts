import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_bets",
  title: "List my bets",
  description: "List the signed-in player's most recent GK Airwin bets and their outcomes.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("How many bets to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("bets")
      .select("id, round_id, amount, cashed_multiplier, win, status, created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = data ?? [];
    const text = rows.length
      ? rows
          .map(
            (b) =>
              `#${b.round_id} · ${Number(b.amount).toFixed(2)} KES · ${b.status}` +
              (b.cashed_multiplier ? ` @ ${Number(b.cashed_multiplier).toFixed(2)}x` : "") +
              (b.win != null ? ` · won ${Number(b.win).toFixed(2)} KES` : ""),
          )
          .join("\n")
      : "No bets yet.";
    return { content: [{ type: "text", text }], structuredContent: { bets: rows } };
  },
});
