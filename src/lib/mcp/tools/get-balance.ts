import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_balance",
  title: "Get my balance",
  description: "Get the signed-in player's GK Airwin account balance in KES.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("profiles")
      .select("balance, phone")
      .eq("id", ctx.getUserId()!)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data)
      return { content: [{ type: "text", text: "No player profile found." }], isError: true };
    const balance = Number(data.balance);
    return {
      content: [{ type: "text", text: `Balance: ${balance.toFixed(2)} KES` }],
      structuredContent: { balance, phone: data.phone },
    };
  },
});
