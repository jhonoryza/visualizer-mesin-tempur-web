import type { AudioEngine } from '../hooks/useAudioEngine';
import type { ColorScheme, VisualMode } from '../types';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  engine: AudioEngine;
  colors: ColorScheme;
  mode: VisualMode;
  time: number;
  bassPulse: number;
  performanceMode: 'light' | 'balanced' | 'ultra';
  themePrimary: string;
  isLightTheme: boolean;
}

interface ColorCache {
  primary: string;
  glow: string;
  accent: string;
  secondary: string;
  grid: string;
  bg: string;
  pAlpha: (a: number) => string;
  aAlpha: (a: number) => string;
  sAlpha: (a: number) => string;
  dynamic: (a: number, pulse: number) => string;
  dynamicHex: (pulse: number) => string;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

function lerpColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

// Color stops: quiet → mid → loud
const DYNAMIC_COLORS: Record<string, string[]> = {
  default: ['#38bdf8', '#f59e0b', '#ef4444'],    // blue → orange → red
  'cyber-noir': ['#06b6d4', '#8b5cf6', '#ec4899'],       // cyan → purple → pink
  'toxic-green': ['#22c55e', '#eab308', '#ef4444'],      // green → yellow → red
  'vaporwave': ['#a855f7', '#ec4899', '#f97316'],      // purple → pink → orange
  'bloodmoon': ['#ef4444', '#f97316', '#fbbf24'],       // red → orange → yellow
  'glacial': ['#38bdf8', '#06b6d4', '#a855f7'],      // sky → cyan → purple
  'phantom-purple': ['#d4d4d4', '#a855f7', '#6366f1'],     // gray → purple → indigo
  'neon-sunset': ['#f59e0b', '#ef4444', '#dc2626'],      // amber → red → dark red
};

// Per-mode color schemes for dynamic coloring
const MODE_COLORS: Record<string, string[]> = {
  'circular-target': ['#f59e0b', '#ef4444', '#fbbf24'],     // amber → red → gold
  'radar': ['#22c55e', '#eab308', '#ef4444'],               // green → yellow → red
  'waveform': ['#38bdf8', '#6366f1', '#a855f7'],            // sky → indigo → purple
  'particle': ['#06b6d4', '#8b5cf6', '#ec4899'],            // cyan → purple → pink
  'bass-cannon': ['#ef4444', '#f97316', '#fbbf24'],         // red → orange → gold
  'neon-grid': ['#06b6d4', '#a855f7', '#ec4899'],           // cyan → purple → pink
  'dna-helix': ['#22c55e', '#10b981', '#06b6d4'],           // green → emerald → cyan
  'wave-tunnel': ['#6366f1', '#a855f7', '#ec4899'],         // indigo → purple → pink
  'starburst': ['#fbbf24', '#f59e0b', '#ef4444'],           // gold → amber → red
  'pulse-rings': ['#38bdf8', '#06b6d4', '#22c55e'],         // sky → cyan → green
  'lava-lamp': ['#ef4444', '#f97316', '#fbbf24'],           // red → orange → gold
  'glitch': ['#ef4444', '#06b6d4', '#a855f7'],              // red → cyan → purple
  'spiral': ['#a855f7', '#ec4899', '#6366f1'],              // purple → pink → indigo
  'hexagon': ['#06b6d4', '#22c55e', '#10b981'],             // cyan → green → emerald
  'matrix-rain': ['#22c55e', '#eab308', '#10b981'],         // green → yellow → emerald
  'aurora': ['#22c55e', '#a855f7', '#6366f1'],              // green → purple → indigo
  'orbit': ['#38bdf8', '#6366f1', '#a855f7'],               // sky → indigo → purple
  'wave-bars': ['#f59e0b', '#ef4444', '#a855f7'],           // amber → red → purple
  'ripple': ['#38bdf8', '#06b6d4', '#22c55e'],              // sky → cyan → green
  'heartbeat': ['#ef4444', '#f97316', '#fbbf24'],           // red → orange → gold
  'mosaic': ['#a855f7', '#ec4899', '#6366f1'],              // purple → pink → indigo
  'fractal': ['#22c55e', '#10b981', '#06b6d4'],             // green → emerald → cyan
};

function getModeColors(mode: string, _baseHex: string): string[] {
  return MODE_COLORS[mode] || DYNAMIC_COLORS.default;
}

function getDynamicColor(baseHex: string, pulse: number, mode?: string): string {
  const stops = mode ? getModeColors(mode, baseHex) : DYNAMIC_COLORS.default;

  if (pulse < 0.25) {
    return lerpColor(stops[0], stops[1], pulse / 0.25);
  } else {
    return lerpColor(stops[1], stops[2], Math.min(1, (pulse - 0.25) / 0.45));
  }
}

function makeColorCache(c: ColorScheme, pulse: number, mode: string): ColorCache {
  const dynHex = getDynamicColor(c.primary, pulse, mode);

  return {
    primary: c.primary,
    glow: c.glow,
    accent: c.accent,
    secondary: c.secondary,
    grid: c.grid,
    bg: c.bg,
    pAlpha: (a: number) => c.primary + Math.min(255, Math.floor(a * 255)).toString(16).padStart(2, '0'),
    aAlpha: (a: number) => c.accent + Math.min(255, Math.floor(a * 255)).toString(16).padStart(2, '0'),
    sAlpha: (a: number) => c.secondary + Math.min(255, Math.floor(a * 255)).toString(16).padStart(2, '0'),
    dynamic: (a: number, p: number) => {
      const amplified = Math.min(1, p * 1.8);
      const d = getDynamicColor(c.primary, amplified, mode);
      return d + Math.min(255, Math.floor(a * 255)).toString(16).padStart(2, '0');
    },
    dynamicHex: () => dynHex,
  };
}

// === GRID ===
let gridCache: { canvas: OffscreenCanvas; w: number; h: number; color: string } | null = null;

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number, gridColor: string) {
  if (gridCache && gridCache.w === w && gridCache.h === h && gridCache.color === gridColor) {
    ctx.drawImage(gridCache.canvas, 0, 0);
    return;
  }
  const oc = new OffscreenCanvas(w, h);
  const octx = oc.getContext('2d')!;
  const gridSize = 40;
  octx.strokeStyle = gridColor;
  octx.lineWidth = 0.3;
  for (let x = 0; x < w; x += gridSize) {
    octx.beginPath(); octx.moveTo(x, 0); octx.lineTo(x, h); octx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    octx.beginPath(); octx.moveTo(0, y); octx.lineTo(w, y); octx.stroke();
  }
  gridCache = { canvas: oc, w, h, color: gridColor };
  ctx.drawImage(oc, 0, 0);
}

// === BASS PULSE ===
function drawBassPulse(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, bassPulse } = rc;
  if (bassPulse < 0.08) return;
  const cx = width / 2, cy = height / 2;
  const r = Math.max(width, height) * 0.7 * bassPulse;
  const alpha = bassPulse * 0.25;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, cc.pAlpha(alpha));
  grad.addColorStop(0.5, cc.pAlpha(alpha * 0.4));
  grad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

// === CIRCULAR TARGET (improved) ===
function drawCircularTarget(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.min(width, height) * 0.42;
  ctx.save();
  ctx.translate(cx, cy);

  if (bassPulse > 0.2) {
    for (let i = 0; i < 5; i++) {
      const r = maxR + i * 20 + bassPulse * 45;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = cc.dynamic((1 - i * 0.2) * bassPulse * 0.45, bassPulse);
      ctx.lineWidth = 4 - i * 0.6; ctx.stroke();
    }
  }

  for (let i = 7; i >= 1; i--) {
    const r = maxR * (i / 7);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = i === 1 ? cc.pAlpha(0.85) : cc.pAlpha(0.18);
    ctx.lineWidth = i === 1 ? 3 : 0.7; ctx.stroke();
  }

  ctx.strokeStyle = cc.pAlpha(0.3); ctx.lineWidth = 0.6;
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * maxR * 0.1, Math.sin(rad) * maxR * 0.1);
    ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR);
    ctx.stroke();
  }

  const barCount = rc.performanceMode === 'light' ? 48 : 72;
  const step = Math.floor(engine.frequencyData.length / barCount);
  const innerR = maxR * 0.18 + bassPulse * 12;
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const val = engine.frequencyData[i * step] / 255;
    const barH = val * maxR * 0.65;
    if (barH < 1) continue;
    ctx.save(); ctx.rotate(angle);
    ctx.fillStyle = cc.dynamic(0.3 + val * 0.7, bassPulse);
    ctx.fillRect(innerR, -2, barH, 4);
    if (val > 0.4) {
      ctx.beginPath(); ctx.arc(innerR + barH, 0, 2.5 + val * 3, 0, Math.PI * 2);
      ctx.fillStyle = cc.dynamic(val * 0.85, bassPulse); ctx.fill();
    }
    ctx.restore();
  }

  ctx.beginPath(); ctx.arc(0, 0, maxR * 0.14, 0, Math.PI * 2);
  ctx.strokeStyle = cc.aAlpha(0.6); ctx.lineWidth = 3; ctx.stroke();

  const pulseR = 10 + bassPulse * 55;
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseR);
  grad.addColorStop(0, cc.dynamic(0.95, bassPulse)); grad.addColorStop(0.4, cc.dynamic(0.35, bassPulse)); grad.addColorStop(1, cc.dynamic(0, bassPulse));
  ctx.beginPath(); ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();

  const sweepAngle = (time * 0.8) % (Math.PI * 2);
  const sweepGrad = ctx.createConicGradient(sweepAngle, 0, 0);
  sweepGrad.addColorStop(0, cc.pAlpha(0.5)); sweepGrad.addColorStop(0.08, cc.pAlpha(0.15)); sweepGrad.addColorStop(0.15, cc.pAlpha(0)); sweepGrad.addColorStop(1, cc.pAlpha(0));
  ctx.beginPath(); ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.fillStyle = sweepGrad; ctx.fill();

  ctx.restore();
}

// === RADAR (improved) ===
function drawRadar(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.min(width, height) * 0.42;
  ctx.save(); ctx.translate(cx, cy);

  if (bassPulse > 0.3) {
    for (let i = 0; i < 5; i++) {
      const phase = (time * 2.5 + i * 0.4) % 3;
      const r = phase * maxR;
      const alpha = Math.max(0, 1 - phase / 3) * bassPulse * 0.5;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = cc.pAlpha(alpha); ctx.lineWidth = 2; ctx.stroke();
    }
  }

  for (let i = 1; i <= 8; i++) {
    ctx.beginPath(); ctx.arc(0, 0, maxR * (i / 8), 0, Math.PI * 2);
    ctx.strokeStyle = i === 8 ? cc.pAlpha(0.2) : cc.grid;
    ctx.lineWidth = i === 8 ? 2 : 0.5; ctx.stroke();
  }

  ctx.strokeStyle = cc.grid; ctx.lineWidth = 0.4;
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR); ctx.stroke();
  }

  const sweepAngle = time * 2.5;
  ctx.save(); ctx.rotate(sweepAngle);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(maxR, 0);
  ctx.strokeStyle = cc.primary; ctx.lineWidth = 2.5; ctx.stroke();
  const sweepGrad = ctx.createLinearGradient(0, 0, maxR, 0);
  sweepGrad.addColorStop(0, cc.pAlpha(0.6)); sweepGrad.addColorStop(0.5, cc.pAlpha(0.15)); sweepGrad.addColorStop(1, cc.pAlpha(0));
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(maxR, -maxR * 0.25); ctx.lineTo(maxR, 0); ctx.closePath();
  ctx.fillStyle = sweepGrad; ctx.fill(); ctx.restore();

  const dotCount = 48;
  const step = Math.floor(engine.frequencyData.length / dotCount);
  for (let i = 0; i < dotCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    if (val < 0.1) continue;
    const angle = (i / dotCount) * Math.PI * 2 + time * 0.5;
    const dist = val * maxR * 0.92;
    const x = Math.cos(angle) * dist, y = Math.sin(angle) * dist;
    const size = 2.5 + val * 5;
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
    glowGrad.addColorStop(0, cc.pAlpha(val * 0.4)); glowGrad.addColorStop(1, cc.pAlpha(0));
    ctx.fillStyle = glowGrad; ctx.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = cc.pAlpha(0.5 + val * 0.5); ctx.fill();
  }

  ctx.beginPath(); ctx.arc(0, 0, 6 + bassPulse * 15, 0, Math.PI * 2);
  ctx.fillStyle = cc.aAlpha(0.9); ctx.fill();
  ctx.restore();
}

// === WAVEFORM (improved) ===
function drawWaveform(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const cy = height / 2;
  const bufLen = engine.timeDomainData.length;

  if (bassPulse > 0.15) {
    const grad = ctx.createRadialGradient(width / 2, cy, 0, width / 2, cy, width * 0.45);
    grad.addColorStop(0, cc.pAlpha(bassPulse * 0.18)); grad.addColorStop(1, cc.pAlpha(0));
    ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);
  }

  const barCount = 80;
  const barStep = Math.floor(engine.frequencyData.length / barCount);
  const barW = width / barCount;
  for (let i = 0; i < barCount; i++) {
    const val = engine.frequencyData[i * barStep] / 255;
    const barH = val * height * 0.45;
    if (barH < 1) continue;
    ctx.fillStyle = cc.pAlpha(0.2 + val * 0.6);
    ctx.fillRect(i * barW, height - barH, barW - 1, barH);
  }

  const skip = rc.performanceMode === 'light' ? 8 : rc.performanceMode === 'balanced' ? 4 : 1;
  ctx.beginPath(); let started = false;
  for (let i = 0; i < bufLen; i += skip) {
    const v = engine.timeDomainData[i] / 128.0;
    const x = (i / bufLen) * width, y = (v * height) / 2;
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = cc.primary; ctx.lineWidth = 3; ctx.stroke();

  ctx.beginPath(); started = false;
  for (let i = 0; i < bufLen; i += skip) {
    const v = engine.timeDomainData[i] / 128.0;
    const x = (i / bufLen) * width, y = height - (v * height) / 2;
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = cc.pAlpha(0.2); ctx.lineWidth = 1.2; ctx.stroke();

  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(width, cy);
  ctx.strokeStyle = cc.pAlpha(0.08); ctx.lineWidth = 0.5; ctx.stroke();
}

// === PARTICLE (improved) ===
function drawParticle(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const centerX = width / 2, centerY = height / 2;
  const isLight = rc.performanceMode === 'light';
  const particleCount = isLight ? 120 : 200;
  const step = Math.floor(engine.frequencyData.length / particleCount);

  for (let i = 0; i < particleCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const angle = (i / particleCount) * Math.PI * 2 + time * 0.4;
    const baseDist = 30 + (i / particleCount) * Math.min(width, height) * 0.45;
    const dist = baseDist + val * 110 + bassPulse * 35;
    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;
    const size = 1.5 + val * 6;

    if (val > 0.2 && !isLight) {
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 5);
      glowGrad.addColorStop(0, cc.pAlpha(val * 0.25)); glowGrad.addColorStop(1, cc.pAlpha(0));
      ctx.fillStyle = glowGrad; ctx.fillRect(x - size * 5, y - size * 5, size * 10, size * 10);
    }

    ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = cc.pAlpha(0.3 + val * 0.7); ctx.fill();
  }

  const energyR = 22 + bassPulse * 60;
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, energyR);
  grad.addColorStop(0, cc.pAlpha(0.75)); grad.addColorStop(0.5, cc.pAlpha(0.15)); grad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(centerX, centerY, energyR, 0, Math.PI * 2); ctx.fill();

  ctx.beginPath(); ctx.arc(centerX, centerY, 5 + bassPulse * 10, 0, Math.PI * 2);
  ctx.fillStyle = cc.primary; ctx.fill();

  for (let r = 0; r < 4; r++) {
    const ringR = 50 + r * 50 + bassPulse * 22;
    ctx.beginPath(); ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = cc.pAlpha(r === 0 ? 0.35 : 0.1); ctx.lineWidth = r === 0 ? 1.5 : 0.5; ctx.stroke();
  }
}

// === BASS CANNON (improved) ===
function drawBassCannon(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const centerX = width / 2, centerY = height / 2;
  const maxR = Math.min(width, height) * 0.45;

  for (let i = 0; i < 6; i++) {
    const phase = (time * 3.5 + i * 0.5) % 4;
    const r = phase * maxR;
    const alpha = Math.max(0, 1 - phase / 4) * bassPulse * 0.75;
    if (alpha < 0.02) continue;
    ctx.beginPath(); ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.strokeStyle = cc.pAlpha(alpha); ctx.lineWidth = 4 - phase * 0.6; ctx.stroke();
  }

  const explosionR = 6 + bassPulse * 90;
  const explosionGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, explosionR);
  explosionGrad.addColorStop(0, '#ffffff'); explosionGrad.addColorStop(0.1, cc.primary);
  explosionGrad.addColorStop(0.5, cc.pAlpha(0.35)); explosionGrad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = explosionGrad;
  ctx.beginPath(); ctx.arc(centerX, centerY, explosionR, 0, Math.PI * 2); ctx.fill();

  const burstCount = 32;
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    const val = engine.frequencyData[i * Math.floor(engine.frequencyData.length / burstCount)] / 255;
    const innerR = 10 + bassPulse * 32;
    const outerR = innerR + val * maxR * 0.65;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.strokeStyle = cc.pAlpha(0.25 + val * 0.65); ctx.lineWidth = 2 + val * 3; ctx.stroke();
  }

  const specCount = 80;
  const specStep = Math.floor(engine.frequencyData.length / specCount);
  for (let i = 0; i < specCount; i++) {
    const angle = (i / specCount) * Math.PI * 2;
    const val = engine.frequencyData[i * specStep] / 255;
    const innerR = maxR * 0.45;
    const outerR = innerR + val * maxR * 0.4;
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.strokeStyle = cc.aAlpha(val * 0.85); ctx.lineWidth = 2; ctx.stroke();
  }
}

// === NEON GRID ===
function drawNeonGrid(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2;

  // Perspective grid floor
  const horizon = height * 0.45;
  const gridLines = 20;
  const scrollSpeed = time * 120;

  ctx.save();
  ctx.globalAlpha = 0.4 + bassPulse * 0.3;

  // Horizontal lines with perspective
  for (let i = 0; i < gridLines; i++) {
    const t = ((i * 40 + scrollSpeed) % (height * 0.6)) / (height * 0.6);
    const y = horizon + t * (height - horizon);
    const alpha = (1 - t) * 0.6;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y);
    ctx.strokeStyle = cc.pAlpha(alpha); ctx.lineWidth = 1; ctx.stroke();
  }

  // Vertical perspective lines
  const vanishCount = 16;
  for (let i = 0; i < vanishCount; i++) {
    const x = (i / (vanishCount - 1)) * width;
    ctx.beginPath(); ctx.moveTo(cx, horizon); ctx.lineTo(x, height);
    ctx.strokeStyle = cc.pAlpha(0.3); ctx.lineWidth = 0.8; ctx.stroke();
  }
  ctx.restore();

  // Sun/moon circle on horizon
  const sunR = 30 + bassPulse * 25;
  const sunGrad = ctx.createRadialGradient(cx, horizon, 0, cx, horizon, sunR);
  sunGrad.addColorStop(0, cc.pAlpha(0.9)); sunGrad.addColorStop(0.6, cc.pAlpha(0.3)); sunGrad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = sunGrad;
  ctx.beginPath(); ctx.arc(cx, horizon, sunR, 0, Math.PI * 2); ctx.fill();

  // Frequency bars on sides
  const barCount = 24;
  const step = Math.floor(engine.frequencyData.length / barCount);
  const barH = height * 0.35;
  for (let i = 0; i < barCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const bh = val * barH;
    if (bh < 2) continue;
    const x = (i / barCount) * width * 0.15;
    ctx.fillStyle = cc.pAlpha(0.3 + val * 0.5);
    ctx.fillRect(x, height - bh, width * 0.15 / barCount - 1, bh);
    ctx.fillRect(width - x - width * 0.15 / barCount, height - bh, width * 0.15 / barCount - 1, bh);
  }
}

// === DNA HELIX ===
function drawDnaHelix(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2;
  const bufLen = engine.frequencyData.length;
  const points = 60;
  const amplitude = width * 0.18;
  const spacing = height / (points + 1);

  for (let strand = 0; strand < 2; strand++) {
    const offset = strand * Math.PI;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const freqIdx = Math.floor(t * bufLen * 0.5);
      const val = engine.frequencyData[freqIdx] / 255;
      const x = cx + Math.sin(t * Math.PI * 4 + time * 2 + offset) * (amplitude + val * 40);
      const y = spacing * (i + 1);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = strand === 0 ? cc.primary : cc.aAlpha(0.7);
    ctx.lineWidth = 2 + bassPulse * 2; ctx.stroke();
  }

  // Connecting rungs
  for (let i = 0; i < points; i += 3) {
    const t = i / points;
    const freqIdx = Math.floor(t * bufLen * 0.5);
    const val = engine.frequencyData[freqIdx] / 255;
    const x1 = cx + Math.sin(t * Math.PI * 4 + time * 2) * (amplitude + val * 40);
    const x2 = cx + Math.sin(t * Math.PI * 4 + time * 2 + Math.PI) * (amplitude + val * 40);
    const y = spacing * (i + 1);
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y);
    ctx.strokeStyle = cc.pAlpha(0.15 + val * 0.3); ctx.lineWidth = 1; ctx.stroke();

    // Node dots
    if (val > 0.4) {
      ctx.beginPath(); ctx.arc(x1, y, 2 + val * 2, 0, Math.PI * 2);
      ctx.fillStyle = cc.pAlpha(0.5 + val * 0.5); ctx.fill();
      ctx.beginPath(); ctx.arc(x2, y, 2 + val * 2, 0, Math.PI * 2);
      ctx.fillStyle = cc.aAlpha(0.5 + val * 0.5); ctx.fill();
    }
  }
}

// === WAVE TUNNEL ===
function drawWaveTunnel(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.max(width, height) * 0.55;
  const rings = 18;

  for (let i = rings; i >= 1; i--) {
    const t = i / rings;
    const r = maxR * t;
    const freqIdx = Math.floor(t * engine.frequencyData.length * 0.6);
    const val = engine.frequencyData[freqIdx] / 255;
    const wobble = val * 15 + bassPulse * 10;

    ctx.beginPath();
    const segs = 64;
    for (let s = 0; s <= segs; s++) {
      const angle = (s / segs) * Math.PI * 2;
      const rr = r + Math.sin(angle * 6 + time * 3 + i * 0.5) * wobble;
      const x = cx + Math.cos(angle) * rr;
      const y = cy + Math.sin(angle) * rr;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = cc.pAlpha(0.08 + (1 - t) * 0.35);
    ctx.lineWidth = 1.5 - t; ctx.stroke();
  }

  // Center glow
  const glowR = 15 + bassPulse * 30;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
  grad.addColorStop(0, cc.pAlpha(0.8)); grad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();
}

// === STARBURST ===
function drawStarburst(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.max(width, height) * 0.5;
  const burstCount = 36;
  const step = Math.floor(engine.frequencyData.length / burstCount);

  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2 + time * 0.15;
    const val = engine.frequencyData[i * step] / 255;
    const len = 30 + val * maxR * 0.7 + bassPulse * 30;
    const innerR = 8 + bassPulse * 12;

    const x1 = cx + Math.cos(angle) * innerR;
    const y1 = cy + Math.sin(angle) * innerR;
    const x2 = cx + Math.cos(angle) * len;
    const y2 = cy + Math.sin(angle) * len;

    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, cc.pAlpha(0.8)); grad.addColorStop(1, cc.pAlpha(0));
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = grad; ctx.lineWidth = 1.5 + val * 3; ctx.stroke();

    if (val > 0.6) {
      ctx.beginPath(); ctx.arc(x2, y2, 2 + val * 3, 0, Math.PI * 2);
      ctx.fillStyle = cc.aAlpha(val * 0.7); ctx.fill();
    }
  }

  const centerR = 10 + bassPulse * 20;
  const cGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerR);
  cGrad.addColorStop(0, '#ffffff'); cGrad.addColorStop(0.3, cc.primary); cGrad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = cGrad;
  ctx.beginPath(); ctx.arc(cx, cy, centerR, 0, Math.PI * 2); ctx.fill();
}

// === PULSE RINGS ===
function drawPulseRings(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.max(width, height) * 0.5;
  const ringCount = 12;
  const step = Math.floor(engine.frequencyData.length / ringCount);

  for (let i = 0; i < ringCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const baseR = (i / ringCount) * maxR;
    const expand = bassPulse * 30 + val * 20;
    const r = baseR + expand;

    ctx.beginPath();
    const segs = 72;
    for (let s = 0; s <= segs; s++) {
      const angle = (s / segs) * Math.PI * 2;
      const freqIdx = Math.floor((s / segs) * engine.frequencyData.length * 0.4);
      const fval = engine.frequencyData[freqIdx] / 255;
      const rr = r + fval * 15;
      const x = cx + Math.cos(angle) * rr;
      const y = cy + Math.sin(angle) * rr;
      if (s === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    const alpha = 0.15 + (1 - i / ringCount) * 0.4;
    ctx.strokeStyle = cc.pAlpha(alpha); ctx.lineWidth = 2 - i * 0.1; ctx.stroke();

    if (i % 3 === 0 && val > 0.5) {
      ctx.fillStyle = cc.pAlpha(0.03); ctx.fill();
    }
  }
}

// === LAVA LAMP ===
function drawLavaLamp(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const blobCount = 6;
  const step = Math.floor(engine.frequencyData.length / blobCount);

  for (let i = 0; i < blobCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const baseX = (width / (blobCount + 1)) * (i + 1);
    const wobbleX = Math.sin(time * 0.8 + i * 1.2) * 40;
    const wobbleY = Math.cos(time * 0.6 + i * 0.9) * 30;
    const x = baseX + wobbleX;
    const y = height / 2 + wobbleY + Math.sin(time + i) * 20;
    const r = 25 + val * 50 + bassPulse * 30;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, cc.pAlpha(0.5 + val * 0.3));
    grad.addColorStop(0.5, cc.pAlpha(0.2 + val * 0.15));
    grad.addColorStop(1, cc.pAlpha(0));
    ctx.fillStyle = grad;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }

  // Connecting streams
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < blobCount - 1; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const x1 = (width / (blobCount + 1)) * (i + 1) + Math.sin(time * 0.8 + i * 1.2) * 40;
    const x2 = (width / (blobCount + 1)) * (i + 2) + Math.sin(time * 0.8 + (i + 1) * 1.2) * 40;
    const y = height / 2;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo((x1 + x2) / 2, y - 30 - val * 40, x2, y);
    ctx.strokeStyle = cc.primary; ctx.lineWidth = 2 + val * 4; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// === SPIRAL ===
function drawSpiral(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.min(width, height) * 0.42;
  const arms = 3;
  const points = 120;
  const step = Math.floor(engine.frequencyData.length / points);

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * Math.PI * 2;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const t = i / points;
      const angle = t * Math.PI * 6 + time * 1.5 + armOffset;
      const val = engine.frequencyData[i * step] / 255;
      const r = t * maxR + val * 25 + bassPulse * 15;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = cc.pAlpha(0.6 - arm * 0.15);
    ctx.lineWidth = 2 - arm * 0.3; ctx.stroke();
  }

  const glowR = 8 + bassPulse * 15;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
  grad.addColorStop(0, cc.pAlpha(0.9)); grad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.arc(cx, cy, glowR, 0, Math.PI * 2); ctx.fill();
}

// === HEXAGON ===
function drawHexagon(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const cx = width / 2, cy = height / 2;
  const hexSize = Math.min(width, height) * 0.08;
  const cols = Math.ceil(width / (hexSize * 1.8)) + 1;
  const rows = Math.ceil(height / (hexSize * 1.6)) + 1;
  const startX = cx - (cols / 2) * hexSize * 1.8;
  const startY = cy - (rows / 2) * hexSize * 1.6;
  const step = Math.floor(engine.frequencyData.length / (cols * rows));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = startX + col * hexSize * 1.8 + (row % 2 ? hexSize * 0.9 : 0);
      const y = startY + row * hexSize * 1.6;
      const idx = (row * cols + col) % (engine.frequencyData.length / step | 0);
      const val = engine.frequencyData[idx * step] / 255;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = Math.sqrt(cx * cx + cy * cy);
      const distFactor = 1 - dist / maxDist;
      const size = hexSize * (0.3 + val * 0.5 + bassPulse * 0.2) * distFactor;
      if (size < 2) continue;

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const hx = x + Math.cos(angle) * size;
        const hy = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(hx, hy); else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fillStyle = cc.pAlpha(0.1 + val * 0.4);
      ctx.fill();
      ctx.strokeStyle = cc.pAlpha(0.15 + val * 0.3);
      ctx.lineWidth = 0.8; ctx.stroke();
    }
  }
}

// === MATRIX RAIN ===
function drawMatrixRain(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const cols = Math.floor(width / 14);
  const charSize = 14;
  const step = Math.floor(engine.frequencyData.length / cols);

  for (let i = 0; i < cols; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const dropCount = 3 + Math.floor(val * 8);
    const x = i * 14 + 7;

    for (let d = 0; d < dropCount; d++) {
      const yBase = ((d * charSize * 3 + i * 37) % height);
      const y = (yBase + val * 100) % height;
      const alpha = 0.15 + val * 0.5;
      ctx.fillStyle = cc.pAlpha(alpha);
      ctx.font = `${charSize}px monospace`;
      const char = String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96));
      ctx.fillText(char, x, y);
    }

    if (val > 0.7) {
      ctx.fillStyle = '#ffffff' + Math.floor(val * 60).toString(16).padStart(2, '0');
      ctx.fillRect(x - 4, 0, 8, height);
    }
  }

  if (bassPulse > 0.5) {
    ctx.fillStyle = cc.pAlpha(bassPulse * 0.08);
    ctx.fillRect(0, 0, width, height);
  }
}

// === AURORA ===
function drawAurora(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const layers = 4;
  const step = Math.floor(engine.frequencyData.length / 30);

  for (let l = 0; l < layers; l++) {
    ctx.beginPath();
    const baseY = height * (0.2 + l * 0.12);
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= width; x += 4) {
      const t = x / width;
      const freqIdx = Math.floor(t * 30) % (engine.frequencyData.length / step | 0);
      const val = engine.frequencyData[freqIdx * step] / 255;
      const y = baseY + Math.sin(t * Math.PI * 3 + time * (0.5 + l * 0.3)) * (30 + val * 60 + bassPulse * 20)
        + Math.sin(t * Math.PI * 7 + time * 0.8) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath();

    const alpha = 0.08 + (1 - l / layers) * 0.12;
    const grad = ctx.createLinearGradient(0, baseY - 40, 0, baseY + 100);
    grad.addColorStop(0, cc.pAlpha(0));
    grad.addColorStop(0.3, cc.pAlpha(alpha));
    grad.addColorStop(0.7, cc.aAlpha(alpha * 0.6));
    grad.addColorStop(1, cc.pAlpha(0));
    ctx.fillStyle = grad; ctx.fill();
  }
}

// === ORBIT ===
function drawOrbit(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.min(width, height) * 0.4;
  const orbits = 5;
  const step = Math.floor(engine.frequencyData.length / orbits);

  for (let i = 0; i < orbits; i++) {
    const r = maxR * ((i + 1) / orbits);
    const val = engine.frequencyData[i * step] / 255;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = cc.pAlpha(0.1 + val * 0.2);
    ctx.lineWidth = 1; ctx.stroke();

    const count = 3 + i * 2;
    for (let j = 0; j < count; j++) {
      const angle = (j / count) * Math.PI * 2 + time * (0.5 + i * 0.2);
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      const pSize = 2 + val * 4;

      const glow = ctx.createRadialGradient(px, py, 0, px, py, pSize * 3);
      glow.addColorStop(0, cc.pAlpha(0.4)); glow.addColorStop(1, cc.pAlpha(0));
      ctx.fillStyle = glow; ctx.fillRect(px - pSize * 3, py - pSize * 3, pSize * 6, pSize * 6);

      ctx.beginPath(); ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fillStyle = cc.pAlpha(0.5 + val * 0.5); ctx.fill();
    }
  }

  const centerR = 6 + bassPulse * 10;
  ctx.beginPath(); ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
  ctx.fillStyle = cc.primary; ctx.fill();
}

// === WAVE BARS ===
function drawWaveBars(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine } = rc;
  const barCount = rc.performanceMode === 'light' ? 40 : 64;
  const step = Math.floor(engine.frequencyData.length / barCount);
  const barW = width / barCount;

  for (let i = 0; i < barCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const barH = val * height * 0.7;
    if (barH < 2) continue;
    const x = i * barW;
    const y = height / 2 - barH / 2;

    const grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, cc.pAlpha(0.3)); grad.addColorStop(0.5, cc.pAlpha(0.7 + val * 0.3)); grad.addColorStop(1, cc.pAlpha(0.3));
    ctx.fillStyle = grad;
    ctx.fillRect(x + 1, y, barW - 2, barH);

    if (val > 0.6) {
      const glow = ctx.createRadialGradient(x + barW / 2, height / 2, 0, x + barW / 2, height / 2, barH * 0.4);
      glow.addColorStop(0, cc.pAlpha(val * 0.15)); glow.addColorStop(1, cc.pAlpha(0));
      ctx.fillStyle = glow;
      ctx.fillRect(x - 5, 0, barW + 10, height);
    }
  }

  ctx.beginPath(); ctx.moveTo(0, height / 2); ctx.lineTo(width, height / 2);
  ctx.strokeStyle = cc.pAlpha(0.1); ctx.lineWidth = 1; ctx.stroke();
}

// === RIPPLE ===
function drawRipple(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2, cy = height / 2;
  const maxR = Math.max(width, height) * 0.55;
  const ringCount = 10;
  const step = Math.floor(engine.frequencyData.length / ringCount);

  for (let i = 0; i < ringCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const phase = (time * 1.5 + i * 0.8) % 4;
    const r = (phase / 4) * maxR + val * 30;
    const alpha = Math.max(0, 1 - phase / 4) * (0.3 + val * 0.4);
    if (alpha < 0.02) continue;

    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = cc.pAlpha(alpha); ctx.lineWidth = 2 + bassPulse * 2; ctx.stroke();
  }

  const centerR = 5 + bassPulse * 10;
  ctx.beginPath(); ctx.arc(cx, cy, centerR, 0, Math.PI * 2);
  ctx.fillStyle = cc.pAlpha(0.8); ctx.fill();
}

// === HEARTBEAT ===
function drawHeartbeat(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const cy = height / 2;
  const bufLen = engine.timeDomainData.length;
  const skip = rc.performanceMode === 'light' ? 6 : 3;

  // Background grid lines
  ctx.strokeStyle = cc.pAlpha(0.05); ctx.lineWidth = 0.5;
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }
  for (let x = 0; x < width; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }

  // Heartbeat line
  ctx.beginPath();
  let started = false;
  for (let i = 0; i < bufLen; i += skip) {
    const v = engine.timeDomainData[i] / 128.0;
    const x = (i / bufLen) * width;
    const y = (v * height) / 2;
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = cc.primary; ctx.lineWidth = 2.5; ctx.stroke();

  // Glow behind
  ctx.beginPath(); started = false;
  for (let i = 0; i < bufLen; i += skip) {
    const v = engine.timeDomainData[i] / 128.0;
    const x = (i / bufLen) * width;
    const y = (v * height) / 2;
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = cc.pAlpha(0.2); ctx.lineWidth = 8; ctx.stroke();

  // Pulse indicator
  if (bassPulse > 0.4) {
    const px = width * 0.75;
    ctx.beginPath(); ctx.arc(px, cy, 8 + bassPulse * 12, 0, Math.PI * 2);
    ctx.fillStyle = cc.pAlpha(bassPulse * 0.6); ctx.fill();
  }
}

// === MOSAIC ===
function drawMosaic(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const gridSize = 20;
  const cols = Math.ceil(width / gridSize);
  const rows = Math.ceil(height / gridSize);
  const totalCells = cols * rows;
  const step = Math.floor(engine.frequencyData.length / Math.min(totalCells, 200));

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const idx = (row * cols + col) % (engine.frequencyData.length / step | 0);
      const val = engine.frequencyData[idx * step] / 255;
      if (val < 0.1) continue;
      const x = col * gridSize;
      const y = row * gridSize;
      const size = gridSize * (0.3 + val * 0.7);

      ctx.fillStyle = cc.pAlpha(0.1 + val * 0.5);
      ctx.fillRect(x + (gridSize - size) / 2, y + (gridSize - size) / 2, size, size);
    }
  }

  if (bassPulse > 0.5) {
    ctx.fillStyle = cc.pAlpha(bassPulse * 0.05);
    ctx.fillRect(0, 0, width, height);
  }
}

// === FRACTAL ===
function drawFractal(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const cx = width / 2, cy = height * 0.85;
  const maxLen = Math.min(width, height) * 0.3;
  const branches = 7;
  const step = Math.floor(engine.frequencyData.length / branches);

  function branch(x: number, y: number, angle: number, len: number, depth: number) {
    if (depth <= 0 || len < 3) return;
    const val = engine.frequencyData[Math.floor(depth * step) % engine.frequencyData.length] / 255;
    const endX = x + Math.cos(angle) * len;
    const endY = y + Math.sin(angle) * len;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(endX, endY);
    ctx.strokeStyle = cc.pAlpha(0.15 + (depth / 7) * 0.4 + val * 0.3);
    ctx.lineWidth = depth * 0.8; ctx.stroke();
    const spread = 0.4 + val * 0.2 + bassPulse * 0.1;
    branch(endX, endY, angle - spread, len * 0.68, depth - 1);
    branch(endX, endY, angle + spread, len * 0.68, depth - 1);
  }

  for (let i = 0; i < 3; i++) {
    const baseAngle = -Math.PI / 2 + (i - 1) * 0.3;
    branch(cx, cy, baseAngle, maxLen, 7);
  }
}

// === GLITCH ===
function drawGlitch(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const barCount = 40;
  const step = Math.floor(engine.frequencyData.length / barCount);

  for (let i = 0; i < barCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const h = val * height * 0.8;
    if (h < 2) continue;
    const y = (i / barCount) * height;
    const x = Math.sin(time * 5 + i * 0.3) * val * 20;

    ctx.fillStyle = cc.pAlpha(0.15 + val * 0.4);
    ctx.fillRect(x, y, width, h / barCount * 2);
  }

  // Horizontal glitch slices
  const sliceCount = 8;
  for (let i = 0; i < sliceCount; i++) {
    const val = engine.frequencyData[i * Math.floor(step * 3)] / 255;
    if (val < 0.4) continue;
    const sliceY = Math.random() * height;
    const sliceH = 2 + val * 8;
    const offset = (Math.random() - 0.5) * val * 30;
    ctx.drawImage(ctx.canvas, 0, sliceY, width, sliceH, offset, sliceY, width, sliceH);
  }

  // Scanlines
  ctx.fillStyle = cc.pAlpha(0.03);
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  // Center burst on bass
  if (bassPulse > 0.5) {
    const cx = width / 2, cy = height / 2;
    const r = bassPulse * Math.max(width, height) * 0.3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = cc.pAlpha(bassPulse * 0.4); ctx.lineWidth = 2; ctx.stroke();
  }
}

// === HUD OVERLAY ===
function drawHUDOverlay(_rc: RenderContext, _cc: ColorCache) {
  // Clean canvas, no overlay
}

// === MAIN RENDER ===
export function renderFrame(rc: RenderContext) {
  const { ctx, width, height } = rc;
  const cc = makeColorCache(rc.colors, rc.bassPulse, rc.mode);

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  drawGrid(ctx, width, height, cc.grid);
  drawBassPulse(rc, cc);

  switch (rc.mode) {
    case 'circular-target': drawCircularTarget(rc, cc); break;
    case 'radar': drawRadar(rc, cc); break;
    case 'waveform': drawWaveform(rc, cc); break;
    case 'particle': drawParticle(rc, cc); break;
    case 'bass-cannon': drawBassCannon(rc, cc); break;
    case 'neon-grid': drawNeonGrid(rc, cc); break;
    case 'dna-helix': drawDnaHelix(rc, cc); break;
    case 'wave-tunnel': drawWaveTunnel(rc, cc); break;
    case 'starburst': drawStarburst(rc, cc); break;
    case 'pulse-rings': drawPulseRings(rc, cc); break;
    case 'lava-lamp': drawLavaLamp(rc, cc); break;
    case 'glitch': drawGlitch(rc, cc); break;
    case 'spiral': drawSpiral(rc, cc); break;
    case 'hexagon': drawHexagon(rc, cc); break;
    case 'matrix-rain': drawMatrixRain(rc, cc); break;
    case 'aurora': drawAurora(rc, cc); break;
    case 'orbit': drawOrbit(rc, cc); break;
    case 'wave-bars': drawWaveBars(rc, cc); break;
    case 'ripple': drawRipple(rc, cc); break;
    case 'heartbeat': drawHeartbeat(rc, cc); break;
    case 'mosaic': drawMosaic(rc, cc); break;
    case 'fractal': drawFractal(rc, cc); break;
  }

  drawHUDOverlay(rc, cc);
}
