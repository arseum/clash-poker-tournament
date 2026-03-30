import { useState, useEffect } from 'react';
import type { Page } from './types';
import { Navigation } from './components/Navigation';
import { SetupPage } from './pages/SetupPage';
import { TournamentPage } from './pages/TournamentPage';
import { TablesPage } from './pages/TablesPage';
import { HistoryPage } from './pages/HistoryPage';
import { useTournamentStore } from './store/tournamentStore';

// Mapping: blind level index (0-based) → arena number (1-15)
const ARENA_MAP = [1,2,3,4,5,5,6,6,7,7,8,8,9,10,11,12,13,14,15,15];

function getArenaNumber(levelIndex: number): number {
  return ARENA_MAP[Math.min(levelIndex, ARENA_MAP.length - 1)];
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('setup');
  const tournament = useTournamentStore(s => s.tournament);

  const arenaNumber = tournament ? getArenaNumber(tournament.currentLevelIndex) : 1;
  const bgUrl = `/arenas/arena${arenaNumber}.jpg`;

  // Preload next arena image to avoid flash
  useEffect(() => {
    if (!tournament) return;
    const nextArena = getArenaNumber(tournament.currentLevelIndex + 1);
    const img = new Image();
    img.src = `/arenas/arena${nextArena}.jpg`;
  }, [tournament?.currentLevelIndex]);

  const renderPage = () => {
    switch (currentPage) {
      case 'setup':      return <SetupPage onNavigate={setCurrentPage} />;
      case 'tournament': return <TournamentPage onNavigate={setCurrentPage} />;
      case 'tables':     return <TablesPage onNavigate={setCurrentPage} />;
      case 'history':    return <HistoryPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Arena background */}
      <div
        key={bgUrl}
        className="fixed inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 -z-10"
        style={{ backgroundImage: `url('${bgUrl}')` }}
      />
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-[#070f18]/50 -z-10" />

      <div className="pb-16 md:pb-0 md:pt-12">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
