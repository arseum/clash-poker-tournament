# Design : Auto-calcul des blindes avec durée de niveau configurable

## Contexte

L'algo actuel (`generateBlindStructure`) génère toujours 12 niveaux de jeu fixes et adapte la durée de chaque niveau en fonction de la durée totale souhaitée. L'utilisateur ne peut pas contrôler la granularité du tournoi (niveaux courts et nombreux vs. longs et peu nombreux).

## Objectif

Permettre à l'utilisateur de fixer **deux paramètres** :
- La **durée totale** du tournoi (heures)
- La **durée d'un niveau** (minutes)

Le **nombre de niveaux** est alors calculé automatiquement.

## Algorithme (`generateBlindStructure`)

### Signature

```ts
generateBlindStructure(
  startingStack: number,
  smallestChip: number,
  targetDurationMinutes: number,
  levelDurationMinutes: number  // nouveau paramètre, default: 20
): BlindLevel[]
```

### Calcul du nombre de niveaux

Les pauses durent 15 min et sont insérées tous les 4 niveaux de jeu. On résout en une itération :

```
nbBreaks = floor(nbLevels / 4)        // estimation initiale sans pauses
nbLevels_initial = round(targetMinutes / levelDuration)
nbBreaks = floor(nbLevels_initial / 4)
nbLevels = round((targetMinutes - nbBreaks * 15) / levelDuration)
nbLevels = clamp(nbLevels, 4, 24)
```

### Placement des pauses

Une pause est insérée après chaque tranche de 4 niveaux de jeu (après le 4e, le 8e, le 12e, etc.).

### Progression des blindes

Inchangée : BB de départ ≈ 1% du stack, progression ×1.5 par niveau, arrondie au plus petit jeton. Antes à partir du niveau 7.

## UI (`SetupPage`)

Quand `autoCalcState === 'input'`, afficher deux inputs côte à côte :

| Input | Type | Défaut | Min | Max |
|-------|------|--------|-----|-----|
| Durée totale | number (h) | 3 | 0.5 | 12 |
| Durée d'un niveau | number (min) | 20 | 5 | 60 |

Le bouton **Go** passe les deux valeurs à `generateBlindStructure`.

Ajouter un state `targetLevelMinutes` (défaut 20) dans `SetupPage`.

## Exemples attendus

| Durée totale | Durée/niveau | Niveaux calculés | Pauses |
|-------------|-------------|-----------------|--------|
| 3h (180 min) | 20 min | 8 | 2 (après 4, 8) |
| 3h (180 min) | 10 min | 15 | 3 (après 4, 8, 12) |
| 2h (120 min) | 15 min | 7 | 1 (après 4) |
| 4h (240 min) | 25 min | 9 | 2 (après 4, 8) |

## Fichiers modifiés

- `src/utils/tournamentEstimator.ts` — ajout du paramètre `levelDurationMinutes`, refactoring du calcul
- `src/pages/SetupPage.tsx` — ajout du state `targetLevelMinutes`, second input dans le panneau auto-calcul
