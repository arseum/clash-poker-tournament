import { ArrowLeftRight, Users, AlertTriangle } from 'lucide-react';
import { CRCard } from '../components/ui/CRCard';
import { CRButton } from '../components/ui/CRButton';
import { CRBadge } from '../components/ui/CRBadge';
import { useTournamentStore } from '../store/tournamentStore';
import type { Page } from '../types';

interface TablesPageProps {
  onNavigate: (page: Page) => void;
}

export function TablesPage({ onNavigate }: TablesPageProps) {
  const { tournament, redistributeTables } = useTournamentStore();

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CRCard>
          <p className="text-[#a0aec0] mb-4">Aucun tournoi en cours</p>
          <CRButton onClick={() => onNavigate('setup')}>Créer un tournoi</CRButton>
        </CRCard>
      </div>
    );
  }

  const { players, tables, config } = tournament;
  const activePlayers = players.filter(p => !p.isEliminated);
  const idealPerTable = config.maxPlayersPerTable;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-cr-gold">Tables</h1>
            <p className="text-cr-blue-light text-sm mt-1">
              {activePlayers.length} joueurs — {tables.length} tables
            </p>
          </div>
          <div className="flex gap-3">
            <CRButton
              variant="blue"
              onClick={redistributeTables}
              className="flex items-center gap-2"
            >
              <ArrowLeftRight size={18} /> Redistribuer
            </CRButton>
            <CRButton variant="ghost" onClick={() => onNavigate('tournament')}>
              ← Tournoi
            </CRButton>
          </div>
        </div>

        {/* Tables grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => {
            const tablePlayers = table.playerIds
              .map(pid => players.find(p => p.id === pid))
              .filter(Boolean)
              .filter(p => !p!.isEliminated);

            const isFull = tablePlayers.length >= idealPerTable;
            const isEmpty = tablePlayers.length === 0;

            if (isEmpty) return null;

            return (
              <CRCard key={table.id} gold={tablePlayers.length <= 3}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-cinzel font-bold text-cr-gold text-lg">{table.name}</h3>
                  <CRBadge variant={isFull ? 'red' : tablePlayers.length <= 4 ? 'gold' : 'green'}>
                    <Users size={12} className="mr-1" />
                    {tablePlayers.length}/{idealPerTable}
                  </CRBadge>
                </div>

                {/* Poker table visual */}
                <div className="bg-[#0d1b2a] rounded-xl p-3 mb-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {tablePlayers.map(player => (
                      <div
                        key={player!.id}
                        className="bg-[#2456a4]/30 border border-[#2456a4]/50 rounded-lg px-2 py-1.5 text-center"
                      >
                        <span className="text-xs text-[#e8e8e8] font-medium truncate block">
                          {player!.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {tablePlayers.length <= 3 && (
                  <div className="flex items-center justify-center gap-1.5 text-xs text-cr-gold/70 font-cinzel tracking-wide">
                    <AlertTriangle size={11} /> Table courte — redistribution conseillée
                  </div>
                )}
              </CRCard>
            );
          })}
        </div>

        {/* Eliminated players section */}
        {players.filter(p => p.isEliminated).length > 0 && (
          <div className="mt-6">
            <h2 className="font-cinzel text-lg font-bold text-[#525265] mb-3">Joueurs éliminés</h2>
            <div className="flex flex-wrap gap-2">
              {players
                .filter(p => p.isEliminated)
                .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                .map(player => (
                  <div key={player.id} className="bg-[#1a2d4a]/50 border border-[#2a4a7a]/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="text-sm text-[#525265] line-through">{player.name}</span>
                    {player.position && <CRBadge variant="red">{player.position}e</CRBadge>}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
