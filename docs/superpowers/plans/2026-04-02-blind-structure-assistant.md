# Blind Structure Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter validation des blindes, estimation mathématique durée/joueurs et config re-entry au BlindStructureEditor.

**Architecture:** Logique pure dans `tournamentEstimator.ts`, nouveaux champs dans `TournamentConfig`, UI intégrée dans `BlindStructureEditor` avec panneau collapsible, inputs dans `SetupPage`.

**Tech Stack:** React 19, TypeScript 5, Tailwind CSS 4, Zustand 5

---

### Task 1: Nouveaux types dans types.ts

**Files:**
- Modify: `src/types.ts`

- [ ] **Step 1: Ajouter les champs à TournamentConfig**

Dans `src/types.ts`, remplacer l'interface `TournamentConfig` :
```ts
export interface ReEntryConfig {
  maxLevel: number;      // dernier niveau autorisé (1-indexed)
  maxPerPlayer: number;  // 0 = illimité
}

export interface TournamentConfig {
  name: string;
  buyIn: number;
  startingStack: number;
  maxPlayersPerTable: number;
  blindStructure: BlindLevel[];
  prizePool: PrizePoolConfig;
  smallestChip: number;          // valeur du plus petit jeton
  reEntry: ReEntryConfig | null; // null = pas de re-entry
}
```

- [ ] **Step 2: Vérifier que TypeScript compile**
```bash
cd /Users/amaitre/prive/1_PERSO/projet/poker-tournament && npm run build 2>&1 | head -30
```
Attendu : erreurs sur SetupPage (config manquants) — normal, on les corrige dans Task 3.

- [ ] **Step 3: Commit**
```bash
git add src/types.ts && git commit -m "feat: add smallestChip and reEntry to TournamentConfig"
```

---

### Task 2: Utilitaire tournamentEstimator.ts

**Files:**
- Create: `src/utils/tournamentEstimator.ts`

- [ ] **Step 1: Créer le fichier**

```ts
import type { BlindLevel, ReEntryConfig } from '../types';

export interface BlindValidationError {
  levelIndex: number;
  field: 'smallBlind' | 'bigBlind' | 'ante';
  value: number;
}

export interface LevelEstimate {
  levelIndex: number;
  isBreak: boolean;
  playersRemaining: number;
  avgM: number;
}

export interface TournamentEstimate {
  totalDurationMinutes: number;
  estimatedEndLevel: number; // index (0-based)
  estimatedDurationMinutes: number; // jusqu'à la fin estimée
  levels: LevelEstimate[];
}

/**
 * Retourne les valeurs de blindes non-multiples du plus petit jeton.
 */
export function validateBlindStructure(
  structure: BlindLevel[],
  smallestChip: number
): BlindValidationError[] {
  if (smallestChip <= 0) return [];
  const errors: BlindValidationError[] = [];
  structure.forEach((level, idx) => {
    if (level.isBreak) return;
    if (level.smallBlind % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'smallBlind', value: level.smallBlind });
    if (level.bigBlind % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'bigBlind', value: level.bigBlind });
    if (level.ante > 0 && level.ante % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'ante', value: level.ante });
  });
  return errors;
}

/**
 * Estime la durée et le nombre de joueurs restants par niveau.
 * Modèle basé sur le M-ratio (Paul Magriel) avec décroissance exponentielle.
 */
export function estimateTournament(
  structure: BlindLevel[],
  playerCount: number,
  startingStack: number,
  maxPlayersPerTable: number,
  reEntry: ReEntryConfig | null,
  handsPerHour = 25
): TournamentEstimate {
  if (playerCount < 2 || startingStack <= 0 || structure.length === 0) {
    return {
      totalDurationMinutes: structure.reduce((s, l) => s + l.duration, 0),
      estimatedEndLevel: structure.length - 1,
      estimatedDurationMinutes: structure.reduce((s, l) => s + l.duration, 0),
      levels: [],
    };
  }

  // Suivi du re-entry : combien chaque joueur a utilisé ses re-entries
  const reEntriesUsed = new Array(playerCount).fill(0);
  let totalReEntries = 0;

  let totalChips = playerCount * startingStack;
  let playersRemaining = playerCount;
  const levels: LevelEstimate[] = [];

  // Niveau estimé de fin = quand playersRemaining <= 1
  let estimatedEndLevel = structure.length - 1;
  let estimatedDurationMinutes = 0;
  let cumulativeDuration = 0;

  for (let i = 0; i < structure.length; i++) {
    const level = structure[i];
    cumulativeDuration += level.duration;

    if (level.isBreak) {
      levels.push({ levelIndex: i, isBreak: true, playersRemaining, avgM: 0 });
      continue;
    }

    const roundCost = level.smallBlind + level.bigBlind + level.ante;
    if (roundCost === 0) {
      levels.push({ levelIndex: i, isBreak: false, playersRemaining, avgM: 999 });
      continue;
    }

    const avgStack = totalChips / playersRemaining;
    const avgM = avgStack / roundCost;
    const playersAtTable = Math.min(maxPlayersPerTable, playersRemaining);
    const handsInLevel = (level.duration * handsPerHour) / 60;

    // Taux de survie : e^(-mains / (M * joueurs_à_table))
    const survivalRate = Math.exp(-handsInLevel / (avgM * playersAtTable));
    const newPlayers = Math.max(1, Math.round(playersRemaining * survivalRate));
    const eliminated = playersRemaining - newPlayers;

    // Re-entry : ajouter des chips pour les éliminés qui peuvent re-enter
    if (reEntry && i < reEntry.maxLevel) {
      let reEnterers = 0;
      for (let p = 0; p < eliminated; p++) {
        const playerIdx = p % playerCount;
        const maxRe = reEntry.maxPerPlayer === 0 ? Infinity : reEntry.maxPerPlayer;
        if (reEntriesUsed[playerIdx] < maxRe) {
          reEntriesUsed[playerIdx]++;
          reEnterers++;
          totalReEntries++;
        }
      }
      totalChips += reEnterers * startingStack;
    }

    levels.push({ levelIndex: i, isBreak: false, playersRemaining: newPlayers, avgM });

    if (playersRemaining > 1 && newPlayers <= 1) {
      estimatedEndLevel = i;
      estimatedDurationMinutes = cumulativeDuration;
    }

    playersRemaining = newPlayers;
  }

  if (estimatedDurationMinutes === 0) {
    estimatedDurationMinutes = cumulativeDuration;
    estimatedEndLevel = structure.length - 1;
  }

  const totalDurationMinutes = structure.reduce((s, l) => s + l.duration, 0);

  return {
    totalDurationMinutes,
    estimatedEndLevel,
    estimatedDurationMinutes,
    levels,
  };
}
```

- [ ] **Step 2: Vérifier le build**
```bash
cd /Users/amaitre/prive/1_PERSO/projet/poker-tournament && npm run build 2>&1 | head -30
```

- [ ] **Step 3: Commit**
```bash
git add src/utils/tournamentEstimator.ts && git commit -m "feat: add tournamentEstimator utility (M-ratio model)"
```

---

### Task 3: Mise à jour SetupPage (nouveaux inputs + valeurs par défaut)

**Files:**
- Modify: `src/pages/SetupPage.tsx`

- [ ] **Step 1: Ajouter smallestChip et reEntry aux valeurs initiales**

Dans `SetupPage.tsx`, modifier l'état initial `config` :
```ts
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
```

- [ ] **Step 2: Ajouter les inputs dans la carte Configuration**

Après le champ `maxPlayersPerTable`, ajouter dans la CRCard "Configuration" :

```tsx
{/* Plus petit jeton */}
<CRInput
  label="Plus petit jeton"
  type="number"
  value={config.smallestChip}
  onChange={e => setConfig(c => ({ ...c, smallestChip: Math.max(1, Number(e.target.value)) }))}
  min={1}
/>

{/* Re-entry */}
<div className="flex flex-col gap-2">
  <label className="text-sm text-[#a0aec0] font-medium">Re-entry</label>
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      id="reentry-toggle"
      checked={config.reEntry !== null}
      onChange={e => setConfig(c => ({
        ...c,
        reEntry: e.target.checked ? { maxLevel: 4, maxPerPlayer: 1 } : null,
      }))}
      className="accent-[#f4c842] cursor-pointer w-4 h-4"
    />
    <label htmlFor="reentry-toggle" className="text-sm text-[#e8e8e8] cursor-pointer">
      Autoriser le re-entry
    </label>
  </div>
  {config.reEntry && (
    <div className="grid grid-cols-2 gap-3 pl-1">
      <CRInput
        label="Jusqu'au niveau"
        type="number"
        value={config.reEntry.maxLevel}
        onChange={e => setConfig(c => ({
          ...c,
          reEntry: c.reEntry ? { ...c.reEntry, maxLevel: Math.max(1, Number(e.target.value)) } : null,
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
          reEntry: c.reEntry ? { ...c.reEntry, maxPerPlayer: Math.max(0, Number(e.target.value)) } : null,
        }))}
        min={0}
      />
    </div>
  )}
</div>
```

- [ ] **Step 3: Passer les props au BlindStructureEditor**

Modifier le composant BlindStructureEditor dans SetupPage :
```tsx
<BlindStructureEditor
  structure={config.blindStructure}
  onChange={bs => setConfig(c => ({ ...c, blindStructure: bs }))}
  playerCount={validPlayers.length}
  startingStack={config.startingStack}
  maxPlayersPerTable={config.maxPlayersPerTable}
  smallestChip={config.smallestChip}
  reEntry={config.reEntry}
/>
```

- [ ] **Step 4: Vérifier le build**
```bash
cd /Users/amaitre/prive/1_PERSO/projet/poker-tournament && npm run build 2>&1 | head -30
```

- [ ] **Step 5: Commit**
```bash
git add src/pages/SetupPage.tsx && git commit -m "feat: add smallestChip and reEntry inputs to SetupPage"
```

---

### Task 4: Mise à jour BlindStructureEditor (validation + panneau analyse)

**Files:**
- Modify: `src/components/BlindStructureEditor.tsx`

- [ ] **Step 1: Ajouter les imports et props**

```tsx
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
```

- [ ] **Step 2: Ajouter la logique de validation et d'estimation dans le composant**

Dans `BlindStructureEditor`, après la définition de `recalcLevels`, ajouter :

```tsx
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
```

- [ ] **Step 3: Ajouter la mise en évidence des erreurs dans les cellules du tableau**

Dans les cellules `input` du tableau, ajouter une classe conditionnelle pour l'orange sur les champs en erreur.

Pour la cellule Grande blinde (`bigBlind`) :
```tsx
className={`w-24 bg-[#1a2d4a] border rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842] ml-auto block ${
  hasError(idx, 'bigBlind') ? 'border-orange-400' : 'border-[#2a4a7a]'
}`}
```

Pour la cellule Petite blinde (affichage texte), wrapper dans un `<div className="flex items-center justify-end gap-1">` :
```tsx
<td className="py-1.5 px-2 text-right text-[#a0aec0]">
  <div className="flex items-center justify-end gap-1">
    {hasError(idx, 'smallBlind') && <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />}
    <span className={hasError(idx, 'smallBlind') ? 'text-orange-400' : ''}>{level.smallBlind.toLocaleString()}</span>
  </div>
</td>
```

Pour l'ante input :
```tsx
className={`w-20 bg-[#1a2d4a] border rounded px-2 py-1 text-white text-sm text-right focus:outline-none focus:border-[#f4c842] ${
  hasError(idx, 'ante') ? 'border-orange-400' : 'border-[#2a4a7a]'
}`}
```

- [ ] **Step 4: Ajouter le panneau d'analyse collapsible après les boutons Ajouter**

Après le `<div className="flex gap-2 mt-3">` des boutons, ajouter :

```tsx
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
          <div className="flex items-center gap-2 text-orange-400 text-sm mb-3">
            <AlertTriangle size={14} />
            <span>
              {validationErrors.length} valeur{validationErrors.length > 1 ? 's' : ''} non-multiple{validationErrors.length > 1 ? 's' : ''} du plus petit jeton ({smallestChip})
            </span>
          </div>
        )}

        {/* Stats globales */}
        {estimate && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4 text-center">
              <div className="bg-[#1a2d4a] rounded-lg p-2">
                <div className="text-xs text-[#a0aec0] mb-1">Durée totale</div>
                <div className="text-[#f4c842] font-bold">
                  {Math.floor(estimate.totalDurationMinutes / 60)}h{String(estimate.totalDurationMinutes % 60).padStart(2, '0')}
                </div>
              </div>
              <div className="bg-[#1a2d4a] rounded-lg p-2">
                <div className="text-xs text-[#a0aec0] mb-1">Fin estimée</div>
                <div className="text-[#4a8fd4] font-bold">Niv. {estimate.estimatedEndLevel + 1}</div>
              </div>
              <div className="bg-[#1a2d4a] rounded-lg p-2">
                <div className="text-xs text-[#a0aec0] mb-1">Durée estimée</div>
                <div className="text-[#4a8fd4] font-bold">
                  {Math.floor(estimate.estimatedDurationMinutes / 60)}h{String(estimate.estimatedDurationMinutes % 60).padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Tableau par niveau */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[#4a8fd4] border-b border-[#2a4a7a]">
                    <th className="text-left py-1 px-2">Niv.</th>
                    <th className="text-right py-1 px-2">Durée</th>
                    <th className="text-right py-1 px-2">Joueurs est.</th>
                    <th className="text-right py-1 px-2">M moyen</th>
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
                        <td className="py-1 px-2 text-right text-[#a0aec0]">{m > 100 ? '>100' : m.toFixed(1)}</td>
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
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: Vérifier le build**
```bash
cd /Users/amaitre/prive/1_PERSO/projet/poker-tournament && npm run build 2>&1 | head -50
```
Attendu : aucune erreur TypeScript.

- [ ] **Step 6: Commit**
```bash
git add src/components/BlindStructureEditor.tsx && git commit -m "feat: add blind validation and tournament analysis panel to BlindStructureEditor"
```

---

### Task 5: Vérification finale

- [ ] **Step 1: Build propre**
```bash
cd /Users/amaitre/prive/1_PERSO/projet/poker-tournament && npm run build 2>&1
```
Attendu : `✓ built in Xs` sans erreurs.

- [ ] **Step 2: Vérifier manuellement**
```bash
cd /Users/amaitre/prive/1_PERSO/projet/poker-tournament && npm run dev
```
Vérifier :
- Les nouveaux inputs "Plus petit jeton" et "Re-entry" apparaissent dans la carte Configuration
- Avec 8 joueurs remplis, le panneau "Analyse du tournoi" apparaît sous l'éditeur
- Les valeurs non-multiples du plus petit jeton sont surlignées en orange
- Les statistiques (durée totale, fin estimée) sont cohérentes

- [ ] **Step 3: Commit final si ajustements**
```bash
git add -p && git commit -m "fix: blind structure assistant adjustments"
```
