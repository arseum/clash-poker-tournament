import { useEffect, useState } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { formatTime, formatChips } from '../constants';
import { calculatePrizes, getPaidPlaces, positionLabel } from '../utils/prizePool';
import { useTheme } from '../contexts/ThemeContext';
import type { TournamentState, Player } from '../types';

const ARENA_MAP = [1,2,3,4,5,5,6,6,7,7,8,8,9,10,11,12,13,14,15,15];
function getArenaNumber(i: number) {
  return ARENA_MAP[Math.min(i, ARENA_MAP.length - 1)];
}

export function DisplayPage() {
  const tournament = useTournamentStore(s => s.tournament);
  const { theme } = useTheme();

  // Sync tournament state from main window via localStorage
  useEffect(() => {
    const handleStorage = () => useTournamentStore.persist.rehydrate();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!tournament) {
    return <DisplayIdle theme={theme} />;
  }

  if (tournament.isEnded) {
    return <EndScreenTV tournament={tournament} theme={theme} />;
  }

  const { config, players, currentLevelIndex, secondsRemaining } = tournament;
  const currentLevel = config.blindStructure[currentLevelIndex];
  const nextLevel    = config.blindStructure[currentLevelIndex + 1];
  const activePlayers = players.filter(p => !p.isEliminated);
  const totalChips    = (players.length + tournament.rebuyCount) * config.startingStack;
  const avgStack      = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0;
  const totalPot      = (players.length + tournament.rebuyCount) * config.buyIn;
  const prizePoolAmount = Math.round(totalPot * config.prizePool.prizePoolPct / 100);
  const prizes        = calculatePrizes(prizePoolAmount, players.length, config.prizePool);
  const paidPlaces    = getPaidPlaces(players.length, config.prizePool.itmPct);
  const levelProgress = 1 - secondsRemaining / (currentLevel.duration * 60);
  const isWarning     = secondsRemaining <= 60 && !currentLevel.isBreak;
  const arenaNumber   = getArenaNumber(currentLevelIndex);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* ── Background layer ── */}
      {theme === 'supercell' ? (
        <>
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/arenas/arena_test.webm"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0" style={{ background: 'rgba(15,5,0,0.60)' }} />
          {/* Supercell vignette */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)',
          }} />
        </>
      ) : (
        <>
          {/* Default: dark poker felt */}
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 40%, #0a2010 0%, #041208 40%, #020a04 70%, #000 100%)',
          }} />
          {/* Felt texture hint */}
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 8px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 8px)',
          }} />
          {/* Card suit watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
            <span style={{ fontSize: '60vw', lineHeight: 1, color: '#27ae60' }}>♠</span>
          </div>
        </>
      )}

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-12 pt-8 pb-4">
          <div
            className="font-cinzel text-2xl font-bold tracking-widest uppercase"
            style={{ color: theme === 'supercell' ? '#ffd700' : '#f4c842', opacity: 0.85 }}
          >
            {theme === 'supercell' ? '⚔️ ' : '♠ '}{config.name}
          </div>
          <div
            className="font-cinzel text-2xl font-bold tracking-widest"
            style={{ color: theme === 'supercell' ? '#ff9a3c' : '#4a8fd4', opacity: 0.85 }}
          >
            {currentLevel.isBreak ? '— PAUSE —' : `NIVEAU ${currentLevel.level}`}
          </div>
        </div>

        {/* Center — Timer */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 gap-6">

          {/* Timer */}
          <div
            className={`font-cinzel font-black leading-none tracking-tight select-none transition-colors ${isWarning ? 'animate-pulse' : ''}`}
            style={{
              fontSize: 'clamp(8rem, 22vw, 20rem)',
              color: isWarning
                ? '#e74c3c'
                : currentLevel.isBreak
                  ? '#ffffff'
                  : (theme === 'supercell' ? '#ffd700' : '#f4c842'),
              textShadow: isWarning
                ? '0 0 60px rgba(231,76,60,0.6)'
                : theme === 'supercell'
                  ? '0 0 80px rgba(255,215,0,0.5), 0 4px 0 rgba(0,0,0,0.8)'
                  : '0 0 60px rgba(244,200,66,0.35)',
            }}
          >
            {formatTime(secondsRemaining)}
          </div>

          {/* Blinds */}
          {!currentLevel.isBreak && (
            <div className="flex items-center gap-10 mt-2">
              <BlindBlock label="Petite blinde" value={formatChips(currentLevel.smallBlind)} theme={theme} />
              <div className="text-8xl font-thin" style={{ color: theme === 'supercell' ? '#ff9a3c' : '#4a8fd4' }}>/</div>
              <BlindBlock label="Grande blinde" value={formatChips(currentLevel.bigBlind)} theme={theme} />
              {currentLevel.ante > 0 && (
                <>
                  <div className="text-8xl font-thin" style={{ color: theme === 'supercell' ? '#ff9a3c' : '#4a8fd4' }}>+</div>
                  <BlindBlock label="Ante" value={formatChips(currentLevel.ante)} theme={theme} accent />
                </>
              )}
            </div>
          )}

          {/* Next level */}
          {nextLevel && (
            <div className="text-[#4a5568] text-xl font-cinzel tracking-wide mt-2">
              Prochain niveau →{' '}
              {nextLevel.isBreak
                ? 'PAUSE'
                : `${formatChips(nextLevel.smallBlind)} / ${formatChips(nextLevel.bigBlind)}${nextLevel.ante ? ` + ${formatChips(nextLevel.ante)}` : ''}`
              }
              {' '}({nextLevel.duration} min)
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-white/10">
          <div
            className="h-full transition-all duration-1000"
            style={{
              width: `${levelProgress * 100}%`,
              background: isWarning
                ? '#e74c3c'
                : theme === 'supercell'
                  ? 'linear-gradient(90deg, #e65100, #ffd700)'
                  : '#f4c842',
            }}
          />
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-4 border-t border-white/10">
          <StatBlock
            label="Joueurs restants"
            value={String(activePlayers.length)}
            sub={`/ ${players.length}`}
            color={theme === 'supercell' ? '#ffd700' : '#f4c842'}
            theme={theme}
          />
          <StatBlock
            label="Stack moyen"
            value={formatChips(avgStack)}
            color="#ffffff"
            theme={theme}
          />
          <StatBlock
            label="Pot total"
            value={`${totalPot}€`}
            color={theme === 'supercell' ? '#2e7d32' : '#27ae60'}
            theme={theme}
          />

          {/* Prize pool */}
          <div className="flex flex-col py-6 px-6 min-h-0">
            <div className="text-[#a0aec0] text-lg uppercase tracking-widest mb-3 font-cinzel text-center">
              Prize Pool{' '}
              <span className="text-[#4a5568] text-base normal-case">ITM {paidPlaces}/{players.length}</span>
            </div>
            <div className="overflow-hidden" style={{ height: '7.5rem' }}>
              <div
                className="flex flex-col gap-1.5"
                style={prizes.length > 3 ? {
                  animation: `prizeScroll ${prizes.length * 2.5}s ease-in-out infinite alternate`,
                  '--prize-scroll-dist': `-${(prizes.length - 3) * 34}px`,
                } as React.CSSProperties : undefined}
              >
                {prizes.map(({ position, percentage, amount }) => (
                  <div
                    key={position}
                    className="flex items-center gap-2 rounded px-2 py-1 text-sm flex-shrink-0"
                    style={{
                      background: position === 1 ? 'rgba(244,200,66,0.10)' :
                                  position === 2 ? 'rgba(255,255,255,0.05)' :
                                  position === 3 ? 'rgba(205,127,50,0.10)' : 'transparent',
                    }}
                  >
                    <span className="font-cinzel font-bold w-7 text-sm" style={{ color: position <= 3 ? '#f4c842' : '#4a5568' }}>
                      {positionLabel(position)}
                    </span>
                    <div className="flex-1">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${percentage}%`,
                            background: theme === 'supercell' ? 'linear-gradient(90deg, #c95200, #ffd700)' : '#27ae60',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-[#4a5568] text-xs w-9 text-right">{percentage}%</span>
                    <span className="font-cinzel font-bold text-sm w-16 text-right" style={{ color: theme === 'supercell' ? '#ffd700' : '#27ae60' }}>
                      {amount}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Sub-components ── */

function DisplayIdle({ theme }: { theme: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 relative">
      {theme === 'supercell' ? (
        <>
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/arenas/arena_test.webm"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0" style={{ background: 'rgba(15,5,0,0.65)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0a2010 0%, #041208 40%, #020a04 70%, #000 100%)',
        }} />
      )}
      <div className="relative z-10 flex flex-col items-center gap-6">
        <div
          className="font-cinzel font-black drop-shadow-[0_0_40px_rgba(244,200,66,0.6)]"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            color: theme === 'supercell' ? '#ffd700' : '#f4c842',
          }}
        >
          {theme === 'supercell' ? '⚔️ POKER ROYALE ⚔️' : '♠ POKER ROYALE ♠'}
        </div>
        <div
          className="font-cinzel text-2xl tracking-widest uppercase"
          style={{ color: theme === 'supercell' ? '#ff9a3c' : '#4a8fd4' }}
        >
          En attente du tournoi…
        </div>
      </div>
    </div>
  );
}

function BlindBlock({ label, value, theme, accent = false }: {
  label: string; value: string; theme: string; accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-[#a0aec0] text-xl uppercase tracking-widest mb-2">{label}</div>
      <div
        className="font-cinzel font-black text-7xl"
        style={{ color: accent ? (theme === 'supercell' ? '#ffd700' : '#f4c842') : '#ffffff' }}
      >
        {value}
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub, color, theme: _theme }: {
  label: string; value: string; sub?: string; color: string; theme: string;
}) {
  return (
    <div className="flex flex-col items-center py-8 border-r border-white/10">
      <div className="text-[#a0aec0] text-lg uppercase tracking-widest mb-3 font-cinzel">{label}</div>
      <div className="font-cinzel font-black leading-none" style={{ fontSize: '5rem', color }}>
        {value}
      </div>
      {sub && <div className="text-[#4a5568] text-lg mt-1">{sub}</div>}
    </div>
  );
}

/* ── EndScreenTV ── */

const TV_MEDAL  = ['🥇', '🥈', '🥉'];
const TV_COLORS = ['#f4c842', '#a0aec0', '#cd7f32'];
const TV_GLOW   = [
  '0 0 80px rgba(244,200,66,0.6)',
  '0 0 40px rgba(160,174,192,0.4)',
  '0 0 40px rgba(205,127,50,0.4)',
];
const TV_ORDER  = [1, 0, 2];

const TV_PARTICLES = [
  { left: '8%',  delay: '0s',   size: 10, dur: '3.0s' },
  { left: '18%', delay: '0.5s', size: 7,  dur: '3.5s' },
  { left: '30%', delay: '0.9s', size: 12, dur: '2.8s' },
  { left: '44%', delay: '0.3s', size: 8,  dur: '3.2s' },
  { left: '56%', delay: '1.1s', size: 10, dur: '2.9s' },
  { left: '68%', delay: '0.7s', size: 7,  dur: '3.4s' },
  { left: '78%', delay: '0.4s', size: 11, dur: '2.7s' },
  { left: '88%', delay: '1.3s', size: 8,  dur: '3.1s' },
  { left: '23%', delay: '1.6s', size: 6,  dur: '2.6s' },
  { left: '63%', delay: '1.0s', size: 9,  dur: '3.3s' },
  { left: '40%', delay: '1.8s', size: 5,  dur: '2.8s' },
  { left: '73%', delay: '1.4s', size: 8,  dur: '3.6s' },
];

function buildPodiumTV(tournament: TournamentState): Player[] {
  const { players } = tournament;
  const winner = players.find(p => !p.isEliminated) ??
    players.reduce((best, p) => (p.position ?? 99) < (best.position ?? 99) ? p : best);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  return [winner, eliminated[0], eliminated[1]].filter(Boolean) as Player[];
}

function EndScreenTV({ tournament, theme }: { tournament: TournamentState; theme: string }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const isSupercell = theme === 'supercell';

  const podium      = buildPodiumTV(tournament);
  const totalPot    = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
  const prizeAmount = Math.round(totalPot * tournament.config.prizePool.prizePoolPct / 100);
  const prizes      = calculatePrizes(prizeAmount, tournament.players.length, tournament.config.prizePool);
  const getPrize    = (position: number) => prizes.find(p => p.position === position)?.amount ?? 0;
  const durationMin = tournament.startedAt
    ? Math.round((Date.now() - tournament.startedAt) / 60000)
    : 0;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setRevealed([2]),        800));
    timers.push(setTimeout(() => setRevealed([2, 1]),    1600));
    timers.push(setTimeout(() => setRevealed([2, 1, 0]), 2600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      {isSupercell ? (
        <>
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/arenas/arena_test.webm"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="absolute inset-0" style={{ background: 'rgba(15,5,0,0.80)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0a2010 0%, #041208 40%, #020a04 70%, #000 100%)',
        }} />
      )}

      {/* Particules supercell */}
      {isSupercell && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {TV_PARTICLES.map((p, i) => (
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
          ))}
        </div>
      )}

      {/* Contenu */}
      <div className="relative z-10 flex flex-col items-center w-full px-12">
        <div
          className="font-cinzel font-black mb-2"
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            color: isSupercell ? '#ffd700' : '#f4c842',
            textShadow: `0 0 40px ${isSupercell ? 'rgba(255,215,0,0.7)' : 'rgba(244,200,66,0.7)'}`,
          }}
        >
          {isSupercell ? '⚔️ TOURNOI TERMINÉ ⚔️' : '♠ TOURNOI TERMINÉ ♠'}
        </div>
        <div
          className="font-cinzel tracking-widest uppercase mb-12"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            color: isSupercell ? '#ff9a3c' : '#4a8fd4',
          }}
        >
          {tournament.config.name} · {durationMin}min · {totalPot}€
        </div>

        {/* Podium TV */}
        <div className="flex items-end justify-center gap-8 xl:gap-16">
          {TV_ORDER.map(rankIdx => {
            const player     = podium[rankIdx];
            const prize      = getPrize(rankIdx + 1);
            const isRevealed = revealed.includes(rankIdx);

            if (!player) return <div key={rankIdx} style={{ width: 'clamp(140px, 14vw, 220px)' }} />;

            return (
              <div
                key={rankIdx}
                className="flex flex-col items-center"
                style={{
                  animation: isRevealed ? 'podiumRise 0.8s ease-out both' : undefined,
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(60px)',
                }}
              >
                <div style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '0.5rem' }}>
                  {TV_MEDAL[rankIdx]}
                </div>
                <div
                  className="border-2 rounded-2xl text-center"
                  style={{
                    padding: 'clamp(12px, 2vw, 24px) clamp(16px, 3vw, 40px)',
                    minWidth: rankIdx === 0 ? 'clamp(160px, 16vw, 260px)' : 'clamp(130px, 13vw, 210px)',
                    background: isSupercell ? 'rgba(45,21,0,0.9)' : 'rgba(26,45,74,0.9)',
                    borderColor: TV_COLORS[rankIdx],
                    boxShadow: TV_GLOW[rankIdx],
                  }}
                >
                  <div
                    className="font-cinzel font-black leading-none mb-2"
                    style={{
                      fontSize: rankIdx === 0
                        ? 'clamp(3rem, 8vw, 7rem)'
                        : rankIdx === 1
                        ? 'clamp(2rem, 6vw, 5rem)'
                        : 'clamp(1.8rem, 5vw, 4rem)',
                      color: TV_COLORS[rankIdx],
                    }}
                  >
                    #{rankIdx + 1}
                  </div>
                  <div
                    className="font-bold"
                    style={{
                      fontSize: 'clamp(1rem, 2.5vw, 2rem)',
                      color: 'white',
                      maxWidth: 'clamp(120px, 12vw, 200px)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {player.name}
                  </div>
                  {prize > 0 && (
                    <div
                      className="font-cinzel font-bold mt-1"
                      style={{
                        fontSize: 'clamp(1rem, 2vw, 1.6rem)',
                        color: isSupercell ? '#ffd700' : '#27ae60',
                      }}
                    >
                      {prize}€
                    </div>
                  )}
                </div>
                {/* Bloc podium */}
                <div
                  style={{
                    width: '100%',
                    height: rankIdx === 0 ? 'clamp(40px, 5vw, 80px)'
                          : rankIdx === 1 ? 'clamp(26px, 3vw, 50px)'
                          : 'clamp(16px, 2vw, 30px)',
                    background: rankIdx === 0 ? 'rgba(244,200,66,0.15)'
                              : rankIdx === 1 ? 'rgba(160,174,192,0.10)'
                              : 'rgba(205,127,50,0.10)',
                    border: `2px solid ${TV_COLORS[rankIdx]}`,
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
