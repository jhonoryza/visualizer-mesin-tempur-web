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
  mainText: string;
  subText: string;
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
  mainText,
  subText,
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
  const shakeRef = useRef({ x: 0, y: 0, intensity: 0 });
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
        const bassEnd = Math.floor(bufLen * 0.06);
        const midEnd = Math.floor(bufLen * 0.3);

        let bassSum = 0, midSum = 0, highSum = 0;

        for (let i = 0; i < bufLen; i++) {
          const val = engineData.frequencyData[i];
          if (i < bassEnd) bassSum += val;
          else if (i < midEnd) midSum += val;
          else highSum += val;
        }

        engineData.bassEnergy = bassSum / (bassEnd || 1) / 255;
        engineData.midEnergy = midSum / ((midEnd - bassEnd) || 1) / 255;
        engineData.highEnergy = highSum / ((bufLen - midEnd) || 1) / 255;

        const targetPulse = engineData.bassEnergy;
        bassPulseRef.current += (targetPulse - bassPulseRef.current) * 0.35;

        const shake = shakeRef.current;
        if (engineData.bassEnergy > 0.6 && engineData.bassEnergy - targetPulse > 0.15) {
          shake.intensity = engineData.bassEnergy * 8;
        }
        shake.x = (Math.random() - 0.5) * shake.intensity;
        shake.y = (Math.random() - 0.5) * shake.intensity;
        shake.intensity *= 0.88;
        if (shake.intensity < 0.1) { shake.intensity = 0; shake.x = 0; shake.y = 0; }
      }

      timeRef.current += 0.016;

      const rc: RenderContext = {
        ctx,
        width: canvas.width,
        height: canvas.height,
        engine: engineData,
        colors,
        mode: visualMode,
        mainText,
        subText,
        time: timeRef.current,
        bassPulse: bassPulseRef.current,
        shakeX: shakeRef.current.x,
        shakeY: shakeRef.current.y,
        performanceMode,
      };

      renderFrame(rc);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [engine, visualMode, colors, mainText, subText, performanceMode, onCanvasReady, onFpsTick]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full"
    >
      {/* Monitor Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{ borderColor: theme.panelBorder, background: `var(--t-panel-gradient, ${theme.panel})` }}
      >
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" style={{ color: theme.primary }} />
          <span className="text-[10px] tracking-[2px]" style={{ color: `color-mix(in srgb, ${theme.primary} 80%, transparent)` }}>
            VISUALIZER
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className={`w-1.5 h-1.5 rounded-full ${fps > 25 ? 'bg-[#22c55e]' : 'bg-[#ef4444]'}`} />
            <span className="text-[9px]" style={{ color: `color-mix(in srgb, ${theme.primary} 60%, transparent)` }}>
              {fps} FPS
            </span>
          </div>
          <span className="text-[9px]" style={{ color: `color-mix(in srgb, ${theme.primary} 40%, transparent)` }}>
            {canvasW}x{canvasH}
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasW}
          height={canvasH}
          style={{
            width: displaySize.w,
            height: displaySize.h,
            borderColor: theme.panelBorder,
            borderRadius: 'var(--t-radius)',
          }}
          className="border"
        />
      </div>
    </motion.div>
  );
}
