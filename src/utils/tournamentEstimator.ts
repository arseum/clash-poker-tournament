import type { BlindLevel, ReEntryConfig } from '../types';

export interface BlindValidationError {
  levelIndex: number;
  field: 'smallBlind' | 'bigBlind' | 'ante';
  value: number;
}

export interface LevelEstimate {
  levelIndex: number;
  isBreak: boolean;
  playersRemaining: number;
  avgM: number;
}

export interface TournamentEstimate {
  totalDurationMinutes: number;
  estimatedEndLevel: number; // index 0-based
  estimatedDurationMinutes: number;
  levels: LevelEstimate[];
}

/**
 * Retourne les valeurs de blindes non-multiples du plus petit jeton.
 */
export function validateBlindStructure(
  structure: BlindLevel[],
  smallestChip: number
): BlindValidationError[] {
  if (smallestChip <= 0) return [];
  const errors: BlindValidationError[] = [];
  structure.forEach((level, idx) => {
    if (level.isBreak) return;
    if (level.smallBlind % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'smallBlind', value: level.smallBlind });
    if (level.bigBlind % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'bigBlind', value: level.bigBlind });
    if (level.ante > 0 && level.ante % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'ante', value: level.ante });
  });
  return errors;
}

/**
 * Estime la durée et le nombre de joueurs restants par niveau.
 * Modèle basé sur le M-ratio (Paul Magriel) avec décroissance exponentielle.
 *
 * survivalRate(L) = e^(-mains_niveau / (avgM × joueurs_à_table))
 */
export function estimateTournament(
  structure: BlindLevel[],
  playerCount: number,
  startingStack: number,
  maxPlayersPerTable: number,
  reEntry: ReEntryConfig | null,
  handsPerHour = 25
): TournamentEstimate {
  const totalDurationMinutes = structure.reduce((s, l) => s + l.duration, 0);

  if (playerCount < 2 || startingStack <= 0 || structure.length === 0) {
    return {
      totalDurationMinutes,
      estimatedEndLevel: structure.length - 1,
      estimatedDurationMinutes: totalDurationMinutes,
      levels: [],
    };
  }

  // Suivi re-entry par "slot joueur" (approximation : on alloue les re-entries aux premiers slots)
  const reEntriesUsed = new Array(playerCount).fill(0);

  let totalChips = playerCount * startingStack;
  let playersRemaining = playerCount;
  const levels: LevelEstimate[] = [];

  let estimatedEndLevel = structure.length - 1;
  let estimatedDurationMinutes = totalDurationMinutes;
  let cumulativeDuration = 0;
  let endFound = false;

  for (let i = 0; i < structure.length; i++) {
    const level = structure[i];
    cumulativeDuration += level.duration;

    if (level.isBreak) {
      levels.push({ levelIndex: i, isBreak: true, playersRemaining, avgM: 0 });
      continue;
    }

    const roundCost = level.smallBlind + level.bigBlind + level.ante;
    if (roundCost === 0) {
      levels.push({ levelIndex: i, isBreak: false, playersRemaining, avgM: 999 });
      continue;
    }

    const avgStack = totalChips / playersRemaining;
    const avgM = avgStack / roundCost;
    const playersAtTable = Math.min(maxPlayersPerTable, playersRemaining);
    const handsInLevel = (level.duration * handsPerHour) / 60;

    // Survie : e^(-mains / (M * joueurs_à_table))
    const survivalRate = Math.exp(-handsInLevel / (avgM * playersAtTable));
    const newPlayers = Math.max(1, Math.round(playersRemaining * survivalRate));
    const eliminated = playersRemaining - newPlayers;

    // Re-entry : ajouter des chips pour les éliminés qui peuvent revenir
    // Niveau 1-indexed pour comparaison avec maxLevel
    if (reEntry && (i + 1) <= reEntry.maxLevel && eliminated > 0) {
      let reEnterers = 0;
      for (let p = 0; p < eliminated && p < playerCount; p++) {
        const maxRe = reEntry.maxPerPlayer === 0 ? Infinity : reEntry.maxPerPlayer;
        if (reEntriesUsed[p] < maxRe) {
          reEntriesUsed[p]++;
          reEnterers++;
        }
      }
      totalChips += reEnterers * startingStack;
    }

    levels.push({ levelIndex: i, isBreak: false, playersRemaining: newPlayers, avgM });

    if (!endFound && playersRemaining > 1 && newPlayers <= 1) {
      estimatedEndLevel = i;
      estimatedDurationMinutes = cumulativeDuration;
      endFound = true;
    }

    playersRemaining = newPlayers;
  }

  return {
    totalDurationMinutes,
    estimatedEndLevel,
    estimatedDurationMinutes,
    levels,
  };
}
