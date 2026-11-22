import { useEffect, useState } from "react";
import { Check, Copy, Gift, Share2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMoney } from "@/components/aviator/Money";
import { REFERRAL_BONUS_KES, REFERRAL_COMMISSION, referralLink } from "@/lib/referral-policy";

export function ReferEarn({ userId }: { userId: string }) {
  const money = useMoney();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ friends: 0, earned: 0 });
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    void (async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", userId).maybeSingle(),
        supabase.from("referral_rewards").select("referred_id,amount").eq("referrer_id", userId),
      ]);
      if (!active) return;
      setCode(p?.referral_code ?? null);
      const rows = r ?? [];
      setStats({ friends: new Set(rows.map((x) => x.referred_id)).size, earned: rows.reduce((s, x) => s + Number(x.amount), 0) });
    })();
    return () => { active = false; };
  }, [userId]);
  const link = code ? referralLink(window.location.origin, code) : "";
  const share = async () => {
    if (!link) return;
    const text = `Join me on GK Airwin Aviator and play! ${link}`;
    try { if (navigator.share) { await navigator.share({ title: "GK Airwin", text, url: link }); return; } } catch { /* fall back to copy */ }
    await navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="air-dialog-arrival rounded-2xl border border-air-green/40 bg-air-surface/90 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-air-page text-air-green"><Gift /></span>
        <span className="flex-1">
          <span className="air-word-glow block text-[16px] font-extrabold text-air-text">Refer & Earn</span>
          <span className="block text-[12px] text-air-muted">Get {money.fmt(REFERRAL_BONUS_KES, 0)} {money.currency} when a friend deposits, plus {REFERRAL_COMMISSION * 100}% of every deposit they make.</span>
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-air-page px-3 py-2">
        <span className="flex-1 truncate text-[12px] text-air-text">{link || "Loading your link…"}</span>
        <button aria-label="Copy invite link" disabled={!link} onClick={() => { void navigator.clipboard?.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1500); }} className="text-air-muted">
          {copied ? <Check className="h-4 w-4 text-air-green" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
      <button onClick={() => void share()} disabled={!link} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-air-wait py-3 text-[15px] font-extrabold text-air-page active:scale-[.97]"><Share2 className="h-4 w-4" />Invite friends</button>
      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-air-page py-2"><p className="text-[18px] font-extrabold text-air-text">{stats.friends}</p><p className="text-[11px] text-air-muted">Friends deposited</p></div>
        <div className="rounded-xl bg-air-page py-2"><p className="text-[18px] font-extrabold text-air-green">{money.fmt(stats.earned)} {money.currency}</p><p className="text-[11px] text-air-muted">Earned</p></div>
      </div>
    </div>
  );
}
