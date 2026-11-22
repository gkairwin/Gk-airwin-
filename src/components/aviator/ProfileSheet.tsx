import { useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ChevronLeft, ChevronRight, Copy, Globe2, History, LogOut, Plane, ShieldCheck, Volume2, VolumeX, Wallet, Check } from "lucide-react";
import { useMoney } from "@/components/aviator/Money";
import { LanguageSelect, usePlayerLanguage } from "./PlayerLanguage";
import { ReferEarn } from "./ReferEarn";
import { avatarSeed, playerId } from "@/lib/player-identity";

function Avatar({ userId }: { userId: string }) {
  const s = avatarSeed(userId);
  const a = `hsl(${s.hue} 85% 55%)`;
  const b = `hsl(${s.hue2} 80% 35%)`;
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={`g${userId}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#g${userId})`} />
      {s.shape === 0 && <circle cx="80" cy="18" r="22" fill="white" opacity=".15" />}
      {s.shape === 1 && <path d="M0 70 L100 30 L100 100 L0 100Z" fill="white" opacity=".12" />}
      {s.shape === 2 && <rect x="-10" y="60" width="130" height="14" fill="white" opacity=".15" transform="rotate(-20 50 50)" />}
      {s.shape === 3 && <circle cx="15" cy="85" r="30" fill="white" opacity=".12" />}
      <circle cx="50" cy="40" r="17" fill="white" opacity=".92" />
      <path d="M18 95c4-20 17-30 32-30s28 10 32 30Z" fill="white" opacity=".92" />
      {s.face === 0 && <path d="M33 33h34v-4a17 17 0 0 0-34 0Z" fill={b} />}
      {s.face === 1 && <rect x="35" y="36" width="30" height="7" rx="3.5" fill={b} />}
      {s.face === 2 && <path d="M31 30 Q50 14 69 30 L74 33 H31Z" fill={a} />}
    </svg>
  );
}

export function ProfileSheet({
  open, userId, balance, soundOn, onClose, onDeposit, onWithdraw, onHistory, onToggleSound, onLogout,
}: {
  open: boolean; userId: string; balance: number; soundOn: boolean;
  onClose: () => void; onDeposit: () => void; onWithdraw: () => void; onHistory: () => void;
  onToggleSound: () => void; onLogout: () => void;
}) {
  const { t } = usePlayerLanguage();
  const money = useMoney();
  const [copied, setCopied] = useState(false);
  if (!open) return null;
  const id = playerId(userId);
  const copy = () => { void navigator.clipboard?.writeText(id); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const go = (fn: () => void) => () => { onClose(); fn(); };

  const Row = ({ icon, title, sub, onClick, tone }: { icon: React.ReactNode; title: string; sub: string; onClick?: () => void; tone: string }) => (
    <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl border border-air-brand/25 bg-air-surface/90 px-3 py-3 text-start shadow-[0_0_14px_-6px_var(--color-air-brand)] transition active:scale-[.98]">
      <span className={`grid h-11 w-11 place-items-center rounded-xl bg-air-page ${tone}`}>{icon}</span>
      <span className="flex-1"><span className="block text-[15px] font-bold text-air-text">{title}</span><span className="block text-[12px] text-air-muted">{sub}</span></span>
      <ChevronRight className="h-5 w-5 text-air-muted" />
    </button>
  );

  return (
    <div className="air-dialog-arrival fixed inset-0 z-50 overflow-y-auto bg-air-page" role="dialog" aria-label="My Account">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--color-air-brand)_28%,transparent),transparent_55%)]" />
      <div className="relative mx-auto max-w-md space-y-3 px-3 pb-8 pt-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} aria-label="Back" className="grid h-11 w-11 place-items-center rounded-xl border border-air-brand/50 bg-air-surface text-air-text shadow-[0_0_12px_-4px_var(--color-air-brand)]"><ChevronLeft /></button>
          <h2 className="air-word-glow flex-1 text-center text-[20px] font-extrabold text-air-text">My Account</h2>
          <span className="w-11" />
        </div>

        <section className="relative overflow-hidden rounded-3xl border-2 border-air-brand/70 bg-air-surface p-4 shadow-[0_0_28px_-6px_var(--color-air-brand)]">
          <div className="absolute -bottom-6 -right-6 h-28 w-56 rotate-[-12deg] bg-gradient-to-r from-transparent via-air-brand/30 to-transparent blur-md" />
          <div className="relative flex items-center gap-4">
            <div className="relative h-24 w-24 shrink-0 rounded-full bg-gradient-to-br from-air-sky via-air-violet to-air-brand p-[3px] shadow-[0_0_20px_-2px_var(--color-air-sky)]">
              <div className="h-full w-full overflow-hidden rounded-full"><Avatar userId={userId} /></div>
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[20px]">👑</span>
            </div>
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[18px] font-extrabold text-air-text">My Account</p>
                <span className="flex items-center gap-1 rounded-full border border-air-green/50 bg-air-win px-2 py-0.5 text-[11px] font-bold text-air-green"><ShieldCheck className="h-3.5 w-3.5" />Verified</span>
              </div>
              <button onClick={copy} className="flex items-center gap-1.5 text-[14px] font-semibold text-air-muted">
                ID: <span className="text-air-text">{id}</span>{copied ? <Check className="h-4 w-4 text-air-green" /> : <Copy className="h-4 w-4" />}
              </button>
              <p className="text-[12px] italic text-air-text/80">Play Smart. Fly Higher.</p>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 rounded-2xl border border-air-line bg-air-surface p-4">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-air-page text-air-wait"><Wallet /></span>
          <div><p className="text-[13px] text-air-muted">Balance ({money.currency})</p><p className="air-word-glow text-[24px] font-extrabold text-air-text">{money.fmt(balance)}</p></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={go(onDeposit)} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-air-brand to-air-cancel py-4 text-[17px] font-extrabold text-air-text shadow-[0_6px_20px_-6px_var(--color-air-brand)] active:scale-[.97]"><ArrowDownToLine className="h-5 w-5" />{t("deposit")}</button>
          <button onClick={go(onWithdraw)} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-b from-air-wait to-air-cashout py-4 text-[17px] font-extrabold text-air-page shadow-[0_6px_20px_-6px_var(--color-air-wait)] active:scale-[.97]"><ArrowUpFromLine className="h-5 w-5" />{t("withdraw")}</button>
        </div>

        <button onClick={onClose} className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-air-brand/50 bg-air-loss p-4 text-start">
          <Plane className="h-10 w-10 -rotate-12 text-air-brand" />
          <span className="flex-1"><span className="block text-[16px] font-extrabold text-air-text">Get the best odds</span><span className="block text-[13px] font-semibold text-air-brand">with GK Airwin Aviator</span></span>
          <span className="flex items-center rounded-xl bg-air-wait px-3 py-2 text-[14px] font-extrabold text-air-page">Play Now<ChevronRight className="h-4 w-4" /></span>
        </button>

        <ReferEarn userId={userId} />

        <p className="pt-1 text-[13px] font-bold tracking-widest text-air-muted">🌍 MY GAME</p>
        <Row icon={<History />} tone="text-air-sky" title="Bet History" sub="Track all your bets and results" onClick={go(onHistory)} />
        <Row icon={soundOn ? <Volume2 /> : <VolumeX />} tone="text-air-green" title={soundOn ? t("soundOn") : t("soundOff")} sub="Tap to switch game sounds" onClick={onToggleSound} />
        <div className="flex w-full items-center gap-3 rounded-2xl border border-air-brand/25 bg-air-surface/90 px-3 py-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-air-page text-air-violet"><Globe2 /></span>
          <span className="flex-1"><span className="block text-[15px] font-bold text-air-text">Language & Region</span><LanguageSelect /></span>
        </div>

        <button onClick={go(onLogout)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-air-brand/70 bg-air-surface py-4 text-[16px] font-bold text-air-text shadow-[0_0_18px_-6px_var(--color-air-brand)]"><LogOut className="h-5 w-5" />{t("logout")}</button>
      </div>
    </div>
  );
}
