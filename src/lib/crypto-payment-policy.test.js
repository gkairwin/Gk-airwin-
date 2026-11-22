import { test, expect } from 'bun:test';
import { canCreditCrypto, depositMethod, cryptoMinimum, shouldCheckCrypto } from './crypto-payment-policy';
const deposit = { id: 'order-1', payment_id: '123', amount: 1000 };
const paid = { payment_id: 123, payment_status: 'finished', order_id: 'order-1', price_amount: 1000, price_currency: 'kes' };
test('Kenya retains M-Pesa', () => expect(depositMethod('KE')).toBe('mpesa'));
test('other countries use NOWPayments', () => { for (const code of ['GH','IN','PK']) expect(depositMethod(code)).toBe('nowpayments'); });
test('verified finished KES payment can credit', () => expect(canCreditCrypto(paid, deposit)).toBe(true));
test('partial and unconfirmed payments cannot credit', () => { for (const status of ['waiting','confirming','confirmed','sending','partially_paid','failed','expired']) expect(canCreditCrypto({ ...paid, payment_status: status }, deposit)).toBe(false); });
test('wrong payment, order, amount or currency cannot credit', () => { for (const change of [{ payment_id: 124 }, { order_id: 'other' }, { price_amount: 100 }, { price_currency: 'usd' }]) expect(canCreditCrypto({ ...paid, ...change }, deposit)).toBe(false); });
test('provider minimum rounds up in KES and retains the 100 KES floor', () => {
  expect(cryptoMinimum(1591.95367063)).toBe(1592);
  expect(cryptoMinimum(50)).toBe(100);
  expect(() => cryptoMinimum(NaN)).toThrow();
});
test('pending and partially paid deposits keep checking but completed deposits stop', () => {
  for (const status of ['waiting', 'confirming', 'confirmed', 'sending', 'partially_paid']) expect(shouldCheckCrypto({ status, credited: false, payment_id: '123' })).toBe(true);
  for (const status of ['failed', 'expired', 'refunded']) expect(shouldCheckCrypto({ status, credited: false, payment_id: '123' })).toBe(false);
  expect(shouldCheckCrypto({ status: 'finished', credited: true, payment_id: '123' })).toBe(false);
  expect(shouldCheckCrypto({ status: 'creating', credited: false, payment_id: null })).toBe(false);
});