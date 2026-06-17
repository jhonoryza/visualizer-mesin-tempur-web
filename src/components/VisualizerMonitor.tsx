import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import type { AudioEngine } from '../hooks/useAudioEngine';
import { renderFrame, type RenderContext } from '../lib/renderer';
import type { ColorScheme, VisualMode, AspectRatio, ColorPreset, AppTheme, CanvasResolution } from '../types';
import { COLOR_PRESETS, ASPECT_RATIOS, APP_THEMES, CANVAS_RESOLUTIONS } from '../types';

type PerformanceMode = 'light' | 'balanced' | 'ultra';

interface VisualizerMonitorProps {
  engine: React.RefObject<AudioEngine>;
  visualMode: VisualMode;
  colorPreset: ColorPreset;
  aspectRatio: AspectRatio;
  canvasResolution: CanvasResolution;
  fps: number;
  onFpsTick: () => void;
  performanceMode: PerformanceMode;
  appTheme: AppTheme;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function VisualizerMonitor({
  engine,
  visualMode,
  colorPreset,
  aspectRatio,
  canvasResolution,
  fps,
  onFpsTick,
  performanceMode,
  appTheme,
  onCanvasReady,
}: VisualizerMonitorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const bassPulseRef = useRef(0);
  const [displaySize, setDisplaySize] = useState({ w: 960, h: 540 });

  const colors: ColorScheme = COLOR_PRESETS[colorPreset];
  const ratio = ASPECT_RATIOS[aspectRatio];
  const resolution = CANVAS_RESOLUTIONS[canvasResolution];
  const theme = APP_THEMES[appTheme];

  // Canvas renders at resolution (reduced in light mode)
  const resScale = performanceMode === 'light' ? 0.5 : performanceMode === 'balanced' ? 0.75 : 1;
  const targetRatio = ratio.w / ratio.h;
  const canvasW = Math.floor(resolution.w * resScale);
  const canvasH = Math.floor(canvasW / targetRatio);

  const updateDisplaySize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxW = rect.width - 16;
    const maxH = rect.height - 16;

    let w = maxW;
    let h = w / targetRatio;

    if (h > maxH) {
      h = maxH;
      w = h * targetRatio;
    }

    setDisplaySize({ w: Math.floor(w), h: Math.floor(h) });
  }, [targetRatio]);

  useEffect(() => {
    updateDisplaySize();
    const obs = new ResizeObserver(updateDisplaySize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateDisplaySize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (onCanvasReady) onCanvasReady(canvas);

    let frameCount = 0;
    let lastRender = 0;
    const targetFPS = performanceMode === 'light' ? 30 : 60;
    const frameInterval = 1000 / targetFPS;

    const animate = (now: number) => {
      animFrameRef.current = requestAnimationFrame(animate);

      // Frame rate limiter — skip if too fast
      if (now - lastRender < frameInterval) return;
      lastRender = now;
      frameCount++;
      onFpsTick();

      const engineData = engine.current;

      // Always update audio data (needed for smooth bass pulse)
      if (engineData.analyser) {
        engineData.analyser.getByteFrequencyData(engineData.frequencyData);
        engineData.analyser.getByteTimeDomainData(engineData.timeDomainData);

        const bufLen = engineData.frequencyData.length;
        const sampleRate = engineData.audioContext?.sampleRate ?? 44100;
        const fftSize = engineData.analyser?.fftSize ?? 2048;
        const binHz = sampleRate / fftSize;

        // Target drum frequencies: kick 60-150Hz, snare 150-400Hz
        const kickStart = Math.floor(40 / binHz);
        const kickEnd = Math.floor(150 / binHz);
        const snareEnd = Math.floor(400 / binHz);

        let kickSum = 0, snareSum = 0, highSum = 0;
        let kickCount = 0, snareCount = 0;

        for (let i = 0; i < bufLen; i++) {
          const val = engineData.frequencyData[i];
          if (i >= kickStart && i < kickEnd) { kickSum += val; kickCount++; }
          else if (i >= kickEnd && i < snareEnd) { snareSum += val; snareCount++; }
          else if (i >= snareEnd) { highSum += val; }
        }

        const kickEnergy = kickCount > 0 ? kickSum / kickCount / 255 : 0;
        const snareEnergy = snareCount > 0 ? snareSum / snareCount / 255 : 0;

        engineData.bassEnergy = kickEnergy;
        engineData.midEnergy = snareEnergy;
        engineData.highEnergy = bufLen - snareEnd > 0 ? highSum / (bufLen - snareEnd) / 255 : 0;

        // Use kick + snare for beat detection
        const drumEnergy = kickEnergy * 0.7 + snareEnergy * 0.3;
        const boostedBass = Math.min(1, drumEnergy * 3.5);
        const targetPulse = boostedBass;
        // Instant attack, smooth decay
        if (targetPulse > bassPulseRef.current) {
          bassPulseRef.current = targetPulse;
        } else {
          bassPulseRef.current += (targetPulse - bassPulseRef.current) * 0.12;
        }
        bassPulseRef.current = Math.min(1, bassPulseRef.current);
      }

      timeRef.current += 0.016;

      const rc: RenderContext = {
        ctx,
        width: canvas.width,
        height: canvas.height,
        engine: engineData,
        colors,
        mode: visualMode,
        time: timeRef.current,
        bassPulse: bassPulseRef.current,
        performanceMode,
        themePrimary: theme.primary,
        isLightTheme: appTheme.endsWith('-light'),
      };

      renderFrame(rc);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [engine, visualMode, colors, performanceMode, onCanvasReady, onFpsTick]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full"
    >
      {/* Monitor Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span className="text-[10px] tracking-[2px]" style={{ color: 'var(--foreground)' }}>
            VISUALIZER
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${fps > 25 ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
            <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
              {fps} FPS
            </span>
          </div>
          <span className="text-[9px]" style={{ color: 'var(--muted-foreground)' }}>
            {canvasW}x{canvasH}
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--background)' }}>
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          style={{
            width: displaySize.w,
            height: displaySize.h,
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius)',
          }}
          className="border"
        />
      </div>
    </motion.div>
  );
}
