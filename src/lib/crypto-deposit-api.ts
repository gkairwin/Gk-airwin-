import { supabase } from '@/integrations/supabase/client';
export type CryptoDeposit = { id: string; amount: number; payment_id: string | null; pay_currency: string; pay_address: string | null; pay_amount: number | null; payin_extra_id: string | null; status: string; credited: boolean };
export class CryptoCallError extends Error {
  constructor(message: string, public retrySafe: boolean) { super(message); }
}
export async function cryptoCall<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error('Please sign in first.');
  const host = window.location.hostname;
  const local = host === 'localhost' || host.endsWith('.lovable.app') || host.endsWith('.lovableproject.com');
  const response = await fetch(`${local ? window.location.origin : 'https://gk-airwin.lovable.app'}/api/public/crypto-deposit`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${data.session.access_token}` }, body: JSON.stringify(body) });
  let result;
  try { result = await response.json(); } catch { throw new Error('Could not reach NOWPayments. Please try again.'); }
  if (!response.ok) throw new CryptoCallError(result.error ?? 'Could not reach NOWPayments. Please try again.', result.retrySafe === true);
  return result.data as T;
}