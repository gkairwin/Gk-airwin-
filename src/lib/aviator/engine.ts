/** Shared growth constant: multiplier = e^(K * secondsSinceTakeoff). */
export const GROWTH_K = 0.115;

export function multiplierAt(secondsSinceTakeoff: number): number {
  if (secondsSinceTakeoff <= 0) return 1;
  return Math.exp(GROWTH_K * secondsSinceTakeoff);
}

export type ServerRound = {
  id: number;
  betOpenAt: number;
  takeoffAt: number;
  /** only present once the round has actually crashed */
  crashedAt: number | null;
  crashPoint: number | null;
  endAt: number | null;
};

export type ServerBet = {
  id: string;
  slot: number;
  roundId: number;
  amount: number;
  autoCashout: number | null;
  cashedMultiplier: number | null;
  win: number | null;
  status: string;
};
