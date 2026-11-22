import { useMoney } from "@/components/aviator/Money";
import { usePlayerLanguage } from "./PlayerLanguage";
import { useEffect, useRef, useState } from "react";

/** Smoothly tweens a number towards its target instead of jumping. */
function useSmoothNumber(target: number, duration = 700) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = value;
    startRef.current = performance.now();
    const from = fromRef.current;
    const tick = (now: number) => {
      const t = Math.min(1, (now - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
import { Avatar, AvatarStack } from "./Avatar";
import type { RoundPlayer } from "@/lib/aviator/players";
import type { RoundResult } from "@/hooks/useAviatorGame";

const TABS = ["All Bets", "Previous", "Top"] as const;
type Tab = (typeof TABS)[number];

export function BetsList({
  players,
  myBets,
  history,
  placedBets,
  totalBets,
  totalWin,
}: {
  players: RoundPlayer[];
  myBets: RoundResult[];
  history: number[];
  placedBets: number;
  totalBets: number;
  totalWin: number;
}) {
  const { t: copy } = usePlayerLanguage();
  const money = useMoney();
  const [tab, setTab] = useState<Tab>("All Bets");
  const smoothWin = useSmoothNumber(totalWin);
  const smoothPlaced = useSmoothNumber(placedBets);
  const pct = totalBets ? Math.min(100, (placedBets / totalBets) * 100) : 0;

  const rows =
    tab === "Top"
      ? [...players]
          .filter((p) => p.cashOutAt)
          .sort((a, b) => b.bet * (b.cashOutAt ?? 0) - a.bet * (a.cashOutAt ?? 0))
          .slice(0, 20)
      : players;

  return (
    <div className="mx-2 mt-2 rounded-[18px] bg-air-surface pb-4">
      <div className="flex justify-center px-2 pt-2">
        <div className="flex w-full rounded-full bg-air-field p-[3px]">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-[6px] text-[13px] transition-colors ${
                t === tab ? "bg-air-raised font-medium text-air-text" : "text-air-text/70"
              }`}
            >
              {copy(t === "All Bets" ? "allBets" : t === "Previous" ? "previous" : "top")}
            </button>
          ))}
        </div>
      </div>

      {tab === "Previous" ? (
        <PreviousTab myBets={myBets} history={history} />
      ) : (
        <>
          <div className="px-3 pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AvatarStack people={players.slice(0, 3)} size={22} />
                <span className="text-[13px] text-air-text">
                  {Math.round(smoothPlaced).toLocaleString()}/{totalBets.toLocaleString()}{" "}
                  <span className="text-air-text/50">{copy("bets")}</span>
                </span>
              </div>
              <div className="text-right">
                <div className="text-[15px] font-semibold text-air-text">
                  {money.fmt(smoothWin)}
                </div>
                <div className="text-[11px] text-air-text/50">{money.text(copy("totalWin"))}</div>
              </div>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-air-raised">
              <div className="h-full rounded-full bg-air-green" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-[1.3fr_1fr_0.7fr_1fr] px-3 pb-1 text-[11px] text-air-text/45">
            <span>{copy("player")}</span>
            <span className="text-right">{copy("bet")} {money.currency}</span>
            <span className="text-center">X</span>
            <span className="text-right">{money.text(copy("win"))}</span>
          </div>

          <div className="divide-y divide-air-text/5">
            {rows.map((p) => (
              <div
                key={p.id}
                className={`grid grid-cols-[1.3fr_1fr_0.7fr_1fr] items-center px-3 py-[7px] text-[12.5px] ${
                  p.cashedOut ? "bg-air-win" : ""
                }`}
              >
                <span className="flex items-center gap-2 text-air-text/85">
                  <Avatar color={p.avatar} name={p.name} size={20} />
                  {p.name}
                </span>
                <span className="text-right text-air-text/85">
                  {money.fmt(p.bet)}
                </span>
                <span className="text-center">
                  {p.cashedOut && p.cashOutAt ? (
                    <span className="rounded-full bg-air-win px-2 py-[1px] text-[11px] text-air-green">
                      {p.cashOutAt.toFixed(2)}x
                    </span>
                  ) : null}
                </span>
                <span className="text-right text-air-text/85">
                  {p.cashedOut && p.cashOutAt
                    ? money.fmt(p.bet * p.cashOutAt)
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PreviousTab({ myBets, history }: { myBets: RoundResult[]; history: number[] }) {
  const { t: copy } = usePlayerLanguage();
  const money = useMoney();
  if (myBets.length === 0) {
    return (
      <div className="px-3 pt-4">
        <div className="pb-3 text-[12px] text-air-text/50">
          {copy("emptyBets")}
        </div>
        <div className="flex flex-wrap gap-2">
          {history.slice(0, 12).map((h, i) => (
            <span
              key={i}
              className="rounded-full bg-air-field px-2 py-[2px] text-[12px] text-air-text/80"
            >
              {h.toFixed(2)}x
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-3 grid grid-cols-[1fr_0.8fr_1fr] px-3 pb-1 text-[11px] text-air-text/45">
        <span>{copy("bet")} {money.currency}</span>
        <span className="text-center">X</span>
        <span className="text-right">{money.text(copy("win"))}</span>
      </div>
      <div className="divide-y divide-air-text/5">
        {myBets.map((b) => (
          <div
            key={b.id}
            className={`grid grid-cols-[1fr_0.8fr_1fr] items-center px-3 py-[7px] text-[12.5px] ${
              b.win ? "bg-air-win" : ""
            }`}
          >
            <span className="text-air-text/85">{money.fmt(b.amount)}</span>
            <span className="text-center">
              <span
                className={`rounded-full px-2 py-[1px] text-[11px] ${
                  b.win ? "bg-air-win text-air-green" : "bg-air-loss text-air-danger"
                }`}
              >
                {b.multiplier.toFixed(2)}x
              </span>
            </span>
            <span className="text-right text-air-text/85">
              {b.win ? money.fmt(b.win) : "—"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
