import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive } from 'lucide-react';
import type { AppTheme } from '../types';
import { APP_THEMES } from '../types';

interface StatusBarProps {
  fps: number;
  trackName: string | null;
  isPlaying: boolean;
  appTheme: AppTheme;
}

export function StatusBar({ fps, trackName, isPlaying, appTheme }: StatusBarProps) {
  const [time, setTime] = useState(new Date());
  const theme = APP_THEMES[appTheme];

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center justify-between px-3 md:px-4 py-1 border-t text-[8px] md:text-[9px] tracking-wider"
      style={{
        borderColor: theme.panelBorder,
        background: `var(--t-panel-gradient, ${theme.panel})`,
      }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        {[
          { icon: Activity, label: `SYS: ONLINE` },
          { icon: Cpu, label: `GPU: ACTIVE` },
          { icon: HardDrive, label: `AUDIO: ${isPlaying ? 'STREAMING' : 'STANDBY'}` },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}>
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(':')[1]?.trim()}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {trackName && (
          <span className="max-w-[100px] md:max-w-[200px] truncate" style={{ color: `color-mix(in srgb, ${theme.primary} 40%, transparent)` }}>
            {trackName}
          </span>
        )}
        <span className={fps > 25 ? 'text-[#22c55e]/70' : 'text-[#ef4444]/70'}>
          {fps}
        </span>
        <span style={{ color: `color-mix(in srgb, ${theme.primary} 40%, transparent)` }}>
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </div>
  );
}
