import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { CRButton } from './ui/CRButton';
import { useTheme } from '../contexts/ThemeContext';
import { calculatePrizes } from '../utils/prizePool';
import type { Player, TournamentState } from '../types';

interface EndTournamentOverlayProps {
  tournament: TournamentState;
  onClose: () => void;
}

const MEDAL  = ['🥇', '🥈', '🥉'];
const COLORS = ['text-[#f4c842]', 'text-[#a0aec0]', 'text-[#cd7f32]'];
const GLOW   = [
  'shadow-[0_0_40px_rgba(244,200,66,0.6)] border-[#f4c842]',
  'shadow-[0_0_20px_rgba(160,174,192,0.4)] border-[#a0aec0]',
  'shadow-[0_0_20px_rgba(205,127,50,0.4)] border-[#cd7f32]',
];
const SIZES  = ['text-7xl md:text-8xl', 'text-5xl md:text-6xl', 'text-4xl md:text-5xl'];
const ORDER  = [1, 0, 2]; // 2nd / 1st / 3rd pour l'effet podium

function buildPodium(tournament: TournamentState): Player[] {
  const { players } = tournament;
  const winner = players.find(p => !p.isEliminated) ??
    players.reduce((best, p) => (p.position ?? 99) < (best.position ?? 99) ? p : best);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  return [winner, eliminated[0], eliminated[1]].filter(Boolean) as Player[];
}

// Particules dorées pour le thème supercell
const PARTICLES = [
  { left: '10%', delay: '0s',    size: 6,  dur: '2.8s' },
  { left: '20%', delay: '0.4s',  size: 4,  dur: '3.2s' },
  { left: '33%', delay: '0.8s',  size: 8,  dur: '2.5s' },
  { left: '45%', delay: '0.2s',  size: 5,  dur: '3.5s' },
  { left: '58%', delay: '1.0s',  size: 6,  dur: '2.9s' },
  { left: '70%', delay: '0.6s',  size: 4,  dur: '3.1s' },
  { left: '80%', delay: '0.3s',  size: 7,  dur: '2.7s' },
  { left: '90%', delay: '1.2s',  size: 5,  dur: '3.3s' },
  { left: '15%', delay: '1.5s',  size: 4,  dur: '2.6s' },
  { left: '62%', delay: '0.9s',  size: 6,  dur: '3.0s' },
  { left: '38%', delay: '1.7s',  size: 3,  dur: '2.8s' },
  { left: '75%', delay: '1.3s',  size: 5,  dur: '3.4s' },
];

export function EndTournamentOverlay({ tournament, onClose }: EndTournamentOverlayProps) {
  const { theme } = useTheme();
  const [visible,  setVisible]  = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);

  const podium       = buildPodium(tournament);
  const totalPot     = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
  const prizeAmount  = Math.round(totalPot * tournament.config.prizePool.prizePoolPct / 100);
  const prizes       = calculatePrizes(prizeAmount, tournament.players.length, tournament.config.prizePool);
  const getPrize     = (position: number) => prizes.find(p => p.position === position)?.amount ?? 0;
  const durationMin  = tournament.startedAt
    ? Math.round((Date.now() - tournament.startedAt) / 60000)
    : 0;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setVisible(true),          100));
    timers.push(setTimeout(() => setRevealed([2]),          600));
    timers.push(setTimeout(() => setRevealed([2, 1]),      1200));
    timers.push(setTimeout(() => setRevealed([2, 1, 0]),   2000));
    return () => timers.forEach(clearTimeout);
  }, []);

  const isSupercell = theme === 'supercell';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: isSupercell ? 'rgba(15,5,0,0.92)' : 'rgba(7,15,24,0.95)' }}
    >
      {/* Arrière-plan : particules supercell ou glow default */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isSupercell ? (
          PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute bottom-0 rounded-full"
              style={{
                left: p.left,
                width:  p.size,
                height: p.size,
                background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff9a3c' : '#ff6600',
                animation: `floatParticle ${p.dur} ${p.delay} ease-out infinite`,
              }}
            />
          ))
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f4c842]/5 blur-3xl animate-pulse" />
        )}
      </div>

      <Trophy
        size={48}
        className="mb-2 animate-bounce"
        style={{ color: isSupercell ? '#ffd700' : '#f4c842' }}
      />
      <h1
        className="font-cinzel text-3xl md:text-5xl font-black mb-1 text-center"
        style={{
          color: isSupercell ? '#ffd700' : '#f4c842',
          textShadow: `0 0 30px ${isSupercell ? 'rgba(255,215,0,0.7)' : 'rgba(244,200,66,0.7)'}`,
        }}
      >
        TOURNOI TERMINÉ
      </h1>
      <p className="text-sm mb-10 tracking-widest uppercase" style={{ color: isSupercell ? '#ff9a3c' : '#4a8fd4' }}>
        {tournament.config.name} · {durationMin}min · {totalPot}€
      </p>

      {/* Podium — ordre visuel : 2ème / 1er / 3ème */}
      <div className="flex items-end justify-center gap-4 md:gap-8 mb-10 px-4">
        {ORDER.map(rankIdx => {
          const player    = podium[rankIdx];
          const prize     = getPrize(rankIdx + 1);
          const isRevealed = revealed.includes(rankIdx);

          if (!player) return <div key={rankIdx} className="w-24 md:w-32" />;

          return (
            <div
              key={rankIdx}
              style={{
                animation: isRevealed ? `podiumRise 0.7s ease-out both` : undefined,
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? 'translateY(0)' : 'translateY(40px)',
              }}
              className="flex flex-col items-center"
            >
              <div className="text-4xl mb-2">{MEDAL[rankIdx]}</div>
              <div
                className={`border-2 rounded-2xl px-4 py-4 md:px-6 text-center ${GLOW[rankIdx]}`}
                style={{
                  minWidth: rankIdx === 0 ? 140 : 110,
                  background: isSupercell ? 'rgba(45,21,0,0.9)' : '#1a2d4a',
                }}
              >
                <div className={`font-cinzel font-black ${SIZES[rankIdx]} ${COLORS[rankIdx]} leading-none mb-1`}>
                  #{rankIdx + 1}
                </div>
                <div className="text-white font-bold text-sm md:text-base truncate max-w-[120px]">
                  {player.name}
                </div>
                {prize > 0 && (
                  <div
                    className="text-sm font-bold mt-1"
                    style={{ color: isSupercell ? '#ffd700' : '#27ae60' }}
                  >
                    {prize}€
                  </div>
                )}
              </div>
              {/* Bloc podium */}
              <div
                className={`w-full rounded-b-xl ${
                  rankIdx === 0
                    ? 'h-16 border-x-2 border-b-2 border-[#f4c842]'
                    : rankIdx === 1
                    ? 'h-10 border-x-2 border-b-2 border-[#a0aec0]'
                    : 'h-6 border-x-2 border-b-2 border-[#cd7f32]'
                }`}
                style={{
                  background: rankIdx === 0
                    ? 'rgba(244,200,66,0.20)'
                    : rankIdx === 1
                    ? 'rgba(160,174,192,0.10)'
                    : 'rgba(205,127,50,0.10)',
                }}
              />
            </div>
          );
        })}
      </div>

      <CRButton variant="gold" size="lg" onClick={onClose} className="text-lg px-12">
        Clôturer le tournoi
      </CRButton>
    </div>
  );
}
