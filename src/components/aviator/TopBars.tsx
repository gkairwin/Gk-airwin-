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
    <div
      className="relative flex h-[50px] w-full items-center justify-between overflow-hidden px-3 border-b border-white/5"
      style={{
        background: "linear-gradient(90deg, #5c0715 0%, #15060d 25%, #080d1a 50%, #060913 75%, #05070d 100%)",
      }}
    >
      <div className="pointer-events-none absolute -left-4 -top-6 h-24 w-32 rounded-full bg-red-600/30 blur-xl" />

      <button
        onClick={onAccount}
        className="relative z-10 flex items-center gap-1.5 rounded-full border border-red-500/50 bg-[#18090f]/90 px-3 py-1 shadow-[0_0_12px_rgba(239,68,68,0.25)] active:scale-95 transition-transform"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
        <span className="text-[12px] font-black uppercase tracking-wider text-red-500">Nestlink</span>
      </button>

      <button
        onClick={onAdmin}
        className="relative z-10 flex items-center gap-1.5 active:scale-95 transition-transform"
        aria-label="Control centre"
      >
        <svg className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
        <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-cyan-400 bg-clip-text text-[13px] font-black tracking-wider text-transparent drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          GLOBAL AVIATOR
        </span>
        <svg className="h-4 w-4 -rotate-45 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
        </svg>
      </button>

      <Button
        variant="ghost"
        onClick={onDeposit}
        aria-label="Profile"
        className={`relative z-10 flex h-[32px] items-center gap-1 rounded-full border border-cyan-400/60 bg-gradient-to-b from-[#1b2230] to-[#0e131d] px-3 py-0 text-[12px] font-bold text-white shadow-[0_0_12px_rgba(34,211,238,0.35)] hover:bg-[#0e131d] hover:text-white ${profileAttention ? "air-profile-attention" : ""}`}
      >
        <UserRound className={`h-3.5 w-3.5 text-cyan-400 ${profileAttention ? "air-profile-shake" : ""}`} />
        Profile
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
    <div className="flex items-center justify-between bg-[#08090b] px-3 py-1.5">
      <div className="flex items-center gap-2 rounded-lg border-t border-red-500/80 border-b border-white/5 bg-[#14151a] px-3 py-1.5 shadow-md">
        <div className="flex items-center gap-1">
          <span className="text-[17px] font-black italic tracking-tight text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]">
            Gk Airwin
          </span>
          <svg className="h-3.5 w-3.5 text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
          </svg>
        </div>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/50">
          — ONE WORLD. ONE GAME.
        </span>
      </div>

      <div className="flex flex-col items-end rounded-xl border border-emerald-500/40 bg-[#14181f] px-3 py-1 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/70">{money.currency}</span>
        <span className="air-word-glow text-[16px] font-black leading-tight text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]">
          {money.fmt(balance)}
        </span>
      </div>
    </div>
  );
}
