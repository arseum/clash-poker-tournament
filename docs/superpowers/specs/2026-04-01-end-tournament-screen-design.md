# Spec — Écran de fin de tournoi (top 3 uniquement)

**Date :** 2026-04-01
**Statut :** Approuvé

---

## Contexte

L'`EndTournamentOverlay` actuel affiche le podium top 3 puis tous les autres joueurs en badges. Avec un grand nombre de joueurs (ex. 1500), le rendu de tous ces badges cause des problèmes de performance. De plus, la `DisplayPage` (écran TV) ne dispose d'aucun écran de fin de tournoi.

---

## Objectif

- Afficher uniquement le top 3 (podium) à la fin du tournoi
- Montrer le gain (€) de chaque joueur du podium
- Couvrir les deux surfaces : interface de contrôle (overlay) et écran TV
- Animations thème-aware : thème default → podium classique, thème supercell → podium + particules dorées

---

## Changements par fichier

### `src/types.ts`
Ajouter `isEnded?: boolean` à l'interface `TournamentState`.

### `src/store/tournamentStore.ts`
Dans `endTournament()` : setter `isEnded: true` en plus de `isRunning: false, isPaused: false`.

### `src/components/EndTournamentOverlay.tsx`
- **Supprimer** la section "reste du classement" (badges 4ème et au-delà)
- **Ajouter** le montant du gain € sous le nom de chaque joueur du podium
- **Animations thème-aware :**
  - `default` : chaque carte monte depuis le bas (`translateY`) avec délai décalé (3ème → 2ème → 1er)
  - `supercell` : idem + particules CSS dorées/orangées qui flottent en arrière-plan (éléments `<div>` absolus animés avec `@keyframes`)
- Utiliser `useTheme()` pour conditionner les animations

### `src/pages/DisplayPage.tsx`
- Détecter `tournament.isEnded === true`
- Quand vrai : remplacer tout le contenu par un composant `EndScreenTV`
- `EndScreenTV` : même logique que `EndTournamentOverlay` (podium top 3 + gains), mais tailles adaptées TV (fontes et cartes beaucoup plus grandes, plein écran)
- Pas de bouton "Clôturer" sur la TV (c'est l'interface de contrôle qui gère ça)
- Le fond reste celui du thème en cours (feutre vert ou arène)

---

## Calcul des gains

Utiliser `calculatePrizes()` de `src/utils/prizePool.ts` (déjà utilisé dans `DisplayPage`).
Récupérer le montant correspondant à la position 1, 2, 3 et l'afficher sous le nom du joueur.

---

## Contraintes

- Aucune nouvelle librairie — animations 100% CSS (`@keyframes` dans `index.css`)
- Perf : zéro rendu de joueurs hors top 3
- La `DisplayPage` se synchronise déjà via `storage` events localStorage — aucun mécanisme supplémentaire nécessaire

---

## Ce qui n'est PAS dans le scope

- Afficher les joueurs 4ème et au-delà (supprimé volontairement)
- Son ou musique
- Partage / export du classement
