## Architecture du projet — Poker Royale

> **LIS CETTE SECTION EN PREMIER.** Elle évite de rescanner le projet à chaque session.

### Stack
- React 19 + TypeScript 5 + Vite 8
- Tailwind CSS 4 (via `@import "tailwindcss"` dans `index.css`, pas de `tailwind.config.js`)
- Zustand 5 (state management + persistence localStorage)
- Lucide React (icônes)

### Arborescence clé
```
src/
  main.tsx              — entry point. Si ?display → DisplayPage, sinon App
  App.tsx               — routing (setup/tournament/tables/history) + fond thématique
  index.css             — @theme Tailwind + CSS variables thèmes + animations

  contexts/
    ThemeContext.tsx     — ThemeProvider, useTheme(), THEMES, THEME_LABELS
                          Thèmes : 'default' (Poker Night) | 'supercell' (CoC/CR)
                          Stocké dans localStorage 'poker-theme'
                          Applique data-theme sur <html>, synchro storage events (TV display)

  components/
    Navigation.tsx       — nav bar + sélecteur de thème (icône Palette)
    ui/CRButton.tsx      — bouton (variants: gold/blue/red/green/ghost), border-radius via --theme-btn-radius
    ui/CRCard.tsx        — carte (prop gold= → .card-gold-glow), classe .cr-card-bg (texture)
    ui/CRInput.tsx       — input stylisé
    ui/CRBadge.tsx       — badge (variants: gold/blue/red/green/purple)
    BlindStructureEditor.tsx
    PrizePoolSetupCard.tsx
    EndTournamentOverlay.tsx

  pages/
    SetupPage.tsx        — config tournoi, joueurs, blindes, prize pool
    TournamentPage.tsx   — timer live, niveaux, éliminations
    TablesPage.tsx       — assignation des tables
    HistoryPage.tsx      — historique des tournois
    DisplayPage.tsx      — écran TV (?display). Theme-aware :
                            default = fond feutre vert + ♠ watermark
                            supercell = arena1.jpg + overlay chaud

  store/
    tournamentStore.ts   — Zustand, clé localStorage 'poker-tournament-state'
    historyStore.ts      — Zustand, clé localStorage 'poker-history-state'

  hooks/useTimer.ts      — timer avec correction de dérive
  utils/prizePool.ts     — calcul prize pool (auto/paliers/manual)
  types.ts               — tous les types TypeScript
  constants.ts           — defaultBlindStructure, formatChips(), formatTime()
```

### Système de thèmes
- CSS variables définies dans `@theme {}` (valeurs par défaut)
- Surchargées dans `[data-theme="supercell"] {}` au runtime
- Classes Tailwind `bg-cr-gold`, `text-cr-blue-mid`, etc. réagissent automatiquement
- Variables clés : `--color-cr-gold`, `--color-cr-blue-mid`, `--color-cr-card`, `--color-cr-darker`, `--color-cr-card-border`
- Variables extra (hors Tailwind) : `--theme-heading-font`, `--theme-overlay-color`, `--theme-gold-glow`, `--theme-btn-radius`
- Supercell : font Lilita One, buttons pill (radius 9999px), palette chaude orange/brun
- **NE PAS** utiliser de hex hardcodés dans les nouveaux composants — utiliser `bg-cr-gold` etc.

### Conventions importantes
- Composants UI préfixés `CR*` (CRButton, CRCard, etc.)
- Pages reçoivent `onNavigate: (page: Page) => void`
- `DisplayPage` se synchronise avec la fenêtre principale via `storage` events localStorage
- Assets arènes : `/public/arenas/arena1.jpg` (seul fichier existant pour l'instant)
- Pas de tests automatisés — vérifier manuellement avec `npm run build` puis `npm run dev`

---

## Orchestration du flux de travail
### 1. Planification par défaut du nœud

- Activez le mode planification pour TOUTE tâche non triviale (3 étapes ou plus, ou décisions architecturales).
- En cas d'imprévu, ARRÊTEZ et replanifiez immédiatement ; n'insistez pas.
- Utilisez le mode planification pour les étapes de vérification, et pas seulement pour la construction.
- Rédigez des spécifications détaillées en amont pour réduire l'ambiguïté.
### 2. Stratégie des sous-agents
- Utilisez les sous-agents de manière judicieuse pour garder la fenêtre principale propre.
- Déchargez la recherche, l'exploration et l'analyse parallèle sur les sous-agents.
- Pour les problèmes complexes, allouez davantage de ressources de calcul via les sous-agents.

- Une tâche par sous-agent pour une exécution ciblée.
### 3. Boucle d'auto-amélioration
- Après TOUTE correction de l'utilisateur : mettez à jour « tasks/lessons.md » avec le modèle.
- Établissez des règles pour éviter de reproduire la même erreur.
- Itérez sans relâche sur ces leçons jusqu'à ce que le taux d'erreur diminue.

- Revoyez les leçons au début de la session pour le projet concerné.
### 4. Vérification avant la validation
- Ne marquez jamais une tâche comme terminée sans avoir prouvé son bon fonctionnement.
- Différence de comportement. Entre le code principal et vos modifications, le cas échéant
- Demandez-vous : « Un ingénieur senior approuverait-il cela ? »

- Exécutez les tests, vérifiez les journaux, démontrez la correction
### 5. Exiger l'élégance (équilibré)
- Pour les modifications importantes : faites une pause et demandez-vous : « Existe-t-il une solution plus élégante ? »

- Si une correction semble bricolée : « Maintenant que je sais tout, j'implémente la solution élégante. »

- Ignorez cette étape pour les corrections simples et évidentes ; ne sur-ingénierez pas.
- Remettez en question votre propre travail avant de le présenter.
### 6. Correction autonome des bogues
- Lorsqu'un rapport de bogue vous est fourni : corrigez-le simplement. Ne demandez pas d'assistance.

- Indiquez les journaux, les erreurs, les tests en échec, puis résolvez-les.

- Aucune modification du contexte n'est requise de la part de l'utilisateur.

- Corrigez les tests d'intégration continue en échec sans qu'on vous dise comment faire.
## Gestion des tâches

1. **Planifier d'abord** : Rédigez un plan dans « tasks/todo.md » avec des éléments cochables.

2. **Vérifier le plan** : Enregistrez-le avant de commencer l'implémentation.

3. **Suivre** Progression : Marquez les éléments comme terminés au fur et à mesure.

4. Explication des modifications : Résumé à chaque étape.

5. Documentation des résultats : Ajoutez une section de révision à « tasks/todo.md ».

6. Retour d’expérience : Mettez à jour « tasks/lessons.md » après les corrections.

## Principes fondamentaux
- **La simplicité avant tout** : Simplifiez au maximum chaque modification. Impact minimal sur le code.

- **Exigence de la qualité** : Identifiez les causes profondes. Pas de solutions temporaires. Respectez les standards des développeurs expérimentés.

- **Impact minimal** : Les modifications ne doivent concerner que le nécessaire. Évitez d’introduire des bogues.