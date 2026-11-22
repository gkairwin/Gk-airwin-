/**
 * Shared wall clock.
 *
 * Every device derives the round schedule from the same time, so phones with
 * a slightly wrong system clock still stay in sync. When online we measure the
 * offset against a server `Date` header and cache it, so the app keeps using
 * the corrected time after the connection drops.
 */

const KEY = "gk_clock_offset";
let offset = 0;

try {
  const cached = Number(localStorage.getItem(KEY));
  if (Number.isFinite(cached)) offset = cached;
} catch {
  /* ignore */
}

export function now(): number {
  return Date.now() + offset;
}

export function clockOffset(): number {
  return offset;
}

export async function syncClock(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const t0 = Date.now();
    const res = await fetch(`${window.location.origin}/?t=${t0}`, {
      method: "HEAD",
      cache: "no-store",
    });
    const header = res.headers.get("date");
    if (!header) return;
    const t1 = Date.now();
    const server = new Date(header).getTime();
    if (!Number.isFinite(server)) return;
    // account for half the round-trip
    const next = server + (t1 - t0) / 2 - t1;
    // the Date header only has second precision; ignore sub-second noise
    if (Math.abs(next - offset) < 1000) return;
    offset = next;
    try {
      localStorage.setItem(KEY, String(offset));
    } catch {
      /* ignore */
    }
  } catch {
    /* offline: keep the cached offset */
  }
}
