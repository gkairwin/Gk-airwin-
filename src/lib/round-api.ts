import { supabase } from "@/integrations/supabase/client";
const PERMANENT = "https://gk-airwin.lovable.app/api/public/round";
const done = new Set<number>();

export async function ensureRound(id: number): Promise<void> {
  if (done.has(id)) return;
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Please sign in first");
  const host = window.location.hostname;
  const url =
    host === "localhost" || host.endsWith(".lovable.app")
      ? `${window.location.origin}/api/public/round`
      : PERMANENT;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session.access_token}` },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("Round not ready, try again");
  done.add(id);
}
