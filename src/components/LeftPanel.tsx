import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Play, X, ListMusic, Target, Radar, AudioLines, Sparkles, Zap, Sun, Moon, Grid3x3, Dna, Orbit, Star, Circle, Droplets, Bug, Hexagon, TreePine, Heart, LayoutGrid, Fingerprint, Columns3, Wind, Activity } from 'lucide-react';
import type { VisualMode, ColorPreset, AspectRatio, PerformanceMode, AppTheme, ThemeName, ThemeMode, Track, RepeatMode, CanvasResolution, VisualMovement } from '../types';
import { COLOR_PRESETS, APP_THEMES, THEME_NAMES, CANVAS_RESOLUTIONS, VISUAL_MOVEMENTS } from '../types';

interface LeftPanelProps {
  performanceMode: PerformanceMode;
  onPerformanceModeChange: (m: PerformanceMode) => void;
  visualMode: VisualMode;
  onVisualModeChange: (m: VisualMode) => void;
  colorPreset: ColorPreset;
  onColorPresetChange: (p: ColorPreset) => void;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (a: AspectRatio) => void;
  canvasResolution: CanvasResolution;
  onCanvasResolutionChange: (r: CanvasResolution) => void;
  visualMovement: VisualMovement;
  onVisualMovementChange: (m: VisualMovement) => void;
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
  canvasResolution,
  onCanvasResolutionChange,
  visualMovement,
  onVisualMovementChange,
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
          style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderRadius: 'var(--radius)' }}
        >
          {num}
        </span>
      )}
      <span className="text-[10px] tracking-[2px] uppercase" style={{ color: 'var(--muted-foreground)' }}>
        {title}
      </span>
    </div>
  );

  const visualModes: { value: VisualMode; label: string; Icon: typeof Target }[] = [
    { value: 'circular-target', label: 'Target', Icon: Target },
    { value: 'radar', label: 'Radar', Icon: Radar },
    { value: 'waveform', label: 'Wave', Icon: AudioLines },
    { value: 'particle', label: 'Particle', Icon: Sparkles },
    { value: 'bass-cannon', label: 'Bass Drop', Icon: Zap },
    { value: 'neon-grid', label: 'Neon Grid', Icon: Grid3x3 },
    { value: 'dna-helix', label: 'DNA', Icon: Dna },
    { value: 'wave-tunnel', label: 'Tunnel', Icon: Orbit },
    { value: 'starburst', label: 'Starburst', Icon: Star },
    { value: 'pulse-rings', label: 'Pulse', Icon: Circle },
    { value: 'lava-lamp', label: 'Lava', Icon: Droplets },
    { value: 'glitch', label: 'Glitch', Icon: Bug },
    { value: 'spiral', label: 'Spiral', Icon: Fingerprint },
    { value: 'hexagon', label: 'Hexagon', Icon: Hexagon },
    { value: 'matrix-rain', label: 'Matrix', Icon: Columns3 },
    { value: 'aurora', label: 'Aurora', Icon: Wind },
    { value: 'orbit', label: 'Orbit', Icon: Orbit },
    { value: 'wave-bars', label: 'Bars', Icon: LayoutGrid },
    { value: 'ripple', label: 'Ripple', Icon: Activity },
    { value: 'heartbeat', label: 'Heartbeat', Icon: Heart },
    { value: 'mosaic', label: 'Mosaic', Icon: Sparkles },
    { value: 'fractal', label: 'Fractal', Icon: TreePine },
  ];

  const colorPresets: { value: ColorPreset; label: string; preview: string }[] = [
    { value: 'neon-sunset', label: 'Neon Sunset', preview: COLOR_PRESETS['neon-sunset'].primary },
    { value: 'cyber-noir', label: 'Cyber Noir', preview: COLOR_PRESETS['cyber-noir'].primary },
    { value: 'toxic-green', label: 'Toxic Green', preview: COLOR_PRESETS['toxic-green'].primary },
    { value: 'vaporwave', label: 'Vaporwave', preview: COLOR_PRESETS['vaporwave'].primary },
    { value: 'bloodmoon', label: 'Bloodmoon', preview: COLOR_PRESETS['bloodmoon'].primary },
    { value: 'glacial', label: 'Glacial', preview: COLOR_PRESETS['glacial'].primary },
    { value: 'phantom-purple', label: 'Phantom', preview: COLOR_PRESETS['phantom-purple'].primary },
  ];

  const repeatLabel = { none: 'OFF', one: '1', all: 'ALL', shuffle: 'SHUF' };

  return (
    <div className="w-full h-full overflow-y-auto p-3 space-y-3">
      {/* Mobile close button */}
      <button
        className="md:hidden absolute top-3 right-3 w-7 h-7 flex items-center justify-center border z-50"
        style={{ borderColor: 'var(--border)', color: 'var(--primary)', borderRadius: 'var(--radius)' }}
        onClick={onCloseMobile}
      >
        <X className="w-4 h-4" />
      </button>

      {/* Playlist */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="app-panel glow-border p-3"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ListMusic className="w-4 h-4" style={{ color: 'var(--primary)' }} />
            <span className="text-[10px] tracking-[2px] uppercase" style={{ color: 'var(--muted-foreground)' }}>
              PLAYLIST ({tracks.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              className="app-btn text-[8px] py-0.5 px-1.5"
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
          <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-[9px] tracking-[1px]" style={{ color: 'var(--muted-foreground)' }}>
            + Add Music (Multiple Files)
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
                  background: currentTrackId === track.id ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : undefined,
                  borderLeft: currentTrackId === track.id ? '2px solid var(--primary)' : '2px solid transparent',
                }}
                onClick={() => onPlayTrack(i)}
              >
                <Play className="w-3 h-3 flex-shrink-0" style={{ color: currentTrackId === track.id ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                <span
                  className="text-[9px] truncate flex-1"
                  style={{ color: currentTrackId === track.id ? 'var(--primary)' : 'var(--foreground)' }}
                >
                  {track.name}
                </span>
                <span className="text-[8px] flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                  {track.duration > 0 ? formatDur(track.duration) : '--:--'}
                </span>
                <button
                  className="w-4 h-4 flex items-center justify-center hover:text-[#ef4444] flex-shrink-0"
                  style={{ color: 'var(--muted-foreground)' }}
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
        className="app-panel glow-border p-3"
      >
        <SectionLabel title="PERFORMANCE MODE" />
        <select
          className="app-select w-full"
          value={performanceMode}
          onChange={(e) => onPerformanceModeChange(e.target.value as PerformanceMode)}
          disabled={isLocked}
        >
          {[
            { value: 'light', label: 'Light (Stable FPS)' },
            { value: 'balanced', label: 'Balanced' },
            { value: 'ultra', label: 'Ultra Quality' },
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
        className="app-panel glow-border p-3"
      >
        <SectionLabel num={1} title="VISUAL SETTINGS" />

        <div className="space-y-3">
          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
              VISUAL MODE
            </label>
            <div className="grid grid-cols-3 gap-1">
              {visualModes.map((m) => (
                <button
                  key={m.value}
                  className={`app-btn text-[8px] py-1.5 px-1 flex flex-col items-center gap-0.5 ${visualMode === m.value ? 'active' : ''}`}
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
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
              MOVEMENT
            </label>
            <div className="flex gap-1">
              {(Object.keys(VISUAL_MOVEMENTS) as VisualMovement[]).map((m) => (
                <button
                  key={m}
                  className={`app-btn flex-1 text-[8px] py-1.5 ${visualMovement === m ? 'active' : ''}`}
                  onClick={() => onVisualMovementChange(m)}
                  disabled={isLocked}
                >
                  {VISUAL_MOVEMENTS[m]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
              COLOR PRESET
            </label>
            <div className="grid grid-cols-4 gap-1">
              {colorPresets.map((p) => (
                <button
                  key={p.value}
                  className={`app-btn text-[8px] py-1.5 px-1 flex flex-col items-center gap-1 ${colorPreset === p.value ? 'active' : ''}`}
                  onClick={() => onColorPresetChange(p.value)}
                  disabled={isLocked}
                >
                  <div
                    className="w-3 h-3"
                    style={{
                      backgroundColor: p.preview,
                      borderRadius: 'var(--radius)',
                      boxShadow: colorPreset === p.value ? `0 0 8px ${p.preview}` : 'none',
                    }}
                  />
                  <span className="leading-none">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
              ASPECT RATIO
            </label>
            <div className="flex gap-1">
              {([
                { value: 'landscape', label: '16:9' },
                { value: 'square', label: '1:1' },
                { value: 'vertical', label: '9:16' },
              ] as { value: AspectRatio; label: string }[]).map((r) => (
                <button
                  key={r.value}
                  className={`app-btn flex-1 text-[9px] py-1 ${aspectRatio === r.value ? 'active' : ''}`}
                  onClick={() => onAspectRatioChange(r.value)}
                  disabled={isLocked}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] tracking-wider block mb-1" style={{ color: 'var(--muted-foreground)' }}>
              OUTPUT RESOLUTION
            </label>
            <div className="flex gap-1 flex-wrap">
              {(Object.keys(CANVAS_RESOLUTIONS) as CanvasResolution[]).map((r) => (
                <button
                  key={r}
                  className={`app-btn text-[8px] py-1 px-1.5 ${canvasResolution === r ? 'active' : ''}`}
                  onClick={() => onCanvasResolutionChange(r)}
                  disabled={isLocked}
                >
                  {CANVAS_RESOLUTIONS[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Themes */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.09 }}
        className="app-panel glow-border p-3"
      >
        <SectionLabel title="APP THEME" />

        {/* Light/Dark toggle */}
        <div className="flex items-center gap-1 mb-3">
          {(['light', 'dark'] as ThemeMode[]).map((mode) => {
            const parts = appTheme.split('-');
            const currentName = parts.slice(0, -1).join('-') as ThemeName;
            const currentMode = parts[parts.length - 1] as ThemeMode;
            const isActive = currentMode === mode;
            return (
              <button
                key={mode}
                className={`app-btn flex-1 text-[9px] py-1.5 flex items-center justify-center gap-1.5 ${isActive ? 'active' : ''}`}
                onClick={() => onAppThemeChange(`${currentName}-${mode}`)}
              >
                {mode === 'light' ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
                <span className="capitalize">{mode}</span>
              </button>
            );
          })}
        </div>

        {/* Theme names */}
        <div className="grid grid-cols-2 gap-1.5">
          {(Object.keys(THEME_NAMES) as ThemeName[]).map((name) => {
            const parts = appTheme.split('-');
            const currentName = parts.slice(0, -1).join('-') as ThemeName;
            const currentMode = parts[parts.length - 1] as ThemeMode;
            const isActive = currentName === name;
            const themeKey = `${name}-${currentMode}` as AppTheme;
            const config = APP_THEMES[themeKey];
            return (
              <button
                key={name}
                className={`app-btn text-[9px] py-2 px-2 flex items-center gap-2 ${isActive ? 'active' : ''}`}
                onClick={() => onAppThemeChange(themeKey)}
              >
                <div
                  className="w-3 h-3 flex-shrink-0"
                  style={{
                    backgroundColor: config.primary,
                    borderRadius: '4px',
                  }}
                />
                <span>{THEME_NAMES[name]}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
