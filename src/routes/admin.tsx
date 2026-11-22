import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { guardAdminPage } from "@/lib/admin-guard";
import { listChats } from "@/lib/admin-api";
import { chatTotals } from "@/lib/admin-policy";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Plane } from "@/components/aviator/Plane";
import { multiplierAt } from "@/lib/aviator/engine";
import { offlineNextRound, offlineRoundAt } from "@/lib/aviator/offline";
import { now as gkNow, syncClock } from "@/lib/aviator/clock";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: guardAdminPage,
  head: () => ({
    meta: [
      { title: "Control Centre — GK Airwin" },
      {
        name: "description",
        content: "GK Airwin control centre with live round tracking and next-round predictions.",
      },
      { property: "og:title", content: "Control Centre — GK Airwin" },
      {
        property: "og:description",
        content: "GK Airwin control centre with live round tracking and next-round predictions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

const BOTS = [
  { name: "NEXUS-07", task: "signal harvesting" },
  { name: "ORACLE-X", task: "curve regression" },
  { name: "VORTEX-3", task: "seed decoding" },
  { name: "QUANTA-9", task: "entropy sampling" },
  { name: "HELIX-5", task: "pattern matching" },
  { name: "AXIOM-1", task: "payout modelling" },
];

const CANDLES = [
  { top: 31, bottom: 68, open: 41, close: 58, up: true },
  { top: 21, bottom: 57, open: 35, close: 43, up: true },
  { top: 14, bottom: 79, open: 32, close: 66, up: false },
  { top: 53, bottom: 89, open: 61, close: 82, up: false },
  { top: 67, bottom: 91, open: 74, close: 83, up: true },
  { top: 65, bottom: 85, open: 72, close: 76, up: false },
  { top: 48, bottom: 82, open: 57, close: 76, up: true },
  { top: 42, bottom: 72, open: 50, close: 62, up: true },
  { top: 36, bottom: 81, open: 51, close: 72, up: false },
  { top: 45, bottom: 76, open: 54, close: 67, up: true },
  { top: 32, bottom: 68, open: 43, close: 57, up: true },
  { top: 39, bottom: 73, open: 47, close: 61, up: false },
  { top: 48, bottom: 84, open: 59, close: 76, up: false },
];

type Snapshot = {
  currentId: number;
  betOpenAt: number;
  takeoffAt: number;
  crashAt: number;
  crashedAt: number | null;
  crashPoint: number | null;
  next: { id: number; crashPoint: number }[];
  offline: boolean;
};

function AdminPage() {
  const navigate = useNavigate();
  return <ControlCentre onBack={() => void navigate({ to: "/play" })} />;
}

function ControlCentre({ onBack }: { onBack: () => void }) {
  const navigate = useNavigate();
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [live, setLive] = useState(1);
  const [totals, setTotals] = useState({ unread: 0, waiting: 0 });
  useEffect(() => {
    let active = true;
    const load = async () => { try { const chats = await listChats(""); if (active) setTotals(chatTotals(chats)); } catch { /* access is checked before entry */ } };
    void load();
    const timer = setInterval(() => void load(), 4000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  const snapRef = useRef<Snapshot | null>(null);
  snapRef.current = snap;

  useEffect(() => {
    const load = () => {
      const t = gkNow();
      const cur = offlineRoundAt(t);
      const n1 = offlineNextRound(cur);
      const n2 = offlineNextRound(n1);
      setSnap({
        currentId: cur.id,
        betOpenAt: cur.betOpenAt,
        takeoffAt: cur.takeoffAt,
        crashAt: cur.crashAt,
        crashedAt: t >= cur.crashAt ? cur.crashAt : null,
        crashPoint: cur.crashPoint,
        next: [
          { id: n1.id, crashPoint: n1.crashPoint },
          { id: n2.id, crashPoint: n2.crashPoint },
        ],
        offline: typeof navigator !== "undefined" && navigator.onLine === false,
      });
    };
    void syncClock();
    load();
    const t = setInterval(load, 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const s = snapRef.current;
      if (s) {
        const now = gkNow();
        if (now < s.takeoffAt) setLive(1);
        else if (s.crashedAt != null && s.crashPoint != null) setLive(s.crashPoint);
        else setLive(Number(multiplierAt((now - s.takeoffAt) / 1000).toFixed(2)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const players = useMemo(() => 3800 + Math.floor(Math.random() * 1500), []);
  const nextOne = snap?.next[0];
  const nextTwo = snap?.next[1];
  const isWaiting = snap ? gkNow() < snap.takeoffAt : true;
  const isFlying = snap ? !isWaiting && snap.crashedAt == null : false;

  return (
    <main className="min-h-screen bg-predictor-wash pb-10 text-predictor-ink">
      <div className="mx-auto min-h-screen w-full max-w-md bg-predictor-paper pb-10 shadow-2xl">
      <div className="flex items-center justify-between border-b border-predictor-line px-4 py-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="px-2 text-[14px] font-semibold text-predictor-ink hover:bg-predictor-wash"
        >
          <ArrowLeft />
          Game
        </Button>
        <span className="flex items-center gap-2 text-[14px] font-bold text-predictor-ink">
          <ShieldCheck className="h-4 w-4 text-predictor-rise" /> Control Centre
        </span>
        <div className="flex gap-1.5">
          <Button
            size="sm"
            onClick={() => void navigate({ to: "/admin/deposits" })}
            className="h-8 bg-predictor-ink px-3 text-[12px] font-bold text-predictor-paper hover:bg-predictor-ink/90"
          >
            Deposits
          </Button>
          <Button
            size="sm"
            onClick={() => void navigate({ to: "/admin/chats" })}
            className="h-8 bg-predictor-ink px-3 text-[12px] font-bold text-predictor-paper hover:bg-predictor-ink/90"
          >
            Chats <span aria-label={`${totals.unread} unread messages`} className="rounded-full bg-predictor-fall px-1.5 text-predictor-paper">{totals.unread}</span>
          </Button>
          <Button
            size="sm"
            onClick={() => void navigate({ to: "/admin/accounts" })}
            className="h-8 bg-predictor-rise px-3 text-[12px] font-bold text-predictor-paper hover:bg-predictor-rise/90"
          >
            Accounts
          </Button>
        </div>
      </div>

      <p className="px-5 pt-3 text-sm font-semibold text-predictor-muted" role="status">{totals.waiting} chats waiting for your reply · {totals.unread} unread messages</p>
      <div className="px-5 pt-3">
        <Button variant="outline" className="w-full border-predictor-line bg-predictor-paper text-predictor-ink" onClick={() => void navigate({ to: "/admin/owner" })}><UserRound /> Owner profile</Button>
      </div>
      <section className="relative px-5 pt-7 text-center">
        <h1 className="text-[38px] font-black leading-none text-predictor-ink">GKAIRWIN.LIVE</h1>
        <p className="mt-5 text-[20px] font-bold">Crash Flight</p>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em] text-predictor-muted">
          Round&nbsp; #{snap?.currentId ?? "—"}
        </p>

        <Plane className="av-plane-hover absolute right-4 top-[5.8rem] w-24" />

        <div className="mt-8 flex items-end justify-center gap-2">
          <span className="text-[54px] font-black leading-none text-predictor-fall">
            {snap?.crashPoint ? `${snap.crashPoint.toFixed(2)}x` : "—"}
          </span>
          <span className="mb-1.5 min-w-24 text-left text-[18px] font-semibold text-predictor-muted">
            {isWaiting ? "waiting" : isFlying ? `${live.toFixed(2)}x in flight` : "flew away"}
          </span>
        </div>

        <div className="mt-8 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-predictor-muted">
          <span>Next crash point</span>
          <span className="text-[18px] normal-case tracking-normal text-predictor-ink">
            {nextOne ? `${nextOne.crashPoint.toFixed(2)}x` : "—"}
          </span>
        </div>
      </section>

      <PredictorChart calculating={isWaiting || isFlying} />

      <div className="mx-5 mt-2 border-t border-predictor-line pt-4 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-predictor-muted">
          {isWaiting ? "Prediction locked" : isFlying ? "Tracking flight" : "Flight complete"}
        </p>
        <div className="mx-auto mt-2 h-1.5 max-w-64 overflow-hidden rounded-full bg-predictor-line">
          <div className={isFlying ? "predictor-progress h-full bg-predictor-fall" : "h-full w-full bg-predictor-rise"} />
        </div>
        <p className="mt-2 text-[13px] font-bold text-predictor-rise">Confidence 100%</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 px-5">
        <Card label="NEXT ROUND" value={nextOne} accent="fall" />
        <Card label="ROUND AFTER" value={nextTwo} accent="rise" />
      </div>

      <div className="mx-5 mt-5 border-t border-predictor-line pt-4">
        <div className="mb-3 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.15em] text-predictor-muted">
          <span>🤖 PREDICTION BOTS</span>
          <span>6/6 LOCKED</span>
        </div>
        <div className="space-y-2">
          {BOTS.map((b) => (
            <div key={b.name} className="rounded-md border border-predictor-line bg-predictor-paper px-3 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-black text-predictor-ink">{b.name}</span>
                <span className="text-[13px] font-bold text-predictor-rise">
                  {snap?.crashPoint ? `${snap.crashPoint.toFixed(2)}x` : "—"}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-predictor-line">
                  <div className="predictor-bot-bar h-full bg-predictor-rise" />
                </div>
                <span className="text-[11px] text-predictor-muted">{b.task}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-2 px-5">
        <Stat label="ROUND" value={snap ? `#${snap.currentId}` : "—"} />
        <Stat label="LIVE" value={`${live.toFixed(2)}x`} />
        <Stat label="PLAYERS" value={players.toLocaleString()} />
      </div>
      </div>
    </main>
  );
}

function PredictorChart({ calculating }: { calculating: boolean }) {
  return (
    <div className="relative mx-5 mt-3 h-72 overflow-hidden border-b border-l border-predictor-line" aria-label="Animated crash prediction chart">
      <div className="pointer-events-none absolute inset-0 predictor-chart-grid" />
      {calculating && <div className="predictor-scan absolute inset-y-0 w-16 bg-predictor-scan" />}
      <div className="absolute inset-0 flex items-stretch justify-around px-2 pb-3 pt-2">
        {CANDLES.map((candle, index) => (
          <div
            key={`${candle.top}-${index}`}
            className="predictor-candle relative h-full flex-1"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span
              className={candle.up ? "absolute left-1/2 w-px -translate-x-1/2 bg-predictor-rise" : "absolute left-1/2 w-px -translate-x-1/2 bg-predictor-fall"}
              style={{ top: `${candle.top}%`, height: `${candle.bottom - candle.top}%` }}
            />
            <span
              className={candle.up ? "absolute left-[20%] right-[20%] bg-predictor-rise" : "absolute left-[20%] right-[20%] bg-predictor-fall"}
              style={{ top: `${Math.min(candle.open, candle.close)}%`, height: `${Math.max(3, Math.abs(candle.close - candle.open))}%` }}
            />
          </div>
        ))}
      </div>
      <span className="absolute right-1 top-2 text-[10px] font-semibold text-predictor-muted">13.66</span>
      <span className="absolute right-1 top-[34%] text-[10px] font-semibold text-predictor-muted">9.22</span>
      <span className="absolute right-1 top-[67%] text-[10px] font-semibold text-predictor-muted">5.78</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-predictor-line bg-predictor-wash px-3 py-3">
      <p className="text-[10px] font-bold tracking-[0.12em] text-predictor-muted">{label}</p>
      <p className="mt-1 truncate text-[15px] font-black text-predictor-ink">{value}</p>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
}: {
  label: string;
  value: { id: number; crashPoint: number } | undefined;
  accent: "fall" | "rise";
}) {
  return (
    <div className="rounded-md border border-predictor-line bg-predictor-wash px-3 py-4 text-center">
      <p className="text-[10px] font-bold tracking-[0.12em] text-predictor-muted">{label}</p>
      <p className={`mt-2 text-[30px] font-black leading-none ${accent === "fall" ? "text-predictor-fall" : "text-predictor-rise"}`}>
        {value ? `${value.crashPoint.toFixed(2)}x` : "—"}
      </p>
      <p className="mt-2 text-[11px] font-semibold text-predictor-muted">#{value?.id ?? "—"}</p>
    </div>
  );
}
