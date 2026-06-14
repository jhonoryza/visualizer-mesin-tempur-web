import { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { VisualizerMonitor } from './components/VisualizerMonitor';
import { FireButton } from './components/FireButton';
import { StatusBar } from './components/StatusBar';
import { useAudioEngine } from './hooks/useAudioEngine';
import { usePlaylist } from './hooks/usePlaylist';
import { useFps } from './hooks/useFps';
import type { VisualMode, ColorPreset, AspectRatio, PerformanceMode, AppTheme } from './types';
import { APP_THEMES } from './types';

export default function App() {
  const audio = useAudioEngine();
  const playlist = usePlaylist();
  const { fps } = useFps();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playingForTrackRef = useRef<string | null>(null);

  const [visualMode, setVisualMode] = useState<VisualMode>('radar');
  const [colorPreset, setColorPreset] = useState<ColorPreset>('hazard');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('landscape');
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>('balanced');
  const [mainText, setMainText] = useState('MESIN TEMPUR');
  const [subText, setSubText] = useState('TACTICAL AUDIO VISUALIZER');
  const [isLocked, setIsLocked] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>('dark-matter');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = APP_THEMES[appTheme];

  const engineRef = audio.engine;
  const trackId = playlist.currentTrack?.id ?? null;

  // Single effect: load track + auto-play on track change
  useEffect(() => {
    const track = playlist.currentTrack;
    if (!track) return;

    const el = engineRef.current;
    if (!el.audioElement) {
      audio.loadUrl(track.url);
      return;
    }

    // Already loaded this track and playing — skip
    if (el.audioElement.src === track.url && playingForTrackRef.current === track.id) {
      return;
    }

    // Stop current, load new
    el.audioElement.pause();
    audio.setIsPlaying(false);
    playingForTrackRef.current = null;

    el.audioElement.src = track.url;
    el.audioElement.load();

    const onCanPlay = () => {
      el.audioElement?.removeEventListener('canplay', onCanPlay);
      if (audio.engine.current.audioContext?.state === 'suspended') {
        audio.engine.current.audioContext.resume().then(() => {
          el.audioElement?.play().then(() => {
            playingForTrackRef.current = track.id;
            audio.setIsPlaying(true);
          }).catch(() => {});
        });
      } else {
        el.audioElement?.play().then(() => {
          playingForTrackRef.current = track.id;
          audio.setIsPlaying(true);
        }).catch(() => {});
      }
    };

    el.audioElement.addEventListener('canplay', onCanPlay, { once: true });

    return () => {
      el.audioElement?.removeEventListener('canplay', onCanPlay);
    };
  }, [playlist.currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle track ended → next
  useEffect(() => {
    const el = engineRef.current;
    if (!el.audioElement) return;

    const onEnded = () => {
      audio.setIsPlaying(false);
      playingForTrackRef.current = null;
      const rm = playlist.repeatMode;
      if (rm === 'one') {
        el.audioElement!.currentTime = 0;
        el.audioElement!.play().then(() => {
          audio.setIsPlaying(true);
          if (playlist.currentTrack) playingForTrackRef.current = playlist.currentTrack.id;
        }).catch(() => {});
      } else {
        playlist.next();
      }
    };

    const onMeta = () => {
      const t = playlist.currentTrack;
      if (t && el.audioElement) {
        playlist.updateTrackDuration(t.id, el.audioElement.duration);
      }
    };

    el.audioElement.addEventListener('ended', onEnded);
    el.audioElement.addEventListener('loadedmetadata', onMeta);
    return () => {
      el.audioElement?.removeEventListener('ended', onEnded);
      el.audioElement?.removeEventListener('loadedmetadata', onMeta);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilesLoad = useCallback(
    async (files: File[]) => {
      await audio.ensureReady();
      playlist.addFiles(files);
    },
    [audio, playlist]
  );

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  const fmtDur = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-black overflow-hidden" data-theme={appTheme}>
      <div className="scanline" />

      <Header
        isLocked={isLocked}
        onToggleLock={() => setIsLocked(!isLocked)}
        appTheme={appTheme}
        onAppThemeChange={setAppTheme}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        sidebarOpen={sidebarOpen}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div
          className={`fixed md:static inset-y-0 left-0 z-40 w-72 border-r flex-shrink-0 overflow-y-auto transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          style={{ borderColor: theme.panelBorder, background: theme.panelBg }}
        >
          <LeftPanel
            performanceMode={performanceMode}
            onPerformanceModeChange={setPerformanceMode}
            visualMode={visualMode}
            onVisualModeChange={setVisualMode}
            colorPreset={colorPreset}
            onColorPresetChange={setColorPreset}
            aspectRatio={aspectRatio}
            onAspectRatioChange={setAspectRatio}
            mainText={mainText}
            onMainTextChange={setMainText}
            subText={subText}
            onSubTextChange={setSubText}
            onFilesLoad={handleFilesLoad}
            isLocked={isLocked}
            appTheme={appTheme}
            onAppThemeChange={setAppTheme}
            tracks={playlist.tracks}
            currentTrackId={trackId}
            repeatMode={playlist.repeatMode}
            onPlayTrack={(i) => { playingForTrackRef.current = null; playlist.playTrack(i); }}
            onRemoveTrack={playlist.removeTrack}
            onCycleRepeat={playlist.cycleRepeat}
            onClearAll={playlist.clearAll}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          {playlist.currentTrack && (
            <div
              className="flex items-center gap-3 px-3 py-1.5 border-b"
              style={{ borderColor: theme.panelBorder, background: `var(--t-panel-gradient, ${theme.panel})` }}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-[9px]" style={{ color: theme.primary }}>NOW:</span>
                <span className="text-[10px] truncate" style={{ color: `color-mix(in srgb, ${theme.primary} 70%, transparent)` }}>
                  {playlist.currentTrack.name}
                </span>
                <span className="text-[8px]" style={{ color: `color-mix(in srgb, ${theme.primary} 40%, transparent)` }}>
                  {fmtDur(playlist.currentTrack.duration)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {playlist.tracks.length > 1 && (
                  <>
                    <button className="military-btn text-[8px] py-0.5 px-1.5" onClick={() => { playingForTrackRef.current = null; playlist.prev(); }}>◀</button>
                    <button className="military-btn text-[8px] py-0.5 px-1.5" onClick={() => { playingForTrackRef.current = null; playlist.next(); }}>▶</button>
                  </>
                )}
                <button
                  className="military-btn text-[8px] py-0.5 px-1.5"
                  onClick={playlist.cycleRepeat}
                >
                  {playlist.repeatMode === 'one' ? '🔂' : playlist.repeatMode === 'all' ? '🔁' : playlist.repeatMode === 'shuffle' ? '🔀' : '⬜'}
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden">
            <VisualizerMonitor
              engine={engineRef}
              visualMode={visualMode}
              colorPreset={colorPreset}
              aspectRatio={aspectRatio}
              mainText={mainText}
              subText={subText}
              isPlaying={audio.isPlaying}
              onTogglePlay={audio.togglePlay}
              fps={fps}
              performanceMode={performanceMode}
              appTheme={appTheme}
              onCanvasReady={handleCanvasReady}
            />
          </div>

          <div
            className="flex items-center justify-between px-3 md:px-4 py-2 border-t"
            style={{ borderColor: theme.panelBorder, background: `var(--t-panel-gradient, ${theme.panel})` }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#22c55e] animate-pulse" />
              <span className="text-[9px] tracking-[2px] hidden sm:inline" style={{ color: `color-mix(in srgb, ${theme.primary} 40%, transparent)` }}>
                WEAPONS SYSTEM ARMED
              </span>
            </div>
            <FireButton
              canvasRef={canvasRef}
              engineRef={engineRef}
              audioDuration={audio.duration}
              appTheme={appTheme}
              tracks={playlist.tracks}
              currentTrackIndex={playlist.currentIndex}
              onSelectTrack={(i) => { playingForTrackRef.current = null; playlist.setCurrentIndex(i); }}
            />
          </div>
        </div>
      </div>

      <StatusBar
        fps={fps}
        trackName={playlist.currentTrack?.name ?? null}
        isPlaying={audio.isPlaying}
        appTheme={appTheme}
      />
    </div>
  );
}
