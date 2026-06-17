import { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { LeftPanel } from './components/LeftPanel';
import { VisualizerMonitor } from './components/VisualizerMonitor';
import { FireButton } from './components/FireButton';
import { StatusBar } from './components/StatusBar';
import { useAudioEngine } from './hooks/useAudioEngine';
import { usePlaylist } from './hooks/usePlaylist';
import { useFps } from './hooks/useFps';
import {
  SkipBack, SkipForward, Play, Pause,
  Repeat, Repeat1, Shuffle, CircleOff,
} from 'lucide-react';
import type { VisualMode, ColorPreset, AspectRatio, PerformanceMode, AppTheme, CanvasResolution } from './types';

function loadKey<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch { return fallback; }
}

export default function App() {
  const audio = useAudioEngine();
  const playlist = usePlaylist();
  const { fps, tick } = useFps();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playingForTrackRef = useRef<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appTheme, setAppTheme] = useState<AppTheme>(() => loadKey('appTheme', 'darkmatter-dark'));
  const [isLocked, setIsLocked] = useState(() => loadKey('isLocked', false));
  const [visualMode, setVisualMode] = useState<VisualMode>(() => loadKey('visualMode', 'bass-cannon'));
  const [colorPreset, setColorPreset] = useState<ColorPreset>(() => loadKey('colorPreset', 'arctic'));
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(() =>
    loadKey('aspectRatio', typeof window !== 'undefined' && window.innerWidth < 768 ? 'square' : 'landscape')
  );
  const [canvasResolution, setCanvasResolution] = useState<CanvasResolution>(() => loadKey('canvasResolution', '480p'));
  const [performanceMode, setPerformanceMode] = useState<PerformanceMode>(() => loadKey('performanceMode', 'balanced'));
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  // Persist to localStorage
  useEffect(() => { localStorage.setItem('appTheme', JSON.stringify(appTheme)); }, [appTheme]);
  useEffect(() => { localStorage.setItem('isLocked', JSON.stringify(isLocked)); }, [isLocked]);
  useEffect(() => { localStorage.setItem('visualMode', JSON.stringify(visualMode)); }, [visualMode]);
  useEffect(() => { localStorage.setItem('colorPreset', JSON.stringify(colorPreset)); }, [colorPreset]);
  useEffect(() => { localStorage.setItem('aspectRatio', JSON.stringify(aspectRatio)); }, [aspectRatio]);
  useEffect(() => { localStorage.setItem('canvasResolution', JSON.stringify(canvasResolution)); }, [canvasResolution]);
  useEffect(() => { localStorage.setItem('performanceMode', JSON.stringify(performanceMode)); }, [performanceMode]);

  const engineRef = audio.engine;
  const trackId = playlist.currentTrack?.id ?? null;

  // Refs for stable access in effects
  const nextRef = useRef(playlist.next);
  nextRef.current = playlist.next;
  const prevRef = useRef(playlist.prev);
  prevRef.current = playlist.prev;
  const repeatModeRef = useRef(playlist.repeatMode);
  repeatModeRef.current = playlist.repeatMode;
  const seekRef = useRef(audio.seek);
  seekRef.current = audio.seek;
  const isPlayingRef = useRef(audio.isPlaying);
  isPlayingRef.current = audio.isPlaying;

  // Load + auto-play + attach listeners on track change
  useEffect(() => {
    const track = playlist.currentTrack;
    if (!track) return;

    const el = engineRef.current;
    if (!el.audioElement) {
      audio.loadUrl(track.url);
      return;
    }

    if (el.audioElement.src === track.url && playingForTrackRef.current === track.id) {
      return;
    }

    el.audioElement.pause();
    audio.setIsPlaying(false);
    playingForTrackRef.current = null;

    el.audioElement.src = track.url;
    el.audioElement.load();

    const onEnded = () => {
      audio.setIsPlaying(false);
      playingForTrackRef.current = null;
      if (repeatModeRef.current === 'one') {
        el.audioElement!.currentTime = 0;
        el.audioElement!.play().then(() => {
          audio.setIsPlaying(true);
          if (playlist.currentTrack) playingForTrackRef.current = playlist.currentTrack.id;
        }).catch(() => {});
      } else {
        nextRef.current();
      }
    };

    const onMeta = () => {
      if (el.audioElement) {
        playlist.updateTrackDuration(track.id, el.audioElement.duration);
      }
    };

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
    el.audioElement.addEventListener('ended', onEnded);
    el.audioElement.addEventListener('loadedmetadata', onMeta);

    return () => {
      el.audioElement?.removeEventListener('canplay', onCanPlay);
      el.audioElement?.removeEventListener('ended', onEnded);
      el.audioElement?.removeEventListener('loadedmetadata', onMeta);
    };
  }, [playlist.currentIndex]); // eslint-disable-line react-hooks/exhaustive-deps

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
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handlePrev = () => {
    playingForTrackRef.current = null;
    prevRef.current();
  };

  const handleNext = () => {
    playingForTrackRef.current = null;
    nextRef.current();
  };

  // Progress bar drag handlers
  const progressRef = useRef<HTMLDivElement>(null);

  const getTimeFromEvent = useCallback((e: MouseEvent | Touch) => {
    const el = progressRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return pct * audio.duration;
  }, [audio.duration]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const t = getTimeFromEvent(e.nativeEvent);
    setIsDragging(true);
    setDragTime(t);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [getTimeFromEvent]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    setDragTime(getTimeFromEvent(e.nativeEvent));
  }, [isDragging, getTimeFromEvent]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;
    const t = getTimeFromEvent(e.nativeEvent);
    seekRef.current(t);
    setIsDragging(false);
  }, [isDragging, getTimeFromEvent]);

  const displayTime = isDragging ? dragTime : audio.currentTime;
  const progressPct = audio.duration > 0 ? (displayTime / audio.duration) * 100 : 0;

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden" data-theme={appTheme} style={{ background: 'var(--background)' }}>

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
          style={{ borderColor: 'var(--border)', background: 'var(--sidebar)' }}
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
            canvasResolution={canvasResolution}
            onCanvasResolutionChange={setCanvasResolution}
            onFilesLoad={handleFilesLoad}
            isLocked={isLocked}
            appTheme={appTheme}
            onAppThemeChange={setAppTheme}
            tracks={playlist.tracks}
            currentTrackId={trackId}
            repeatMode={playlist.repeatMode}
            onPlayTrack={async (i) => { await audio.ensureReady(); playingForTrackRef.current = null; playlist.playTrack(i); }}
            onRemoveTrack={playlist.removeTrack}
            onCycleRepeat={playlist.cycleRepeat}
            onClearAll={playlist.clearAll}
            onCloseMobile={() => setSidebarOpen(false)}
          />
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-hidden">
            <VisualizerMonitor
              engine={engineRef}
              visualMode={visualMode}
              colorPreset={colorPreset}
              aspectRatio={aspectRatio}
              canvasResolution={canvasResolution}
              fps={fps}
              onFpsTick={tick}
              performanceMode={performanceMode}
              appTheme={appTheme}
              onCanvasReady={handleCanvasReady}
            />
          </div>

          {playlist.currentTrack && (
            <div className="border-t" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
              {/* Track name */}
              <div className="flex items-center justify-center px-3 py-1">
                <span className="text-[10px] truncate text-center" style={{ color: 'var(--muted-foreground)' }}>
                  {playlist.currentTrack.name}
                </span>
              </div>

              {/* Centered controls */}
              <div className="flex items-center justify-center gap-2 pb-1">
                <button className="app-btn p-1.5" onClick={handlePrev}>
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
                <button className="app-btn p-2" onClick={() => audio.togglePlay()}>
                  {audio.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="app-btn p-1.5" onClick={handleNext}>
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button className="app-btn p-1.5" onClick={playlist.cycleRepeat}>
                  {playlist.repeatMode === 'one' && <Repeat1 className="w-3.5 h-3.5" />}
                  {playlist.repeatMode === 'all' && <Repeat className="w-3.5 h-3.5" />}
                  {playlist.repeatMode === 'shuffle' && <Shuffle className="w-3.5 h-3.5" />}
                  {playlist.repeatMode === 'none' && <CircleOff className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-2 px-3 pb-1.5">
                <span className="text-[8px] w-8 text-right flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                  {fmtDur(displayTime)}
                </span>
                <div
                  ref={progressRef}
                  className="flex-1 h-5 flex items-center cursor-pointer group relative"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--secondary)' }}>
                    <div
                      className="h-full rounded-full transition-none"
                      style={{ width: `${progressPct}%`, background: 'var(--primary)' }}
                    />
                  </div>
                  <div
                    className="absolute w-3 h-3 rounded-full border-2 transition-transform group-hover:scale-125"
                    style={{
                      left: `calc(${progressPct}% - 6px)`,
                      background: 'var(--primary)',
                      borderColor: 'var(--background)',
                      boxShadow: '0 0 6px var(--ring)',
                    }}
                  />
                </div>
                <span className="text-[8px] w-8 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }}>
                  {fmtDur(audio.duration)}
                </span>
              </div>
            </div>
          )}

          <div
            className="flex items-center justify-between px-3 md:px-4 py-2 border-t"
            style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#22c55e] animate-pulse" />
              <span className="text-[9px] tracking-[2px] hidden sm:inline" style={{ color: 'var(--muted-foreground)' }}>
                SYSTEM READY
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
