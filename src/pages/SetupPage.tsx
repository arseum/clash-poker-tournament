import {useState} from 'react';
import {ChevronRight, ClipboardList, Plus, Settings, Spade, Trash2, UserPlus, Users, Zap} from 'lucide-react';
import {CRCard} from '../components/ui/CRCard';
import {CRButton} from '../components/ui/CRButton';
import {CRInput} from '../components/ui/CRInput';
import {PrizePoolSetupCard} from '../components/PrizePoolSetupCard';
import {BlindStructureEditor} from '../components/BlindStructureEditor';
import {useTournamentStore} from '../store/tournamentStore';
import {DEFAULT_BLIND_STRUCTURE, DEFAULT_PRIZE_POOL_CONFIG} from '../constants';
import {generateBlindStructure} from '../utils/tournamentEstimator';
import type {Page, TournamentConfig} from '../types';

interface SetupPageProps {
    onNavigate: (page: Page) => void;
}

export function SetupPage({onNavigate}: SetupPageProps) {
    const {initTournament, tournament} = useTournamentStore();

    const [config, setConfig] = useState<TournamentConfig>({
        name: 'Tournoi Clash Royale',
        buyIn: 20,
        startingStack: 10000,
        maxPlayersPerTable: 9,
        blindStructure: DEFAULT_BLIND_STRUCTURE,
        prizePool: DEFAULT_PRIZE_POOL_CONFIG,
        smallestChip: 25,
        reEntry: null,
    });

    const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
    const [bulkCount, setBulkCount] = useState(8);
    const [showResumePrompt, setShowResumePrompt] = useState(!!tournament);

    // Auto-calcul : 'idle' | 'input' | 'loading'
    const [autoCalcState, setAutoCalcState] = useState<'idle' | 'input' | 'loading'>('idle');
    const [targetHours, setTargetHours] = useState(3);
    const [targetLevelMinutes, setTargetLevelMinutes] = useState(20);

    const handleAutoCalcGo = () => {
        setAutoCalcState('loading');
        const targetMinutes = Math.round(targetHours * 60);
        setTimeout(() => {
            setConfig(c => ({
                ...c,
                blindStructure: generateBlindStructure(c.startingStack, c.smallestChip, targetMinutes, targetLevelMinutes)
            }));
            setAutoCalcState('idle');
        }, 1200);
    };

    const addPlayer = () => setPlayerNames(prev => [...prev, '']);
    const removePlayer = (idx: number) => setPlayerNames(prev => prev.filter((_, i) => i !== idx));
    const updatePlayer = (idx: number, name: string) => {
        setPlayerNames(prev => prev.map((n, i) => i === idx ? name : n));
    };
    const addBulkPlayers = () => {
        setPlayerNames(prev => {
            const base = prev.length;
            const newPlayers = Array.from({length: bulkCount}, (_, i) => `Joueur ${base + i + 1}`);
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
                    <Spade size={48} className="text-cr-gold mx-auto mb-4"/>
                    <h2 className="font-cinzel text-2xl font-bold text-cr-gold mb-2">Tournoi en cours</h2>
                    <p className="text-[#8888a0] mb-2">{tournament.config.name}</p>
                    <p className="text-[#e8e8e8] mb-6">
                        {tournament.players.filter(p => !p.isEliminated).length} joueurs restants —{' '}
                        Niveau {tournament.currentLevelIndex + 1}
                    </p>
                    <div className="flex flex-col gap-3">
                        <CRButton variant="gold" size="lg" onClick={() => {
                            setShowResumePrompt(false);
                            onNavigate('tournament');
                        }}>
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
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="cr-supercell-only"><img src="/clash_royal_todo/tournament_icon.webp" alt=""
                                                                 className="w-14 h-14 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"/></span>
                        <h1 className="font-cinzel text-2xl sm:text-4xl md:text-5xl font-black text-cr-gold drop-shadow-[0_0_30px_rgba(244,200,66,0.5)]">
                            POKER ROYALE
                        </h1>
                        <span className="cr-supercell-only"><img src="/clash_royal_todo/tournament_icon.webp" alt=""
                                                                 className="w-14 h-14 object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] scale-x-[-1]"/></span>
                    </div>
                    <p className="text-cr-blue-light tracking-widest text-sm uppercase">Configuration du tournoi</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Config card */}
                    <CRCard>
                        <h2 className="font-cinzel text-lg font-bold text-cr-gold mb-4 flex items-center gap-2">
                            <Settings size={18} className="text-cr-blue-light"/> Configuration
                        </h2>
                        <div className="flex flex-col gap-4">
                            <CRInput
                                label="Nom du tournoi"
                                value={config.name}
                                onChange={e => setConfig(c => ({...c, name: e.target.value}))}
                                placeholder="Mon super tournoi"
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <CRInput
                                    label="Buy-in (€)"
                                    type="number"
                                    value={config.buyIn}
                                    onChange={e => setConfig(c => ({...c, buyIn: Number(e.target.value)}))}
                                    min={0}
                                />
                                <CRInput
                                    label="Stack de départ"
                                    type="number"
                                    value={config.startingStack}
                                    onChange={e => setConfig(c => ({...c, startingStack: Number(e.target.value)}))}
                                    min={100}
                                    step={500}
                                />
                            </div>
                            <CRInput
                                label="Joueurs max par table"
                                type="number"
                                value={config.maxPlayersPerTable}
                                onChange={e => setConfig(c => ({...c, maxPlayersPerTable: Number(e.target.value)}))}
                                min={2}
                                max={10}
                            />
                            <CRInput
                                label="Plus petit jeton"
                                type="number"
                                value={config.smallestChip}
                                onChange={e => setConfig(c => ({
                                    ...c,
                                    smallestChip: Math.max(1, Number(e.target.value))
                                }))}
                                min={1}
                            />
                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-[#8888a0] font-medium">Re-entry</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="reentry-toggle"
                                        checked={config.reEntry !== null}
                                        onChange={e => setConfig(c => ({
                                            ...c,
                                            reEntry: e.target.checked ? {maxLevel: 4, maxPerPlayer: 1} : null,
                                        }))}
                                        className="accent-[#f4c842] cursor-pointer w-4 h-4"
                                    />
                                    <label htmlFor="reentry-toggle" className="text-sm text-[#e8e8e8] cursor-pointer">
                                        Autoriser le re-entry
                                    </label>
                                </div>
                                {config.reEntry && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
                                        <CRInput
                                            label="Jusqu'au niveau"
                                            type="number"
                                            value={config.reEntry.maxLevel}
                                            onChange={e => setConfig(c => ({
                                                ...c,
                                                reEntry: c.reEntry ? {
                                                    ...c.reEntry,
                                                    maxLevel: Math.max(1, Number(e.target.value))
                                                } : null,
                                            }))}
                                            min={1}
                                            max={config.blindStructure.length}
                                        />
                                        <CRInput
                                            label="Max par joueur (0=∞)"
                                            type="number"
                                            value={config.reEntry.maxPerPlayer}
                                            onChange={e => setConfig(c => ({
                                                ...c,
                                                reEntry: c.reEntry ? {
                                                    ...c.reEntry,
                                                    maxPerPlayer: Math.max(0, Number(e.target.value))
                                                } : null,
                                            }))}
                                            min={0}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </CRCard>

                    {/* Players card */}
                    <CRCard>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-cinzel text-lg font-bold text-cr-gold flex items-center gap-2">
                                <Users size={20}/> Joueurs ({validPlayers.length})
                            </h2>
                            {playerNames.length > 2 && (
                                <button
                                    onClick={clearPlayers}
                                    className="text-[#525265] hover:text-cr-red text-xs transition-colors flex items-center gap-1"
                                    title="Vider la liste"
                                >
                                    <Trash2 size={13}/> Tout effacer
                                </button>
                            )}
                        </div>

                        {/* Ajout en masse — inline, sans boîte */}
                        <div className="flex gap-2 items-center mb-1 pb-3 border-b border-cr-card-border/50">
                            <UserPlus size={15} className="text-cr-blue-light flex-shrink-0"/>
                            <span className="text-[#8888a0] text-sm flex-shrink-0">Ajouter</span>
                            <input
                                type="number"
                                value={bulkCount}
                                onChange={e => setBulkCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                                className="w-14 bg-cr-darker border border-cr-card-border rounded px-2 py-1 text-white text-sm text-center focus:outline-none focus:border-cr-gold"
                                min={1}
                                max={50}
                            />
                            <span className="text-[#8888a0] text-sm flex-shrink-0">joueurs</span>
                            <CRButton
                                variant="ghost"
                                size="sm"
                                onClick={addBulkPlayers}
                                className="ml-auto flex-shrink-0"
                            >
                                Ajouter
                            </CRButton>
                        </div>

                        {/* Liste joueurs — rows plates */}
                        <div className="flex flex-col overflow-y-auto" style={{maxHeight: '16rem'}}>
                            {playerNames.map((name, idx) => (
                                <div key={idx}
                                     className="flex items-center border-b border-cr-card-border/30 last:border-0 flex-shrink-0"
                                     style={{minHeight: '2.5rem'}}>
                                    <span
                                        className="text-[#525265] text-xs w-6 text-right pr-2 flex-shrink-0">{idx + 1}</span>
                                    <input
                                        className="flex-1 bg-transparent py-2 text-[#e8e8e8] placeholder-[#4a5568] text-sm focus:outline-none min-w-0"
                                        placeholder={`Joueur ${idx + 1}`}
                                        value={name}
                                        onChange={e => updatePlayer(idx, e.target.value)}
                                    />
                                    {playerNames.length > 2 && (
                                        <button
                                            onClick={() => removePlayer(idx)}
                                            className="text-[#525265] hover:text-cr-red transition-colors px-2 flex items-center flex-shrink-0"
                                        >
                                            <Trash2 size={13}/>
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
                            <Plus size={16}/> Ajouter un joueur
                        </CRButton>
                    </CRCard>

                    {/* Prize pool setup */}
                    <div className="md:col-span-2">
                        <PrizePoolSetupCard
                            buyIn={config.buyIn}
                            playerCount={validPlayers.length}
                            prizePool={config.prizePool}
                            onChange={pp => setConfig(c => ({...c, prizePool: pp}))}
                        />
                    </div>

                    {/* Blind structure editor */}
                    <CRCard className="md:col-span-2">
                        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                            <h2 className="font-cinzel text-lg font-bold text-cr-gold flex items-center gap-2">
                                <ClipboardList size={18} className="text-cr-blue-light"/> Structure des blindes
                            </h2>
                            <div className="flex items-center gap-2 ml-auto flex-wrap justify-end">
                                {autoCalcState === 'input' && (
                                    <>
                                        <span className="text-[#8888a0] text-sm flex-shrink-0">Durée totale</span>
                                        <input
                                            type="number"
                                            value={targetHours}
                                            onChange={e => setTargetHours(Math.max(0.5, Math.min(12, Number(e.target.value))))}
                                            min={0.5}
                                            max={12}
                                            step={0.5}
                                            className="w-20 bg-cr-card border border-cr-card-border rounded px-2 py-1.5 text-[#e0ddd8] text-sm text-center focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold/20"
                                            placeholder="3"
                                            autoFocus
                                        />
                                        <span className="text-[#8888a0] text-sm flex-shrink-0">h</span>
                                        <span className="text-[#8888a0] text-sm flex-shrink-0">·</span>
                                        <input
                                            type="number"
                                            value={targetLevelMinutes}
                                            onChange={e => setTargetLevelMinutes(Math.max(5, Math.min(60, Number(e.target.value))))}
                                            min={5}
                                            max={60}
                                            step={5}
                                            className="w-20 bg-cr-card border border-cr-card-border rounded px-2 py-1.5 text-[#e0ddd8] text-sm text-center focus:outline-none focus:border-cr-gold focus:ring-1 focus:ring-cr-gold/20"
                                            placeholder="20"
                                        />
                                        <span className="text-[#8888a0] text-sm flex-shrink-0">min/niv.</span>
                                        <CRButton variant="gold" size="sm" onClick={handleAutoCalcGo}>
                                            Go
                                        </CRButton>
                                        <button
                                            onClick={() => setAutoCalcState('idle')}
                                            data-variant="ghost"
                                            className="cr-btn text-[#525265] hover:text-cr-red transition-colors text-lg leading-none px-2 py-1"
                                            title="Annuler"
                                        >
                                            ✕
                                        </button>
                                    </>
                                )}
                                {autoCalcState !== 'input' && (
                                    <CRButton variant="blue" size="sm" onClick={() => setAutoCalcState('input')}
                                              className="flex items-center gap-1.5">
                                        <Zap size={14}/> Auto-calcul
                                    </CRButton>
                                )}
                            </div>
                        </div>

                        {autoCalcState === 'loading' ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-5">
                                <div className="relative w-16 h-16">
                                    <div className="absolute inset-0 rounded-full border-4 border-cr-gold/15"/>
                                    <div
                                        className="absolute inset-0 rounded-full border-4 border-t-[#f4c842] border-r-transparent border-b-transparent border-l-transparent animate-spin"/>
                                    <div className="absolute inset-0 flex items-center justify-center"><Spade size={20}
                                                                                                              className="text-cr-gold"/>
                                    </div>
                                </div>
                                <p className="text-cr-blue-light text-sm tracking-[0.2em] uppercase animate-pulse">
                                    Calcul en cours…
                                </p>
                            </div>
                        ) : (
                            <BlindStructureEditor
                                structure={config.blindStructure}
                                onChange={bs => setConfig(c => ({...c, blindStructure: bs}))}
                                playerCount={validPlayers.length}
                                startingStack={config.startingStack}
                                maxPlayersPerTable={config.maxPlayersPerTable}
                                smallestChip={config.smallestChip}
                                reEntry={config.reEntry}
                            />
                        )}
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
                        Lancer le tournoi <ChevronRight size={24}/>
                    </CRButton>
                </div>
            </div>
        </div>
    );
}
