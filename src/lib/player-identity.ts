function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
/** Stable public player ID derived from the account id, e.g. GKA-784563. */
export function playerId(userId: string): string {
  return `GKA-${String(hash(userId) % 900000 + 100000)}`;
}
/** Stable avatar seed parameters for a player. */
export function avatarSeed(userId: string) {
  const h = hash(userId + ":avatar");
  return { hue: h % 360, hue2: (h >> 9) % 360, shape: (h >> 18) % 4, face: (h >> 22) % 3 };
}
