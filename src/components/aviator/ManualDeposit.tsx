import { usePlayerLanguage } from "./PlayerLanguage";
import { useEffect, useState } from "react";
import { Copy, Check, Landmark, Clock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useMoney } from "./Money";
import { bankAmountKes } from "@/lib/bank-deposit-policy";

const ACCOUNT = "05506274696150";
type Req = { id: string; amount: number; payment_code: string; status: string; created_at: string };

export function ManualDeposit({ country, onClose }: { country: string; onClose: () => void }) {
  const { t } = usePlayerLanguage();
  const money = useMoney();
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [recent, setRecent] = useState<Req[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from("manual_deposit_requests")
      .select("id, amount, payment_code, status, created_at")
      .order("created_at", { ascending: false })
      .limit(3);
    setRecent((data ?? []).map((r) => ({ ...r, amount: Number(r.amount) })));
  };
  useEffect(() => { void load(); }, []);

  const copy = async () => {
    try { await navigator.clipboard.writeText(ACCOUNT); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const submit = async () => {
    const amt = bankAmountKes(Number(amount), money.rate);
    const ref = code.trim().toUpperCase();
    if (!(amt >= 100)) return setMsg(money.text(t("invalidAmount")));
    if (!/^[A-Z0-9]{6,64}$/.test(ref)) return setMsg(t("invalidCode"));
    setBusy(true); setMsg("");
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) { setBusy(false); return setMsg(t("signFirst")); }
    const { error } = await supabase.from("manual_deposit_requests").insert({
      user_id: s.user.id, country_code: country, amount: amt, payment_code: ref,
    });
    setBusy(false);
    if (error) return setMsg(/duplicate|unique/i.test(error.message) ? t("duplicateCode") : t("tryAgain"));
    setDone(true); void load();
  };

  if (done) {
    return (
      <div className="py-3 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-air-green/15 ring-1 ring-air-green/40">
          <Clock className="h-7 w-7 text-air-green" />
        </div>
        <p className="text-[15px] font-bold">{t("submitted")}</p>
        <p className="mx-auto mt-1 max-w-[260px] text-[12px] text-air-text/60">
          {t("pendingNote")}
        </p>
        <Button variant="ghost" onClick={onClose} className="mt-5 h-auto w-full whitespace-normal rounded-full bg-air-text/10 py-2.5 text-[13px] font-semibold">{t("close")}</Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 border-b border-air-text/10 pb-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-bold text-air-wait">
          <Landmark className="h-4 w-4" /> {t("bankTransfer")}
        </div>
        <p className="text-[11px] text-air-text/50">{t("bank")}</p>
        <p className="mb-2 text-[14px] font-bold">I&amp;M Bank, Kenya</p>
        <p className="text-[11px] text-air-text/50">{t("account")}</p>
        <div className="flex items-center justify-between">
          <p className="min-w-0 font-mono text-[16px] font-black"><bdi dir="ltr">{ACCOUNT}</bdi></p>
          <Button variant="ghost" onClick={copy} aria-label={copied ? t("copied") : t("copy")} title={copied ? t("copied") : t("copy")} size="icon" className="shrink-0 rounded-md bg-air-text/10">
            {copied ? <Check className="h-3.5 w-3.5 text-air-green" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
      <p className="mb-4 text-[12px] leading-relaxed text-air-text/60">{money.text(t("transferInstructions"))}</p>
      <label className="mb-1 block text-[12px] text-air-text/60" htmlFor="transfer-amount">{money.text(t("amountSent"))}</label>
      <input id="transfer-amount" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" placeholder={money.fmt(1000, 0)} disabled={!money.rate || busy}
        className="mb-3 w-full rounded-lg bg-air-field px-3 py-2.5 text-[14px] outline-none ring-1 ring-air-text/10 focus:ring-air-green" />
      <label className="mb-1 block text-[12px] text-air-text/60" htmlFor="transfer-code">{t("paymentCode")}</label>
      <input dir="ltr" id="transfer-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="UK74Q0T…" maxLength={64}
        className="mb-3 w-full rounded-lg bg-air-field px-3 py-2.5 font-mono text-[14px] tracking-wider outline-none ring-1 ring-air-text/10 focus:ring-air-green" />
      {msg && <p role="alert" className="mb-3 text-[12px] text-air-danger">{msg}</p>}
      <Button variant="ghost" disabled={busy || !money.rate} onClick={submit}
        className="flex h-auto w-full items-center justify-center gap-2 whitespace-normal rounded-lg bg-air-green py-3 text-[14px] font-semibold text-air-action-ink disabled:opacity-60">
        <ShieldCheck className="h-4 w-4" />{busy ? t("sending") : t("confirm")}
      </Button>
      {recent.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-air-text/10 pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-air-text/40">{t("recent")}</p>
          {recent.map((r) => (
            <div key={r.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-1 text-[12px]">
              <span dir="ltr" className="min-w-0 break-all font-mono text-air-text/70">{r.payment_code}</span>
              <span className="text-air-text/70">{money.fmt(r.amount)} {money.currency}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r.status === "approved" ? "bg-air-green/20 text-air-green" : r.status === "rejected" ? "bg-air-danger/20 text-air-danger" : "bg-air-wait/20 text-air-wait"}`}>{t(r.status === "approved" ? "approved" : r.status === "rejected" ? "rejected" : "pending")}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
