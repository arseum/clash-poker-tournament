import { useEffect, useState } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { formatTime, formatChips } from '../constants';
import { calculatePrizes, getPaidPlaces, positionLabel } from '../utils/prizePool';
import { useTheme } from '../contexts/ThemeContext';
import type { TournamentState, Player } from '../types';

export function DisplayPage() {
  const tournament = useTournamentStore(s => s.tournament);
  const { theme } = useTheme();

  useEffect(() => {
    const handleStorage = () => useTournamentStore.persist.rehydrate();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!tournament) return <DisplayIdle theme={theme} />;
  if (tournament.isEnded) return <EndScreenTV tournament={tournament} theme={theme} />;

  const { config, players, currentLevelIndex, secondsRemaining } = tournament;
  const currentLevel  = config.blindStructure[currentLevelIndex];
  const nextLevel     = config.blindStructure[currentLevelIndex + 1];
  const activePlayers = players.filter(p => !p.isEliminated);
  const totalChips    = (players.length + tournament.rebuyCount) * config.startingStack;
  const avgStack      = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0;
  const totalPot      = (players.length + tournament.rebuyCount) * config.buyIn;
  const prizePoolAmount = Math.round(totalPot * config.prizePool.prizePoolPct / 100);
  const prizes        = calculatePrizes(prizePoolAmount, players.length, config.prizePool);
  const paidPlaces    = getPaidPlaces(players.length, config.prizePool.itmPct);
  const levelProgress = 1 - secondsRemaining / (currentLevel.duration * 60);
  const isWarning     = secondsRemaining <= 60 && !currentLevel.isBreak;
  const isSC          = theme === 'supercell';

  const gold  = isSC ? '#f4c842' : '#f4c842';
  const accent = isSC ? '#8899cc' : '#4a8fd4';

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background */}
      {isSC ? (
        <>
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src="/arenas/arena_test.webm"
            autoPlay loop muted playsInline
          />
          <div className="absolute inset-0" style={{ background: 'rgba(10,16,32,0.68)' }} />
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.50) 100%)',
          }} />
        </>
      ) : (
        <>
          <div className="absolute inset-0" style={{
            background: 'radial-gradient(ellipse at 50% 40%, #0a2010 0%, #041208 40%, #020a04 70%, #000 100%)',
          }} />
          <div className="absolute inset-0 opacity-[0.04]" style={{
            backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 8px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 8px)',
          }} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
            <span style={{ fontSize: '60vw', lineHeight: 1, color: '#27ae60' }}>♠</span>
          </div>
        </>
      )}

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 sm:px-10 pt-4 sm:pt-7 pb-2 sm:pb-3 gap-2">
          <div className="font-cinzel text-sm sm:text-xl lg:text-2xl font-bold tracking-widest uppercase truncate"
            style={{ color: gold, opacity: 0.90, textShadow: '0 2px 0 rgba(0,0,0,0.7)' }}>
            {isSC
              ? <span className="flex items-center gap-2"><img src="/clash_royal_todo/tournament_icon.webp" alt="" className="w-5 h-5 sm:w-7 sm:h-7 object-contain inline-block" /> {config.name}</span>
              : <>♠ {config.name}</>
            }
          </div>
          <div className="font-cinzel text-sm sm:text-xl lg:text-2xl font-bold tracking-widest flex-shrink-0"
            style={{ color: accent, textShadow: '0 2px 0 rgba(0,0,0,0.7)' }}>
            {currentLevel.isBreak ? '— PAUSE —' : `NIVEAU ${currentLevel.level}`}
          </div>
        </div>

        {/* Center — Timer + Blinds */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-12 gap-3 sm:gap-6">

          {/* Timer */}
          <div
            className={`font-cinzel font-black leading-none tracking-tight select-none transition-colors ${isWarning ? 'animate-pulse' : ''}`}
            style={{
              fontSize: 'clamp(5rem, 22vw, 20rem)',
              color: isWarning ? '#e74c3c' : currentLevel.isBreak ? '#ffffff' : gold,
              textShadow: isWarning
                ? '0 0 60px rgba(231,76,60,0.6), 0 3px 0 rgba(0,0,0,0.8)'
                : isSC
                  ? '0 0 80px rgba(244,200,66,0.45), 0 4px 0 rgba(0,0,0,0.9)'
                  : '0 0 60px rgba(244,200,66,0.35)',
            }}
          >
            {formatTime(secondsRemaining)}
          </div>

          {/* Blinds */}
          {!currentLevel.isBreak && (
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8 lg:gap-12">
              <BlindBlock label="Petite blinde" value={formatChips(currentLevel.smallBlind)} isSC={isSC} />
              <div className="text-4xl sm:text-7xl font-thin" style={{ color: accent }}>/</div>
              <BlindBlock label="Grande blinde" value={formatChips(currentLevel.bigBlind)} isSC={isSC} />
              {currentLevel.ante > 0 && (
                <>
                  <div className="text-4xl sm:text-7xl font-thin" style={{ color: accent }}>+</div>
                  <BlindBlock label="Ante" value={formatChips(currentLevel.ante)} isSC={isSC} accent />
                </>
              )}
            </div>
          )}

          {/* Next level */}
          {nextLevel && (
            <div className="text-[#4a5568] text-xs sm:text-lg lg:text-xl font-cinzel tracking-wide text-center px-2">
              Prochain →{' '}
              {nextLevel.isBreak
                ? 'PAUSE'
                : `${formatChips(nextLevel.smallBlind)} / ${formatChips(nextLevel.bigBlind)}${nextLevel.ante ? ` + ${formatChips(nextLevel.ante)}` : ''}`
              }
              {' '}({nextLevel.duration} min)
            </div>
          )}
        </div>

        {/* Progress bar — CR style */}
        <div className="w-full cr-timer-bar-track">
          <div
            className={`cr-timer-bar-fill cr-timer-bar-blue${isWarning ? ' cr-timer-bar-warning' : ''}`}
            style={{ width: `${levelProgress * 100}%` }}
          />
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
          <StatBlock label="Joueurs" value={String(activePlayers.length)} sub={`/ ${players.length}`} color={gold} />
          <StatBlock label="Stack moyen" value={formatChips(avgStack)} color="#ffffff" />
          <StatBlock label="Pot total" value={`${totalPot}€`} color="#27ae60" />

          {/* Prize pool */}
          <div className="col-span-2 sm:col-span-1 flex flex-col py-3 sm:py-5 px-3 sm:px-5 border-t border-white/10 sm:border-t-0 min-h-0">
            <div className="text-[#a0aec0] text-xs sm:text-base uppercase tracking-widest mb-2 font-cinzel text-center">
              Prize Pool <span className="text-[#4a5568] text-xs normal-case">ITM {paidPlaces}/{players.length}</span>
            </div>
            <div className="overflow-hidden" style={{ height: '6.5rem' }}>
              <div
                className="flex flex-col gap-1"
                style={prizes.length > 3 ? {
                  animation: `prizeScroll ${prizes.length * 2.5}s ease-in-out infinite alternate`,
                  '--prize-scroll-dist': `-${(prizes.length - 3) * 30}px`,
                } as React.CSSProperties : undefined}
              >
                {prizes.map(({ position, percentage, amount }) => (
                  <div key={position} className="flex items-center gap-2 rounded px-2 py-0.5 text-xs sm:text-sm flex-shrink-0"
                    style={{
                      background: position === 1 ? 'rgba(244,200,66,0.10)' :
                                  position === 2 ? 'rgba(255,255,255,0.05)' :
                                  position === 3 ? 'rgba(205,127,50,0.10)' : 'transparent',
                    }}>
                    <span className="font-cinzel font-bold w-6 text-xs" style={{ color: position <= 3 ? '#f4c842' : '#4a5568' }}>
                      {positionLabel(position)}
                    </span>
                    <div className="flex-1">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{
                          width: `${percentage}%`,
                          background: isSC ? 'linear-gradient(90deg, #d98000, #f4c842)' : '#27ae60',
                        }} />
                      </div>
                    </div>
                    <span className="text-[#4a5568] text-xs w-8 text-right">{percentage}%</span>
                    <span className="font-cinzel font-bold text-xs w-12 text-right" style={{ color: isSC ? '#f4c842' : '#27ae60' }}>
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
  const isSC = theme === 'supercell';
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 sm:gap-8 relative">
      {isSC ? (
        <>
          <video className="absolute inset-0 w-full h-full object-cover"
            src="/arenas/arena_test.webm" autoPlay loop muted playsInline />
          <div className="absolute inset-0" style={{ background: 'rgba(10,16,32,0.70)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0a2010 0%, #041208 40%, #020a04 70%, #000 100%)',
        }} />
      )}
      <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6 px-4 text-center">
        <div className="flex items-center justify-center gap-3 sm:gap-6">
          {isSC
            ? <img src="/clash_royal_todo/tournament_icon.webp" alt="" className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]" />
            : <span style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: '#f4c842' }}>♠</span>
          }
          <div className="font-cinzel font-black drop-shadow-[0_0_40px_rgba(244,200,66,0.6)]"
            style={{ fontSize: 'clamp(2rem, 7vw, 5.5rem)', color: '#f4c842', textShadow: '0 3px 0 rgba(0,0,0,0.8)' }}>
            POKER ROYALE
          </div>
          {isSC
            ? <img src="/clash_royal_todo/tournament_icon.webp" alt="" className="w-12 h-12 sm:w-20 sm:h-20 object-contain drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] scale-x-[-1]" />
            : <span style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: '#f4c842' }}>♠</span>
          }
        </div>
        <div className="font-cinzel text-base sm:text-2xl tracking-widest uppercase"
          style={{ color: isSC ? '#8899cc' : '#4a8fd4' }}>
          En attente du tournoi…
        </div>
      </div>
    </div>
  );
}

function BlindBlock({ label, value, isSC, accent = false }: {
  label: string; value: string; isSC: boolean; accent?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="text-[#a0aec0] text-xs sm:text-lg lg:text-xl uppercase tracking-widest mb-1 sm:mb-2">{label}</div>
      <div className="font-cinzel font-black" style={{
        fontSize: 'clamp(2rem, 7vw, 6rem)',
        color: accent ? '#f4c842' : '#ffffff',
        textShadow: isSC ? '0 3px 0 rgba(0,0,0,0.8)' : undefined,
      }}>
        {value}
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub, color }: {
  label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="flex flex-col items-center py-4 sm:py-7 border-r border-white/10 last:border-r-0">
      <div className="text-[#a0aec0] text-xs sm:text-base lg:text-lg uppercase tracking-widest mb-1 sm:mb-2 font-cinzel text-center px-2">{label}</div>
      <div className="font-cinzel font-black leading-none" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 4.5rem)', color }}>
        {value}
      </div>
      {sub && <div className="text-[#4a5568] text-xs sm:text-base mt-1">{sub}</div>}
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
  const isSC = theme === 'supercell';

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
      {isSC ? (
        <>
          <video className="absolute inset-0 w-full h-full object-cover"
            src="/arenas/arena_test.webm" autoPlay loop muted playsInline />
          <div className="absolute inset-0" style={{ background: 'rgba(10,16,32,0.82)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0a2010 0%, #041208 40%, #020a04 70%, #000 100%)',
        }} />
      )}

      {isSC && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {TV_PARTICLES.map((p, i) => (
            <div key={i} className="absolute bottom-0 rounded-full" style={{
              left: p.left, width: p.size, height: p.size,
              background: i % 3 === 0 ? '#f4c842' : i % 3 === 1 ? '#f4a800' : '#d98000',
              animation: `floatParticle ${p.dur} ${p.delay} ease-out infinite`,
            }} />
          ))}
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-12 gap-2 sm:gap-4">
        {/* Title */}
        <div className="flex items-center gap-3 sm:gap-5">
          {isSC && <img src="/clash_royal_todo/crown-blue.png" alt="" className="w-10 h-10 sm:w-16 sm:h-16 object-contain" />}
          <div className="font-cinzel font-black text-center"
            style={{
              fontSize: 'clamp(1.5rem, 5vw, 4rem)',
              color: '#f4c842',
              textShadow: '0 0 40px rgba(244,200,66,0.7), 0 3px 0 rgba(0,0,0,0.9)',
            }}>
            TOURNOI TERMINÉ
          </div>
          {isSC && <img src="/clash_royal_todo/crown-blue.png" alt="" className="w-10 h-10 sm:w-16 sm:h-16 object-contain scale-x-[-1]" />}
        </div>
        <div className="font-cinzel tracking-widest uppercase text-center"
          style={{ fontSize: 'clamp(0.75rem, 2vw, 1.4rem)', color: isSC ? '#8899cc' : '#4a8fd4' }}>
          {tournament.config.name} · {durationMin}min · {totalPot}€
        </div>

        {/* Podium */}
        <div className="flex items-end justify-center gap-3 sm:gap-8 xl:gap-14 mt-2 sm:mt-6 w-full">
          {TV_ORDER.map(rankIdx => {
            const player     = podium[rankIdx];
            const prize      = getPrize(rankIdx + 1);
            const isRevealed = revealed.includes(rankIdx);

            if (!player) return <div key={rankIdx} style={{ width: 'clamp(100px, 12vw, 200px)' }} />;

            return (
              <div key={rankIdx} className="flex flex-col items-center"
                style={{
                  opacity:   isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(60px)',
                  transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                }}>
                <div style={{ fontSize: 'clamp(1.5rem, 4vw, 3.5rem)', marginBottom: '0.4rem' }}>
                  {TV_MEDAL[rankIdx]}
                </div>
                <div className="border-2 rounded-xl text-center"
                  style={{
                    padding: 'clamp(8px, 1.5vw, 24px) clamp(12px, 2.5vw, 40px)',
                    minWidth: rankIdx === 0 ? 'clamp(110px, 14vw, 240px)' : 'clamp(90px, 11vw, 190px)',
                    background: isSC ? 'rgba(20,36,80,0.92)' : 'rgba(26,45,74,0.90)',
                    borderColor: TV_COLORS[rankIdx],
                    boxShadow: TV_GLOW[rankIdx],
                  }}>
                  <div className="font-cinzel font-black leading-none mb-1" style={{
                    fontSize: rankIdx === 0 ? 'clamp(2.2rem, 7vw, 6.5rem)'
                            : rankIdx === 1 ? 'clamp(1.8rem, 5.5vw, 5rem)'
                            : 'clamp(1.5rem, 4.5vw, 4rem)',
                    color: TV_COLORS[rankIdx],
                    textShadow: '0 2px 0 rgba(0,0,0,0.8)',
                  }}>
                    #{rankIdx + 1}
                  </div>
                  <div className="font-bold" style={{
                    fontSize: 'clamp(0.85rem, 2.2vw, 1.8rem)',
                    color: 'white',
                    maxWidth: 'clamp(90px, 10vw, 180px)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textShadow: '0 1px 0 rgba(0,0,0,0.7)',
                  }}>
                    {player.name}
                  </div>
                  {prize > 0 && (
                    <div className="font-cinzel font-bold mt-1" style={{
                      fontSize: 'clamp(0.85rem, 1.8vw, 1.5rem)',
                      color: '#f4c842',
                      textShadow: '0 1px 0 rgba(0,0,0,0.7)',
                    }}>
                      {prize}€
                    </div>
                  )}
                </div>
                <div style={{
                  width: '100%',
                  height: rankIdx === 0 ? 'clamp(30px, 4vw, 70px)'
                        : rankIdx === 1 ? 'clamp(20px, 3vw, 48px)'
                        : 'clamp(12px, 2vw, 28px)',
                  background: rankIdx === 0 ? 'rgba(244,200,66,0.15)'
                            : rankIdx === 1 ? 'rgba(160,174,192,0.10)'
                            : 'rgba(205,127,50,0.10)',
                  border: `2px solid ${TV_COLORS[rankIdx]}`,
                  borderTop: 'none',
                  borderRadius: '0 0 8px 8px',
                }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
