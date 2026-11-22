import { usePlayerLanguage } from "./PlayerLanguage";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CryptoDeposit } from "./CryptoDeposit";
import { ManualDeposit } from "./ManualDeposit";
import { Bitcoin, Landmark } from "lucide-react";
import { startDeposit, checkDeposit } from "@/lib/deposit-api";

type Stage = "form" | "waiting" | "paid" | "failed";

export function DepositDialog({
  open,
  defaultPhone,
  country = "KE",
  onClose,
  onPaid,
}: {
  open: boolean;
  defaultPhone?: string;
  country?: string;
  onClose: () => void;
  onPaid: () => void;
}) {
  const { t } = usePlayerLanguage();
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [editingPhone, setEditingPhone] = useState(false);
  const [amount, setAmount] = useState("100");
  const [stage, setStage] = useState<Stage>("form");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"crypto" | "bank">("crypto");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  };

  useEffect(() => {
    if (open) {
      setStage("form");
      setMsg("");
      setPhone(defaultPhone ?? "");
      setEditingPhone(false);
    } else stop();
    return stop;
  }, [open]);

  useEffect(() => {
    if (open && !editingPhone && defaultPhone) setPhone(defaultPhone);
  }, [open, defaultPhone, editingPhone]);

  if (!open) return null;

  const submit = async () => {
    if (!phone.trim()) {
      setMsg(t("invalidPhone"));
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      const res = await startDeposit(phone, Number(amount));
      setStage("waiting");
      setMsg(res.message);
      const began = Date.now();
      timer.current = setInterval(async () => {
        if (Date.now() - began > 120000) {
          stop();
          setStage("failed");
          setMsg(t("pendingNote"));
          return;
        }
        try {
          const r = await checkDeposit(res.localId);
          if (r.status === "paid") {
            stop();
            setStage("paid");
            setMsg(`KES ${r.amount} added to your balance.`);
            onPaid();
          } else if (r.status === "failed") {
            stop();
            setStage("failed");
            setMsg(t("tryAgain"));
          }
        } catch {
          /* keep polling */
        }
      }, 3000);
    } catch (e) {
      setMsg(t("tryAgain"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-air-overlay px-5">
      <div role="dialog" aria-modal="true" aria-label={t("deposit")} className="air-dialog-arrival max-h-[90dvh] overflow-y-auto w-full max-w-[400px] rounded-lg border-t-2 border-air-brand bg-air-surface p-5 text-air-text ring-1 ring-air-text/10">
        <div className="mb-4 flex items-center justify-between">
          <span className="air-word-glow text-[15px] font-bold">{country === "KE" ? `M-Pesa · ${t("deposit")}` : t("deposit")}</span>
          <Button variant="ghost" onClick={() => { stop(); onClose(); }} className="text-air-text/60" aria-label={t("close")}>✕</Button>
        </div>

        {country !== "KE" && <>
          <div role="group" aria-label={t("deposit")} className="mb-5 grid grid-cols-2 gap-2 border-b border-air-text/10 pb-4">
            <Button variant="ghost" type="button" aria-pressed={method === "crypto"} onClick={() => setMethod("crypto")} className={`h-auto min-h-20 min-w-0 flex-col gap-2 whitespace-normal rounded-lg border px-2 py-3 text-xs transition-colors ${method === "crypto" ? "border-air-green bg-air-green/10 text-air-green" : "border-air-text/10 bg-air-field text-air-muted"}`}>
              <Bitcoin className="size-5 shrink-0" aria-hidden="true" />
              <span>Crypto · NOWPayments</span>
            </Button>
            <Button variant="ghost" type="button" aria-pressed={method === "bank"} onClick={() => setMethod("bank")} className={`h-auto min-h-20 min-w-0 flex-col gap-2 whitespace-normal rounded-lg border px-2 py-3 text-xs transition-colors ${method === "bank" ? "border-air-wait bg-air-wait/10 text-air-wait" : "border-air-text/10 bg-air-field text-air-muted"}`}>
              <Landmark className="size-5 shrink-0" aria-hidden="true" />
              <span>{t("bankTransfer")}</span>
            </Button>
          </div>
          <div hidden={method !== "crypto"}><CryptoDeposit onPaid={onPaid} /></div>
          <div hidden={method !== "bank"}><ManualDeposit country={country} onClose={onClose} /></div>
        </>}

        {country === "KE" && stage === "form" && (
          <>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="deposit-phone" className="text-[12px] text-air-text/60">Safaricom · {t("phone")}</label>
              {defaultPhone && (
                <Button variant="ghost"
                  type="button"
                  onClick={() => setEditingPhone((value) => !value)}
                  className="text-[12px] font-semibold text-air-green"
                >
                  {editingPhone ? t("done") : t("edit")}
                </Button>
              )}
            </div>
            <input
              id="deposit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              readOnly={!!defaultPhone && !editingPhone}
              inputMode="tel"
              placeholder="0712345678"
              className="mb-3 w-full rounded-lg bg-air-field px-3 py-2.5 text-[14px] outline-none ring-1 ring-air-text/10 read-only:opacity-80"
            />
            <label className="mb-1 block text-[12px] text-air-text/60">{t("amount")}</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="mb-3 w-full rounded-lg bg-air-field px-3 py-2.5 text-[14px] outline-none ring-1 ring-air-text/10"
            />
            <div className="mb-3 flex gap-2">
              {[100, 500, 1000, 2000].map((v) => (
                <Button variant="ghost" key={v} onClick={() => setAmount(String(v))} className="h-auto flex-1 rounded-full bg-air-text/10 py-1.5 text-[12px]">
                  {v}
                </Button>
              ))}
            </div>
            {msg && <p className="mb-3 text-[12px] text-air-danger">{msg}</p>}
            <Button variant="ghost"
              disabled={busy}
              onClick={submit}
              className="h-auto w-full whitespace-normal rounded-full bg-air-green py-2.5 text-[14px] font-semibold text-air-action-ink disabled:opacity-60"
            >
              {busy ? t("sending") : t("deposit")}
            </Button>
          </>
        )}

        {stage === "waiting" && (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-air-text/20 border-t-air-green" />
            <p className="text-[13px] text-air-text/80">{msg || "Check your phone and enter your M-Pesa PIN."}</p>
          </div>
        )}

        {(stage === "paid" || stage === "failed") && (
          <div className="py-2 text-center">
            <p className={`mb-4 text-[14px] font-semibold ${stage === "paid" ? "text-air-green" : "text-air-danger"}`}>
              {stage === "paid" ? t("approved") : t("rejected")}
            </p>
            <p className="mb-4 text-[13px] text-air-text/70">{msg}</p>
            <Button variant="ghost" onClick={onClose} className="h-auto w-full whitespace-normal rounded-full bg-air-text/10 py-2.5 text-[13px] font-semibold">
              {t("close")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
