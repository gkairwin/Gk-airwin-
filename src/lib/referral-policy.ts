/** Inviter reward on the friend's first credited deposit, in KES (shown converted). */
export const REFERRAL_BONUS_KES = 50;
/** Share of every credited deposit by the invited friend. */
export const REFERRAL_COMMISSION = 0.1;
export const referralLink = (origin: string, code: string) => `${origin}/auth?ref=${encodeURIComponent(code)}`;
export const referralReward = (depositKes: number, first: boolean) =>
  depositKes > 0 ? Math.round(depositKes * REFERRAL_COMMISSION * 100) / 100 + (first ? REFERRAL_BONUS_KES : 0) : 0;
