import { Trash2, Trophy, TrendingUp, Clock, Users } from 'lucide-react';
import { CRCard } from '../components/ui/CRCard';
import { CRButton } from '../components/ui/CRButton';
import { CRBadge } from '../components/ui/CRBadge';
import { useHistoryStore } from '../store/historyStore';
import type { Page } from '../types';

interface HistoryPageProps {
  onNavigate: (page: Page) => void;
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const { entries, removeEntry, clearHistory } = useHistoryStore();

  const totalGames = entries.length;

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-cinzel text-2xl sm:text-3xl font-bold text-cr-gold">Historique</h1>
            <p className="text-cr-blue-light text-sm mt-1">{totalGames} tournois enregistrés</p>
          </div>
          <div className="flex gap-3">
            {entries.length > 0 && (
              <CRButton variant="red" size="sm" onClick={clearHistory}>
                <Trash2 size={16} />
              </CRButton>
            )}
            <CRButton variant="ghost" onClick={() => onNavigate('setup')}>
              ← Setup
            </CRButton>
          </div>
        </div>

        {entries.length === 0 ? (
          <CRCard className="text-center py-16">
            <Trophy size={48} className="text-[#2a4a7a] mx-auto mb-4" />
            <p className="text-[#525265] font-cinzel text-xl">Aucun tournoi terminé</p>
            <p className="text-[#2a4a7a] text-sm mt-2">Les résultats apparaîtront ici</p>
          </CRCard>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map(entry => (
              <CRCard key={entry.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-cinzel font-bold text-cr-gold text-lg">{entry.name}</h3>
                    <p className="text-cr-blue-light text-sm">
                      {new Date(entry.date).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    className="text-[#525265] hover:text-[#e74c3c] transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                  <div className="text-center">
                    <Users size={16} className="mx-auto text-cr-blue-light mb-1" />
                    <div className="font-cinzel font-bold text-xl text-white">{entry.playerCount}</div>
                    <div className="text-[#525265] text-xs">joueurs</div>
                  </div>
                  <div className="text-center">
                    <Clock size={16} className="mx-auto text-cr-blue-light mb-1" />
                    <div className="font-cinzel font-bold text-xl text-white">{entry.duration}min</div>
                    <div className="text-[#525265] text-xs">durée</div>
                  </div>
                  <div className="text-center">
                    <Trophy size={16} className="mx-auto text-cr-gold mb-1" />
                    <div className="font-cinzel font-bold text-xl text-cr-gold">{entry.totalPot}€</div>
                    <div className="text-[#525265] text-xs">pot</div>
                  </div>
                  <div className="text-center">
                    <TrendingUp size={16} className="mx-auto text-cr-green mb-1" />
                    <div className="font-cinzel font-bold text-xl text-cr-green">{entry.buyIn}€</div>
                    <div className="text-[#525265] text-xs">buy-in</div>
                  </div>
                </div>

                {entry.placements.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-cinzel text-sm text-cr-blue-light mb-2 uppercase tracking-wide">Classement</h4>
                    <div className="flex flex-wrap gap-2">
                      {entry.placements.slice(0, 5).map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-cr-darker rounded-lg px-2.5 py-1.5">
                          <span className={`font-cinzel font-bold text-sm ${idx === 0 ? 'text-cr-gold' : idx === 1 ? 'text-[#a0aec0]' : idx === 2 ? 'text-[#cd7f32]' : 'text-[#525265]'}`}>
                            #{p.position}
                          </span>
                          <span className="text-[#e8e8e8] text-sm">{p.playerName}</span>
                          {p.prize > 0 && (
                            <CRBadge variant="green">{p.prize}€</CRBadge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CRCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
