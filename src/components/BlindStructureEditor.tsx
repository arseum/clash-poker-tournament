import { Plus, Trash2, Coffee } from 'lucide-react';
import type { BlindLevel } from '../types';

interface Props {
  structure: BlindLevel[];
  onChange: (structure: BlindLevel[]) => void;
}

function recalcLevels(levels: BlindLevel[]): BlindLevel[] {
  return levels.map((l, i) => ({ ...l, level: i + 1 }));
}

export function BlindStructureEditor({ structure, onChange }: Props) {
  const updateLevel = (idx: number, patch: Partial<BlindLevel>) => {
    const updated = structure.map((l, i) => {
      if (i !== idx) return l;
      const next = { ...l, ...patch };
      // Auto-calc small blind when big blind changes
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
                        className="w-24 bg-[#1a2d4a] border border-[#2a4a7a] rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842] ml-auto block"
                      />
                    </td>
                    {/* Petite blinde (auto) */}
                    <td className="py-1.5 px-2 text-right text-[#a0aec0]">
                      {level.smallBlind.toLocaleString()}
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
                            className="w-20 bg-[#1a2d4a] border border-[#2a4a7a] rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842]"
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
    </div>
  );
}
