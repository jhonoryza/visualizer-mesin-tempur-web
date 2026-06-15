import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Play, X, ListMusic, Target, Radar, AudioLines, Sparkles, Bomb } from 'lucide-react';
import type { VisualMode, ColorPreset, AspectRatio, PerformanceMode, AppTheme, Track, RepeatMode } from '../types';
import { COLOR_PRESETS, APP_THEMES } from '../types';

interface LeftPanelProps {
  performanceMode: PerformanceMode;
  onPerformanceModeChange: (m: PerformanceMode) => void;
  visualMode: VisualMode;
  onVisualModeChange: (m: VisualMode) => void;
  colorPreset: ColorPreset;
  onColorPresetChange: (p: ColorPreset) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (a: AspectRatio) => void;
  mainText: string;
  onMainTextChange: (t: string) => void;
  subText: string;
  onSubTextChange: (t: string) => void;
  onFilesLoad: (files: File[]) => void;
  isLocked: boolean;
  appTheme: AppTheme;
  onAppThemeChange: (t: AppTheme) => void;
  tracks: Track[];
  currentTrackId: string | null;
  repeatMode: RepeatMode;
  onPlayTrack: (index: number) => void;
  onRemoveTrack: (id: string) => void;
  onCycleRepeat: () => void;
  onClearAll: () => void;
  onCloseMobile: () => void;
}

export function LeftPanel({
  performanceMode,
  onPerformanceModeChange,
  visualMode,
  onVisualModeChange,
  colorPreset,
  onColorPresetChange,
  aspectRatio,
  onAspectRatioChange,
  mainText,
  onMainTextChange,
  subText,
  onSubTextChange,
  onFilesLoad,
  isLocked,
  appTheme,
  onAppThemeChange,
  tracks,
  currentTrackId,
  repeatMode,
  onPlayTrack,
  onRemoveTrack,
  onCycleRepeat,
  onClearAll,
  onCloseMobile,
}: LeftPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const theme = APP_THEMES[appTheme];

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      const audioFiles = files.filter((f) => /\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(f.name));
      if (audioFiles.length > 0) onFilesLoad(audioFiles);
    },
    [onFilesLoad]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        onFilesLoad(Array.from(e.target.files));
        e.target.value = '';
      }
    },
    [onFilesLoad]
  );

  const formatDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const SectionLabel = ({ num, title }: { num?: number; title: string }) => (
    <div className="flex items-center gap-2 mb-2">
      {num !== undefined && (
        <span
          className="w-5 h-5 flex items-center justify-center border text-[9px]"
          style={{ borderColor: theme.panelBorder, color: theme.primary, borderRadius: 'var(--t-radius)' }}
        >
          {num}
        </span>
      )}
      <span className="text-[10px] tracking-[2px] uppercase" style={{ color: `color-mix(in srgb, ${theme.primary} 80%, transparent)` }}>
        {title}
      </span>
    </div>
  );

  const visualModes: { value: VisualMode; label: string; Icon: typeof Target }[] = [
    { value: 'circular-target', label: 'Circular Target', Icon: Target },
    { value: 'radar', label: 'Radar', Icon: Radar },
    { value: 'waveform', label: 'Waveform', Icon: AudioLines },
    { value: 'particle', label: 'Particle', Icon: Sparkles },
    { value: 'bass-cannon', label: 'Bass Cannon', Icon: Bomb },
  ];

  const colorPresets: { value: ColorPreset; label: string; preview: string }[] = [
    { value: 'hazard', label: 'Hazard', preview: COLOR_PRESETS.hazard.primary },
    { value: 'cyber', label: 'Cyber', preview: COLOR_PRESETS.cyber.primary },
    { value: 'matrix', label: 'Matrix', preview: COLOR_PRESETS.matrix.primary },
    { value: 'plasma', label: 'Plasma', preview: COLOR_PRESETS.plasma.primary },
    { value: 'blood', label: 'Blood', preview: COLOR_PRESETS.blood.primary },
    { value: 'arctic', label: 'Arctic', preview: COLOR_PRESETS.arctic.primary },
    { value: 'phantom', label: 'Phantom', preview: COLOR_PRESETS.phantom.primary },
  ];

  const repeatLabel = { none: 'OFF', one: '1', all: 'ALL', shuffle: 'SHUF' };

  return (
    <div className="w-full h-full overflow-y-auto p-3 space-y-3">
      {/* Mobile close button */}
      <button
        className="md:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center border z-50"
        style={{ borderColor: theme.panelBorder, color: theme.primary, borderRadius: 'var(--t-radius)' }}
        onClick={onCloseMobile}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Playlist */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="hud-panel glow-border p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4" style={{ color: theme.primary }} />
            <span className="text-[10px] tracking-[2px] uppercase" style={{ color: `color-mix(in srgb, ${theme.primary} 80%, transparent)` }}>
              PLAYLIST ({tracks.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="military-btn text-[8px] py-0.5 px-1.5"
              onClick={onCycleRepeat}
              title={`Repeat: ${repeatMode}`}
            >
              R:{repeatLabel[repeatMode]}
            </button>
            {tracks.length > 0 && (
              <button className="military-btn text-[8px] py-0.5 px-1.5" onClick={onClearAll}>
                CLR
              </button>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`drop-zone p-3 text-center cursor-pointer transition-all mb-2 ${isDragging ? 'dragging' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" accept=".mp3,.wav,.m4a,.ogg,.flac,.aac" multiple className="hidden" onChange={handleFileInput} />
          <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }} />
          <p className="text-[9px] tracking-[1px]" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}>
            + TAMBAH LAGU (BISA BANYAK)
          </p>
        </div>

        {/* Track list */}
        {tracks.length > 0 && (
          <div className="space-y-0.5 max-h-40 overflow-y-auto">
            {tracks.map((track, i) => (
              <div
                key={track.id}
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer transition-colors ${
                  currentTrackId === track.id ? '' : 'hover:bg-white/5'
                }`}
                style={{
                  background: currentTrackId === track.id ? `color-mix(in srgb, ${theme.primary} 12%, transparent)` : undefined,
                  borderLeft: currentTrackId === track.id ? `2px solid ${theme.primary}` : '2px solid transparent',
                }}
                onClick={() => onPlayTrack(i)}
              >
                <Play className="w-3 h-3 flex-shrink-0" style={{ color: currentTrackId === track.id ? theme.primary : `color-mix(in srgb, ${theme.primary} 40%, transparent)` }} />
                <span
                  className="text-[9px] truncate flex-1"
                  style={{ color: currentTrackId === track.id ? theme.primary : `color-mix(in srgb, ${theme.primary} 60%, transparent)` }}
                >
                  {track.name}
                </span>
                <span className="text-[8px] flex-shrink-0" style={{ color: `color-mix(in srgb, ${theme.primary} 30%, transparent)` }}>
                  {track.duration > 0 ? formatDur(track.duration) : '--:--'}
                </span>
                <button
                  className="w-4 h-4 flex items-center justify-center hover:text-[#ef4444] flex-shrink-0"
                  style={{ color: `color-mix(in srgb, ${theme.primary} 30%, transparent)` }}
                  onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id); }}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Performance Mode */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.03 }}
        className="hud-panel glow-border p-3"
      >
        <SectionLabel title="MODE PERFORMA PERANGKAT" />
        <select
          className="military-select w-full"
          value={performanceMode}
          onChange={(e) => onPerformanceModeChange(e.target.value as PerformanceMode)}
          disabled={isLocked}
        >
          {[
            { value: 'light', label: 'HP / Spek Ringan (FPS Stabil)' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'ultra', label: 'Ultra Visual' },
          ].map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </motion.div>

      {/* Visual Config */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.06 }}
        className="hud-panel glow-border p-3"
      >
        <SectionLabel num={1} title="KONFIGURASI MERIAM" />

        <div className="space-y-3">
          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}>
              TIPE MERIAM
            </label>
            <div className="grid grid-cols-3 gap-1">
              {visualModes.map((m) => (
                <button
                  key={m.value}
                  className={`military-btn text-[8px] py-1.5 px-1 flex flex-col items-center gap-0.5 ${visualMode === m.value ? 'active' : ''}`}
                  onClick={() => onVisualModeChange(m.value)}
                  disabled={isLocked}
                >
                  <m.Icon className="w-4 h-4" />
                  <span className="leading-none">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}>
              PRESET WARNA
            </label>
            <div className="grid grid-cols-4 gap-1">
              {colorPresets.map((p) => (
                <button
                  key={p.value}
                  className={`military-btn text-[8px] py-1.5 px-1 flex flex-col items-center gap-1 ${colorPreset === p.value ? 'active' : ''}`}
                  onClick={() => onColorPresetChange(p.value)}
                  disabled={isLocked}
                >
                  <div
                    className="w-3 h-3"
                    style={{
                      backgroundColor: p.preview,
                      borderRadius: 'var(--t-radius)',
                      boxShadow: colorPreset === p.value ? `0 0 8px ${p.preview}` : 'none',
                    }}
                  />
                  <span className="leading-none">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}>
              RATIO MONITOR
            </label>
            <div className="flex gap-1">
              {([
                { value: 'landscape', label: '16:9' },
                { value: 'square', label: '1:1' },
                { value: 'vertical', label: '9:16' },
              ] as { value: AspectRatio; label: string }[]).map((r) => (
                <button
                  key={r.value}
                  className={`military-btn flex-1 text-[9px] py-1 ${aspectRatio === r.value ? 'active' : ''}`}
                  onClick={() => onAspectRatioChange(r.value)}
                  disabled={isLocked}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}>
              TEXT UTAMA
            </label>
            <input
              type="text"
              className="military-input w-full"
              placeholder="MASUKKAN TEXT..."
              value={mainText}
              onChange={(e) => onMainTextChange(e.target.value)}
              disabled={isLocked}
            />
          </div>

          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: `color-mix(in srgb, ${theme.primary} 50%, transparent)` }}>
              TEXT SUB JUDUL
            </label>
            <input
              type="text"
              className="military-input w-full"
              placeholder="MASUKKAN SUB JUDUL..."
              value={subText}
              onChange={(e) => onSubTextChange(e.target.value)}
              disabled={isLocked}
            />
          </div>
        </div>
      </motion.div>

      {/* Themes — compact grid on mobile */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.09 }}
        className="hud-panel glow-border p-3"
      >
        <SectionLabel title="TEMA APLIKASI" />
        <div className="grid grid-cols-5 gap-1">
          {(Object.keys(APP_THEMES) as AppTheme[]).map((t) => (
            <button
              key={t}
              className={`military-btn text-[7px] py-1.5 px-1 flex flex-col items-center gap-1 ${appTheme === t ? 'active' : ''}`}
              onClick={() => onAppThemeChange(t)}
            >
              <div
                className="w-3 h-3 flex-shrink-0"
                style={{
                  backgroundColor: APP_THEMES[t].primary,
                  borderRadius: t === 'claude' ? '6px' : t === 'twitter-dark' ? '9999px' : '2px',
                  boxShadow: appTheme === t ? `0 0 8px ${APP_THEMES[t].primary}` : 'none',
                }}
              />
              <span className="leading-none whitespace-nowrap">{APP_THEMES[t].label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
