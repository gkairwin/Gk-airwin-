import { useMoney } from "@/components/aviator/Money";
import { useEffect, useRef, useState } from 'react';
import { CircleHelp, Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cryptoCall, CryptoCallError, type CryptoDeposit as Deposit } from '@/lib/crypto-deposit-api';
import { CRYPTO_DEPOSIT_COPY } from '@/lib/crypto-deposit-copy';
import { shouldCheckCrypto } from '@/lib/crypto-payment-policy';
import { usePlayerLanguage } from './PlayerLanguage';

export function CryptoDeposit({ onPaid }: { onPaid: () => void }) {
  const { t, language } = usePlayerLanguage();
  const helpCopy = CRYPTO_DEPOSIT_COPY[language];
  const [showHelp, setShowHelp] = useState(false);
  const money = useMoney();
  const [amount, setAmount] = useState('');
  useEffect(() => { if (money.rate && amount === '') setAmount(String(Math.ceil(money.local(1000)))); }, [money.rate]); // eslint-disable-line react-hooks/exhaustive-deps
  const kesAmount = money.rate ? Math.round(Number(amount) / money.rate) : 0;
  const [currency, setCurrency] = useState('');
  const [currencies, setCurrencies] = useState<string[]>([]);
  const [recent, setRecent] = useState<Deposit[]>([]);
  const [active, setActive] = useState<Deposit | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [minimum, setMinimum] = useState<number | null>(null);
  const [minimumLoading, setMinimumLoading] = useState(false);
  const checking = useRef(false);
  const paidCallback = useRef(onPaid);
  paidCallback.current = onPaid;
  const requestId = useRef<string | null>(null);
  const load = async () => {
    const result = await cryptoCall<{ deposits: Deposit[] }>({ action: 'list' });
    setRecent(result.deposits);
  };
  useEffect(() => {
    let cancelled = false;
    void Promise.all([cryptoCall<{ currencies: string[] }>({ action: 'currencies' }), cryptoCall<{ deposits: Deposit[] }>({ action: 'list' })]).then(([coins, rows]) => {
      if (cancelled) return;
      setCurrencies(coins.currencies.sort());
      setCurrency(coins.currencies.includes('btc') ? 'btc' : coins.currencies[0] ?? '');
      setRecent(rows.deposits);
    }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!currency) return;
    let cancelled = false;
    setMinimum(null); setMinimumLoading(true);
    void cryptoCall<{ minimum: number }>({ action: 'minimum', currency }).then((result) => {
      if (!cancelled) { setMinimum(result.minimum); setError(''); }
    }).catch((e) => { if (!cancelled) setError(e instanceof Error ? e.message : t('tryAgain')); })
      .finally(() => { if (!cancelled) setMinimumLoading(false); });
    return () => { cancelled = true; };
  }, [currency]);
  useEffect(() => {
    if (!active || !shouldCheckCrypto(active)) return;
    let cancelled = false;
    const id = active.id;
    const refresh = async () => {
      if (checking.current || document.visibilityState !== 'visible') return;
      checking.current = true;
      try {
        const result = await cryptoCall<{ deposit: Deposit }>({ action: 'check', id });
        if (cancelled) return;
        setActive(result.deposit);
        setRecent((rows) => rows.map((row) => row.id === id ? result.deposit : row));
        setError('');
        if (result.deposit.credited) paidCallback.current();
      } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : 'Please try again.'); }
      finally { checking.current = false; }
    };
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    document.addEventListener('visibilitychange', refresh);
    return () => { cancelled = true; window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, [active?.id, active?.credited, active?.status]);
  const start = async () => {
    setBusy(true); setError('');
    requestId.current ??= crypto.randomUUID();
    try {
      const result = await cryptoCall<{ deposit: Deposit }>({ action: 'start', amount: kesAmount, currency, requestId: requestId.current });
      setActive(result.deposit); requestId.current = null; await load();
    } catch (e) { if (e instanceof CryptoCallError && e.retrySafe) requestId.current = null; setError(e instanceof Error ? e.message : t('tryAgain')); }
    finally { setBusy(false); }
  };
  const check = async () => {
    if (!active || checking.current) return;
    checking.current = true;
    setBusy(true); setError('');
    try {
      const result = await cryptoCall<{ deposit: Deposit }>({ action: 'check', id: active.id });
      setActive(result.deposit); if (result.deposit.credited) onPaid(); await load();
    } catch (e) { setError(e instanceof Error ? e.message : t('tryAgain')); }
    finally { checking.current = false; setBusy(false); }
  };
  const copy = async (value: string) => { try { await navigator.clipboard.writeText(value); } catch { setError(t('tryAgain')); } };
  return <div className="space-y-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-bold text-air-green">NOWPayments · Crypto</p>
      <Button type="button" variant="ghost" aria-expanded={showHelp} aria-controls="crypto-deposit-help" onClick={() => setShowHelp((visible) => !visible)} className="h-auto gap-1.5 px-2 py-1 text-xs font-semibold text-air-green">
        <CircleHelp className="size-4" aria-hidden="true" /> {helpCopy.help}
      </Button>
    </div>
    {showHelp && <div id="crypto-deposit-help" className="rounded-xl bg-air-field p-3 ring-1 ring-air-text/10">
      <p className="mb-2 text-sm font-semibold">{helpCopy.helpTitle}</p>
      <ol className="list-decimal space-y-2 ps-5 text-xs leading-relaxed text-air-text/80">
        {helpCopy.steps.map((step) => <li key={step}>{money.text(step)}</li>)}
      </ol>
    </div>}
    {!active ? <>
      <p className="text-xs font-semibold text-air-green">{helpCopy.recommended}</p>
      <label htmlFor="crypto-amount" className="block text-xs text-air-text/60">{money.text(t('amount'))}</label>
      <input id="crypto-amount" disabled={busy} inputMode="numeric" value={amount} onChange={(e) => { setAmount(e.target.value.replace(/\D/g, '')); requestId.current = null; }} className="w-full rounded-lg bg-air-field px-3 py-2.5 text-sm ring-1 ring-air-text/10" />
      <label htmlFor="crypto-currency" className="block text-xs text-air-text/60">Cryptocurrency / Network</label>
      <select id="crypto-currency" disabled={busy} dir="ltr" value={currency} onChange={(e) => { setCurrency(e.target.value); requestId.current = null; }} className="w-full rounded-lg bg-air-field px-3 py-2.5 text-sm ring-1 ring-air-text/10">
        {currencies.map((coin) => <option key={coin} value={coin}>{coin.toUpperCase()}</option>)}
      </select>
      {minimum !== null && <p className="text-xs text-air-text/70">Minimum: {money.fmt(minimum, 0)} {money.currency}</p>}
      <Button variant="ghost" disabled={busy || minimumLoading || minimum === null || !currency || kesAmount < minimum || kesAmount > 150000} onClick={() => void start()} className="h-auto w-full whitespace-normal bg-air-green py-2.5 text-air-action-ink">{busy ? t('sending') : t('deposit')}</Button>
    </> : <>
      <p className="text-sm font-bold">{money.fmt(active.amount, 0)} {money.currency}</p>
      {active.pay_address && !active.credited && !['failed', 'expired', 'refunded'].includes(active.status) && <>
        <p className="text-xs text-air-text/70">Send only {active.pay_currency.toUpperCase()} on its matching network.</p>
        <div className="flex items-center gap-2">
          <bdi dir="ltr" className="min-w-0 flex-1 break-all font-mono text-sm">{active.pay_amount} {active.pay_currency.toUpperCase()}</bdi>
          <Button variant="ghost" size="icon" aria-label="Copy crypto amount" onClick={() => void copy(String(active.pay_amount))}><Copy /></Button>
        </div>
        {active.payin_extra_id && <div className="flex items-center gap-2 rounded-lg bg-air-field p-2">
          <div className="min-w-0 flex-1"><p className="text-xs text-air-wait">Required memo / destination tag</p><bdi dir="ltr" className="break-all font-mono text-sm">{active.payin_extra_id}</bdi></div>
          <Button variant="ghost" size="icon" aria-label="Copy destination tag" onClick={() => void copy(active.payin_extra_id ?? '')}><Copy /></Button>
        </div>}
        <div className="flex items-center gap-2 rounded-lg bg-air-field p-2">
          <bdi dir="ltr" className="min-w-0 flex-1 break-all font-mono text-xs">{active.pay_address}</bdi>
          <Button variant="ghost" size="icon" aria-label="Copy payment address" onClick={() => void copy(active.pay_address ?? '')}><Copy /></Button>
        </div>
      </>}
      <p role="status" className={`text-sm ${active.credited ? 'text-air-green' : 'text-air-wait'}`}>{active.credited ? t('approved') : active.status.replaceAll('_',' ')}</p>
      {!active.credited && <Button variant="ghost" disabled={busy} onClick={() => void check()} className="w-full bg-air-text/10"><RefreshCw className={busy ? 'animate-spin' : ''} /> Check payment</Button>}
      <Button variant="ghost" onClick={() => setActive(null)} className="w-full text-air-text/60">{t('back')}</Button>
    </>}
    <div className="border-t border-air-text/10 pt-3">
      <a href="https://nowpayments.io/payment/?iid=4604207786" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-air-green underline underline-offset-4">
        {helpCopy.paymentLink}<ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
      </a>
      <p className="mt-2 text-xs leading-relaxed text-air-text/60">{helpCopy.linkNote}</p>
    </div>
    {error && <p role="alert" className="break-words text-xs text-air-danger">{error}</p>}
    {recent.length > 0 && <div className="border-t border-air-text/10 pt-3">
      <p className="mb-2 text-xs text-air-text/50">{t('recent')}</p>
      {recent.map((row) => <Button key={row.id} variant="ghost" onClick={() => setActive(row)} className="flex h-auto w-full justify-between gap-2 whitespace-normal py-2 text-xs"><span>{money.fmt(row.amount, 0)} {money.currency} · {row.pay_currency.toUpperCase()}</span><span className="text-air-text/60">{row.status.replaceAll('_',' ')}</span></Button>)}
    </div>}
  </div>;
}