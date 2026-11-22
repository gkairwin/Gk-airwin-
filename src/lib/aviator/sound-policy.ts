/** Only announce a crash witnessed during flight, never a late page arrival. */
export function shouldPlayCrash(previous: string, current: string, enabled: boolean) {
  return enabled && previous === "flying" && current === "crashed";
}

/** Only play takeoff when a watched countdown becomes a flight. */
export function shouldPlayStart(previous: string, current: string, enabled: boolean) {
  return enabled && previous === "waiting" && current === "flying";
}