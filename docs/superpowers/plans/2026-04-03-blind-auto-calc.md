# Blind Auto-Calc — Durée par niveau configurable

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'utilisateur de fixer la durée d'un niveau lors de l'auto-calcul des blindes, le nombre de niveaux étant alors calculé automatiquement.

**Architecture:** Ajout d'un paramètre `levelDurationMinutes` à `generateBlindStructure` dans `tournamentEstimator.ts`. Le nombre de niveaux est dérivé des deux inputs (durée totale + durée/niveau) avec placement de pauses tous les 4 niveaux. L'UI `SetupPage` expose le second input à côté du premier.

**Tech Stack:** TypeScript, React 19, pas de tests automatisés — vérification manuelle via `npm run build && npm run dev`.

---

### Task 1 : Mettre à jour `generateBlindStructure` dans `tournamentEstimator.ts`

**Files:**
- Modify: `src/utils/tournamentEstimator.ts:1-54`

- [ ] **Step 1 : Remplacer la signature et le corps de `generateBlindStructure`**

Remplacer la fonction existante (lignes 11–54) par :

```ts
/**
 * Génère une structure de blindes automatique.
 * - BB de départ ≈ 1% du stack, arrondi au plus petit jeton
 * - Progression x1.5 par niveau, arrondie au plus petit jeton
 * - Pauses de 15 min insérées après chaque tranche de 4 niveaux de jeu
 * - Antes à partir du niveau 7 (≈ 10% de la BB)
 *
 * @param levelDurationMinutes  Durée souhaitée par niveau (défaut 20 min)
 */
export function generateBlindStructure(
  startingStack: number,
  smallestChip: number,
  targetDurationMinutes = 180,
  levelDurationMinutes = 20
): BlindLevel[] {
  const chip = Math.max(1, smallestChip);
  const roundTo = (n: number) => Math.max(chip, Math.round(n / chip) * chip);
  const lvDur = Math.max(5, Math.round(levelDurationMinutes));

  // Calcul du nombre de niveaux de jeu (une itération pour tenir compte des pauses)
  const approxLevels = Math.round(targetDurationMinutes / lvDur);
  const nbBreaks = Math.floor(approxLevels / 4);
  const GAME_LEVELS = Math.min(24, Math.max(4, Math.round((targetDurationMinutes - nbBreaks * 15) / lvDur)));

  const startBB = roundTo(startingStack * 0.01);
  const result: BlindLevel[] = [];
  let gameLevel = 0;

  for (let i = 0; i < GAME_LEVELS; i++) {
    const bb = roundTo(startBB * Math.pow(1.5, i));
    const sb = roundTo(bb / 2);
    const ante = i >= 6 ? roundTo(bb * 0.1) : 0;

    result.push({
      level: result.length + 1,
      smallBlind: sb,
      bigBlind: bb,
      ante,
      duration: lvDur,
    });
    gameLevel++;

    if (gameLevel % 4 === 0 && gameLevel < GAME_LEVELS) {
      result.push({
        level: result.length + 1,
        smallBlind: 0,
        bigBlind: 0,
        ante: 0,
        duration: 15,
        isBreak: true,
      });
    }
  }

  return result;
}
```

- [ ] **Step 2 : Vérifier le build**

```bash
npm run build
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 3 : Commit**

```bash
git add src/utils/tournamentEstimator.ts
git commit -m "feat: generateBlindStructure accepte levelDurationMinutes, nb niveaux calculé auto"
```

---

### Task 2 : Mettre à jour l'UI dans `SetupPage.tsx`

**Files:**
- Modify: `src/pages/SetupPage.tsx`

- [ ] **Step 1 : Ajouter le state `targetLevelMinutes`**

Après la ligne `const [targetHours, setTargetHours] = useState(3);` (ligne ~37), ajouter :

```ts
const [targetLevelMinutes, setTargetLevelMinutes] = useState(20);
```

- [ ] **Step 2 : Passer `targetLevelMinutes` à `generateBlindStructure`**

Dans `handleAutoCalcGo`, remplacer :

```ts
setConfig(c => ({ ...c, blindStructure: generateBlindStructure(c.startingStack, c.smallestChip, targetMinutes) }));
```

par :

```ts
setConfig(c => ({ ...c, blindStructure: generateBlindStructure(c.startingStack, c.smallestChip, targetMinutes, targetLevelMinutes) }));
```

- [ ] **Step 3 : Ajouter le second input dans le panneau auto-calcul**

Dans le bloc `{autoCalcState === 'input' && (...)}`, ajouter le second input juste après l'input de durée totale (après le `<span>h</span>`) et avant le bouton Go :

```tsx
{autoCalcState === 'input' && (
  <>
    <span className="text-[#a0aec0] text-sm flex-shrink-0">Durée totale</span>
    <input
      type="number"
      value={targetHours}
      onChange={e => setTargetHours(Math.max(0.5, Math.min(12, Number(e.target.value))))}
      min={0.5}
      max={12}
      step={0.5}
      className="w-20 bg-[#1a2d4a] border border-[#f4c842]/50 rounded px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-[#f4c842]"
      placeholder="3"
      autoFocus
    />
    <span className="text-[#a0aec0] text-sm flex-shrink-0">h</span>
    <span className="text-[#a0aec0] text-sm flex-shrink-0">·</span>
    <input
      type="number"
      value={targetLevelMinutes}
      onChange={e => setTargetLevelMinutes(Math.max(5, Math.min(60, Number(e.target.value))))}
      min={5}
      max={60}
      step={5}
      className="w-20 bg-[#1a2d4a] border border-[#f4c842]/50 rounded px-2 py-1.5 text-white text-sm text-center focus:outline-none focus:border-[#f4c842]"
      placeholder="20"
    />
    <span className="text-[#a0aec0] text-sm flex-shrink-0">min/niv.</span>
    <button
      onClick={handleAutoCalcGo}
      className="px-3 py-1.5 rounded-lg bg-[#f4c842] text-[#0a1520] font-bold text-sm hover:bg-[#f4c842]/90 transition-colors"
    >
      Go
    </button>
    <button
      onClick={() => setAutoCalcState('idle')}
      className="text-[#4a5568] hover:text-[#e74c3c] transition-colors text-lg leading-none px-1"
      title="Annuler"
    >
      ✕
    </button>
  </>
)}
```

Note : ce bloc **remplace entièrement** le bloc `{autoCalcState === 'input' && (...)}` existant dans `SetupPage.tsx` (lignes ~285–313).

- [ ] **Step 4 : Vérifier le build**

```bash
npm run build
```

Attendu : aucune erreur TypeScript.

- [ ] **Step 5 : Vérification manuelle**

```bash
npm run dev
```

Scénarios à tester :
1. Cliquer sur ⚡ Auto-calcul → deux inputs apparaissent côte à côte
2. Laisser 3h + 20min/niv → Go → structure avec ~8 niveaux de jeu générée
3. Mettre 3h + 10min/niv → Go → structure avec ~15 niveaux
4. Mettre 2h + 15min/niv → Go → structure avec ~7 niveaux, 1 pause après le 4e

- [ ] **Step 6 : Commit**

```bash
git add src/pages/SetupPage.tsx
git commit -m "feat: ajouter input durée/niveau dans le panneau auto-calcul des blindes"
```
