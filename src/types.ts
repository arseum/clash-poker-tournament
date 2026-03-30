export type Page = 'setup' | 'tournament' | 'tables' | 'history';

export interface Player {
  id: string;
  name: string;
  tableId: string;
  isEliminated: boolean;
  eliminatedAt?: number; // level index
  position?: number; // finish position
}

export interface Table {
  id: string;
  name: string;
  playerIds: string[];
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number; // minutes
  isBreak?: boolean;
}

export interface TournamentConfig {
  name: string;
  buyIn: number;
  startingStack: number;
  maxPlayersPerTable: number;
  blindStructure: BlindLevel[];
}

export interface TournamentState {
  id: string;
  config: TournamentConfig;
  players: Player[];
  tables: Table[];
  currentLevelIndex: number;
  secondsRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  startedAt: number | null;
  rebuyCount: number;
}

export interface HistoryEntry {
  id: string;
  name: string;
  date: number;
  buyIn: number;
  playerCount: number;
  rebuyCount: number;
  totalPot: number;
  duration: number; // minutes
  placements: Array<{ playerName: string; position: number; prize: number }>;
}
