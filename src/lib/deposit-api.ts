import { supabase } from "@/integrations/supabase/client";

const PERMANENT_DEPOSIT_API = "https://gk-airwin.lovable.app/api/public/deposit";

function endpoint() {
  const host = window.location.hostname;
  return host === "localhost" || host.endsWith(".lovable.app")
    ? `${window.location.origin}/api/public/deposit`
    : PERMANENT_DEPOSIT_API;
}

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Please sign in first");
  const res = await fetch(endpoint(), {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!res.ok || !payload?.data) throw new Error(payload?.error ?? "Payment service is temporarily unavailable");
  return payload.data;
}

export const startDeposit = (phone: string, amount: number) =>
  call<{ localId: string; message: string }>({ action: "start", phone, amount });

export const checkDeposit = (localId: string) =>
  call<{ status: "paid" | "failed" | "pending"; amount: number; message?: string }>({ action: "check", localId });
