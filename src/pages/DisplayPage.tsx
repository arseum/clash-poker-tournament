import { useEffect } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { formatTime, formatChips } from '../constants';

// Mapping arena (same as App.tsx)
const ARENA_MAP = [1,2,3,4,5,5,6,6,7,7,8,8,9,10,11,12,13,14,15,15];
function getArenaNumber(i: number) {
  return ARENA_MAP[Math.min(i, ARENA_MAP.length - 1)];
}

export function DisplayPage() {
  const tournament = useTournamentStore(s => s.tournament);

  // Sync from main window via localStorage storage events
  useEffect(() => {
    const handleStorage = () => {
      useTournamentStore.persist.rehydrate();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!tournament) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <div className="text-[#f4c842] font-cinzel text-6xl font-black drop-shadow-[0_0_40px_rgba(244,200,66,0.6)]">
          ♠ POKER ROYALE ♠
        </div>
        <div className="text-[#4a8fd4] font-cinzel text-2xl tracking-widest uppercase">
          En attente du tournoi…
        </div>
      </div>
    );
  }

  const { config, players, currentLevelIndex, secondsRemaining } = tournament;
  const currentLevel = config.blindStructure[currentLevelIndex];
  const nextLevel = config.blindStructure[currentLevelIndex + 1];
  const activePlayers = players.filter(p => !p.isEliminated);
  const totalChips = activePlayers.length * config.startingStack + tournament.rebuyCount * config.startingStack;
  const avgStack = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0;
  const totalPot = (players.length + tournament.rebuyCount) * config.buyIn;
  const levelProgress = 1 - secondsRemaining / (currentLevel.duration * 60);
  const isWarning = secondsRemaining <= 60 && !currentLevel.isBreak;
  const arenaNumber = getArenaNumber(currentLevelIndex);

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{
        backgroundImage: `url('/arenas/arena${arenaNumber}.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#070f18]/55" />

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-12 pt-8 pb-4">
          <div className="font-cinzel text-2xl font-bold text-[#f4c842]/80 tracking-widest uppercase">
            {config.name}
          </div>
          <div className="font-cinzel text-2xl font-bold text-[#4a8fd4]/80 tracking-widest">
            {currentLevel.isBreak ? '— PAUSE —' : `NIVEAU ${currentLevel.level}`}
          </div>
        </div>

        {/* Center — Timer */}
        <div className="flex-1 flex flex-col items-center justify-center px-12 gap-6">

          {/* Timer */}
          <div
            className={`font-cinzel font-black leading-none tracking-tight select-none transition-colors
              ${isWarning ? 'text-[#e74c3c] animate-pulse' : currentLevel.isBreak ? 'text-white' : 'text-[#f4c842]'}
            `}
            style={{ fontSize: 'clamp(8rem, 22vw, 20rem)' }}
          >
            {formatTime(secondsRemaining)}
          </div>

          {/* Blinds */}
          {!currentLevel.isBreak && (
            <div className="flex items-center gap-10 mt-2">
              <div className="text-center">
                <div className="text-[#a0aec0] text-xl uppercase tracking-widest mb-2">Petite blinde</div>
                <div className="font-cinzel font-black text-7xl text-white">{formatChips(currentLevel.smallBlind)}</div>
              </div>
              <div className="text-[#4a8fd4] text-8xl font-thin">/</div>
              <div className="text-center">
                <div className="text-[#a0aec0] text-xl uppercase tracking-widest mb-2">Grande blinde</div>
                <div className="font-cinzel font-black text-7xl text-white">{formatChips(currentLevel.bigBlind)}</div>
              </div>
              {currentLevel.ante > 0 && (
                <>
                  <div className="text-[#4a8fd4] text-8xl font-thin">+</div>
                  <div className="text-center">
                    <div className="text-[#a0aec0] text-xl uppercase tracking-widest mb-2">Ante</div>
                    <div className="font-cinzel font-black text-7xl text-[#f4c842]">{formatChips(currentLevel.ante)}</div>
                  </div>
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
        <div className="h-2 bg-white/10 mx-0">
          <div
            className={`h-full transition-all duration-1000 ${isWarning ? 'bg-[#e74c3c]' : 'bg-[#f4c842]'}`}
            style={{ width: `${levelProgress * 100}%` }}
          />
        </div>

        {/* Bottom stats */}
        <div className="grid grid-cols-3 border-t border-white/10">
          <div className="flex flex-col items-center py-8 border-r border-white/10">
            <div className="text-[#a0aec0] text-lg uppercase tracking-widest mb-3 font-cinzel">Joueurs restants</div>
            <div className="font-cinzel font-black text-[#f4c842] leading-none" style={{ fontSize: '5rem' }}>
              {activePlayers.length}
            </div>
            <div className="text-[#4a5568] text-lg mt-1">/ {players.length}</div>
          </div>
          <div className="flex flex-col items-center py-8 border-r border-white/10">
            <div className="text-[#a0aec0] text-lg uppercase tracking-widest mb-3 font-cinzel">Stack moyen</div>
            <div className="font-cinzel font-black text-white leading-none" style={{ fontSize: '5rem' }}>
              {formatChips(avgStack)}
            </div>
          </div>
          <div className="flex flex-col items-center py-8">
            <div className="text-[#a0aec0] text-lg uppercase tracking-widest mb-3 font-cinzel">Pot total</div>
            <div className="font-cinzel font-black text-[#27ae60] leading-none" style={{ fontSize: '5rem' }}>
              {totalPot}€
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
