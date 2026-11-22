import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { needsProfileAttention } from "@/lib/profile-attention";

export function useProfileAttention(userId: string | undefined, suspended: boolean) {
  const [depositState, setDepositState] = useState<{ userId: string; hasDeposited: boolean } | null>(null);
  useEffect(() => {
    if (!userId || suspended) return;
    let active = true;
    let checking = false;
    let confirmed = false;
    const check = async () => {
      if (checking || confirmed) return;
      checking = true;
      try {
        const results = await Promise.all([
          supabase.from("deposits").select("id").eq("user_id", userId).eq("credited", true).limit(1),
          supabase.from("crypto_deposits").select("id").eq("user_id", userId).eq("credited", true).limit(1),
          supabase.from("manual_deposit_requests").select("id").eq("user_id", userId).eq("status", "approved").limit(1),
        ]);
        const paid = results.some(result => (result.data?.length ?? 0) > 0);
        if (active && (paid || results.every(result => !result.error))) {
          confirmed = paid;
          setDepositState({ userId, hasDeposited: paid });
        }
      } finally { checking = false; }
    };
    void check();
    const timer = setInterval(() => void check(), 15_000);
    const onFocus = () => void check();
    window.addEventListener("focus", onFocus);
    return () => { active = false; clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [userId, suspended]);
  return needsProfileAttention(Boolean(userId), depositState?.userId === userId ? depositState?.hasDeposited ?? null : null, suspended);
}