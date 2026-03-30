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

  // Detect end of tournament (1 player left)
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
          <p className="text-[#a0aec0] mb-4">Aucun tournoi en cours</p>
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
  const totalPot = (players.length + tournament.rebuyCount) * config.buyIn;
  const prizes = calculatePrizes(totalPot, players.length);
  const paidPlaces = getPaidPlaces(players.length);
  const levelProgress = 1 - secondsRemaining / (currentLevel.duration * 60);
  const isWarning = secondsRemaining <= 60 && !currentLevel.isBreak;

  return (
    <div className="min-h-screen p-4 relative">
      {/* End overlay */}
      {showEnd && (
        <EndTournamentOverlay tournament={tournament} onClose={handleCloseEnd} />
      )}

      {/* Title bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-cinzel text-xl font-bold text-[#f4c842]">{config.name}</h1>
        <div className="flex gap-2">
          <CRButton variant="ghost" size="sm" onClick={() => onNavigate('tables')}>Tables</CRButton>
          <CRButton variant="ghost" size="sm" onClick={() => onNavigate('history')}>Historique</CRButton>
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

        {/* Timer + Blinds */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          <CRCard gold className="text-center relative overflow-hidden">
            <div className="absolute bottom-0 left-0 h-1 bg-[#f4c842]/20 w-full">
              <div
                className="h-full bg-[#f4c842] transition-all duration-1000"
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>

            {currentLevel.isBreak ? (
              <>
                <div className="font-cinzel text-2xl font-bold text-[#9b59b6] mb-2">— PAUSE —</div>
                <div className={`font-cinzel font-black text-9xl leading-none tracking-tight ${isWarning ? 'text-[#e74c3c] animate-pulse' : 'text-[#e8e8e8]'}`}>
                  {formatTime(secondsRemaining)}
                </div>
              </>
            ) : (
              <>
                <div className="font-cinzel text-2xl font-bold text-[#4a8fd4] mb-1">
                  NIVEAU {currentLevel.level}
                </div>
                <div className={`font-cinzel font-black text-9xl leading-none tracking-tight mb-4 ${isWarning ? 'text-[#e74c3c] animate-pulse' : 'text-[#f4c842]'}`}>
                  {formatTime(secondsRemaining)}
                </div>
                <div className="flex justify-center gap-6 text-center">
                  <div>
                    <div className="text-[#a0aec0] text-xs uppercase tracking-widest mb-1">Petite</div>
                    <div className="font-cinzel text-3xl font-bold text-white">{formatChips(currentLevel.smallBlind)}</div>
                  </div>
                  <div className="text-[#4a8fd4] text-4xl font-thin self-center">/</div>
                  <div>
                    <div className="text-[#a0aec0] text-xs uppercase tracking-widest mb-1">Grande</div>
                    <div className="font-cinzel text-3xl font-bold text-white">{formatChips(currentLevel.bigBlind)}</div>
                  </div>
                  {currentLevel.ante > 0 && (
                    <>
                      <div className="text-[#4a8fd4] text-4xl font-thin self-center">+</div>
                      <div>
                        <div className="text-[#a0aec0] text-xs uppercase tracking-widest mb-1">Ante</div>
                        <div className="font-cinzel text-3xl font-bold text-[#f4c842]">{formatChips(currentLevel.ante)}</div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </CRCard>

          {/* Controls */}
          <CRCard>
            <div className="flex flex-wrap justify-center gap-3">
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
              <div className="mt-3 text-center text-sm text-[#a0aec0]">
                Prochain: {nextLevelData.isBreak ? 'PAUSE' : `${formatChips(nextLevelData.smallBlind)}/${formatChips(nextLevelData.bigBlind)}${nextLevelData.ante ? ` + ${formatChips(nextLevelData.ante)}` : ''}`} — {nextLevelData.duration}min
              </div>
            )}
          </CRCard>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <CRCard className="text-center">
              <div className="text-[#a0aec0] text-xs uppercase tracking-widest mb-1">Joueurs</div>
              <div className="font-cinzel text-3xl font-bold text-[#f4c842]">{activePlayers.length}</div>
              <div className="text-[#4a5568] text-xs">/ {players.length}</div>
            </CRCard>
            <CRCard className="text-center">
              <div className="text-[#a0aec0] text-xs uppercase tracking-widest mb-1">Stack moyen</div>
              <div className="font-cinzel text-3xl font-bold text-[#4a8fd4]">{formatChips(avgStack)}</div>
            </CRCard>
            <CRCard className="text-center">
              <div className="text-[#a0aec0] text-xs uppercase tracking-widest mb-1">Pot total</div>
              <div className="font-cinzel text-3xl font-bold text-[#27ae60]">{totalPot}€</div>
              {tournament.rebuyCount > 0 && (
                <div className="text-[#a0aec0] text-xs">+{tournament.rebuyCount} rebuy</div>
              )}
            </CRCard>
          </div>

          {/* Prize pool */}
          <CRCard>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-cinzel text-base font-bold text-[#27ae60] flex items-center gap-2">
                <Trophy size={16} className="text-[#f4c842]" /> Prize Pool — {totalPot}€
              </h2>
              <span className="text-[#4a5568] text-xs">ITM : {paidPlaces}/{players.length} joueurs</span>
            </div>
            <div className="flex flex-col gap-1 max-h-40 overflow-y-auto pr-1">
              {prizes.map(({ position, percentage, amount }) => (
                <div
                  key={position}
                  className={`flex items-center justify-between rounded px-3 py-1.5 text-sm ${
                    position === 1 ? 'bg-[#f4c842]/10 border border-[#f4c842]/30' :
                    position === 2 ? 'bg-white/5 border border-white/10' :
                    position === 3 ? 'bg-[#cd7f32]/10 border border-[#cd7f32]/20' :
                    'bg-[#0d1b2a]'
                  }`}
                >
                  <span className={`font-cinzel font-bold w-8 ${position <= 3 ? 'text-[#f4c842]' : 'text-[#4a5568]'}`}>
                    {positionLabel(position)}
                  </span>
                  <div className="flex-1 mx-3">
                    <div className="h-1.5 bg-[#0d1b2a] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#27ae60]"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[#a0aec0] text-xs w-10 text-right">{percentage}%</span>
                  <span className="font-cinzel font-bold text-[#27ae60] w-16 text-right">{amount}€</span>
                </div>
              ))}
            </div>
          </CRCard>
        </div>

        {/* Players sidebar */}
        <CRCard className="max-h-screen overflow-y-auto">
          <h2 className="font-cinzel text-base font-bold text-[#f4c842] mb-3 flex items-center gap-2">
            <Trophy size={18} /> Joueurs actifs ({activePlayers.length})
          </h2>
          <div className="flex flex-col gap-2">
            {activePlayers.map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-[#0d1b2a] rounded-lg px-3 py-2 group"
              >
                <span className="text-[#e8e8e8] text-sm font-medium">{player.name}</span>
                <button
                  onClick={() => eliminatePlayer(player.id)}
                  className="text-[#4a5568] hover:text-[#e74c3c] transition-colors opacity-0 group-hover:opacity-100"
                  title="Éliminer"
                >
                  <UserMinus size={16} />
                </button>
              </div>
            ))}
          </div>

          {players.filter(p => p.isEliminated).length > 0 && (
            <>
              <h3 className="font-cinzel text-sm font-bold text-[#4a5568] mt-4 mb-2">Éliminés</h3>
              <div className="flex flex-col gap-1">
                {players.filter(p => p.isEliminated)
                  .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                  .map(player => (
                    <div key={player.id} className="flex items-center justify-between bg-[#0d1b2a]/50 rounded-lg px-3 py-2 group">
                      <div className="flex items-center gap-2 min-w-0">
                        {player.position && <CRBadge variant="red">{player.position}e</CRBadge>}
                        <span className="text-sm text-[#4a5568] line-through truncate">{player.name}</span>
                      </div>
                      <button
                        onClick={() => undoElimination(player.id)}
                        className="text-[#4a5568] hover:text-[#f4c842] transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0"
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
