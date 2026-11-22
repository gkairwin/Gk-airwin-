/** Bank inputs use local money; the existing approval flow stores KES to two decimal places. */
export function bankAmountKes(local: number, rate: number): number {
  if (!Number.isFinite(local) || !Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round((local / rate) * 100) / 100;
}