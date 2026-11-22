import { useMoney } from "@/components/aviator/Money";
import { localToBetKes } from "@/lib/currency";
import { usePlayerLanguage } from "./PlayerLanguage";
import { useEffect, useState } from "react";
import type { BetState } from "@/hooks/useAviatorGame";

const CHIPS = [100, 200, 500, 20000];

export function BetPanel({
  index,
  bet,
  multiplier,
  canAddPanel,
  onPlace,
  onCancel,
  onCashOut,
  onAmount,
  onUpdate,
  onAddPanel,
  onRemovePanel,
}: {
  index: number;
  bet: BetState;
  multiplier: number;
  canAddPanel: boolean;
  onPlace: () => void;
  onCancel: () => void;
  onCashOut: () => void;
  onAmount: (n: number) => void;
  onUpdate: (patch: Partial<BetState>) => void;
  onAddPanel: () => void;
  onRemovePanel: () => void;
}) {
  const { t } = usePlayerLanguage();
  const money = useMoney();
  const show = (kes: number) => (money.currency === "KES" ? kes.toFixed(2) : money.local(kes).toFixed(2));
  const fromInput = (v: number) => (money.currency === "KES" || !money.rate ? v : localToBetKes(v, money.rate));
  const [tab, setTab] = useState<"bet" | "auto">("bet");
  const [amountEditing, setAmountEditing] = useState(false);
  const [amountInput, setAmountInput] = useState(show(bet.amount));

  useEffect(() => {
    if (!amountEditing) setAmountInput(show(bet.amount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountEditing, bet.amount, money.rate]);

  const mainAction = () => {
    if (bet.active) return onCashOut();
    if (bet.queued || bet.placed) return onCancel();
    onPlace();
  };

  return (
    <div className="mx-2 mt-2 rounded-[18px] bg-air-surface p-2">
      <div className="mb-2 flex items-center justify-center gap-2">
        <div className="flex rounded-full bg-air-field p-[3px]">
          <button
            onClick={() => setTab("bet")}
            className={`rounded-full min-w-16 px-5 py-[5px] text-[13px] font-medium transition-colors ${
              tab === "bet" ? "bg-air-raised text-air-text" : "text-air-text/70"
            }`}
          >
            {t("bet")}
          </button>
          <button
            onClick={() => setTab("auto")}
            className={`rounded-full min-w-16 px-5 py-[5px] text-[13px] font-medium transition-colors ${
              tab === "auto" ? "bg-air-raised text-air-text" : "text-air-text/70"
            }`}
          >
            {t("auto")}
          </button>
        </div>
        <button
          onClick={index === 0 ? onAddPanel : onRemovePanel}
          disabled={index === 0 && !canAddPanel}
          className="ml-1 flex h-7 w-7 items-center justify-center rounded-md border border-air-green/50 text-air-green disabled:opacity-30"
          aria-label={index === 0 ? "Add second bet" : "Remove this bet"}
        >
          {index === 0 ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="13" height="13" rx="2" />
              <path d="M8 21h11a2 2 0 0 0 2-2V8" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          )}
        </button>
      </div>

      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between rounded-full bg-air-field px-1 py-1">
            <button
              onClick={() => onAmount(Math.max(100, bet.amount - 10))}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-air-raised text-lg leading-none text-air-text/70 active:scale-95"
            >
              −
            </button>
            <input
              type="text"
              inputMode="decimal"
              aria-label={`Bet amount in ${money.currency}`}
              value={amountInput}
              onFocus={() => {
                setAmountEditing(true);
                setAmountInput(String(bet.amount));
              }}
              onChange={(event) => {
                const value = event.currentTarget.value;
                if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
                  setAmountInput(value);
                  const amount = fromInput(Number(value));
                  if (amount >= 100 && amount <= 100000) onAmount(amount);
                }
              }}
              onBlur={() => {
                setAmountEditing(false);
                const amount = fromInput(Number(amountInput));
                if (!Number.isFinite(amount) || amount < 100) {
                  setAmountInput(show(bet.amount));
                } else {
                  onAmount(Math.min(100000, amount));
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") event.currentTarget.blur();
              }}
              className="min-w-0 w-full bg-transparent text-center text-[17px] font-semibold text-air-text outline-none"
            />
            <button
              onClick={() => onAmount(Math.min(100000, bet.amount + 10))}
              className="flex h-7 w-7 items-center justify-center rounded-full bg-air-raised text-lg leading-none text-air-text/70 active:scale-95"
            >
              +
            </button>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => onAmount(c)}
                className="rounded-full bg-air-field py-1 text-[12px] text-air-text/80 active:bg-air-raised"
              >
                {money.fmt(c, 0)}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={mainAction}
          className={`flex min-w-0 flex-1 flex-col items-center justify-center rounded-[16px] border-2 text-air-text air-bet-shadow transition-transform active:scale-[0.98] ${
            bet.active
              ? "border-air-cashout-edge bg-air-cashout"
              : bet.queued
                ? "border-air-queued-edge bg-air-queued"
                : bet.placed
                  ? "border-air-cancel-edge bg-air-cancel"
                  : "border-air-action-edge bg-air-action"
          }`}
        >
          <span className="w-full break-words px-1 text-center text-[15px] font-semibold leading-tight">
            {bet.active
              ? t("cashout")
              : bet.queued
                ? t("nextRound")
                : bet.placed
                  ? t("cancel")
                  : t("bet")}
          </span>
          <span className="text-[16px] font-semibold leading-tight">
            {bet.active
              ? money.fmt(bet.amount * multiplier)
              : money.fmt(bet.amount)}{" "}
            <span className="text-[12px]">{money.currency}</span>
          </span>
          {bet.queued && (
            <span className="mt-0.5 text-[10px] opacity-80">{t("cancel")}</span>
          )}
        </button>
      </div>

      {tab === "auto" && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-air-field px-3 py-2">
          <label className="flex items-center gap-2 text-[12px] text-air-text/80">
            <Toggle on={bet.autoBet} onClick={() => onUpdate({ autoBet: !bet.autoBet })} />
            {t("autoBet")}
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-[12px] text-air-text/80">
              <Toggle
                on={bet.autoCashOut}
                onClick={() => onUpdate({ autoCashOut: !bet.autoCashOut })}
              />
              {t("autoCashout")}
            </label>
            <input
              type="number"
              step="0.1"
              min="1.01"
              value={bet.autoCashOutAt}
              onChange={(e) =>
                onUpdate({ autoCashOutAt: Math.max(1.01, Number(e.target.value) || 1.01) })
              }
              className="w-16 rounded-full bg-air-field px-2 py-1 text-center text-[12px] text-air-text outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="switch"
      aria-checked={on}
      className={`relative h-[18px] w-8 rounded-full transition-colors ${
        on ? "bg-air-action" : "bg-air-raised"
      }`}
    >
      <span
        className={`absolute top-[2px] h-[14px] w-[14px] rounded-full bg-air-text transition-all ${
          on ? "left-[16px]" : "left-[2px]"
        }`}
      />
    </button>
  );
}
