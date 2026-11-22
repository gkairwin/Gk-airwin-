/**
 * Deterministic round schedule.
 *
 * Every device computes the exact same rounds from the wall clock, so the game
 * (and the prediction robot) runs identically online and offline. Rounds have
 * a variable length: 6s betting, the flight itself, then a short 4s pause after
 * the plane flies away — so the crash screen never lingers.
 */

export const DAY_MS = 86_400_000;
export const BET_MS = 6_000;
export const CRASH_PAUSE_MS = 4_000;
export const ROUNDS_PER_DAY_MAX = 20_000;
const K = 0.115;
const MAX_CP = 1000;

function hash32(n: number): number {
  let x = n >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = Math.imul(x ^ (x >>> 16), 0x45d9f3b);
  x = (x ^ (x >>> 16)) >>> 0;
  return x;
}

/** Crash point for a global round id — identical on every device. */
export function offlineCrashPoint(id: number): number {
  const u = (hash32(id * 2654435761) % 1_000_000) / 1_000_000;
  const raw = 0.97 / Math.max(u, 0.00097);
  return Number(Math.min(MAX_CP, Math.max(1.01, raw)).toFixed(2));
}

export function flightMs(crashPoint: number): number {
  return (Math.log(crashPoint) / K) * 1000;
}

export type OfflineRound = {
  id: number;
  betOpenAt: number;
  takeoffAt: number;
  crashAt: number;
  endAt: number;
  crashPoint: number;
};

const dayCache = new Map<number, OfflineRound[]>();

function buildDay(dayIndex: number): OfflineRound[] {
  const cached = dayCache.get(dayIndex);
  if (cached) return cached;
  const start = dayIndex * DAY_MS;
  const rounds: OfflineRound[] = [];
  let t = start;
  let i = 0;
  while (t < start + DAY_MS && i < ROUNDS_PER_DAY_MAX) {
    const id = dayIndex * ROUNDS_PER_DAY_MAX + i;
    const crashPoint = offlineCrashPoint(id);
    const takeoffAt = t + BET_MS;
    const crashAt = takeoffAt + flightMs(crashPoint);
    const endAt = crashAt + CRASH_PAUSE_MS;
    rounds.push({ id, betOpenAt: t, takeoffAt, crashAt, endAt, crashPoint });
    t = endAt;
    i += 1;
  }
  if (dayCache.size > 4) dayCache.clear();
  dayCache.set(dayIndex, rounds);
  return rounds;
}

function dayIndexOf(ts: number): number {
  return Math.floor(ts / DAY_MS);
}

export function offlineRoundAt(ts: number): OfflineRound {
  const day = dayIndexOf(ts);
  const rounds = buildDay(day);
  // binary search for the round containing ts
  let lo = 0;
  let hi = rounds.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (rounds[mid]!.betOpenAt <= ts) lo = mid;
    else hi = mid - 1;
  }
  const r = rounds[lo]!;
  if (ts >= r.endAt) {
    const nxt = rounds[lo + 1];
    if (nxt) return nxt;
    return buildDay(day + 1)[0]!;
  }
  return r;
}

/** The round that follows `round` in the shared schedule. */
export function offlineNextRound(round: OfflineRound): OfflineRound {
  return offlineRoundAt(round.endAt + 1);
}

export function offlineRoundIndex(ts: number): number {
  return offlineRoundAt(ts).id;
}

export function offlineHistory(ts: number, count = 24): number[] {
  const current = offlineRoundAt(ts);
  const day = dayIndexOf(current.betOpenAt);
  const rounds = buildDay(day);
  const pos = current.id - day * ROUNDS_PER_DAY_MAX;
  const out: number[] = [];
  for (let i = pos - 1; i >= 0 && out.length < count; i -= 1) {
    out.push(rounds[i]!.crashPoint);
  }
  if (out.length < count) {
    const prev = buildDay(day - 1);
    for (let i = prev.length - 1; i >= 0 && out.length < count; i -= 1) {
      out.push(prev[i]!.crashPoint);
    }
  }
  return out;
}

/** Look up a round by its global id (same schedule every device uses). */
export function offlineRoundById(id: number): OfflineRound | null {
  if (!Number.isInteger(id) || id < 0) return null;
  const day = Math.floor(id / ROUNDS_PER_DAY_MAX);
  return buildDay(day)[id - day * ROUNDS_PER_DAY_MAX] ?? null;
}
