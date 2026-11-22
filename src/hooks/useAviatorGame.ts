import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { multiplierAt } from "@/lib/aviator/engine";
import { offlineHistory, offlineRoundAt } from "@/lib/aviator/offline";
import { now as gkNow, syncClock } from "@/lib/aviator/clock";
import { generateRoundPlayers, type RoundPlayer } from "@/lib/aviator/players";
import { ensureRound } from "@/lib/round-api";

export type Phase = "waiting" | "flying" | "crashed";

const VISIBLE_PLAYERS = 40;
const POLL_MS = 450;
export const MIN_BET = 100;

export type BetState = {
  amount: number;
  placed: boolean;
  queued: boolean;
  active: boolean;
  cashedAt: number | null;
  won: number | null;
  betId: string | null;
  autoBet: boolean;
  autoCashOut: boolean;
  autoCashOutAt: number;
};

export type RoundResult = {
  id: string;
  multiplier: number;
  amount: number;
  win: number | null;
};

type RoundState = {
  id: number;
  serverNow: number;
  betOpenAt: number;
  takeoffAt: number;
  crashedAt: number | null;
  crashPoint: number | null;
  endAt: number | null;
};

const newBet = (amount: number): BetState => ({
  amount,
  placed: false,
  queued: false,
  active: false,
  cashedAt: null,
  won: null,
  betId: null,
  autoBet: false,
  autoCashOut: false,
  autoCashOutAt: 2,
});

export function useAviatorGame() {
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("KE");
  const [suspended, setSuspended] = useState(false);
  const suspendedRef = useRef(false);
  const [phase, setPhase] = useState<Phase>("waiting");
  const [multiplier, setMultiplier] = useState(1);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [balance, setBalance] = useState(0);
  const [online, setOnline] = useState(2411);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const [bets, setBets] = useState<BetState[]>(() => [newBet(MIN_BET)]);
  const [myBets, setMyBets] = useState<RoundResult[]>([]);

  const [players, setPlayers] = useState<RoundPlayer[]>([]);
  const [totalBets, setTotalBets] = useState(4562);
  const [placedBets, setPlacedBets] = useState(0);
  const [totalWin, setTotalWin] = useState(0);

  const roundRef = useRef<RoundState | null>(null);
  const offsetRef = useRef(0);
  const betsRef = useRef(bets);
  betsRef.current = bets;
  const phaseRef = useRef<Phase>("waiting");
  const multiplierRef = useRef(1);
  const roundIdRef = useRef<number | null>(null);
  const settledRef = useRef<number | null>(null);
  const placingRef = useRef<Set<number>>(new Set());
  const offlineRef = useRef(false);
  const balanceRef = useRef(0);
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const setOfflineBalance = useCallback((next: number) => {
    balanceRef.current = next;
    setBalance(next);
    try {
      localStorage.setItem("gk_balance", String(next));
    } catch {
      /* ignore */
    }
  }, []);

  /* ---------------- clock sync ---------------- */
  useEffect(() => {
    void syncClock();
    const t = setInterval(() => void syncClock(), 60_000);
    const onOnline = () => void syncClock();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(t);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  /* ---------------- auth ---------------- */
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      setPhone(String(session?.user.user_metadata?.["phone"] ?? ""));
    });
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setPhone(String(data.session?.user.user_metadata?.["phone"] ?? ""));
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshBalance = useCallback(async () => {
    if (offlineRef.current) {
      const cached = Number(localStorage.getItem("gk_balance") ?? "0");
      setBalance(cached);
      balanceRef.current = cached;
      return;
    }
    if (!userRef.current) {
      setBalance(0);
      setPhone("");
      return;
    }
    const currentUser = userRef.current;
    const { data } = await supabase
      .from("profiles")
      .select("balance, phone, country_code, suspended")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (data && userRef.current?.id === currentUser.id) {
      setBalance(Number(data.balance));
      balanceRef.current = Number(data.balance);
      setPhone(data.phone ?? String(currentUser.user_metadata?.["phone"] ?? ""));
      const cc = (data as { country_code?: string | null }).country_code ?? currentUser.user_metadata?.["country_code"];
      setCountry(String(cc || "KE").toUpperCase());
      const sus = Boolean((data as { suspended?: boolean }).suspended);
      suspendedRef.current = sus;
      setSuspended(sus);
      try {
        localStorage.setItem("gk_balance", String(Number(data.balance)));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const loadHistory = useCallback(async () => {
    // Deterministic schedule: identical on every device, online or offline.
    setHistory(offlineHistory(gkNow(), 50));
  }, []);

  const loadMyBets = useCallback(async () => {
    if (!userRef.current) return;
    const { data } = await supabase
      .from("bets")
      .select("id, amount, cashed_multiplier, win, status, round_id")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) {
      setMyBets(
        data
          .filter((b) => b.status !== "placed")
          .map((b) => ({
            id: b.id,
            multiplier: Number(b.cashed_multiplier ?? 0),
            amount: Number(b.amount),
            win: b.win != null ? Number(b.win) : null,
          })),
      );
    }
  }, []);

  /* ---------------- round clock (deterministic, shared by every device) ---------------- */
  useEffect(() => {
    let alive = true;
    const poll = async () => {
      if (!alive) return;
      const now = gkNow();
      const o = offlineRoundAt(now);
      const crashed = now >= o.crashAt;
      const isOffline = typeof navigator !== "undefined" && navigator.onLine === false;
      offlineRef.current = isOffline;
      setOffline(isOffline);
      offsetRef.current = 0;
      roundRef.current = {
        id: o.id,
        serverNow: now,
        betOpenAt: o.betOpenAt,
        takeoffAt: o.takeoffAt,
        crashedAt: crashed ? o.crashAt : null,
        crashPoint: crashed ? o.crashPoint : null,
        endAt: o.endAt,
      };

      if (roundIdRef.current !== o.id) {
        const prev = roundIdRef.current;
        roundIdRef.current = o.id;
        setPlayers(generateRoundPlayers(VISIBLE_PLAYERS));
        setTotalBets(4000 + Math.floor(Math.random() * 1200));
        setPlacedBets(0);
        setTotalWin(0);
        setOnline(1800 + Math.floor(Math.random() * 1200));
        setBets((list) =>
          list.map((b) =>
            b.queued
              ? { ...b, active: false, betId: null }
              : { ...b, placed: false, queued: false, active: false, betId: null },
          ),
        );
        setHistory(offlineHistory(now, 50));
        if (!isOffline) void ensureRound(o.id).catch(() => {});
        if (prev !== null && !isOffline) {
          if (userRef.current) await supabase.rpc("settle_my_bets");
          void refreshBalance();
          void loadMyBets();
        }
        if (!isOffline && userRef.current) {
          const { data: mine } = await supabase
            .from("bets")
            .select("id, slot, amount, status, auto_cashout")
            .eq("round_id", o.id);
          if (mine?.length) {
            setBets((list) =>
              list.map((b, i) => {
                const found = mine.find((m) => m.slot === i);
                if (!found) return b;
                return {
                  ...b,
                  betId: found.id,
                  amount: Number(found.amount),
                  placed: found.status === "placed",
                  active: found.status === "placed",
                };
              }),
            );
          }
        }
      }

      if (crashed && settledRef.current !== o.id) {
        settledRef.current = o.id;
        if (!isOffline && userRef.current) {
          await supabase.rpc("settle_my_bets");
          void refreshBalance();
          void loadMyBets();
        }
      }
    };
    void poll();
    const t = setInterval(() => void poll(), POLL_MS);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [loadHistory, loadMyBets, refreshBalance]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    void refreshBalance();
    void loadMyBets();
  }, [user, refreshBalance, loadMyBets]);

  /* ---------------- local clock ---------------- */
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const r = roundRef.current;
      if (r) {
        const now = gkNow();
        if (now < r.takeoffAt) {
          const span = Math.max(1, r.takeoffAt - r.betOpenAt);
          const p = Math.min(1, Math.max(0, (now - r.betOpenAt) / span));
          setProgress(p);
          setPlacedBets(Math.floor(totalBets * (0.55 + 0.45 * p)));
          if (phaseRef.current !== "waiting") {
            phaseRef.current = "waiting";
            setPhase("waiting");
          }
          setMultiplier(1);
          multiplierRef.current = 1;
        } else if (r.crashedAt == null) {
          if (phaseRef.current !== "flying") {
            phaseRef.current = "flying";
            setPhase("flying");
            // Only real bets for this round take off; queued ones wait for the next round.
            setBets((list) =>
              list.map((b) => (b.placed && b.betId && !b.queued ? { ...b, active: true } : b)),
            );
          }
          const m = multiplierAt((now - r.takeoffAt) / 1000);
          multiplierRef.current = m;
          setMultiplier(Number(m.toFixed(2)));
          setPlayers((prev) => {
            let changed = false;
            const next = prev.map((p) => {
              if (!p.cashedOut && p.cashOutAt !== null && m >= p.cashOutAt) {
                changed = true;
                return { ...p, cashedOut: true };
              }
              return p;
            });
            return changed ? next : prev;
          });
          setTotalWin((w) => w + Math.random() * 900 * (m / 2));
          betsRef.current.forEach((b, i) => {
            if (b.active && !b.cashedAt && b.autoCashOut && m >= b.autoCashOutAt) {
              void cashOutRef.current(i);
            }
          });
        } else {
          if (phaseRef.current !== "crashed") {
            phaseRef.current = "crashed";
            setPhase("crashed");
            setBets((list) =>
              list.map((b) => (b.active ? { ...b, active: false, placed: false } : b)),
            );
          }
          if (r.crashPoint != null) {
            setMultiplier(Number(r.crashPoint));
            multiplierRef.current = Number(r.crashPoint);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [totalBets]);

  /* ---------------- actions ---------------- */
  const placeBet = async (i: number) => {
    if (suspendedRef.current) {
      setError("ACCOUNT SUSPENDED — hacking or bots detected.");
      return;
    }
    const r = roundRef.current;
    const b = betsRef.current[i];
    if (!r || !b || placingRef.current.has(i)) return;
    if (b.active) return;
    // Queued bets (placed while flying) and fresh bets both proceed; real bets don't.
    if (b.placed && !b.queued) return;
    const noBalance =
      balanceRef.current < MIN_BET
        ? "Not enough balance — minimum bet is 100 KES."
        : "Not enough balance — deposit to keep playing.";
    if (b.amount < MIN_BET) {
      setError(`Minimum bet is ${MIN_BET} KES`);
      return;
    }
    // Flying or crashed: one tap queues the bet for the very next round.
    const queuedAmount = betsRef.current.reduce(
      (total, item, index) => total + (index !== i && item.queued && !item.betId ? item.amount : 0),
      0,
    );
    if (gkNow() >= r.takeoffAt) {
      if (!userRef.current) {
        setError("Sign in to place a bet.");
        return;
      }
      if (b.amount + queuedAmount > balanceRef.current) {
        setError(noBalance);
        return;
      }
      setBets((list) =>
        list.map((x, idx) =>
          idx === i
            ? { ...x, placed: true, queued: true, active: false, cashedAt: null, won: null, betId: null }
            : x,
        ),
      );
      return;
    }
    if (offlineRef.current) {
      if (b.amount > balanceRef.current) {
        setError(noBalance);
        return;
      }
      setOfflineBalance(balanceRef.current - b.amount);
      setBets((list) =>
        list.map((x, idx) =>
          idx === i
            ? { ...x, placed: true, queued: false, cashedAt: null, won: null, betId: `offline-${i}` }
            : x,
        ),
      );
      return;
    }
    if (!userRef.current) {
      setError("Sign in to place a bet.");
      return;
    }
    if (b.amount > balanceRef.current) {
      setError(noBalance);
      return;
    }
    placingRef.current.add(i);
    // Optimistic: the tap marks the bet instantly; the server confirms behind it.
    setBets((list) =>
      list.map((x, idx) =>
        idx === i ? { ...x, placed: true, queued: false, cashedAt: null, won: null, betId: null } : x,
      ),
    );
    const revert = (msg?: string) => {
      setBets((list) =>
        list.map((x, idx) => (idx === i ? { ...x, placed: false, queued: false, betId: null } : x)),
      );
      if (msg) setError(msg);
    };
    try {
      await ensureRound(r.id);
    } catch (e) {
      placingRef.current.delete(i);
      revert((e as Error).message);
      return;
    }
    const { data, error: rpcError } = await supabase.rpc("place_bet", {
      p_round_id: r.id,
      p_amount: b.amount,
      p_slot: i,
      p_auto_cashout: b.autoCashOut ? b.autoCashOutAt : (null as unknown as number),
    });
    placingRef.current.delete(i);
    if (rpcError) {
      if (/duplicate key/i.test(rpcError.message)) {
        // The bet already exists on the server for this round/slot — accept it.
        const { data: existing } = await supabase
          .from("bets")
          .select("id, amount, status")
          .eq("round_id", r.id)
          .eq("slot", i)
          .maybeSingle();
        if (existing?.id) {
          setBets((list) =>
            list.map((x, idx) =>
              idx === i
                ? {
                    ...x,
                    placed: true,
                    queued: false,
                    active: false,
                    betId: existing.id,
                    amount: Number(existing.amount),
                  }
                : x,
            ),
          );
          void refreshBalance();
        } else {
          setBets((list) =>
            list.map((x, idx) =>
              idx === i ? { ...x, placed: true, queued: true, active: false, betId: null } : x,
            ),
          );
        }
        return;
      }
      if (/betting closed/i.test(rpcError.message)) {
        setBets((list) =>
          list.map((x, idx) =>
            idx === i ? { ...x, placed: true, queued: true, active: false, betId: null } : x,
          ),
        );
        return;
      }
      revert(rpcError.message.replace(/^.*?:\s*/, ""));
      return;
    }
    const row = Array.isArray(data) ? data[0] : data;
    setBets((list) =>
      list.map((x, idx) =>
        idx === i ? { ...x, placed: true, queued: false, cashedAt: null, won: null, betId: row?.id ?? null } : x,
      ),
    );
    void refreshBalance();
  };

  const cancelBet = async (i: number) => {
    const b = betsRef.current[i];
    if (!b || (!b.placed && !b.queued)) return;
    if (b.queued && !b.betId) {
      // Queued for next round: just unqueue, nothing was charged.
      setBets((list) =>
        list.map((x, idx) =>
          idx === i ? { ...x, placed: false, queued: false, active: false, betId: null } : x,
        ),
      );
      return;
    }
    const betId = b.betId;
    if (!betId) return;
    if (offlineRef.current) {
      setOfflineBalance(balanceRef.current + b.amount);
      setBets((list) =>
        list.map((x, idx) =>
          idx === i ? { ...x, placed: false, queued: false, active: false, betId: null } : x,
        ),
      );
      return;
    }
    const { error: rpcError } = await supabase.rpc("cancel_bet", { p_bet_id: betId });
    if (rpcError) {
      setError(rpcError.message.replace(/^.*?:\s*/, ""));
      return;
    }
    setBets((list) =>
      list.map((x, idx) =>
        idx === i ? { ...x, placed: false, queued: false, active: false, betId: null } : x,
      ),
    );
    void refreshBalance();
  };

  const cashOut = useCallback(
    async (i: number) => {
      const b = betsRef.current[i];
      if (!b?.active || !b.betId || b.cashedAt) return;
      if (offlineRef.current) {
        const at = Number(multiplierRef.current.toFixed(2));
        const won = Number((b.amount * at).toFixed(2));
        setOfflineBalance(balanceRef.current + won);
        setBets((list) =>
          list.map((x, idx) =>
            idx === i ? { ...x, active: false, placed: false, cashedAt: at, won } : x,
          ),
        );
        setMyBets((prev) => [
          { id: `${Date.now()}-${i}`, multiplier: at, amount: b.amount, win: won },
          ...prev.slice(0, 19),
        ]);
        return;
      }
      setBets((list) => list.map((x, idx) => (idx === i ? { ...x, active: false } : x)));
      const seen = Number(multiplierRef.current.toFixed(2));
      const { data, error: rpcError } = await supabase.rpc("cash_out_at", {
        p_bet_id: b.betId,
        p_multiplier: seen,
      });
      if (rpcError) {
        setBets((list) => list.map((x, idx) => (idx === i ? { ...x, active: true } : x)));
        setError(rpcError.message.replace(/^.*?:\s*/, ""));
        return;
      }
      const row = Array.isArray(data) ? data[0] : data;
      const at = Number(row?.cashed_multiplier ?? multiplierRef.current);
      const won = Number(row?.win ?? 0);
      if (row?.status === "lost") setError("Too late — the plane flew away.");
      setBets((list) =>
        list.map((x, idx) =>
          idx === i ? { ...x, active: false, placed: false, cashedAt: at, won } : x,
        ),
      );
      void refreshBalance();
      void loadMyBets();
    },
    [loadMyBets, refreshBalance],
  );

  const cashOutRef = useRef(cashOut);
  cashOutRef.current = cashOut;

  const setAmount = (i: number, n: number) =>
    setBets((list) =>
      list.map((b, idx) => (idx === i ? { ...b, amount: Math.min(100000, Math.max(MIN_BET, Number(n.toFixed(2)))) } : b)),
    );

  const updateBet = (i: number, patch: Partial<BetState>) =>
    setBets((list) => list.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));

  const addPanel = () => setBets((list) => (list.length > 1 ? list : [...list, newBet(MIN_BET)]));
  const removePanel = (i: number) =>
    setBets((list) => {
      const b = list[i];
      if (list.length < 2 || !b) return list;
      if (b.placed && b.betId) void supabase.rpc("cancel_bet", { p_bet_id: b.betId });
      return list.filter((_, idx) => idx !== i);
    });

  // auto-bet and queued bets: (re-)arm at the start of each waiting phase
  useEffect(() => {
    if (phase !== "waiting") return;
    betsRef.current.forEach((b, i) => {
      if ((b.autoBet && !b.placed) || (b.queued && b.placed && !b.betId)) void placeBet(i);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, roundIdRef.current]);

  return {
    user,
    phone,
    country,
    suspended,
    offline,
    phase,
    multiplier,
    progress,
    history,
    balance,
    online,
    bets,
    myBets,
    players,
    totalBets,
    placedBets,
    totalWin,
    error,
    clearError: () => setError(null),
    refreshBalance,
    placeBet,
    cancelBet,
    cashOut,
    setAmount,
    updateBet,
    addPanel,
    removePanel,
  };
}
