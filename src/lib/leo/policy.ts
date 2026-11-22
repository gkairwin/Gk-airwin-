export const LEO_MIN_DELAY_MS = 5000;
export const LEO_ENABLED = false;
export function supportApi(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.lovable.app') || hostname.endsWith('.lovableproject.com')
    ? '/api/public/support'
    : 'https://gk-airwin.lovable.app/api/public/support';
}
export function replyDelay(createdAt: string, now = Date.now()) {
  return Math.max(0, new Date(createdAt).getTime() + LEO_MIN_DELAY_MS - now);
}
export function ownAccountContext(profile: { id: string; balance: number; country_code: string | null } | null, userId: string) {
  if (!profile || profile.id !== userId) return null;
  return { balanceKES: Number(profile.balance), country: profile.country_code ?? 'KE' };
}