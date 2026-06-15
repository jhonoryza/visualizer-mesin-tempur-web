import { useRef, useEffect, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Crosshair } from 'lucide-react';
import type { AudioEngine } from '../hooks/useAudioEngine';
import { renderFrame, type RenderContext } from '../lib/renderer';
import type { ColorScheme, VisualMode, AspectRatio, ColorPreset, AppTheme } from '../types';
import { COLOR_PRESETS, ASPECT_RATIOS, APP_THEMES } from '../types';

type PerformanceMode = 'light' | 'balanced' | 'ultra';

interface VisualizerMonitorProps {
  engine: React.RefObject<AudioEngine>;
  visualMode: VisualMode;
  colorPreset: ColorPreset;
  aspectRatio: AspectRatio;
  mainText: string;
  subText: string;
  fps: number;
  performanceMode: PerformanceMode;
  appTheme: AppTheme;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function VisualizerMonitor({
  engine,
  visualMode,
  colorPreset,
  aspectRatio,
  mainText,
  subText,
  fps,
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
  const [canvasSize, setCanvasSize] = useState({ w: 960, h: 540 });

  const colors: ColorScheme = COLOR_PRESETS[colorPreset];
  const ratio = ASPECT_RATIOS[aspectRatio];
  const theme = APP_THEMES[appTheme];

  const updateSize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxW = rect.width - 16;
    const maxH = rect.height - 16;

    const targetRatio = ratio.w / ratio.h;
    let w = maxW;
    let h = w / targetRatio;

    if (h > maxH) {
      h = maxH;
      w = h * targetRatio;
    }

    setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
  }, [ratio]);

  useEffect(() => {
    updateSize();
    const obs = new ResizeObserver(updateSize);
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [updateSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (onCanvasReady) onCanvasReady(canvas);

    const analyserFrameSkip = performanceMode === 'light' ? 2 : 1;
    let frameCount = 0;

    const animate = () => {
      frameCount++;
      const engineData = engine.current;

      if (engineData.analyser && frameCount % analyserFrameSkip === 0) {
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
        const prevPulse = bassPulseRef.current;
        bassPulseRef.current += (targetPulse - bassPulseRef.current) * 0.35;

        const shake = shakeRef.current;
        if (engineData.bassEnergy > 0.6 && engineData.bassEnergy - prevPulse > 0.15) {
          shake.intensity = engineData.bassEnergy * 8;
        }
        shake.x = (Math.random() - 0.5) * shake.intensity;
        shake.y = (Math.random() - 0.5) * shake.intensity;
        shake.intensity *= 0.88;
        if (shake.intensity < 0.1) {
          shake.intensity = 0;
          shake.x = 0;
          shake.y = 0;
        }
      }

      timeRef.current += 0.016;

      const shake = shakeRef.current;
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
        shakeX: shake.x,
        shakeY: shake.y,
      };

      renderFrame(rc);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [engine, visualMode, colors, mainText, subText, performanceMode, onCanvasReady]);

  const resolution = `${canvasSize.w}×${canvasSize.h}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full"
    >
      {/* Monitor Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b"
        style={{
          borderColor: theme.panelBorder,
          background: `var(--t-panel-gradient, ${theme.panel})`,
        }}
      >
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4" style={{ color: theme.primary }} />
          <span className="text-[10px] tracking-[2px]" style={{ color: `color-mix(in srgb, ${theme.primary} 80%, transparent)` }}>
            TACTICAL WEAPONS MONITOR HUD
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
            {resolution}
          </span>
        </div>
      </div>

      {/* Canvas Container */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center bg-black relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize.w}
          height={canvasSize.h}
          className="border"
          style={{ borderColor: theme.panelBorder, borderRadius: 'var(--t-radius)' }}
        />
      </div>
    </motion.div>
  );
}
