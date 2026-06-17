import { motion } from 'framer-motion';
import { Lock, Menu } from 'lucide-react';
import type { AppTheme } from '../types';
import { APP_THEMES } from '../types';

interface HeaderProps {
  isLocked: boolean;
  onToggleLock: () => void;
  appTheme: AppTheme;
  onAppThemeChange: (t: AppTheme) => void;
  onMenuToggle: () => void;
  sidebarOpen: boolean;
}

export function Header({ isLocked, onToggleLock, appTheme, onAppThemeChange, onMenuToggle }: HeaderProps) {
  const theme = APP_THEMES[appTheme];

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between px-3 md:px-4 py-2.5 md:py-3 border-b"
      style={{
        borderColor: theme.panelBorder,
        background: `var(--t-panel-gradient, ${theme.panel})`,
      }}
    >
      <div className="flex items-center gap-2 md:gap-3">
        {/* Mobile menu button */}
        <button
          className="md:hidden w-8 h-8 flex items-center justify-center border"
          style={{ borderColor: theme.panelBorder, borderRadius: 'var(--t-radius)' }}
          onClick={onMenuToggle}
        >
          <Menu className="w-4 h-4" style={{ color: theme.primary }} />
        </button>

        <div
          className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center border relative"
          style={{ borderColor: theme.panelBorder, borderRadius: 'var(--t-radius)' }}
        >
          <img src="/winemp-logo.png" alt="WINEMP" width={32} height={32} className="w-full h-full object-cover" style={{ borderRadius: 'var(--t-radius)' }} />
          <div
            className="absolute inset-0 border animate-pulse"
            style={{ borderColor: `color-mix(in srgb, ${theme.primary} 20%, transparent)`, borderRadius: 'var(--t-radius)' }}
          />
        </div>
        <div>
          <h1
            className="text-xs md:text-sm font-bold tracking-[3px] glow-text leading-none"
            style={{ color: theme.primary }}
          >
            WINEMP
          </h1>
          <p
            className="text-[7px] md:text-[9px] tracking-[2px] mt-0.5 hidden sm:block"
            style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}
          >
            AUDIO VISUALIZER
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Theme dots — hidden on small mobile, shown on md+ */}
        <div className="hidden sm:flex items-center gap-1">
          {(Object.keys(APP_THEMES) as AppTheme[]).map((t) => (
            <button
              key={t}
              className="w-3.5 h-3.5 md:w-4 md:h-4 border transition-all"
              style={{
                borderRadius: '6px',
                backgroundColor: appTheme === t ? APP_THEMES[t].primary : 'transparent',
                borderColor: APP_THEMES[t].primary,
                boxShadow: appTheme === t ? `0 0 8px ${APP_THEMES[t].primary}` : 'none',
              }}
              onClick={() => onAppThemeChange(t)}
              title={APP_THEMES[t].label}
            />
          ))}
        </div>

        <div
          className="hidden sm:flex items-center gap-1.5 px-2 py-1 border"
          style={{ borderColor: theme.panelBorder, borderRadius: 'var(--t-radius)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          <span
            className="text-[9px] tracking-wider"
            style={{ color: `color-mix(in srgb, ${theme.primary} 60%, transparent)` }}
          >
            SYS v3.3.0
          </span>
        </div>
        <button
          onClick={onToggleLock}
          className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center border transition-all"
          style={{ borderColor: theme.panelBorder, borderRadius: 'var(--t-radius)' }}
          title={isLocked ? 'Unlock Controls' : 'Lock Controls'}
        >
          <Lock
            className="w-3.5 h-3.5 md:w-4 md:h-4"
            style={{ color: isLocked ? theme.primary : `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}
          />
        </button>
      </div>
    </motion.header>
  );
}
