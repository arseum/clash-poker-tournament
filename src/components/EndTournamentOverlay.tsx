import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { CRButton } from './ui/CRButton';
import type { Player, TournamentState } from '../types';

interface EndTournamentOverlayProps {
  tournament: TournamentState;
  onClose: () => void;
}

const MEDAL = ['🥇', '🥈', '🥉'];
const COLORS = ['text-[#f4c842]', 'text-[#a0aec0]', 'text-[#cd7f32]'];
const GLOW = [
  'shadow-[0_0_40px_rgba(244,200,66,0.6)] border-[#f4c842]',
  'shadow-[0_0_20px_rgba(160,174,192,0.4)] border-[#a0aec0]',
  'shadow-[0_0_20px_rgba(205,127,50,0.4)] border-[#cd7f32]',
];
const SIZES = ['text-7xl md:text-8xl', 'text-5xl md:text-6xl', 'text-4xl md:text-5xl'];
const ORDER = [1, 0, 2]; // display order: 2nd, 1st, 3rd for podium effect

function buildPodium(tournament: TournamentState): Player[] {
  const { players } = tournament;
  const winner = players.find(p => !p.isEliminated) ??
    players.reduce((best, p) => (p.position ?? 99) < (best.position ?? 99) ? p : best);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));

  // position 1 = winner, position 2 = first eliminated (last out before winner), etc.
  return [winner, eliminated[0], eliminated[1]].filter(Boolean) as Player[];
}

export function EndTournamentOverlay({ tournament, onClose }: EndTournamentOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);
  const podium = buildPodium(tournament);
  const totalPot = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
  const durationMin = tournament.startedAt
    ? Math.round((Date.now() - tournament.startedAt) / 60000)
    : 0;

  useEffect(() => {
    // Staggered reveal: 3rd → 2nd → 1st
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setVisible(true), 100));
    timers.push(setTimeout(() => setRevealed([2]), 600));
    timers.push(setTimeout(() => setRevealed([2, 1]), 1200));
    timers.push(setTimeout(() => setRevealed([2, 1, 0]), 2000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070f18]/95 backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Particles / glow background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f4c842]/5 blur-3xl animate-pulse" />
      </div>

      <Trophy size={48} className="text-[#f4c842] mb-2 animate-bounce" />
      <h1 className="font-cinzel text-3xl md:text-5xl font-black text-[#f4c842] mb-1 text-center drop-shadow-[0_0_30px_rgba(244,200,66,0.7)]">
        TOURNOI TERMINÉ
      </h1>
      <p className="text-[#4a8fd4] text-sm mb-10 tracking-widest uppercase">
        {tournament.config.name} · {durationMin}min · {totalPot}€
      </p>

      {/* Podium — displayed in order 2nd / 1st / 3rd */}
      <div className="flex items-end justify-center gap-4 md:gap-8 mb-10 px-4">
        {ORDER.map(rankIdx => {
          const player = podium[rankIdx];
          if (!player) return <div key={rankIdx} className="w-24 md:w-32" />;
          const isRevealed = revealed.includes(rankIdx);
          return (
            <div
              key={rankIdx}
              className={`flex flex-col items-center transition-all duration-700 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
            >
              <div className="text-4xl mb-2">{MEDAL[rankIdx]}</div>
              <div
                className={`bg-[#1a2d4a] border-2 rounded-2xl px-4 py-4 md:px-6 text-center ${GLOW[rankIdx]}`}
                style={{ minWidth: rankIdx === 0 ? 140 : 110 }}
              >
                <div className={`font-cinzel font-black ${SIZES[rankIdx]} ${COLORS[rankIdx]} leading-none mb-1`}>
                  #{rankIdx + 1}
                </div>
                <div className="text-white font-bold text-sm md:text-base truncate max-w-[120px]">
                  {player.name}
                </div>
              </div>
              {/* Podium block */}
              <div
                className={`w-full rounded-b-xl mt-0 ${rankIdx === 0 ? 'h-16 bg-[#f4c842]/20 border-x-2 border-b-2 border-[#f4c842]' : rankIdx === 1 ? 'h-10 bg-[#a0aec0]/10 border-x-2 border-b-2 border-[#a0aec0]' : 'h-6 bg-[#cd7f32]/10 border-x-2 border-b-2 border-[#cd7f32]'}`}
              />
            </div>
          );
        })}
      </div>

      {/* Rest of ranking */}
      {tournament.players.filter(p => p.isEliminated && (p.position ?? 0) > 3).length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-8 px-4 max-w-lg">
          {tournament.players
            .filter(p => p.isEliminated && (p.position ?? 0) > 3)
            .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
            .map(p => (
              <span key={p.id} className="bg-[#1a2d4a] border border-[#2a4a7a] rounded-lg px-3 py-1 text-sm text-[#a0aec0]">
                #{p.position} {p.name}
              </span>
            ))}
        </div>
      )}

      <CRButton variant="gold" size="lg" onClick={onClose} className="text-lg px-12">
        Clôturer le tournoi
      </CRButton>
    </div>
  );
}
