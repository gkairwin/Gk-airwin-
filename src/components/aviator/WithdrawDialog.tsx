import { useMoney } from "@/components/aviator/Money";
import { usePlayerLanguage } from "./PlayerLanguage";
const MIN_WITHDRAW = 15000;
const TAX = 1000;

export function WithdrawDialog({
  open,
  balance,
  onClose,
  onDeposit,
}: {
  open: boolean;
  balance: number;
  onClose: () => void;
  onDeposit: () => void;
}) {
  const { t } = usePlayerLanguage();
  const money = useMoney();
  if (!open) return null;

  const shortfall = Math.max(0, MIN_WITHDRAW - balance);
  const eligible = shortfall === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70">
      <div className="w-full max-w-md rounded-t-2xl bg-[#1b1c1d] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[16px] font-bold text-white">{t("withdraw")}</h2>
          <button onClick={onClose} className="text-white/60" aria-label="Close">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="rounded-xl bg-[#101112] p-4 text-center">
          <p className="text-[12px] text-white/50">{t("balance")}</p>
          <p className="text-[24px] font-extrabold text-[#2ecc55]">
            {money.fmt(balance)} <span className="text-[13px] font-normal text-white/60">{money.currency}</span>
          </p>
        </div>

        <p className="mt-4 text-center text-[13px] leading-5 text-white/80">
          {eligible
            ? money.text(t("withdrawFee"))
            : money.text(t("withdrawShort", shortfall.toFixed(0)))}
        </p>

        <button
          onClick={onDeposit}
          className="mt-4 w-full rounded-lg bg-[#28a909] py-3 text-[15px] font-bold text-white"
        >
          {t("deposit")} <bdi dir="ltr">{money.fmt(eligible ? TAX : shortfall, 0)} {money.currency}</bdi>
        </button>
        <button
          onClick={onClose}
          className="mt-2 w-full py-2 text-center text-[12px] text-white/50"
        >
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
