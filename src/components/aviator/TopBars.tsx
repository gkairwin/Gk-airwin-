import { useMoney } from "@/components/aviator/Money";
import { UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppBar({
  signedIn,
  onDeposit,
  onAccount,
  onAdmin,
  profileAttention = false,
}: {
  signedIn: boolean;
  onDeposit: () => void;
  onAccount: () => void;
  onAdmin: () => void;
  profileAttention?: boolean;
}) {
  return (
    <div className="relative w-full bg-[#08090b]" style={{ aspectRatio: "1213 / 106" }}>
      <img src="/gk-topbar.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <button onClick={onAccount} aria-label="Nestlink" className="absolute left-[4%] top-0 h-full w-[24%]" />
      <button onClick={onAdmin} aria-label="Control centre" className="absolute left-[30%] top-0 h-full w-[38%]" />
      <Button
        variant="ghost"
        onClick={onDeposit}
        aria-label="Profile"
        className={`absolute right-[2%] top-[14%] flex h-[72%] w-[20%] items-center justify-center gap-1 rounded-full border border-air-sky/60 bg-gradient-to-b from-[#292a31] to-[#08090b] p-0 text-[clamp(10px,3vw,15px)] font-extrabold text-white shadow-[0_0_12px_-2px_var(--color-air-sky)] hover:bg-[#08090b] hover:text-white [&_svg]:size-[1.1em] ${profileAttention ? "air-profile-attention" : ""}`}
      >
        <UserRound className={`h-[1.1em] w-[1.1em] text-air-sky ${profileAttention ? "air-profile-shake" : ""}`} />Profile
      </Button>
    </div>
  );
}

export function GameHeader({
  balance,
  soundOn,
  signedIn,
  onToggleSound,
  onWithdraw,
  onLogout,
}: {
  balance: number;
  soundOn: boolean;
  signedIn: boolean;
  onToggleSound: () => void;
  onWithdraw: () => void;
  onLogout: () => void;
}) {
  const money = useMoney();

  return (
    <div className="relative flex items-center justify-between bg-[#08090b] py-1 pe-3">
      <img src="/gk-logo.png" alt="Gk Airwin — One World. One Game." className="h-auto w-[62%] max-w-[400px]" />
      <div className="flex shrink-0 flex-col items-end rounded-xl border border-air-green/40 bg-[#1e2025] px-3 py-1 shadow-[0_0_10px_-3px_var(--color-air-green)]">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-white/60">{money.currency}</span>
        <span className="air-word-glow text-[16px] font-extrabold leading-tight text-air-green">{money.fmt(balance)}</span>
      </div>
    </div>
  );
}
