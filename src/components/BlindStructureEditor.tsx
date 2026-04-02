import { useState, useMemo } from 'react';
import { Plus, Trash2, Coffee, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import type { BlindLevel, ReEntryConfig } from '../types';
import { validateBlindStructure, estimateTournament } from '../utils/tournamentEstimator';

interface Props {
  structure: BlindLevel[];
  onChange: (structure: BlindLevel[]) => void;
  playerCount?: number;
  startingStack?: number;
  maxPlayersPerTable?: number;
  smallestChip?: number;
  reEntry?: ReEntryConfig | null;
}

function recalcLevels(levels: BlindLevel[]): BlindLevel[] {
  return levels.map((l, i) => ({ ...l, level: i + 1 }));
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export function BlindStructureEditor({ structure, onChange, playerCount, startingStack, maxPlayersPerTable, smallestChip, reEntry }: Props) {
  const [analysisOpen, setAnalysisOpen] = useState(true);

  const validationErrors = useMemo(() =>
    smallestChip && smallestChip > 0
      ? validateBlindStructure(structure, smallestChip)
      : [],
    [structure, smallestChip]
  );

  const estimate = useMemo(() => {
    if (!playerCount || !startingStack || !maxPlayersPerTable || playerCount < 2) return null;
    return estimateTournament(structure, playerCount, startingStack, maxPlayersPerTable, reEntry ?? null);
  }, [structure, playerCount, startingStack, maxPlayersPerTable, reEntry]);

  const hasError = (idx: number, field: 'smallBlind' | 'bigBlind' | 'ante') =>
    validationErrors.some(e => e.levelIndex === idx && e.field === field);

  const updateLevel = (idx: number, patch: Partial<BlindLevel>) => {
    const updated = structure.map((l, i) => {
      if (i !== idx) return l;
      const next = { ...l, ...patch };
      if (patch.bigBlind !== undefined) {
        next.smallBlind = Math.floor(patch.bigBlind / 2);
      }
      return next;
    });
    onChange(updated);
  };

  const addLevel = () => {
    const last = structure.filter(l => !l.isBreak).at(-1);
    const newBB = last ? last.bigBlind * 2 : 100;
    const newLevel: BlindLevel = {
      level: structure.length + 1,
      smallBlind: Math.floor(newBB / 2),
      bigBlind: newBB,
      ante: last?.ante ?? 0,
      duration: 20,
    };
    onChange(recalcLevels([...structure, newLevel]));
  };

  const addBreak = () => {
    const newBreak: BlindLevel = {
      level: structure.length + 1,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      duration: 15,
      isBreak: true,
    };
    onChange(recalcLevels([...structure, newBreak]));
  };

  const removeLevel = (idx: number) => {
    onChange(recalcLevels(structure.filter((_, i) => i !== idx)));
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[#4a8fd4] border-b border-[#2a4a7a]">
              <th className="text-left py-2 px-2 w-10">Niv.</th>
              <th className="text-right py-2 px-2">Grande blinde</th>
              <th className="text-right py-2 px-2">Petite blinde</th>
              <th className="text-center py-2 px-2">Ante</th>
              <th className="text-right py-2 px-2">Durée (min)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {structure.map((level, idx) => (
              <tr
                key={idx}
                className={`border-b border-[#1a2d4a] ${level.isBreak ? 'bg-[#6b2fa0]/10' : ''}`}
              >
                <td className="py-1.5 px-2 font-bold text-[#4a8fd4]">{level.level}</td>

                {level.isBreak ? (
                  <>
                    <td colSpan={3} className="py-1.5 px-2 text-center text-[#9b59b6] font-bold tracking-widest">
                      — PAUSE —
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={level.duration}
                        onChange={e => updateLevel(idx, { duration: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-16 bg-[#1a2d4a] border border-[#2a4a7a] rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842] ml-auto block"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    {/* Grande blinde */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={level.bigBlind}
                        onChange={e => updateLevel(idx, { bigBlind: Math.max(2, Number(e.target.value)) })}
                        min={2}
                        step={50}
                        className={`w-24 bg-[#1a2d4a] border rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842] ml-auto block ${
                          hasError(idx, 'bigBlind') ? 'border-orange-400' : 'border-[#2a4a7a]'
                        }`}
                      />
                    </td>
                    {/* Petite blinde (auto) */}
                    <td className="py-1.5 px-2 text-right text-[#a0aec0]">
                      <div className="flex items-center justify-end gap-1">
                        {hasError(idx, 'smallBlind') && <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />}
                        <span className={hasError(idx, 'smallBlind') ? 'text-orange-400' : ''}>
                          {level.smallBlind.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    {/* Ante */}
                    <td className="py-1.5 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="checkbox"
                          checked={level.ante > 0}
                          onChange={e => updateLevel(idx, { ante: e.target.checked ? Math.max(1, Math.floor(level.bigBlind * 0.1)) : 0 })}
                          className="accent-[#f4c842] cursor-pointer"
                        />
                        {level.ante > 0 && (
                          <input
                            type="number"
                            value={level.ante}
                            onChange={e => updateLevel(idx, { ante: Math.max(1, Number(e.target.value)) })}
                            min={1}
                            className={`w-20 bg-[#1a2d4a] border rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842] ${
                              hasError(idx, 'ante') ? 'border-orange-400' : 'border-[#2a4a7a]'
                            }`}
                          />
                        )}
                      </div>
                    </td>
                    {/* Durée */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={level.duration}
                        onChange={e => updateLevel(idx, { duration: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-16 bg-[#1a2d4a] border border-[#2a4a7a] rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842] ml-auto block"
                      />
                    </td>
                  </>
                )}

                {/* Delete */}
                <td className="py-1.5 px-1">
                  {structure.length > 1 && (
                    <button
                      onClick={() => removeLevel(idx)}
                      className="text-[#4a5568] hover:text-[#e74c3c] transition-colors p-1"
                      title="Supprimer ce niveau"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={addLevel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#2a4a7a] text-[#4a8fd4] hover:border-[#f4c842] hover:text-[#f4c842] transition-colors text-sm"
        >
          <Plus size={14} /> Ajouter un niveau
        </button>
        <button
          onClick={addBreak}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#6b2fa0]/50 text-[#9b59b6] hover:border-[#9b59b6] hover:text-[#c084fc] transition-colors text-sm"
        >
          <Coffee size={14} /> Ajouter une pause
        </button>
      </div>

      {/* Panneau d'analyse */}
      {(estimate || validationErrors.length > 0) && (
        <div className="mt-4 border border-[#2a4a7a] rounded-lg overflow-hidden">
          <button
            onClick={() => setAnalysisOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-2 bg-[#0d1b2a] text-[#4a8fd4] hover:text-[#f4c842] transition-colors text-sm font-semibold"
          >
            <span>📊 Analyse du tournoi</span>
            {analysisOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {analysisOpen && (
            <div className="p-4 bg-[#0a1520]">
              {/* Erreurs de validation */}
              {validationErrors.length > 0 && (
                <div className="flex items-center gap-2 text-orange-400 text-sm mb-3 p-2 bg-orange-400/10 rounded-lg border border-orange-400/30">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>
                    {validationErrors.length} valeur{validationErrors.length > 1 ? 's' : ''} non-multiple{validationErrors.length > 1 ? 's' : ''} du plus petit jeton ({smallestChip})
                  </span>
                </div>
              )}

              {/* Stats globales */}
              {estimate && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 text-center">
                    <div className="bg-[#1a2d4a] rounded-lg p-2">
                      <div className="text-xs text-[#a0aec0] mb-1">Durée totale</div>
                      <div className="text-[#f4c842] font-bold text-sm">{formatDuration(estimate.totalDurationMinutes)}</div>
                    </div>
                    <div className="bg-[#1a2d4a] rounded-lg p-2">
                      <div className="text-xs text-[#a0aec0] mb-1">Fin estimée</div>
                      <div className="text-[#4a8fd4] font-bold text-sm">Niv. {estimate.estimatedEndLevel + 1}</div>
                    </div>
                    <div className="bg-[#1a2d4a] rounded-lg p-2">
                      <div className="text-xs text-[#a0aec0] mb-1">Durée estimée</div>
                      <div className="text-[#4a8fd4] font-bold text-sm">{formatDuration(estimate.estimatedDurationMinutes)}</div>
                    </div>
                  </div>

                  {/* Tableau par niveau */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#4a8fd4] border-b border-[#2a4a7a]">
                          <th className="text-left py-1 px-2">Niv.</th>
                          <th className="text-right py-1 px-2">Durée</th>
                          <th className="text-right py-1 px-2">Joueurs restants est.</th>
                          <th className="text-right py-1 px-2">Orbites</th>
                          <th className="text-left py-1 px-2 w-24">Santé</th>
                        </tr>
                      </thead>
                      <tbody>
                        {estimate.levels.map((lv) => {
                          const level = structure[lv.levelIndex];
                          if (lv.isBreak) {
                            return (
                              <tr key={lv.levelIndex} className="border-b border-[#1a2d4a] text-[#9b59b6]">
                                <td className="py-1 px-2">{lv.levelIndex + 1}</td>
                                <td className="py-1 px-2 text-right">{level.duration}min</td>
                                <td colSpan={3} className="py-1 px-2 text-center tracking-widest">— PAUSE —</td>
                              </tr>
                            );
                          }
                          const m = lv.avgM;
                          const healthColor = m > 15 ? '#22c55e' : m > 8 ? '#f97316' : '#ef4444';
                          const healthWidth = Math.min(100, Math.max(5, (m / 30) * 100));
                          return (
                            <tr key={lv.levelIndex} className="border-b border-[#1a2d4a]">
                              <td className="py-1 px-2 text-[#4a8fd4]">{lv.levelIndex + 1}</td>
                              <td className="py-1 px-2 text-right text-[#a0aec0]">{level.duration}min</td>
                              <td className="py-1 px-2 text-right text-white">{lv.playersRemaining}</td>
                              <td className="py-1 px-2 text-right text-[#a0aec0]">
                                {m > 100 ? '>100' : m.toFixed(1)}
                              </td>
                              <td className="py-1 px-2">
                                <div className="h-2 bg-[#1a2d4a] rounded-full overflow-hidden w-20">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${healthWidth}%`, backgroundColor: healthColor }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!estimate && (
                <p className="text-[#4a5568] text-xs text-center py-2">
                  Ajoutez des joueurs pour voir l'estimation
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
