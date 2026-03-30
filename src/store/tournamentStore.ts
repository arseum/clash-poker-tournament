import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TournamentState, TournamentConfig, Player, Table } from '../types';

interface TournamentStore {
  tournament: TournamentState | null;
  initTournament: (config: TournamentConfig, playerNames: string[]) => void;
  eliminatePlayer: (playerId: string) => void;
  undoElimination: (playerId: string) => void;
  rebuyPlayer: (playerId: string) => void;
  nextLevel: () => void;
  prevLevel: () => void;
  startTimer: () => void;
  pauseTimer: () => void;
  tickTimer: () => void;
  resetTimer: () => void;
  updateSecondsRemaining: (seconds: number) => void;
  redistributeTables: () => void;
  endTournament: () => void;
  clearTournament: () => void;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function createTables(players: Player[], maxPerTable: number): Table[] {
  const tables: Table[] = [];
  const activePlayers = [...players];
  const tableCount = Math.ceil(activePlayers.length / maxPerTable);

  for (let i = 0; i < tableCount; i++) {
    tables.push({ id: generateId(), name: `Table ${i + 1}`, playerIds: [] });
  }

  activePlayers.forEach((player, idx) => {
    const tableIdx = idx % tableCount;
    tables[tableIdx].playerIds.push(player.id);
  });

  return tables;
}

export const useTournamentStore = create<TournamentStore>()(
  persist(
    (set, _get) => ({
      tournament: null,

      initTournament: (config, playerNames) => {
        const players: Player[] = playerNames.map(name => ({
          id: generateId(),
          name,
          tableId: '',
          isEliminated: false,
        }));
        const tables = createTables(players, config.maxPlayersPerTable);
        // assign tableId to players
        tables.forEach(table => {
          table.playerIds.forEach(pid => {
            const p = players.find(p => p.id === pid);
            if (p) p.tableId = table.id;
          });
        });

        const firstLevel = config.blindStructure[0];
        set({
          tournament: {
            id: generateId(),
            config,
            players,
            tables,
            currentLevelIndex: 0,
            secondsRemaining: firstLevel.duration * 60,
            isRunning: false,
            isPaused: false,
            startedAt: null,
            rebuyCount: 0,
          }
        });
      },

      eliminatePlayer: (playerId) => set(state => {
        if (!state.tournament) return state;
        const activePlayers = state.tournament.players.filter(p => !p.isEliminated);
        const position = activePlayers.length;
        return {
          tournament: {
            ...state.tournament,
            players: state.tournament.players.map(p =>
              p.id === playerId
                ? { ...p, isEliminated: true, eliminatedAt: state.tournament!.currentLevelIndex, position }
                : p
            ),
          }
        };
      }),

      undoElimination: (playerId) => set(state => {
        if (!state.tournament) return state;
        // Recalculate positions for players eliminated after this one
        const target = state.tournament.players.find(p => p.id === playerId);
        if (!target || !target.isEliminated) return state;
        const targetPosition = target.position ?? 0;
        return {
          tournament: {
            ...state.tournament,
            players: state.tournament.players.map(p => {
              if (p.id === playerId) return { ...p, isEliminated: false, eliminatedAt: undefined, position: undefined };
              // players who were eliminated "after" (lower position number) get +1
              if (p.isEliminated && p.position !== undefined && p.position < targetPosition) {
                return { ...p, position: p.position + 1 };
              }
              return p;
            }),
          }
        };
      }),

      rebuyPlayer: (playerId) => set(state => {
        if (!state.tournament) return state;
        return {
          tournament: {
            ...state.tournament,
            rebuyCount: state.tournament.rebuyCount + 1,
            players: state.tournament.players.map(p =>
              p.id === playerId ? { ...p, isEliminated: false, eliminatedAt: undefined, position: undefined } : p
            ),
          }
        };
      }),

      nextLevel: () => set(state => {
        if (!state.tournament) return state;
        const nextIdx = Math.min(
          state.tournament.currentLevelIndex + 1,
          state.tournament.config.blindStructure.length - 1
        );
        const nextLevel = state.tournament.config.blindStructure[nextIdx];
        return {
          tournament: {
            ...state.tournament,
            currentLevelIndex: nextIdx,
            secondsRemaining: nextLevel.duration * 60,
          }
        };
      }),

      prevLevel: () => set(state => {
        if (!state.tournament) return state;
        const prevIdx = Math.max(state.tournament.currentLevelIndex - 1, 0);
        const prevLevel = state.tournament.config.blindStructure[prevIdx];
        return {
          tournament: {
            ...state.tournament,
            currentLevelIndex: prevIdx,
            secondsRemaining: prevLevel.duration * 60,
          }
        };
      }),

      startTimer: () => set(state => {
        if (!state.tournament) return state;
        return {
          tournament: {
            ...state.tournament,
            isRunning: true,
            isPaused: false,
            startedAt: state.tournament.startedAt ?? Date.now(),
          }
        };
      }),

      pauseTimer: () => set(state => {
        if (!state.tournament) return state;
        return {
          tournament: { ...state.tournament, isRunning: false, isPaused: true }
        };
      }),

      tickTimer: () => set(state => {
        if (!state.tournament || !state.tournament.isRunning) return state;
        const newSeconds = state.tournament.secondsRemaining - 1;
        if (newSeconds <= 0) {
          const nextIdx = Math.min(
            state.tournament.currentLevelIndex + 1,
            state.tournament.config.blindStructure.length - 1
          );
          const nextLevel = state.tournament.config.blindStructure[nextIdx];
          return {
            tournament: {
              ...state.tournament,
              currentLevelIndex: nextIdx,
              secondsRemaining: nextLevel.duration * 60,
              isRunning: nextIdx !== state.tournament.currentLevelIndex,
            }
          };
        }
        return {
          tournament: { ...state.tournament, secondsRemaining: newSeconds }
        };
      }),

      resetTimer: () => set(state => {
        if (!state.tournament) return state;
        const currentLevel = state.tournament.config.blindStructure[state.tournament.currentLevelIndex];
        return {
          tournament: {
            ...state.tournament,
            secondsRemaining: currentLevel.duration * 60,
            isRunning: false,
            isPaused: false,
          }
        };
      }),

      updateSecondsRemaining: (seconds) => set(state => {
        if (!state.tournament) return state;
        return { tournament: { ...state.tournament, secondsRemaining: seconds } };
      }),

      redistributeTables: () => set(state => {
        if (!state.tournament) return state;
        const activePlayers = state.tournament.players.filter(p => !p.isEliminated);
        const maxPerTable = state.tournament.config.maxPlayersPerTable;
        const tableCount = Math.max(1, Math.ceil(activePlayers.length / maxPerTable));

        const tables: Table[] = Array.from({ length: tableCount }, (_, i) => ({
          id: state.tournament!.tables[i]?.id ?? Math.random().toString(36).slice(2, 9),
          name: `Table ${i + 1}`,
          playerIds: [],
        }));

        activePlayers.forEach((player, idx) => {
          tables[idx % tableCount].playerIds.push(player.id);
        });

        const updatedPlayers = state.tournament.players.map(p => {
          if (p.isEliminated) return p;
          const table = tables.find(t => t.playerIds.includes(p.id));
          return { ...p, tableId: table?.id ?? p.tableId };
        });

        return {
          tournament: { ...state.tournament, tables, players: updatedPlayers }
        };
      }),

      endTournament: () => set(state => {
        if (!state.tournament) return state;
        return {
          tournament: { ...state.tournament, isRunning: false, isPaused: false }
        };
      }),

      clearTournament: () => set({ tournament: null }),
    }),
    {
      name: 'poker-tournament-state',
    }
  )
);
