import type { PrizePoolConfig, PalierEntry } from '../types';

export interface PrizeEntry {
  position: number;
  percentage: number;
  amount: number;
}

// ─── ITM ─────────────────────────────────────────────────────────────────────
export function getPaidPlaces(playerCount: number, itmPct: number): number {
  if (playerCount <= 0) return 0;
  return Math.max(1, Math.round(playerCount * (itmPct / 100)));
}

// ─── Auto distribution: formule Winamax / nombre d'or ────────────────────────
//
// f(n) = (c / √5) × [ φ^(n+1) + (−1)^n × φ^(−(n+1)) ]
//   φ  = (1 + √5) / 2  ≈ 1.618
//   c  = ln(φ) / ln(J)
//   J  = places payées, n = rang interne (n=J → 1er)
//
const PHI   = (1 + Math.sqrt(5)) / 2;
const SQRT5 = Math.sqrt(5);

function fibWeight(n: number, J: number): number {
  const c = Math.log(PHI) / Math.log(J);
  return (c / SQRT5) * (
    Math.pow(PHI,  n + 1) +
    Math.pow(-1, n) * Math.pow(PHI, -(n + 1))
  );
}

function distributeAuto(totalPot: number, J: number): PrizeEntry[] {
  if (J <= 0) return [];
  if (J === 1) return [{ position: 1, percentage: 100, amount: totalPot }];
  const weights = Array.from({ length: J }, (_, i) => fibWeight(J - i, J));
  const totalW  = weights.reduce((s, w) => s + w, 0);
  return weights.map((w, i) => ({
    position:   i + 1,
    percentage: Math.round((w / totalW) * 1000) / 10,
    amount:     Math.round(totalPot * w / totalW),
  }));
}

// ─── Paliers distribution ─────────────────────────────────────────────────────
function distributePaliers(totalPot: number, paliers: PalierEntry[]): PrizeEntry[] {
  const entries: PrizeEntry[] = [];
  for (const palier of paliers) {
    const count     = palier.toPosition - palier.fromPosition + 1;
    const pctEach   = palier.totalPct / count;
    const amountEach = Math.round(totalPot * (pctEach / 100));
    for (let pos = palier.fromPosition; pos <= palier.toPosition; pos++) {
      entries.push({
        position:   pos,
        percentage: Math.round(pctEach * 10) / 10,
        amount:     amountEach,
      });
    }
  }
  return entries.sort((a, b) => a.position - b.position);
}

// ─── Manual distribution ──────────────────────────────────────────────────────
function distributeManual(totalPot: number, manualShares: number[], J: number): PrizeEntry[] {
  return Array.from({ length: J }, (_, i) => {
    const pct = manualShares[i] ?? 0;
    return {
      position:   i + 1,
      percentage: pct,
      amount:     Math.round(totalPot * pct / 100),
    };
  });
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export function calculatePrizes(
  prizePoolAmount: number,
  playerCount: number,
  config: PrizePoolConfig,
): PrizeEntry[] {
  const J = getPaidPlaces(playerCount, config.itmPct);
  if (J <= 0) return [];

  switch (config.distributionMode) {
    case 'paliers': return distributePaliers(prizePoolAmount, config.paliers);
    case 'manual':  return distributeManual(prizePoolAmount, config.manualShares, J);
    case 'auto':
    default:        return distributeAuto(prizePoolAmount, J);
  }
}

// ─── Helpers pour initialiser les modes ───────────────────────────────────────
export function defaultPaliers(J: number): PalierEntry[] {
  if (J <= 0) return [];
  const pctEach = Math.round(1000 / J) / 10;
  return Array.from({ length: J }, (_, i) => ({
    fromPosition: i + 1,
    toPosition:   i + 1,
    totalPct: i < J - 1
      ? pctEach
      : Math.round((100 - pctEach * (J - 1)) * 10) / 10,
  }));
}

export function defaultManualShares(J: number): number[] {
  if (J <= 0) return [];
  const pctEach = Math.round(1000 / J) / 10;
  return Array.from({ length: J }, (_, i) =>
    i < J - 1 ? pctEach : Math.round((100 - pctEach * (J - 1)) * 10) / 10
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
const POSITION_MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function positionLabel(pos: number): string {
  return POSITION_MEDAL[pos] ?? `${pos}e`;
}
