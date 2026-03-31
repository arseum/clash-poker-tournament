import { useState } from 'react';
import { Plus, Users, ChevronRight, Trash2, UserPlus } from 'lucide-react';
import { CRCard } from '../components/ui/CRCard';
import { CRButton } from '../components/ui/CRButton';
import { CRInput } from '../components/ui/CRInput';
import { useTournamentStore } from '../store/tournamentStore';
import { DEFAULT_BLIND_STRUCTURE } from '../constants';
import type { TournamentConfig, Page } from '../types';

interface SetupPageProps {
  onNavigate: (page: Page) => void;
}

export function SetupPage({ onNavigate }: SetupPageProps) {
  const { initTournament, tournament } = useTournamentStore();

  const [config, setConfig] = useState<TournamentConfig>({
    name: 'Tournoi Clash Royale',
    buyIn: 20,
    startingStack: 10000,
    maxPlayersPerTable: 9,
    blindStructure: DEFAULT_BLIND_STRUCTURE,
  });

  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [bulkCount, setBulkCount] = useState(8);
  const [showResumePrompt, setShowResumePrompt] = useState(!!tournament);

  const addPlayer = () => setPlayerNames(prev => [...prev, '']);
  const removePlayer = (idx: number) => setPlayerNames(prev => prev.filter((_, i) => i !== idx));
  const updatePlayer = (idx: number, name: string) => {
    setPlayerNames(prev => prev.map((n, i) => i === idx ? name : n));
  };
  const addBulkPlayers = () => {
    setPlayerNames(prev => {
      const base = prev.length;
      const newPlayers = Array.from({ length: bulkCount }, (_, i) => `Joueur ${base + i + 1}`);
      return [...prev, ...newPlayers];
    });
  };
  const clearPlayers = () => setPlayerNames(['', '']);

  const validPlayers = playerNames.filter(n => n.trim().length > 0);
  const canStart = validPlayers.length >= 2 && config.name.trim().length > 0;

  const handleStart = () => {
    if (!canStart) return;
    initTournament(config, validPlayers.map(n => n.trim()));
    onNavigate('tournament');
  };

  if (showResumePrompt && tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <CRCard gold className="max-w-md w-full text-center">
          <div className="text-5xl mb-4">♠</div>
          <h2 className="font-cinzel text-2xl font-bold text-[#f4c842] mb-2">Tournoi en cours</h2>
          <p className="text-[#a0aec0] mb-2">{tournament.config.name}</p>
          <p className="text-[#e8e8e8] mb-6">
            {tournament.players.filter(p => !p.isEliminated).length} joueurs restants —{' '}
            Niveau {tournament.currentLevelIndex + 1}
          </p>
          <div className="flex flex-col gap-3">
            <CRButton variant="gold" size="lg" onClick={() => { setShowResumePrompt(false); onNavigate('tournament'); }}>
              Reprendre le tournoi
            </CRButton>
            <CRButton variant="ghost" onClick={() => setShowResumePrompt(false)}>
              Nouveau tournoi
            </CRButton>
          </div>
        </CRCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl md:text-5xl font-black text-[#f4c842] drop-shadow-[0_0_30px_rgba(244,200,66,0.5)] mb-2">
            ♠ POKER ROYALE ♠
          </h1>
          <p className="text-[#4a8fd4] tracking-widest text-sm uppercase">Configuration du tournoi</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Config card */}
          <CRCard>
            <h2 className="font-cinzel text-lg font-bold text-[#f4c842] mb-4 flex items-center gap-2">
              ⚙ Configuration
            </h2>
            <div className="flex flex-col gap-4">
              <CRInput
                label="Nom du tournoi"
                value={config.name}
                onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
                placeholder="Mon super tournoi"
              />
              <div className="grid grid-cols-2 gap-3">
                <CRInput
                  label="Buy-in (€)"
                  type="number"
                  value={config.buyIn}
                  onChange={e => setConfig(c => ({ ...c, buyIn: Number(e.target.value) }))}
                  min={0}
                />
                <CRInput
                  label="Stack de départ"
                  type="number"
                  value={config.startingStack}
                  onChange={e => setConfig(c => ({ ...c, startingStack: Number(e.target.value) }))}
                  min={100}
                  step={500}
                />
              </div>
              <CRInput
                label="Joueurs max par table"
                type="number"
                value={config.maxPlayersPerTable}
                onChange={e => setConfig(c => ({ ...c, maxPlayersPerTable: Number(e.target.value) }))}
                min={2}
                max={10}
              />
            </div>
          </CRCard>

          {/* Players card */}
          <CRCard>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-cinzel text-lg font-bold text-[#f4c842] flex items-center gap-2">
                <Users size={20} /> Joueurs ({validPlayers.length})
              </h2>
              {playerNames.length > 2 && (
                <button
                  onClick={clearPlayers}
                  className="text-[#4a5568] hover:text-[#e74c3c] text-xs transition-colors flex items-center gap-1"
                  title="Vider la liste"
                >
                  <Trash2 size={13} /> Tout effacer
                </button>
              )}
            </div>

            {/* Ajout en masse */}
            <div className="flex gap-2 items-center mb-3 p-2 bg-[#0d1b2a] rounded-lg border border-[#2a4a7a]">
              <UserPlus size={16} className="text-[#4a8fd4] flex-shrink-0" />
              <span className="text-[#a0aec0] text-sm flex-shrink-0">Ajouter</span>
              <input
                type="number"
                value={bulkCount}
                onChange={e => setBulkCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                className="w-14 bg-[#1a2d4a] border border-[#2a4a7a] rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-[#f4c842]"
                min={1}
                max={50}
              />
              <span className="text-[#a0aec0] text-sm flex-shrink-0">joueurs</span>
              <CRButton
                variant="ghost"
                size="sm"
                onClick={addBulkPlayers}
                className="ml-auto flex-shrink-0"
              >
                Ajouter
              </CRButton>
            </div>

            <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: '16rem' }}>
              {playerNames.map((name, idx) => (
                <div key={idx} className="flex items-stretch rounded-lg border border-[#2a4a7a] flex-shrink-0" style={{ overflow: 'hidden', minHeight: '2.5rem' }}>
                  <span className="text-[#4a8fd4] text-sm w-7 flex items-center justify-end pr-1.5 bg-[#0d1b2a] flex-shrink-0">{idx + 1}.</span>
                  <input
                    className="flex-1 bg-[#0d1b2a] px-2 py-2 text-white placeholder-[#4a5568] text-sm focus:outline-none focus:bg-[#1a2d4a] transition-colors min-w-0"
                    placeholder={`Joueur ${idx + 1}`}
                    value={name}
                    onChange={e => updatePlayer(idx, e.target.value)}
                  />
                  {playerNames.length > 2 && (
                    <button
                      onClick={() => removePlayer(idx)}
                      className="bg-[#c0392b]/20 hover:bg-[#c0392b] text-[#c0392b] hover:text-white transition-colors px-3 flex items-center flex-shrink-0"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <CRButton
              variant="ghost"
              size="sm"
              onClick={addPlayer}
              className="mt-3 w-full flex items-center justify-center gap-1"
            >
              <Plus size={16} /> Ajouter un joueur
            </CRButton>
          </CRCard>

          {/* Blind structure preview */}
          <CRCard className="md:col-span-2">
            <h2 className="font-cinzel text-lg font-bold text-[#f4c842] mb-4">
              📋 Structure des blindes
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#4a8fd4] border-b border-[#2a4a7a]">
                    <th className="text-left py-2 px-3">Niv.</th>
                    <th className="text-right py-2 px-3">Petite blinde</th>
                    <th className="text-right py-2 px-3">Grande blinde</th>
                    <th className="text-right py-2 px-3">Ante</th>
                    <th className="text-right py-2 px-3">Durée</th>
                  </tr>
                </thead>
                <tbody>
                  {config.blindStructure.map(level => (
                    <tr
                      key={level.level}
                      className={`border-b border-[#1a2d4a] ${level.isBreak ? 'bg-[#6b2fa0]/10 text-[#9b59b6]' : 'text-[#e8e8e8] hover:bg-[#1a3a6b]/30'}`}
                    >
                      <td className="py-1.5 px-3 font-bold">{level.level}</td>
                      {level.isBreak ? (
                        <td colSpan={3} className="py-1.5 px-3 text-center font-bold tracking-widest">— PAUSE —</td>
                      ) : (
                        <>
                          <td className="py-1.5 px-3 text-right">{level.smallBlind.toLocaleString()}</td>
                          <td className="py-1.5 px-3 text-right">{level.bigBlind.toLocaleString()}</td>
                          <td className="py-1.5 px-3 text-right">{level.ante > 0 ? level.ante.toLocaleString() : '-'}</td>
                        </>
                      )}
                      <td className="py-1.5 px-3 text-right text-[#a0aec0]">{level.duration}min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CRCard>
        </div>

        {/* Start button */}
        <div className="mt-8 flex justify-center">
          <CRButton
            variant="gold"
            size="lg"
            onClick={handleStart}
            disabled={!canStart}
            className="flex items-center gap-3 text-xl px-12"
          >
            Lancer le tournoi <ChevronRight size={24} />
          </CRButton>
        </div>
      </div>
    </div>
  );
}
