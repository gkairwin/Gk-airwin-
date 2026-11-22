export type RoundPlayer = {
  id: string;
  name: string;
  avatar: string;
  bet: number;
  cashOutAt: number | null;
  cashedOut: boolean;
};

const LETTERS = "abcdefghijklmnopqrstuvwxyz0123456789";
const AVATAR_COLORS = [
  "#e8b923",
  "#7a4fd8",
  "#2f8f6b",
  "#b8442c",
  "#3a6fb0",
  "#8a8f98",
  "#d0762b",
  "#4d5a7a",
  "#a2325c",
  "#2b7d8f",
];

let seed = 1337;
function rnd() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rnd() * arr.length)] as T;
}

export function maskedName() {
  const a = LETTERS[Math.floor(rnd() * LETTERS.length)] ?? "a";
  const b = LETTERS[Math.floor(rnd() * LETTERS.length)] ?? "1";
  return `${a}***${b}`;
}

export function avatarColor() {
  return pick(AVATAR_COLORS);
}

const BET_AMOUNTS = [
  9499.8, 6649.86, 3609.92, 3229.93, 2500, 1900.5, 1500, 1200.4, 950, 800,
  650.75, 500, 420.3, 300, 250, 200, 150, 100, 80, 50, 30, 20, 10, 5,
];

function crashLike() {
  const r = rnd();
  return Math.max(1.01, Math.min(20, 1 / (1 - r * 0.92)));
}

export function generateRoundPlayers(count: number): RoundPlayer[] {
  const players: RoundPlayer[] = [];
  for (let i = 0; i < count; i++) {
    players.push({
      id: `p${i}-${Math.floor(rnd() * 1e9)}`,
      name: maskedName(),
      avatar: avatarColor(),
      bet: BET_AMOUNTS[Math.min(BET_AMOUNTS.length - 1, Math.floor(i / 2 + rnd() * 3))] ?? 5,
      cashOutAt: rnd() < 0.75 ? Number(crashLike().toFixed(2)) : null,
      cashedOut: false,
    });
  }
  return players.sort((a, b) => b.bet - a.bet);
}

export function randomCrashPoint() {
  const r = Math.random();
  if (r < 0.04) return 1.0;
  return Math.max(1.01, Math.min(150, Number((0.99 / (1 - r)).toFixed(2))));
}
