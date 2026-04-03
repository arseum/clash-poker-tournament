import { useEffect, useState } from 'react';

import { Play, Pause, SkipForward, SkipBack, RotateCcw, UserMinus, Trophy, Undo2, Tv } from 'lucide-react';
import { CRCard } from '../components/ui/CRCard';
import { CRButton } from '../components/ui/CRButton';
import { CRBadge } from '../components/ui/CRBadge';
import { EndTournamentOverlay } from '../components/EndTournamentOverlay';
import { useTournamentStore } from '../store/tournamentStore';
import { useHistoryStore } from '../store/historyStore';
import { useTimer } from '../hooks/useTimer';
import { formatTime, formatChips } from '../constants';
import { calculatePrizes, getPaidPlaces, positionLabel } from '../utils/prizePool';
import type { Page } from '../types';

interface TournamentPageProps {
  onNavigate: (page: Page) => void;
}

export function TournamentPage({ onNavigate }: TournamentPageProps) {
  useTimer();

  const {
    tournament,
    startTimer,
    pauseTimer,
    nextLevel,
    prevLevel,
    resetTimer,
    eliminatePlayer,
    undoElimination,
    clearTournament,
    endTournament,
  } = useTournamentStore();
  const { addEntry } = useHistoryStore();

  const [showEnd, setShowEnd] = useState(false);

  const activePlayers = tournament?.players.filter(p => !p.isEliminated) ?? [];
  const totalPlayers = tournament?.players.length ?? 0;
  useEffect(() => {
    if (!showEnd && tournament && activePlayers.length === 1 && totalPlayers > 1) {
      endTournament();
      setShowEnd(true);
    }
  }, [activePlayers.length, totalPlayers, showEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseEnd = () => {
    if (!tournament) return;
    const winner = activePlayers[0] ?? tournament.players.reduce((b, p) =>
      (p.position ?? 99) < (b.position ?? 99) ? p : b
    );
    addEntry({
      id: tournament.id,
      name: tournament.config.name,
      date: Date.now(),
      buyIn: tournament.config.buyIn,
      playerCount: tournament.players.length,
      rebuyCount: tournament.rebuyCount,
      totalPot: (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn,
      duration: tournament.startedAt ? Math.round((Date.now() - tournament.startedAt) / 60000) : 0,
      placements: [
        { playerName: winner.name, position: 1, prize: 0 },
        ...tournament.players
          .filter(p => p.isEliminated && p.position !== undefined)
          .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
          .map(p => ({ playerName: p.name, position: p.position!, prize: 0 })),
      ],
    });
    clearTournament();
    setShowEnd(false);
    onNavigate('history');
  };

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <CRCard>
          <p className="text-[#8888a0] mb-4">Aucun tournoi en cours</p>
          <CRButton onClick={() => onNavigate('setup')}>Créer un tournoi</CRButton>
        </CRCard>
      </div>
    );
  }

  const { config, players, currentLevelIndex, secondsRemaining, isRunning } = tournament;
  const currentLevel = config.blindStructure[currentLevelIndex];
  const nextLevelData = config.blindStructure[currentLevelIndex + 1];
  const totalChips = (players.length + tournament.rebuyCount) * config.startingStack;
  const avgStack = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0;
  const totalPot        = (players.length + tournament.rebuyCount) * config.buyIn;
  const prizePoolAmount = Math.round(totalPot * config.prizePool.prizePoolPct / 100);
  const prizes          = calculatePrizes(prizePoolAmount, players.length, config.prizePool);
  const paidPlaces      = getPaidPlaces(players.length, config.prizePool.itmPct);
  const levelProgress = 1 - secondsRemaining / (currentLevel.duration * 60);
  const isWarning = secondsRemaining <= 60 && !currentLevel.isBreak;

  return (
    <div className="min-h-screen p-4 relative">
      {showEnd && (
        <EndTournamentOverlay tournament={tournament} onClose={handleCloseEnd} />
      )}

      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="font-cinzel text-base sm:text-xl font-bold text-cr-gold truncate min-w-0">{config.name}</h1>
        <div className="flex gap-2 flex-shrink-0">
          <CRButton variant="ghost" size="sm" onClick={() => onNavigate('tables')}>Tables</CRButton>
          <CRButton variant="ghost" size="sm" onClick={() => onNavigate('history')} className="hidden sm:flex">Historique</CRButton>
          <CRButton
            variant="blue"
            size="sm"
            onClick={() => window.open('/?display', 'poker-tv', 'width=1920,height=1080')}
            className="flex items-center gap-1.5"
          >
            <Tv size={15} /> TV
          </CRButton>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Timer + Controls + Stats — colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Timer (avec controls intégrés) */}
          <CRCard gold className="text-center relative overflow-hidden">
            {/* Barre de progression */}
            <div className="absolute bottom-0 left-0 w-full cr-timer-bar-track">
              <div
                className={`cr-timer-bar-fill${isWarning ? ' cr-timer-bar-warning' : ''}`}
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>

            {currentLevel.isBreak ? (
              <>
                <div className="font-cinzel text-xl sm:text-2xl font-bold text-[#9b59b6] mb-2">— PAUSE —</div>
                <div className={`font-cinzel font-black text-6xl sm:text-8xl md:text-9xl leading-none tracking-tight ${isWarning ? 'text-[#e74c3c] animate-pulse' : 'text-[#e8e8e8]'}`}>
                  {formatTime(secondsRemaining)}
                </div>
              </>
            ) : (
              <>
                <div className="cr-level-ribbon font-cinzel text-lg sm:text-2xl font-bold text-cr-blue-light mb-1">
                  <span>NIVEAU {currentLevel.level}</span>
                </div>
                <div className={`font-cinzel font-black text-6xl sm:text-8xl md:text-9xl leading-none tracking-tight mb-3 sm:mb-4 ${isWarning ? 'text-[#e74c3c] animate-pulse' : 'text-cr-gold'}`}>
                  {formatTime(secondsRemaining)}
                </div>
                <div className="flex justify-center gap-3 sm:gap-6 text-center flex-wrap">
                  <div>
                    <div className="text-[#8888a0] text-xs uppercase tracking-widest mb-1">Petite</div>
                    <div className="font-cinzel text-xl sm:text-3xl font-bold text-white">{formatChips(currentLevel.smallBlind)}</div>
                  </div>
                  <div className="text-cr-blue-light text-2xl sm:text-4xl font-thin self-center">/</div>
                  <div>
                    <div className="text-[#8888a0] text-xs uppercase tracking-widest mb-1">Grande</div>
                    <div className="font-cinzel text-xl sm:text-3xl font-bold text-white">{formatChips(currentLevel.bigBlind)}</div>
                  </div>
                  {currentLevel.ante > 0 && (
                    <>
                      <div className="text-cr-blue-light text-2xl sm:text-4xl font-thin self-center">+</div>
                      <div>
                        <div className="text-[#8888a0] text-xs uppercase tracking-widest mb-1">Ante</div>
                        <div className="font-cinzel text-xl sm:text-3xl font-bold text-cr-gold">{formatChips(currentLevel.ante)}</div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Controls — fusionnés dans le timer */}
            <div className="border-t border-cr-card-border/40 mt-5 pt-4 flex flex-wrap justify-center gap-3">
              <CRButton variant="ghost" size="sm" onClick={prevLevel}>
                <SkipBack size={18} />
              </CRButton>
              <CRButton variant="ghost" size="sm" onClick={resetTimer}>
                <RotateCcw size={18} />
              </CRButton>
              <CRButton
                variant={isRunning ? 'red' : 'green'}
                size="lg"
                onClick={isRunning ? pauseTimer : startTimer}
                className="px-12 flex items-center gap-2"
              >
                {isRunning ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Jouer</>}
              </CRButton>
              <CRButton variant="ghost" size="sm" onClick={nextLevel}>
                <SkipForward size={18} />
              </CRButton>
            </div>
            {nextLevelData && (
              <div className="mt-3 text-center text-sm text-[#525265] pb-1">
                Prochain : {nextLevelData.isBreak ? 'PAUSE' : `${formatChips(nextLevelData.smallBlind)}/${formatChips(nextLevelData.bigBlind)}${nextLevelData.ante ? ` + ${formatChips(nextLevelData.ante)}` : ''}`} — {nextLevelData.duration}min
              </div>
            )}
          </CRCard>

          {/* Stats — ligne plate sans cards individuelles */}
          <div className="grid grid-cols-3 border border-cr-card-border rounded-xl overflow-hidden bg-cr-card/90">
            <div className="text-center px-4 py-4 border-r border-cr-card-border">
              <div className="text-[#8888a0] text-xs uppercase tracking-widest mb-1">Joueurs</div>
              <div className="font-cinzel text-2xl sm:text-3xl font-bold text-cr-gold">{activePlayers.length}</div>
              <div className="text-[#525265] text-xs">/ {players.length}</div>
            </div>
            <div className="text-center px-4 py-4 border-r border-cr-card-border">
              <div className="text-[#8888a0] text-xs uppercase tracking-widest mb-1">Moy.</div>
              <div className="font-cinzel text-2xl sm:text-3xl font-bold text-cr-blue-light">{formatChips(avgStack)}</div>
            </div>
            <div className="text-center px-4 py-4">
              <div className="text-[#8888a0] text-xs uppercase tracking-widest mb-1">Pot</div>
              <div className="font-cinzel text-2xl sm:text-3xl font-bold text-cr-green">{totalPot}€</div>
              {tournament.rebuyCount > 0 && (
                <div className="text-[#8888a0] text-xs">+{tournament.rebuyCount} rebuy</div>
              )}
            </div>
          </div>

          {/* Prize pool */}
          <CRCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cinzel text-base font-bold text-cr-green flex items-center gap-2">
                <Trophy size={16} className="text-cr-gold" /> Prize Pool — {prizePoolAmount}€
              </h2>
              <span className="text-[#525265] text-xs">ITM : {paidPlaces}/{players.length} joueurs</span>
            </div>
            <div className="flex flex-col max-h-44 overflow-y-auto">
              {prizes.map(({ position, percentage, amount }) => (
                <div
                  key={position}
                  className="flex items-center justify-between py-2 border-b border-cr-card-border/40 last:border-0 text-sm"
                >
                  <span className={`font-cinzel font-bold w-8 flex-shrink-0 ${position <= 3 ? 'text-cr-gold' : 'text-[#525265]'}`}>
                    {positionLabel(position)}
                  </span>
                  <div className="flex-1 mx-3">
                    <div className="h-1 bg-cr-darker rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-cr-green"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[#8888a0] text-xs w-10 text-right">{percentage}%</span>
                  <span className="font-cinzel font-bold text-cr-green w-14 text-right">{amount}€</span>
                </div>
              ))}
            </div>
          </CRCard>
        </div>

        {/* Players sidebar */}
        <CRCard className="max-h-72 lg:max-h-screen overflow-y-auto">
          <h2 className="font-cinzel text-base font-bold text-cr-gold mb-4 flex items-center gap-2">
            <span className="cr-supercell-only !block"><img src="/clash_royal_todo/crown-blue.png" alt="" className="w-6 h-6 object-contain" /></span>
            <span className="cr-default-only !block"><Trophy size={18} /></span>
            Joueurs actifs ({activePlayers.length})
          </h2>
          <div className="flex flex-col">
            {activePlayers.map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between py-2.5 border-b border-cr-card-border/30 last:border-0"
              >
                <span className="text-[#e8e8e8] text-sm">{player.name}</span>
                <button
                  onClick={() => eliminatePlayer(player.id)}
                  data-variant="red"
                  className="cr-btn text-[#525265] hover:text-white hover:bg-cr-red transition-colors flex-shrink-0 ml-2 p-1.5 rounded-lg"
                  title="Éliminer"
                >
                  <UserMinus size={15} />
                </button>
              </div>
            ))}
          </div>

          {players.filter(p => p.isEliminated).length > 0 && (
            <>
              <h3 className="font-cinzel text-xs font-bold text-[#525265] uppercase tracking-widest mt-5 mb-3">Éliminés</h3>
              <div className="flex flex-col">
                {players.filter(p => p.isEliminated)
                  .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                  .map(player => (
                    <div key={player.id} className="flex items-center justify-between py-2 border-b border-cr-card-border/20 last:border-0 group">
                      <div className="flex items-center gap-2 min-w-0">
                        {player.position && <CRBadge variant="red">{player.position}e</CRBadge>}
                        <span className="text-sm text-[#525265] line-through truncate">{player.name}</span>
                      </div>
                      <button
                        onClick={() => undoElimination(player.id)}
                        data-variant="ghost"
                        className="cr-btn text-[#525265] hover:text-cr-gold transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0 p-1"
                        title="Annuler l'élimination"
                      >
                        <Undo2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </>
          )}
        </CRCard>
      </div>
    </div>
  );
}
