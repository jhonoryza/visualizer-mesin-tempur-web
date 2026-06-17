import { motion } from 'framer-motion';
import { Lock, Menu, Sun, Moon } from 'lucide-react';
import type { AppTheme, ThemeName, ThemeMode } from '../types';

interface HeaderProps {
  isLocked: boolean;
  onToggleLock: () => void;
  appTheme: AppTheme;
  onAppThemeChange: (t: AppTheme) => void;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function Header({ isLocked, onToggleLock, appTheme, onAppThemeChange, onMenuToggle }: HeaderProps) {
  const parts = appTheme.split('-');
  const currentName = parts.slice(0, -1).join('-') as ThemeName;
  const currentMode = parts[parts.length - 1] as ThemeMode;

  const toggleMode = () => {
    const newMode: ThemeMode = currentMode === 'dark' ? 'light' : 'dark';
    onAppThemeChange(`${currentName}-${newMode}`);
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-b"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--card)',
      }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile menu button */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center border"
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
          onClick={onMenuToggle}
        >
          <Menu className="w-4 h-4" style={{ color: 'var(--primary)' }} />
        </button>

        <div
          className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border relative"
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
        >
          <img src="/winemp-logo.png" alt="WINEMP" width={32} height={32} className="w-full h-full object-cover" style={{ borderRadius: 'var(--radius)' }} />
          <div
            className="absolute inset-0 border animate-pulse"
            style={{ borderColor: 'color-mix(in srgb, var(--primary) 20%, transparent)', borderRadius: 'var(--radius)' }}
          />
        </div>
        <div>
          <h1
            className="text-xs md:text-sm font-bold tracking-[3px] glow-text leading-none"
            style={{ color: 'var(--primary)' }}
          >
            WINEMP
          </h1>
          <p
            className="text-[7px] md:text-[9px] tracking-[2px] mt-0.5 hidden sm:block"
            style={{ color: 'var(--muted-foreground)' }}
          >
            AUDIO VISUALIZER
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Light/Dark toggle */}
        <button
          onClick={toggleMode}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border transition-all"
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
          title={`Switch to ${currentMode === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {currentMode === 'dark' ? (
            <Sun className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: 'var(--primary)' }} />
          ) : (
            <Moon className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: 'var(--primary)' }} />
          )}
        </button>

        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 border"
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span
            className="text-[9px] tracking-wider"
            style={{ color: 'var(--muted-foreground)' }}
          >
            v3.3.0
          </span>
        </div>
        <button
          onClick={onToggleLock}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border transition-all"
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
          title={isLocked ? 'Unlock Controls' : 'Lock Controls'}
        >
          <Lock
            className="w-3.5 h-3.5 md:w-4 md:h-4"
            style={{ color: isLocked ? 'var(--primary)' : 'var(--muted-foreground)' }}
          />
        </button>
      </div>
    </motion.header>
  );
}
