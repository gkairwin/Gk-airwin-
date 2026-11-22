import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "round_history",
  title: "Round history",
  description: "Get the crash points (flew-away multipliers) of recent finished GK Airwin rounds.",
  inputSchema: {
    limit: z.number().int().min(1).max(100).default(20).describe("How many rounds to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ limit }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.rpc("round_history", { p_limit: limit ?? 20 });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    const rows = (data ?? []) as { crash_point: number }[];
    return {
      content: [
        {
          type: "text",
          text: rows.length
            ? rows.map((r) => `${Number(r.crash_point).toFixed(2)}x`).join(", ")
            : "No finished rounds yet.",
        },
      ],
      structuredContent: { rounds: rows },
    };
  },
});
