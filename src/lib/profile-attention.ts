export function needsProfileAttention(signedIn: boolean, hasDeposited: boolean | null, suspended = false) {
  return signedIn && hasDeposited === false && !suspended;
}