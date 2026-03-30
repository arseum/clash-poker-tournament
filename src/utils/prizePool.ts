export interface PrizeEntry {
  position: number;
  percentage: number;
  amount: number;
}

// Distribution basée sur les structures EPT / WSOP (% du pot total)
const DISTRIBUTIONS: Record<number, number[]> = {
  1:  [100],
  2:  [65, 35],
  3:  [50, 30, 20],
  4:  [45, 26, 17, 12],
  5:  [38, 23, 16, 12, 11],
  6:  [35, 21, 15, 11, 10, 8],
  7:  [33, 20, 14, 10, 8.5, 7.5, 7],
  8:  [31, 19, 13, 10, 8, 7, 6.5, 5.5],
  9:  [30, 18, 12, 9, 7.5, 7, 6, 5.5, 5],
  10: [28, 17, 12, 8.5, 7, 6.5, 5.5, 5.5, 5.5, 4.5],
};

const POSITION_MEDAL: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

// ITM % standard des grosses structures (~15-20 %)
export function getPaidPlaces(playerCount: number): number {
  if (playerCount <= 6)  return 1;
  if (playerCount <= 9)  return 2;
  if (playerCount <= 18) return 3;
  if (playerCount <= 27) return 4;
  if (playerCount <= 36) return 5;
  if (playerCount <= 45) return 6;
  if (playerCount <= 55) return 8;
  if (playerCount <= 70) return 9;
  return Math.min(10, Math.ceil(playerCount * 0.15));
}

export function calculatePrizes(totalPot: number, playerCount: number): PrizeEntry[] {
  const places = getPaidPlaces(playerCount);
  const dist = DISTRIBUTIONS[Math.min(places, 10)];
  return dist.map((pct, i) => ({
    position: i + 1,
    percentage: pct,
    amount: Math.round(totalPot * pct / 100),
  }));
}

export function positionLabel(pos: number): string {
  return POSITION_MEDAL[pos] ?? `${pos}e`;
}
