import { useState } from 'react';
import { ArrowLeftRight, Users, AlertTriangle, Plus, X } from 'lucide-react';
import { CRCard } from '../components/ui/CRCard';
import { CRButton } from '../components/ui/CRButton';
import { CRBadge } from '../components/ui/CRBadge';
import { useTournamentStore } from '../store/tournamentStore';
import type { Page } from '../types';

interface TablesPageProps {
  onNavigate: (page: Page) => void;
}

export function TablesPage({ onNavigate }: TablesPageProps) {
  const { tournament, redistributeTables, movePlayerToTable, addTable, removeTable } = useTournamentStore();
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

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

  function handleDragStart(e: React.DragEvent, playerId: string) {
    e.dataTransfer.setData('playerId', playerId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e: React.DragEvent, targetTableId: string) {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId) movePlayerToTable(playerId, targetTableId);
    setDragOverTableId(null);
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-cr-gold">Tables</h1>
            <p className="text-cr-blue-light text-sm mt-1">
              {activePlayers.length} joueurs — {tables.length} tables · glisser-déposer pour déplacer
            </p>
          </div>
          <div className="flex gap-3">
            <CRButton
              variant="green"
              onClick={addTable}
              className="flex items-center gap-2"
            >
              <Plus size={18} /> Ajouter table
            </CRButton>
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
            const isDragOver = dragOverTableId === table.id;

            return (
              <div
                key={table.id}
                onDragOver={e => { e.preventDefault(); setDragOverTableId(table.id); }}
                onDragLeave={() => setDragOverTableId(null)}
                onDrop={e => handleDrop(e, table.id)}
              >
                {isEmpty ? (
                  <div className={`rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center min-h-32 gap-2 ${isDragOver ? 'border-cr-gold/70 bg-cr-gold/5 scale-[1.02]' : 'border-cr-card-border/40'}`}>
                    <h3 className="font-cinzel font-bold text-[#525265] text-base">{table.name}</h3>
                    <p className="text-xs text-[#525265]">Glisser un joueur ici</p>
                    <button
                      onClick={() => removeTable(table.id)}
                      className="mt-1 text-[#525265] hover:text-cr-red transition-colors p-1 rounded"
                      title="Supprimer la table"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <CRCard
                    gold={tablePlayers.length <= 3}
                    className={`transition-all duration-150 ${isDragOver ? 'ring-2 ring-cr-gold/70 scale-[1.02]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-cinzel font-bold text-cr-gold text-lg">{table.name}</h3>
                      <CRBadge variant={isFull ? 'red' : tablePlayers.length <= 4 ? 'gold' : 'green'}>
                        <Users size={12} className="mr-1" />
                        {tablePlayers.length}/{idealPerTable}
                      </CRBadge>
                    </div>

                    {/* Poker table visual */}
                    <div className={`bg-[#0d1b2a] rounded-xl p-3 mb-3 transition-colors duration-150 ${isDragOver ? 'bg-[#1a3050]' : ''}`}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {tablePlayers.map(player => (
                          <div
                            key={player!.id}
                            draggable
                            onDragStart={e => handleDragStart(e, player!.id)}
                            className="bg-[#2456a4]/30 border border-[#2456a4]/50 rounded-lg px-2 py-1.5 text-center cursor-grab active:cursor-grabbing active:opacity-50 hover:border-cr-gold/50 hover:bg-[#2456a4]/50 transition-colors select-none"
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
                )}
              </div>
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
