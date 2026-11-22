import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getBalance from "./tools/get-balance";
import listMyBets from "./tools/list-my-bets";
import listMyDeposits from "./tools/list-my-deposits";
import roundHistory from "./tools/round-history";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "gk-airwin-creator",
  title: "GK Airwin Creator",
  version: "0.1.0",
  instructions:
    "Tools for the GK Airwin Aviator app. Read the signed-in player's balance, bet history and M-Pesa deposits, plus recent round crash points. All tools act as the authenticated player.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  // Tools declare no outputSchema; cast keeps exactOptionalPropertyTypes happy.
  tools: [getBalance, listMyBets, listMyDeposits, roundHistory] as unknown as Parameters<
    typeof defineMcp
  >[0]["tools"],
});
