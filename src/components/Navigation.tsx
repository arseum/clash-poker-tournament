import React, { useState } from 'react';
import { Settings, Clock, Grid, History, Palette, X } from 'lucide-react';
import type { Page } from '../types';
import { useTournamentStore } from '../store/tournamentStore';
import { useTheme, THEMES, THEME_LABELS } from '../contexts/ThemeContext';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: Array<{ page: Page; label: string; icon: React.ReactNode }> = [
  { page: 'setup',      label: 'Setup',      icon: <Settings size={20} /> },
  { page: 'tournament', label: 'Tournoi',    icon: <Clock size={20} /> },
  { page: 'tables',     label: 'Tables',     icon: <Grid size={20} /> },
  { page: 'history',    label: 'Historique', icon: <History size={20} /> },
];

const THEME_ICONS: Record<string, string> = {
  default:  '🃏',
  supercell: '⚔️',
};

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { tournament } = useTournamentStore();
  const { theme, setTheme } = useTheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-cr-dark/70 backdrop-blur-md border-t border-cr-card-border/60 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
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
                  ${isActive ? 'text-cr-gold' : 'text-[#4a5568] hover:text-[#a0aec0]'}
                `}
              >
                {icon}
                <span className="font-cinzel tracking-wide">{label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cr-gold md:top-0 md:bottom-auto" />
                )}
                {hasContent && !isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-cr-green rounded-full animate-pulse" />
                )}
              </button>
            );
          })}

          {/* Theme button */}
          <button
            onClick={() => setShowThemePicker(v => !v)}
            className={`
              flex flex-col md:flex-row items-center gap-1 md:gap-2
              px-4 py-3 text-xs md:text-sm font-medium transition-colors relative
              ${showThemePicker ? 'text-cr-gold' : 'text-[#4a5568] hover:text-[#a0aec0]'}
            `}
            title="Changer de thème"
          >
            <Palette size={20} />
            <span className="font-cinzel tracking-wide">Thème</span>
          </button>
        </div>
      </nav>

      {/* Theme picker panel */}
      {showThemePicker && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-start justify-center pb-20 md:pt-16 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowThemePicker(false)}
          />

          <div className="relative bg-cr-dark border border-cr-card-border rounded-2xl p-5 w-full max-w-sm shadow-2xl z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cinzel text-cr-gold text-lg font-bold tracking-wide">
                Choisir un thème
              </h3>
              <button
                onClick={() => setShowThemePicker(false)}
                className="text-[#4a5568] hover:text-[#a0aec0] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {THEMES.map(t => (
                <button
                  key={t}
                  onClick={() => { setTheme(t); setShowThemePicker(false); }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                    ${theme === t
                      ? 'border-cr-gold bg-cr-gold/10 text-cr-gold'
                      : 'border-cr-card-border bg-cr-card/50 text-[#a0aec0] hover:border-cr-blue-light hover:text-white'
                    }
                  `}
                >
                  <span className="text-2xl">{THEME_ICONS[t]}</span>
                  <div>
                    <div className="font-cinzel font-bold text-sm">{THEME_LABELS[t]}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {t === 'default' && 'Dark poker night classic'}
                      {t === 'supercell' && 'Clash Royale & Clash of Clans'}
                    </div>
                  </div>
                  {theme === t && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-cr-gold" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
