# Design : Assistant Structure des Blindes

## Objectif
Améliorer le `BlindStructureEditor` avec des outils d'aide : validation des blindes vs plus petit jeton, estimation mathématique de la durée du tournoi et du nombre de joueurs restants par niveau, configuration du re-entry.

## Nouveaux inputs (dans TournamentConfig)
- `smallestChip: number` — valeur du plus petit jeton (défaut: 25)
- `reEntry: { maxLevel: number; maxPerPlayer: number } | null` — config re-entry (null = désactivé)

Ces inputs sont placés dans la carte "Configuration" de SetupPage.

## Validation des blindes
Les valeurs SB/BB/ante qui ne sont pas multiples de `smallestChip` sont surlignées en orange dans le tableau.

## Modèle mathématique (M-ratio)
```
coûtOrbite(L) = SB + BB + ante
avgM(L) = totalChips / (joueursRestants × coûtOrbite(L))
mains(L) = durée(L) × 25 / 60
survivalRate(L) = e^(-mains(L) / (avgM(L) × joueurs_à_table))
joueursRestants(L+1) = max(1, round(joueursRestants(L) × survivalRate(L)))
```
Re-entry : si L ≤ reEntry.maxLevel, les chips des éliminés reviennent dans le jeu (limité par maxPerPlayer).

## UI : bloc "Analyse" collapsible sous le tableau
- Durée totale (somme de toutes les durées)
- Niveau de fin estimé + durée effective
- Tableau : niveau | durée | joueurs estimés | M moyen | barre de santé (vert/orange/rouge)
- Les pauses ne comptent pas dans l'estimation des joueurs

## Architecture
- `src/utils/tournamentEstimator.ts` — logique pure (validation + estimation)
- `src/types.ts` — ajout des nouveaux champs
- `src/components/BlindStructureEditor.tsx` — UI validation + panneau analyse
- `src/pages/SetupPage.tsx` — nouveaux inputs + transmission des props
