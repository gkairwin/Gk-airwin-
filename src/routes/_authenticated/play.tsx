import { toast } from "sonner";
import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BetPanel } from "@/components/aviator/BetPanel";
import { BetsList } from "@/components/aviator/BetsList";
import { WithdrawDialog } from "@/components/aviator/WithdrawDialog";
import { DepositDialog } from "@/components/aviator/DepositDialog";
import { GameCanvas } from "@/components/aviator/GameCanvas";
import { HistoryStrip } from "@/components/aviator/HistoryStrip";
import { AppBar, GameHeader } from "@/components/aviator/TopBars";
import { useAviatorGame } from "@/hooks/useAviatorGame";
import { useAviatorSound } from "@/lib/aviator/sound";
import { supabase } from "@/integrations/supabase/client";
import { MoneyProvider, useMoney } from "@/components/aviator/Money";
import { ProfileSheet } from "@/components/aviator/ProfileSheet";
import { PlayerChat } from "@/components/aviator/PlayerChat";
import { useProfileAttention } from "@/hooks/useProfileAttention";

export const Route = createFileRoute("/_authenticated/play")({
  head: () => ({
    meta: [
      { title: "Play GK Airwin Aviator" },
      {
        name: "description",
        content:
          "Watch the GK Airwin Aviator multiplier climb and cash out before the plane flies away.",
      },
      { property: "og:title", content: "Play GK Airwin Aviator" },
      {
        property: "og:description",
        content:
          "Watch the GK Airwin Aviator multiplier climb and cash out before the plane flies away.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AviatorPage,
});

function AviatorPage() {
  const game = useAviatorGame();
  const profileAttention = useProfileAttention(game.user?.id, game.suspended);
  const sound = useAviatorSound(game.phase);
  const navigate = useNavigate();
  const { queryClient } = Route.useRouteContext();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFocus = () => void game.refreshBalance();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openDeposit = () => setDepositOpen(true);

  useEffect(() => {
    if (!game.error) return;
    const t = setTimeout(() => game.clearError(), 3000);
    return () => clearTimeout(t);
  }, [game]);

  const signOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  return (
    <MoneyProvider country={game.country}>
    <main className="min-h-screen bg-air-page pb-6">
      <h1 className="sr-only">GK Airwin Aviator</h1>
      <AppBar
        signedIn
        profileAttention={profileAttention}
        onDeposit={() => setProfileOpen(true)}
        onAccount={() => void signOut()}
        onAdmin={() => void navigate({ to: "/admin" })}
      />
      <GameHeader
        balance={game.balance}
        soundOn={sound.enabled}
        signedIn
        onToggleSound={sound.toggle}
        onWithdraw={() => (game.suspended ? toast.error("ACCOUNT SUSPENDED — hacking or bots detected.") : setWithdrawOpen(true))}
        onLogout={() => void signOut()}
      />
      {game.suspended && (
        <div role="alert" className="mx-2 my-2 rounded-lg bg-destructive px-4 py-3 text-center text-destructive-foreground">
          <p className="text-[15px] font-black tracking-wide">ACCOUNT SUSPENDED</p>
          <p className="text-[12px] font-semibold">Hacking or bots detected. You cannot place bets or withdraw.</p>
        </div>
      )}
      <HistoryStrip history={game.history} />
      <div className="pt-2">
        <GameCanvas
          phase={game.phase}
          multiplier={game.multiplier}
          progress={game.progress}
          online={game.online}
          players={game.players}
        />
        {game.bets.map((bet, i) => (
          <div key={i} className={game.suspended ? "pointer-events-none opacity-50" : undefined} aria-disabled={game.suspended}>
          <BetPanel
            key={i}
            index={i}
            bet={bet}
            multiplier={game.multiplier}
            canAddPanel={game.bets.length < 2}
            onPlace={() => void game.placeBet(i)}
            onCancel={() => void game.cancelBet(i)}
            onCashOut={() => void game.cashOut(i)}
            onAmount={(n) => game.setAmount(i, n)}
            onUpdate={(patch) => game.updateBet(i, patch)}
            onAddPanel={game.addPanel}
            onRemovePanel={() => game.removePanel(i)}
          />
          </div>
        ))}
        <div id="bets-list" />
        <BetsList
          players={game.players}
          myBets={game.myBets}
          history={game.history}
          placedBets={game.placedBets}
          totalBets={game.totalBets}
          totalWin={game.totalWin}
        />
      </div>

      {game.error && (
        <div className="fixed inset-x-0 bottom-4 z-50 mx-auto w-fit max-w-[90%] rounded-full bg-air-brand px-4 py-2 text-center text-[12px] font-semibold text-air-text">
          <MoneyText text={game.error} />
        </div>
      )}

      <ProfileSheet
        open={profileOpen}
        userId={game.user?.id ?? "guest"}
        balance={game.balance}
        soundOn={sound.enabled}
        onClose={() => setProfileOpen(false)}
        onDeposit={openDeposit}
        onWithdraw={() => (game.suspended ? toast.error("ACCOUNT SUSPENDED — hacking or bots detected.") : setWithdrawOpen(true))}
        onHistory={() => document.getElementById("bets-list")?.scrollIntoView({ behavior: "smooth" })}
        onToggleSound={sound.toggle}
        onLogout={() => void signOut()}
      />

      <PlayerChat user={game.user} onNeedAuth={() => void navigate({ to: "/auth" })} />

      <DepositDialog
        open={depositOpen}
        defaultPhone={game.phone}
        country={game.country}
        onClose={() => setDepositOpen(false)}
        onPaid={() => void game.refreshBalance()}
      />

      <WithdrawDialog
        open={withdrawOpen && !game.suspended}
        balance={game.balance}
        onClose={() => setWithdrawOpen(false)}
        onDeposit={() => {
          setWithdrawOpen(false);
          openDeposit();
        }}
      />
    </main>
    </MoneyProvider>
  );
}

function MoneyText({ text }: { text: string }) {
  return <>{useMoney().text(text)}</>;
}
