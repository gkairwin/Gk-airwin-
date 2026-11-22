import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { currencyFor, toLocal } from "@/lib/currency";

type Money = { currency: string; rate: number; local: (kes: number) => number; fmt: (kes: number, digits?: number) => string; text: (s: string) => string };
const fmtKes = (k: number, d = 2) => k.toLocaleString("en", { minimumFractionDigits: d, maximumFractionDigits: d });
const kesMoney: Money = { currency: "KES", rate: 1, local: (k) => k, fmt: fmtKes, text: (s) => s };
/** Rewrites "15,000 KES" / "KES 100" / "KES" inside copy into the player's currency. */
function localizeText(s: string, currency: string, fmt: (k: number, d?: number) => string) {
  if (currency === "KES") return s;
  const n = (v: string) => fmt(Number(v.replace(/,/g, "")), 0);
  return s.replace(/(\d[\d,]*(?:\.\d+)?)\s*KES/g, (_, v) => `${n(v)} ${currency}`).replace(/KES\s*(\d[\d,]*(?:\.\d+)?)/g, (_, v) => `${n(v)} ${currency}`).replace(/KES/g, currency);
}
const Ctx = createContext<Money>(kesMoney);

export function MoneyProvider({ country, children }: { country: string; children: ReactNode }) {
  const currency = currencyFor(country);
  const [rate, setRate] = useState(currency === "KES" ? 1 : 0);
  useEffect(() => {
    if (currency === "KES") { setRate(1); return; }
    const key = `gk_rate_${currency}`;
    try { const c = JSON.parse(localStorage.getItem(key) ?? "null"); if (c?.rate) setRate(c.rate); } catch { /* optional */ }
    fetch("https://open.er-api.com/v6/latest/KES").then((r) => r.json()).then((d) => {
      const r = d?.rates?.[currency];
      if (typeof r === "number") { setRate(r); try { localStorage.setItem(key, JSON.stringify({ rate: r })); } catch { /* optional */ } }
    }).catch(() => {});
  }, [currency]);
  const ready = rate > 0;
  const value: Money = ready
    ? { currency, rate, local: (k) => toLocal(k, rate), fmt: (k, d = 2) => fmtKes(toLocal(k, rate), d), text: (t) => localizeText(t, currency, (k, d) => fmtKes(toLocal(k, rate), d)) }
    : { currency, rate: 0, local: () => 0, fmt: () => "…", text: (t) => t.replace(/\d[\d,]*(?:\.\d+)?\s*KES|KES\s*\d[\d,]*(?:\.\d+)?/g, `… ${currency}`).replace(/KES/g, currency) };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useMoney = () => useContext(Ctx);
