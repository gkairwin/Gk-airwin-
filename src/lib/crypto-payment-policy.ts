export function canCreditCrypto(payment: { payment_id?: unknown; payment_status?: string; order_id?: string; price_amount?: unknown; price_currency?: string }, deposit: { id: string; payment_id: string | null; amount: number }) {
  return payment.payment_status === 'finished' && String(payment.payment_id) === deposit.payment_id && payment.order_id === deposit.id && payment.price_currency?.toLowerCase() === 'kes' && Number(payment.price_amount) === Number(deposit.amount);
}

export function depositMethod(country: string) { return country === 'KE' ? 'mpesa' : 'nowpayments'; }

export function cryptoMinimum(fiatEquivalent: number) {
  if (!Number.isFinite(fiatEquivalent) || fiatEquivalent <= 0) throw new Error('Could not check the minimum deposit. Please try again.');
  return Math.max(100, Math.ceil(fiatEquivalent));
}

export function shouldCheckCrypto(deposit: { credited: boolean; status: string; payment_id?: string | null }) {
  return !deposit.credited && Boolean(deposit.payment_id) && !['failed', 'expired', 'refunded'].includes(deposit.status);
}