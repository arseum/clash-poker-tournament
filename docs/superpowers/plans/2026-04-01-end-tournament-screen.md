# End Tournament Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher un écran de fin de tournoi top-3 uniquement (podium + gains €), sur l'interface de contrôle et sur l'écran TV, avec animations thème-aware.

**Architecture:** Ajout d'un flag `isEnded` dans le store Zustand propagé par localStorage vers la `DisplayPage`. L'`EndTournamentOverlay` est simplifié (suppression des badges 4ème+, ajout des gains). Un nouveau composant `EndScreenTV` est ajouté dans `DisplayPage.tsx` pour l'écran TV.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Zustand 5, CSS keyframes (aucune lib supplémentaire)

---

## Fichiers modifiés

| Fichier | Action |
|---|---|
| `src/types.ts` | Modifier — ajouter `isEnded?: boolean` à `TournamentState` |
| `src/store/tournamentStore.ts` | Modifier — `endTournament()` set `isEnded: true` |
| `src/index.css` | Modifier — ajouter `@keyframes podiumRise` et `@keyframes floatParticle` |
| `src/components/EndTournamentOverlay.tsx` | Modifier — supprimer badges 4ème+, ajouter gains, animations thème-aware |
| `src/pages/DisplayPage.tsx` | Modifier — détecter `isEnded`, ajouter composant `EndScreenTV` |

---

## Task 1 : Ajouter `isEnded` au type et au store

**Files:**
- Modify: `src/types.ts`
- Modify: `src/store/tournamentStore.ts`

- [ ] **Étape 1 : Ajouter `isEnded` à `TournamentState` dans `types.ts`**

Dans `src/types.ts`, modifier l'interface `TournamentState` :

```ts
export interface TournamentState {
  id: string;
  config: TournamentConfig;
  players: Player[];
  tables: Table[];
  currentLevelIndex: number;
  secondsRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  isEnded: boolean;
  startedAt: number | null;
  rebuyCount: number;
}
```

- [ ] **Étape 2 : Mettre à jour `endTournament()` dans le store**

Dans `src/store/tournamentStore.ts`, modifier la fonction `endTournament` :

```ts
endTournament: () => set(state => {
  if (!state.tournament) return state;
  return {
    tournament: { ...state.tournament, isRunning: false, isPaused: false, isEnded: true }
  };
}),
```

- [ ] **Étape 3 : Initialiser `isEnded: false` dans `initTournament()`**

Dans `src/store/tournamentStore.ts`, dans `initTournament`, ajouter `isEnded: false` à l'objet tournament :

```ts
set({
  tournament: {
    id: generateId(),
    config,
    players,
    tables,
    currentLevelIndex: 0,
    secondsRemaining: firstLevel.duration * 60,
    isRunning: false,
    isPaused: false,
    isEnded: false,
    startedAt: null,
    rebuyCount: 0,
  }
});
```

- [ ] **Étape 4 : Vérifier que le build passe**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript. Si des erreurs apparaissent sur `isEnded` manquant, elles indiqueront les endroits à corriger.

- [ ] **Étape 5 : Commit**

```bash
git add src/types.ts src/store/tournamentStore.ts
git commit -m "feat: add isEnded flag to TournamentState"
```

---

## Task 2 : Ajouter les keyframes CSS

**Files:**
- Modify: `src/index.css`

- [ ] **Étape 1 : Ajouter `@keyframes podiumRise` et `@keyframes floatParticle`**

Dans `src/index.css`, ajouter à la fin de la section `ANIMATIONS` (après `@keyframes goldPulse`) :

```css
@keyframes podiumRise {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes floatParticle {
  0%   { opacity: 0;   transform: translateY(0)    scale(1); }
  15%  { opacity: 0.9; }
  85%  { opacity: 0.6; }
  100% { opacity: 0;   transform: translateY(-80px) scale(0.3); }
}
```

- [ ] **Étape 2 : Commit**

```bash
git add src/index.css
git commit -m "feat: add podiumRise and floatParticle keyframes"
```

---

## Task 3 : Refactoriser `EndTournamentOverlay`

**Files:**
- Modify: `src/components/EndTournamentOverlay.tsx`

- [ ] **Étape 1 : Réécrire `EndTournamentOverlay.tsx`**

Remplacer l'intégralité du fichier par :

```tsx
import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { CRButton } from './ui/CRButton';
import { useTheme } from '../contexts/ThemeContext';
import { calculatePrizes } from '../utils/prizePool';
import type { Player, TournamentState } from '../types';

interface EndTournamentOverlayProps {
  tournament: TournamentState;
  onClose: () => void;
}

const MEDAL  = ['🥇', '🥈', '🥉'];
const COLORS = ['text-[#f4c842]', 'text-[#a0aec0]', 'text-[#cd7f32]'];
const GLOW   = [
  'shadow-[0_0_40px_rgba(244,200,66,0.6)] border-[#f4c842]',
  'shadow-[0_0_20px_rgba(160,174,192,0.4)] border-[#a0aec0]',
  'shadow-[0_0_20px_rgba(205,127,50,0.4)] border-[#cd7f32]',
];
const SIZES  = ['text-7xl md:text-8xl', 'text-5xl md:text-6xl', 'text-4xl md:text-5xl'];
const ORDER  = [1, 0, 2]; // 2nd / 1st / 3rd pour l'effet podium

function buildPodium(tournament: TournamentState): Player[] {
  const { players } = tournament;
  const winner = players.find(p => !p.isEliminated) ??
    players.reduce((best, p) => (p.position ?? 99) < (best.position ?? 99) ? p : best);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  return [winner, eliminated[0], eliminated[1]].filter(Boolean) as Player[];
}

// Particules dorées pour le thème supercell
const PARTICLES = [
  { left: '10%', delay: '0s',    size: 6,  dur: '2.8s' },
  { left: '20%', delay: '0.4s',  size: 4,  dur: '3.2s' },
  { left: '33%', delay: '0.8s',  size: 8,  dur: '2.5s' },
  { left: '45%', delay: '0.2s',  size: 5,  dur: '3.5s' },
  { left: '58%', delay: '1.0s',  size: 6,  dur: '2.9s' },
  { left: '70%', delay: '0.6s',  size: 4,  dur: '3.1s' },
  { left: '80%', delay: '0.3s',  size: 7,  dur: '2.7s' },
  { left: '90%', delay: '1.2s',  size: 5,  dur: '3.3s' },
  { left: '15%', delay: '1.5s',  size: 4,  dur: '2.6s' },
  { left: '62%', delay: '0.9s',  size: 6,  dur: '3.0s' },
  { left: '38%', delay: '1.7s',  size: 3,  dur: '2.8s' },
  { left: '75%', delay: '1.3s',  size: 5,  dur: '3.4s' },
];

export function EndTournamentOverlay({ tournament, onClose }: EndTournamentOverlayProps) {
  const { theme } = useTheme();
  const [visible,  setVisible]  = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);

  const podium       = buildPodium(tournament);
  const totalPot     = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
  const prizeAmount  = Math.round(totalPot * tournament.config.prizePool.prizePoolPct / 100);
  const prizes       = calculatePrizes(prizeAmount, tournament.players.length, tournament.config.prizePool);
  const getPrize     = (position: number) => prizes.find(p => p.position === position)?.amount ?? 0;
  const durationMin  = tournament.startedAt
    ? Math.round((Date.now() - tournament.startedAt) / 60000)
    : 0;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setVisible(true),          100));
    timers.push(setTimeout(() => setRevealed([2]),          600));
    timers.push(setTimeout(() => setRevealed([2, 1]),      1200));
    timers.push(setTimeout(() => setRevealed([2, 1, 0]),   2000));
    return () => timers.forEach(clearTimeout);
  }, []);

  const isSupercell = theme === 'supercell';

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: isSupercell ? 'rgba(15,5,0,0.92)' : 'rgba(7,15,24,0.95)' }}
    >
      {/* Arrière-plan : particules supercell ou glow default */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {isSupercell ? (
          PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute bottom-0 rounded-full"
              style={{
                left: p.left,
                width:  p.size,
                height: p.size,
                background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff9a3c' : '#ff6600',
                animation: `floatParticle ${p.dur} ${p.delay} ease-out infinite`,
              }}
            />
          ))
        ) : (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#f4c842]/5 blur-3xl animate-pulse" />
        )}
      </div>

      <Trophy
        size={48}
        className="mb-2 animate-bounce"
        style={{ color: isSupercell ? '#ffd700' : '#f4c842' }}
      />
      <h1
        className="font-cinzel text-3xl md:text-5xl font-black mb-1 text-center"
        style={{
          color: isSupercell ? '#ffd700' : '#f4c842',
          textShadow: `0 0 30px ${isSupercell ? 'rgba(255,215,0,0.7)' : 'rgba(244,200,66,0.7)'}`,
        }}
      >
        TOURNOI TERMINÉ
      </h1>
      <p className="text-sm mb-10 tracking-widest uppercase" style={{ color: isSupercell ? '#ff9a3c' : '#4a8fd4' }}>
        {tournament.config.name} · {durationMin}min · {totalPot}€
      </p>

      {/* Podium — ordre visuel : 2ème / 1er / 3ème */}
      <div className="flex items-end justify-center gap-4 md:gap-8 mb-10 px-4">
        {ORDER.map(rankIdx => {
          const player    = podium[rankIdx];
          const prize     = getPrize(rankIdx + 1);
          const isRevealed = revealed.includes(rankIdx);

          if (!player) return <div key={rankIdx} className="w-24 md:w-32" />;

          return (
            <div
              key={rankIdx}
              style={{
                animation: isRevealed ? `podiumRise 0.7s ease-out both` : undefined,
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? 'translateY(0)' : 'translateY(40px)',
                transition: 'opacity 0.1s',
              }}
              className="flex flex-col items-center"
            >
              <div className="text-4xl mb-2">{MEDAL[rankIdx]}</div>
              <div
                className={`border-2 rounded-2xl px-4 py-4 md:px-6 text-center ${GLOW[rankIdx]}`}
                style={{
                  minWidth: rankIdx === 0 ? 140 : 110,
                  background: isSupercell ? 'rgba(45,21,0,0.9)' : '#1a2d4a',
                }}
              >
                <div className={`font-cinzel font-black ${SIZES[rankIdx]} ${COLORS[rankIdx]} leading-none mb-1`}>
                  #{rankIdx + 1}
                </div>
                <div className="text-white font-bold text-sm md:text-base truncate max-w-[120px]">
                  {player.name}
                </div>
                {prize > 0 && (
                  <div
                    className="text-sm font-bold mt-1"
                    style={{ color: isSupercell ? '#ffd700' : '#27ae60' }}
                  >
                    {prize}€
                  </div>
                )}
              </div>
              {/* Bloc podium */}
              <div
                className={`w-full rounded-b-xl ${
                  rankIdx === 0
                    ? 'h-16 border-x-2 border-b-2 border-[#f4c842]'
                    : rankIdx === 1
                    ? 'h-10 border-x-2 border-b-2 border-[#a0aec0]'
                    : 'h-6 border-x-2 border-b-2 border-[#cd7f32]'
                }`}
                style={{
                  background: rankIdx === 0
                    ? 'rgba(244,200,66,0.20)'
                    : rankIdx === 1
                    ? 'rgba(160,174,192,0.10)'
                    : 'rgba(205,127,50,0.10)',
                }}
              />
            </div>
          );
        })}
      </div>

      <CRButton variant="gold" size="lg" onClick={onClose} className="text-lg px-12">
        Clôturer le tournoi
      </CRButton>
    </div>
  );
}
```

- [ ] **Étape 2 : Vérifier le build**

```bash
npm run build
```

Résultat attendu : aucune erreur TypeScript ni d'import manquant.

- [ ] **Étape 3 : Commit**

```bash
git add src/components/EndTournamentOverlay.tsx
git commit -m "feat: end tournament overlay — top 3 only, prize amounts, theme animations"
```

---

## Task 4 : Ajouter `EndScreenTV` dans `DisplayPage`

**Files:**
- Modify: `src/pages/DisplayPage.tsx`

- [ ] **Étape 1 : Mettre à jour les imports en haut de `DisplayPage.tsx`**

Remplacer les imports existants par :

```tsx
import { useEffect, useState } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { formatTime, formatChips } from '../constants';
import { calculatePrizes, getPaidPlaces, positionLabel } from '../utils/prizePool';
import { useTheme } from '../contexts/ThemeContext';
import type { TournamentState, Player } from '../types';
```

- [ ] **Étape 2 : Détecter `isEnded` dans le composant principal `DisplayPage`**

Dans le composant `DisplayPage`, après la ligne `if (!tournament)`, ajouter la détection de fin :

```tsx
if (tournament?.isEnded) {
  return <EndScreenTV tournament={tournament} theme={theme} />;
}
```

La structure dans `DisplayPage` doit ressembler à :

```tsx
export function DisplayPage() {
  const tournament = useTournamentStore(s => s.tournament);
  const { theme } = useTheme();

  useEffect(() => {
    const handleStorage = () => useTournamentStore.persist.rehydrate();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!tournament) {
    return <DisplayIdle theme={theme} />;
  }

  if (tournament.isEnded) {
    return <EndScreenTV tournament={tournament} theme={theme} />;
  }

  // ... reste du JSX existant inchangé
```

- [ ] **Étape 3 : Ajouter le composant `EndScreenTV` à la fin de `DisplayPage.tsx`**

Après le composant `StatBlock`, ajouter :

```tsx
const TV_MEDAL  = ['🥇', '🥈', '🥉'];
const TV_COLORS = ['#f4c842', '#a0aec0', '#cd7f32'];
const TV_GLOW   = [
  '0 0 80px rgba(244,200,66,0.6)',
  '0 0 40px rgba(160,174,192,0.4)',
  '0 0 40px rgba(205,127,50,0.4)',
];
const TV_ORDER  = [1, 0, 2];

const TV_PARTICLES = [
  { left: '8%',  delay: '0s',   size: 10, dur: '3.0s' },
  { left: '18%', delay: '0.5s', size: 7,  dur: '3.5s' },
  { left: '30%', delay: '0.9s', size: 12, dur: '2.8s' },
  { left: '44%', delay: '0.3s', size: 8,  dur: '3.2s' },
  { left: '56%', delay: '1.1s', size: 10, dur: '2.9s' },
  { left: '68%', delay: '0.7s', size: 7,  dur: '3.4s' },
  { left: '78%', delay: '0.4s', size: 11, dur: '2.7s' },
  { left: '88%', delay: '1.3s', size: 8,  dur: '3.1s' },
  { left: '23%', delay: '1.6s', size: 6,  dur: '2.6s' },
  { left: '63%', delay: '1.0s', size: 9,  dur: '3.3s' },
  { left: '40%', delay: '1.8s', size: 5,  dur: '2.8s' },
  { left: '73%', delay: '1.4s', size: 8,  dur: '3.6s' },
];

function buildPodiumTV(tournament: TournamentState): Player[] {
  const { players } = tournament;
  const winner = players.find(p => !p.isEliminated) ??
    players.reduce((best, p) => (p.position ?? 99) < (best.position ?? 99) ? p : best);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  return [winner, eliminated[0], eliminated[1]].filter(Boolean) as Player[];
}

function EndScreenTV({ tournament, theme }: { tournament: TournamentState; theme: string }) {
  const [revealed, setRevealed] = useState<number[]>([]);
  const isSupercell = theme === 'supercell';

  const podium      = buildPodiumTV(tournament);
  const totalPot    = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
  const prizeAmount = Math.round(totalPot * tournament.config.prizePool.prizePoolPct / 100);
  const prizes      = calculatePrizes(prizeAmount, tournament.players.length, tournament.config.prizePool);
  const getPrize    = (position: number) => prizes.find(p => p.position === position)?.amount ?? 0;
  const durationMin = tournament.startedAt
    ? Math.round((Date.now() - tournament.startedAt) / 60000)
    : 0;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setRevealed([2]),        800));
    timers.push(setTimeout(() => setRevealed([2, 1]),    1600));
    timers.push(setTimeout(() => setRevealed([2, 1, 0]), 2600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background */}
      {isSupercell ? (
        <>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url('/arenas/arena1.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
          <div className="absolute inset-0" style={{ background: 'rgba(15,5,0,0.80)' }} />
        </>
      ) : (
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0a2010 0%, #041208 40%, #020a04 70%, #000 100%)',
        }} />
      )}

      {/* Particules supercell */}
      {isSupercell && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {TV_PARTICLES.map((p, i) => (
            <div
              key={i}
              className="absolute bottom-0 rounded-full"
              style={{
                left: p.left,
                width:  p.size,
                height: p.size,
                background: i % 3 === 0 ? '#ffd700' : i % 3 === 1 ? '#ff9a3c' : '#ff6600',
                animation: `floatParticle ${p.dur} ${p.delay} ease-out infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Contenu */}
      <div className="relative z-10 flex flex-col items-center w-full px-12">
        <div
          className="font-cinzel font-black mb-2"
          style={{
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            color: isSupercell ? '#ffd700' : '#f4c842',
            textShadow: `0 0 40px ${isSupercell ? 'rgba(255,215,0,0.7)' : 'rgba(244,200,66,0.7)'}`,
          }}
        >
          {isSupercell ? '⚔️ TOURNOI TERMINÉ ⚔️' : '♠ TOURNOI TERMINÉ ♠'}
        </div>
        <div
          className="font-cinzel tracking-widest uppercase mb-12"
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            color: isSupercell ? '#ff9a3c' : '#4a8fd4',
          }}
        >
          {tournament.config.name} · {durationMin}min · {totalPot}€
        </div>

        {/* Podium TV */}
        <div className="flex items-end justify-center gap-8 xl:gap-16">
          {TV_ORDER.map(rankIdx => {
            const player     = podium[rankIdx];
            const prize      = getPrize(rankIdx + 1);
            const isRevealed = revealed.includes(rankIdx);

            if (!player) return <div key={rankIdx} style={{ width: 'clamp(140px, 14vw, 220px)' }} />;

            return (
              <div
                key={rankIdx}
                className="flex flex-col items-center"
                style={{
                  animation: isRevealed ? 'podiumRise 0.8s ease-out both' : undefined,
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(60px)',
                }}
              >
                <div style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', marginBottom: '0.5rem' }}>
                  {TV_MEDAL[rankIdx]}
                </div>
                <div
                  className="border-2 rounded-2xl text-center"
                  style={{
                    padding: 'clamp(12px, 2vw, 24px) clamp(16px, 3vw, 40px)',
                    minWidth: rankIdx === 0 ? 'clamp(160px, 16vw, 260px)' : 'clamp(130px, 13vw, 210px)',
                    background: isSupercell ? 'rgba(45,21,0,0.9)' : 'rgba(26,45,74,0.9)',
                    borderColor: TV_COLORS[rankIdx],
                    boxShadow: TV_GLOW[rankIdx],
                  }}
                >
                  <div
                    className="font-cinzel font-black leading-none mb-2"
                    style={{
                      fontSize: rankIdx === 0
                        ? 'clamp(3rem, 8vw, 7rem)'
                        : rankIdx === 1
                        ? 'clamp(2rem, 6vw, 5rem)'
                        : 'clamp(1.8rem, 5vw, 4rem)',
                      color: TV_COLORS[rankIdx],
                    }}
                  >
                    #{rankIdx + 1}
                  </div>
                  <div
                    className="font-bold"
                    style={{
                      fontSize: 'clamp(1rem, 2.5vw, 2rem)',
                      color: 'white',
                      maxWidth: 'clamp(120px, 12vw, 200px)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {player.name}
                  </div>
                  {prize > 0 && (
                    <div
                      className="font-cinzel font-bold mt-1"
                      style={{
                        fontSize: 'clamp(1rem, 2vw, 1.6rem)',
                        color: isSupercell ? '#ffd700' : '#27ae60',
                      }}
                    >
                      {prize}€
                    </div>
                  )}
                </div>
                {/* Bloc podium */}
                <div
                  style={{
                    width: '100%',
                    height: rankIdx === 0 ? 'clamp(40px, 5vw, 80px)'
                          : rankIdx === 1 ? 'clamp(26px, 3vw, 50px)'
                          : 'clamp(16px, 2vw, 30px)',
                    background: rankIdx === 0 ? 'rgba(244,200,66,0.15)'
                              : rankIdx === 1 ? 'rgba(160,174,192,0.10)'
                              : 'rgba(205,127,50,0.10)',
                    border: `2px solid ${TV_COLORS[rankIdx]}`,
                    borderTop: 'none',
                    borderRadius: '0 0 8px 8px',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

Note : `useState` est déjà importé dans `DisplayPage.tsx` via les composants existants. Si ce n'est pas le cas, ajouter `useState` à l'import React existant.

- [ ] **Étape 4 : Vérifier le build**

```bash
npm run build
```

Résultat attendu : aucune erreur. Si `useState` manque dans les imports, l'ajouter : `import { useEffect, useState } from 'react';`

- [ ] **Étape 5 : Tester manuellement**

```bash
npm run dev
```

Séquence de test :
1. Créer un tournoi avec 4+ joueurs
2. Éliminer tous les joueurs sauf 1
3. Cliquer "Terminer le tournoi" dans `TournamentPage`
4. Vérifier que l'overlay de contrôle affiche le podium top 3 avec les gains, sans badges 4ème+
5. Ouvrir `http://localhost:5173?display` dans un second onglet
6. Répéter l'étape 3 — vérifier que l'écran TV bascule sur `EndScreenTV`
7. Tester avec thème default et thème supercell (icône Palette dans la nav)

- [ ] **Étape 6 : Commit final**

```bash
git add src/pages/DisplayPage.tsx
git commit -m "feat: add EndScreenTV to DisplayPage for tournament end"
```
