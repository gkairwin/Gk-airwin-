import { z } from 'zod';
import { canCreditCrypto, cryptoMinimum } from './crypto-payment-policy';

const inputSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('list') }),
  z.object({ action: z.literal('currencies') }),
  z.object({ action: z.literal('minimum'), currency: z.string().regex(/^[a-z0-9]{2,30}$/) }),
  z.object({ action: z.literal('start'), amount: z.number().int().min(100).max(150000), currency: z.string().regex(/^[a-z0-9]{2,30}$/), requestId: z.string().uuid() }),
  z.object({ action: z.literal('check'), id: z.string().uuid() }),
]);

export class CryptoRequestError extends Error {
  constructor(message: string, public retrySafe = false) { super(message); }
}

async function nowpayments(path: string, body?: unknown) {
  const token = process.env['LOVABLE_API_KEY'];
  const key = process.env['UDC_NOWPAYMENTS_API_KEY'];
  if (!token || !key) throw new Error('NOWPayments is temporarily unavailable. Please try again later.');
  const response = await fetch(`https://connector-gateway.lovable.dev/udc_nowpayments/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'X-Connection-Api-Key': key, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) {
    const text = await response.text();
    console.error(`NOWPayments failed [${response.status}]: ${text}`);
    let message = 'NOWPayments could not process this request.';
    try { const error = JSON.parse(text); if (typeof error.message === 'string') message = error.message; } catch { /* non-JSON provider error */ }
    throw new CryptoRequestError(`NOWPayments (${response.status}): ${message}`, response.status === 400 || response.status === 422);
  }
  return response.json();
}

async function minimumFor(currency: string) {
  const result = await nowpayments(`min-amount?currency_from=${encodeURIComponent(currency)}&fiat_equivalent=kes`);
  return cryptoMinimum(z.coerce.number().parse(result.fiat_equivalent));
}

export async function cryptoDeposit(raw: unknown, userId: string) {
  const validated = inputSchema.safeParse(raw);
  if (!validated.success) throw new Error('Enter a valid amount between 100 and 150,000 KES and choose a cryptocurrency.');
  const input = validated.data;
  if (input.action === 'minimum') return { minimum: await minimumFor(input.currency) };
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  if (input.action === 'currencies') {
    const [result, merchant] = await Promise.all([nowpayments('currencies'), nowpayments('merchant/coins')]);
    const selected = new Set(z.array(z.string()).parse(merchant.selectedCurrencies).map((coin) => coin.toLowerCase()));
    return { currencies: z.array(z.string()).parse(result.currencies).map((coin) => coin.toLowerCase()).filter((coin) => selected.has(coin) && /^[a-z0-9]{2,30}$/.test(coin)) };
  }
  if (input.action === 'list') {
    const { data, error } = await supabaseAdmin.from('crypto_deposits').select('id,amount,payment_id,pay_currency,pay_address,pay_amount,payin_extra_id,status,credited,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(5);
    if (error) throw new Error('Could not load deposits. Please try again.');
    return { deposits: data };
  }
  if (input.action === 'start') {
    const { data: profile } = await supabaseAdmin.from('profiles').select('country_code').eq('id', userId).single();
    if (!profile?.country_code || profile.country_code === 'KE') throw new Error('Please use M-Pesa for Kenyan deposits.');
    const { data: existing } = await supabaseAdmin.from('crypto_deposits').select('*').eq('request_id', input.requestId).maybeSingle();
    if (existing) {
      if (existing.user_id !== userId) throw new Error('Invalid deposit request.');
      if (!existing.payment_id) throw new Error('This request is still being processed. Check your recent deposits before trying again.');
      return { deposit: existing };
    }
    const minimum = await minimumFor(input.currency);
    if (input.amount < minimum) throw new CryptoRequestError(`Minimum ${input.currency.toUpperCase()} deposit is KES ${minimum.toLocaleString()}.`, true);
    const { data: deposit, error } = await supabaseAdmin.from('crypto_deposits').insert({ user_id: userId, request_id: input.requestId, amount: input.amount, pay_currency: input.currency }).select('*').single();
    if (error || !deposit) throw new Error('Could not start deposit. Check your recent deposits before trying again.');
    try {
      const payment = await nowpayments('payment', { price_amount: input.amount, price_currency: 'kes', pay_currency: input.currency, order_id: deposit.id, order_description: 'GK Airwin deposit' });
      const parsed = z.object({ payment_id: z.union([z.string(),z.number()]), pay_address: z.string().min(1), pay_amount: z.coerce.number().positive(), pay_currency: z.string(), payment_status: z.string(), payin_extra_id: z.string().nullable().optional() }).parse(payment);
      const { data: saved, error: saveError } = await supabaseAdmin.from('crypto_deposits').update({ payment_id: String(parsed.payment_id), pay_address: parsed.pay_address, pay_amount: parsed.pay_amount, payin_extra_id: parsed.payin_extra_id ?? null, status: parsed.payment_status }).eq('id', deposit.id).select('*').single();
      if (saveError || !saved) throw new Error('Could not save payment details. Please contact support before sending funds.');
      return { deposit: saved };
    } catch (error) {
      if (error instanceof CryptoRequestError && error.retrySafe) await supabaseAdmin.from('crypto_deposits').update({ status: 'failed' }).eq('id', deposit.id);
      throw error;
    }
  }
  const { data: deposit } = await supabaseAdmin.from('crypto_deposits').select('*').eq('id', input.id).eq('user_id', userId).single();
  if (!deposit) throw new Error('Deposit not found.');
  if (!deposit.credited && deposit.payment_id) {
    const payment = await nowpayments(`payment/${encodeURIComponent(deposit.payment_id)}`);
    if (canCreditCrypto(payment, deposit)) {
      const { error } = await supabaseAdmin.rpc('credit_crypto_deposit', { p_id: deposit.id, p_payment_id: deposit.payment_id });
      if (error) throw new Error('Payment confirmed; balance update is pending. Please check again.');
    } else {
      if (payment.payment_status === 'finished') throw new Error('Payment details do not match this deposit. Please contact support.');
      const { error } = await supabaseAdmin.from('crypto_deposits').update({ status: String(payment.payment_status ?? 'waiting') }).eq('id', deposit.id).eq('credited', false);
      if (error) throw new Error('Could not update payment status. Please check again.');
    }
  }
  const { data: fresh, error } = await supabaseAdmin.from('crypto_deposits').select('*').eq('id', deposit.id).single();
  if (error) throw new Error('Could not load payment status.');
  return { deposit: fresh };
}