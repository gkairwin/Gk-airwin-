import { test, expect } from 'bun:test';
import { replyDelay, ownAccountContext, supportApi, LEO_ENABLED } from './policy.ts';
test('support is manual-only at the owner request', () => {
  expect(LEO_ENABLED).toBe(false);
});
test('Leo waits at least five seconds after a player message', () => {
  expect(replyDelay('2026-11-11T00:00:00Z', Date.parse('2026-11-11T00:00:00Z'))).toBe(5000);
  expect(replyDelay('2026-11-11T00:00:00Z', Date.parse('2026-11-11T00:00:03Z'))).toBe(2000);
  expect(replyDelay('2026-11-11T00:00:00Z', Date.parse('2026-11-11T00:00:06Z'))).toBe(0);
  expect(replyDelay('2026-11-11T00:00:00Z', Date.parse('2026-11-11T00:00:04.999Z'))).toBe(1);
  expect(replyDelay('2026-11-11T00:00:00Z', Date.parse('2026-11-11T00:00:05Z'))).toBe(0);
});
test('Leo preview requests use the preview endpoint rather than an unpublished live endpoint', () => {
  expect(supportApi('e79c29ce-c586-48ad-a2fd-e295d769aa38.lovableproject.com')).toBe('/api/public/support');
  expect(supportApi('id-preview--example.lovable.app')).toBe('/api/public/support');
  expect(supportApi('localhost')).toBe('/api/public/support');
  expect(supportApi('example.vercel.app')).toBe('https://gk-airwin.lovable.app/api/public/support');
});
test('Leo cannot use another player account context', () => {
  expect(ownAccountContext({id:'other',balance:15000,country_code:'KE'},'self')).toBeNull();
  expect(ownAccountContext({id:'self',balance:100,country_code:'IN'},'self')).toEqual({balanceKES:100,country:'IN'});
});