import { useState, useEffect } from 'react';
import { Activity, Cpu, HardDrive } from 'lucide-react';
import type { AppTheme } from '../types';

interface StatusBarProps {
  fps: number;
  trackName: string | null;
  isPlaying: boolean;
  appTheme: AppTheme;
}

export function StatusBar({ fps, trackName, isPlaying }: StatusBarProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="flex items-center justify-between px-3 md:px-4 py-1 border-t text-[8px] md:text-[9px] tracking-wider"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--card)',
      }}
    >
      <div className="flex items-center gap-3 md:gap-4">
        {[
          { icon: Activity, label: `SYS: ONLINE` },
          { icon: Cpu, label: `GPU: ACTIVE` },
          { icon: HardDrive, label: `AUDIO: ${isPlaying ? 'PLAYING' : 'PAUSED'}` },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-1" style={{ color: 'var(--muted-foreground)' }}>
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(':')[1]?.trim()}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {trackName && (
          <span className="max-w-[100px] md:max-w-[200px] truncate" style={{ color: 'var(--muted-foreground)' }}>
            {trackName}
          </span>
        )}
        <span className={fps > 25 ? 'text-[#22c55e]/70' : 'text-[#ef4444]/70'}>
          {fps}
        </span>
        <span style={{ color: 'var(--muted-foreground)' }}>
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </div>
  );
}
