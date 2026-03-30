import React from 'react';
import { Settings, Clock, Grid, History } from 'lucide-react';
import type { Page } from '../types';
import { useTournamentStore } from '../store/tournamentStore';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: Array<{ page: Page; label: string; icon: React.ReactNode }> = [
  { page: 'setup', label: 'Setup', icon: <Settings size={20} /> },
  { page: 'tournament', label: 'Tournoi', icon: <Clock size={20} /> },
  { page: 'tables', label: 'Tables', icon: <Grid size={20} /> },
  { page: 'history', label: 'Historique', icon: <History size={20} /> },
];

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { tournament } = useTournamentStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0d1b2a]/70 backdrop-blur-md border-t border-[#2a4a7a]/60 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="flex justify-around md:justify-center md:gap-8 max-w-5xl mx-auto">
        {navItems.map(({ page, label, icon }) => {
          const isActive = currentPage === page;
          const hasContent = page === 'tournament' && tournament?.isRunning;

          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`
                flex flex-col md:flex-row items-center gap-1 md:gap-2
                px-4 py-3 text-xs md:text-sm font-medium transition-colors relative
                ${isActive
                  ? 'text-[#f4c842]'
                  : 'text-[#4a5568] hover:text-[#a0aec0]'
                }
              `}
            >
              {icon}
              <span className="font-cinzel tracking-wide">{label}</span>
              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#f4c842] md:top-0 md:bottom-auto" />
              )}
              {hasContent && !isActive && (
                <div className="absolute top-2 right-2 w-2 h-2 bg-[#27ae60] rounded-full animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
