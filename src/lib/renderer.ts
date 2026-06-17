import type { AudioEngine } from '../hooks/useAudioEngine';
import type { ColorScheme, VisualMode } from '../types';

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  engine: AudioEngine;
  colors: ColorScheme;
  mode: VisualMode;
  mainText: string;
  subText: string;
  time: number;
  bassPulse: number;
  shakeX: number;
  shakeY: number;
  performanceMode: 'light' | 'balanced' | 'ultra';
  themePrimary: string;
  themeBg: string;
}

// Pre-computed color cache per frame
interface ColorCache {
  primary: string;
  glow: string;
  accent: string;
  secondary: string;
  grid: string;
  bg: string;
  pAlpha: (a: number) => string;
  aAlpha: (a: number) => string;
}

function makeColorCache(c: ColorScheme): ColorCache {
  return {
    primary: c.primary,
    glow: c.glow,
    accent: c.accent,
    secondary: c.secondary,
    grid: c.grid,
    bg: c.bg,
    pAlpha: (a: number) => c.primary + Math.min(255, Math.floor(a * 255)).toString(16).padStart(2, '0'),
    aAlpha: (a: number) => c.accent + Math.min(255, Math.floor(a * 255)).toString(16).padStart(2, '0'),
  };
}

// === GRID (cached via pattern) ===
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
    octx.beginPath();
    octx.moveTo(x, 0);
    octx.lineTo(x, h);
    octx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    octx.beginPath();
    octx.moveTo(0, y);
    octx.lineTo(w, y);
    octx.stroke();
  }

  gridCache = { canvas: oc, w, h, color: gridColor };
  ctx.drawImage(oc, 0, 0);
}

// === BASS PULSE ===
function drawBassPulse(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, bassPulse } = rc;
  if (bassPulse < 0.15) return;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.max(width, height) * 0.6;

  const r = maxR * bassPulse;
  const alpha = bassPulse * 0.15;

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, cc.pAlpha(alpha));
  grad.addColorStop(0.7, cc.pAlpha(alpha * 0.3));
  grad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}

// === CIRCULAR TARGET ===
function drawCircularTarget(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  // Outer glow rings on bass
  if (bassPulse > 0.3) {
    for (let i = 0; i < 3; i++) {
      const r = maxR + i * 15 + bassPulse * 30;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = cc.pAlpha((1 - i * 0.3) * bassPulse * 0.3);
      ctx.lineWidth = 3 - i;
      ctx.stroke();
    }
  }

  // Concentric rings
  for (let i = 6; i >= 1; i--) {
    const r = maxR * (i / 6);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = i === 1 ? cc.pAlpha(0.8) : cc.pAlpha(0.2);
    ctx.lineWidth = i === 1 ? 2 : 0.8;
    ctx.stroke();
  }

  // Crosshairs
  ctx.strokeStyle = cc.pAlpha(0.3);
  ctx.lineWidth = 0.6;
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * maxR * 0.12, Math.sin(rad) * maxR * 0.12);
    ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR);
    ctx.stroke();
  }

    // Frequency bars — batch into one path
    const barCount = rc.performanceMode === 'light' ? 48 : 64;
  const step = Math.floor(engine.frequencyData.length / barCount);
  const innerR = maxR * 0.22 + bassPulse * 8;

  ctx.lineWidth = 3;
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const val = engine.frequencyData[i * step] / 255;
    const barH = val * maxR * 0.5;
    if (barH < 1) continue;

    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = cc.pAlpha(0.4 + val * 0.6);
    ctx.fillRect(innerR, -1.5, barH, 3);

    // Tip dot
    if (val > 0.5) {
      ctx.beginPath();
      ctx.arc(innerR + barH, 0, 2 + val * 2, 0, Math.PI * 2);
      ctx.fillStyle = cc.aAlpha(val * 0.8);
      ctx.fill();
    }
    ctx.restore();
  }

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, maxR * 0.18, 0, Math.PI * 2);
  ctx.strokeStyle = cc.aAlpha(0.4);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Center pulse
  const pulseR = 15 + bassPulse * 40;
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseR);
  grad.addColorStop(0, cc.pAlpha(0.9));
  grad.addColorStop(0.5, cc.pAlpha(0.3));
  grad.addColorStop(1, cc.pAlpha(0));
  ctx.beginPath();
  ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Sweep
  const sweepAngle = (time * 0.8) % (Math.PI * 2);
  const sweepGrad = ctx.createConicGradient(sweepAngle, 0, 0);
  sweepGrad.addColorStop(0, cc.pAlpha(0.4));
  sweepGrad.addColorStop(0.08, cc.pAlpha(0.15));
  sweepGrad.addColorStop(0.15, cc.pAlpha(0));
  sweepGrad.addColorStop(1, cc.pAlpha(0));
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.fillStyle = sweepGrad;
  ctx.fill();

  ctx.restore();
}

// === RADAR ===
function drawRadar(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  // Shockwaves
  if (bassPulse > 0.4) {
    for (let i = 0; i < 3; i++) {
      const phase = (time * 2 + i * 0.5) % 3;
      const r = phase * maxR;
      const alpha = Math.max(0, 1 - phase / 3) * bassPulse * 0.4;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = cc.pAlpha(alpha);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Grid
  for (let i = 1; i <= 6; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, maxR * (i / 6), 0, Math.PI * 2);
    ctx.strokeStyle = i === 6 ? cc.pAlpha(0.15) : cc.grid;
    ctx.lineWidth = i === 6 ? 1.5 : 0.5;
    ctx.stroke();
  }

  // Radial lines
  ctx.strokeStyle = cc.grid;
  ctx.lineWidth = 0.4;
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR);
    ctx.stroke();
  }

  // Sweep
  const sweepAngle = time * 2;
  ctx.save();
  ctx.rotate(sweepAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(maxR, 0);
  ctx.strokeStyle = cc.primary;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Fan
  const sweepGrad = ctx.createLinearGradient(0, 0, maxR, 0);
  sweepGrad.addColorStop(0, cc.pAlpha(0.5));
  sweepGrad.addColorStop(0.5, cc.pAlpha(0.15));
  sweepGrad.addColorStop(1, cc.pAlpha(0));
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(maxR, -maxR * 0.2);
  ctx.lineTo(maxR, 0);
  ctx.closePath();
  ctx.fillStyle = sweepGrad;
  ctx.fill();
  ctx.restore();

  // Frequency dots
  const dotCount = 36;
  const step = Math.floor(engine.frequencyData.length / dotCount);
  for (let i = 0; i < dotCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    if (val < 0.2) continue;
    const angle = (i / dotCount) * Math.PI * 2 + time * 0.4;
    const dist = val * maxR * 0.9;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const size = 2 + val * 4;

    // Glow halo
    const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
    glowGrad.addColorStop(0, cc.pAlpha(val * 0.3));
    glowGrad.addColorStop(1, cc.pAlpha(0));
    ctx.fillStyle = glowGrad;
    ctx.fillRect(x - size * 3, y - size * 3, size * 6, size * 6);

    // Core
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = cc.pAlpha(0.5 + val * 0.5);
    ctx.fill();
  }

  // Center burst
  const burstR = 5 + bassPulse * 10;
  ctx.beginPath();
  ctx.arc(0, 0, burstR, 0, Math.PI * 2);
  ctx.fillStyle = cc.aAlpha(0.8);
  ctx.fill();

  ctx.restore();
}

// === WAVEFORM ===
function drawWaveform(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse } = rc;
  const cy = height / 2;
  const bufLen = engine.timeDomainData.length;

  // Bass background
  if (bassPulse > 0.2) {
    const grad = ctx.createRadialGradient(width / 2, cy, 0, width / 2, cy, width * 0.4);
    grad.addColorStop(0, cc.pAlpha(bassPulse * 0.1));
    grad.addColorStop(1, cc.pAlpha(0));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Frequency bars — batch
  const barCount = 64;
  const barStep = Math.floor(engine.frequencyData.length / barCount);
  const barW = width / barCount;

  ctx.fillStyle = cc.pAlpha(0.5);
  for (let i = 0; i < barCount; i++) {
    const val = engine.frequencyData[i * barStep] / 255;
    const barH = val * height * 0.35;
    if (barH < 1) continue;
    const alpha = 0.3 + val * 0.5;
    ctx.fillStyle = cc.pAlpha(alpha);
    ctx.fillRect(i * barW, height - barH, barW - 1, barH);
  }

  // Waveform — sample every 4th point for performance
  const skip = rc.performanceMode === 'light' ? 8 : rc.performanceMode === 'balanced' ? 4 : 1;

  ctx.beginPath();
  let started = false;
  for (let i = 0; i < bufLen; i += skip) {
    const v = engine.timeDomainData[i] / 128.0;
    const x = (i / bufLen) * width;
    const y = (v * height) / 2;
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = cc.primary;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Mirror
  ctx.beginPath();
  started = false;
  for (let i = 0; i < bufLen; i += skip) {
    const v = engine.timeDomainData[i] / 128.0;
    const x = (i / bufLen) * width;
    const y = height - (v * height) / 2;
    if (!started) { ctx.moveTo(x, y); started = true; }
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = cc.pAlpha(0.25);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Center line
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.strokeStyle = cc.pAlpha(0.1);
  ctx.lineWidth = 0.5;
  ctx.stroke();
}


// === PARTICLE ===
function drawParticle(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const centerX = width / 2;
  const centerY = height / 2;
  const isLight = rc.performanceMode === 'light';

  const particleCount = isLight ? 80 : 120;
  const step = Math.floor(engine.frequencyData.length / particleCount);

  for (let i = 0; i < particleCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const angle = (i / particleCount) * Math.PI * 2 + time * 0.25;
    const baseDist = 40 + (i / particleCount) * Math.min(width, height) * 0.38;
    const dist = baseDist + val * 80 + bassPulse * 20;

    const x = centerX + Math.cos(angle) * dist;
    const y = centerY + Math.sin(angle) * dist;
    const size = 1 + val * 4;

    // Glow halo via radial gradient (cheaper than shadowBlur)
    if (val > 0.3 && !isLight) {
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, size * 4);
      glowGrad.addColorStop(0, cc.pAlpha(val * 0.2));
      glowGrad.addColorStop(1, cc.pAlpha(0));
      ctx.fillStyle = glowGrad;
      ctx.fillRect(x - size * 4, y - size * 4, size * 8, size * 8);
    }

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = cc.pAlpha(0.4 + val * 0.6);
    ctx.fill();
  }

  // Center energy
  const energyR = 20 + bassPulse * 45;
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, energyR);
  grad.addColorStop(0, cc.pAlpha(0.6));
  grad.addColorStop(0.5, cc.pAlpha(0.15));
  grad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, energyR, 0, Math.PI * 2);
  ctx.fill();

  // Core dot
  ctx.beginPath();
  ctx.arc(centerX, centerY, 4 + bassPulse * 6, 0, Math.PI * 2);
  ctx.fillStyle = cc.primary;
  ctx.fill();

  // Rings
  for (let r = 0; r < 3; r++) {
    const ringR = 60 + r * 40 + bassPulse * 15;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = cc.pAlpha(r === 0 ? 0.25 : 0.1);
    ctx.lineWidth = r === 0 ? 1.2 : 0.5;
    ctx.stroke();
  }
}

// === BASS CANNON ===
function drawBassCannon(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, engine, bassPulse, time } = rc;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxR = Math.min(width, height) * 0.4;

  // Shockwaves
  for (let i = 0; i < 4; i++) {
    const phase = (time * 3 + i * 0.7) % 4;
    const r = phase * maxR;
    const alpha = Math.max(0, 1 - phase / 4) * bassPulse * 0.6;
    if (alpha < 0.02) continue;
    ctx.beginPath();
    ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
    ctx.strokeStyle = cc.pAlpha(alpha);
    ctx.lineWidth = 3 - phase * 0.5;
    ctx.stroke();
  }

  // Center explosion
  const explosionR = 10 + bassPulse * 70;
  const explosionGrad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, explosionR);
  explosionGrad.addColorStop(0, '#ffffff');
  explosionGrad.addColorStop(0.15, cc.primary);
  explosionGrad.addColorStop(0.5, cc.pAlpha(0.3));
  explosionGrad.addColorStop(1, cc.pAlpha(0));
  ctx.fillStyle = explosionGrad;
  ctx.beginPath();
  ctx.arc(centerX, centerY, explosionR, 0, Math.PI * 2);
  ctx.fill();

  // Burst lines — batch
  const burstCount = 24;
  ctx.lineWidth = 2;
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    const val = engine.frequencyData[i * Math.floor(engine.frequencyData.length / burstCount)] / 255;
    const innerR = 15 + bassPulse * 25;
    const outerR = innerR + val * maxR * 0.5;

    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.strokeStyle = cc.pAlpha(0.3 + val * 0.5);
    ctx.lineWidth = 1.5 + val * 2;
    ctx.stroke();
  }

  // Spectrum ring
  const specCount = 64;
  const specStep = Math.floor(engine.frequencyData.length / specCount);
  ctx.lineWidth = 2;
  for (let i = 0; i < specCount; i++) {
    const angle = (i / specCount) * Math.PI * 2;
    const val = engine.frequencyData[i * specStep] / 255;
    const innerR = maxR * 0.5;
    const outerR = innerR + val * maxR * 0.3;

    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.strokeStyle = cc.aAlpha(val * 0.7);
    ctx.stroke();
  }
}

// === HUD OVERLAY ===
function drawHUDOverlay(rc: RenderContext, cc: ColorCache) {
  const { ctx, width, height, mainText, subText, bassPulse, engine, themePrimary } = rc;

  const textColor = themePrimary || cc.primary;

  // Info text
  const fontSize = Math.max(10, width * 0.012);
  ctx.font = `${fontSize}px "Inter", sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillStyle = cc.pAlpha(0.3);
  ctx.fillText(`B:${(engine.bassEnergy * 100).toFixed(0)} M:${(engine.midEnergy * 100).toFixed(0)} H:${(engine.highEnergy * 100).toFixed(0)}`, 16, 24);

  ctx.textAlign = 'right';
  ctx.fillText(`Peak:${(engine.peak * 100).toFixed(0)} Pulse:${(bassPulse * 100).toFixed(0)}`, width - 16, 24);

  // Main text
  if (mainText) {
    const mainFontSize = Math.max(18, width * 0.035);
    ctx.font = `600 ${mainFontSize}px "Inter", sans-serif`;
    ctx.fillStyle = textColor;
    ctx.textAlign = 'center';
    ctx.fillText(mainText, width / 2, height - 40);
  }

  if (subText) {
    ctx.font = `${Math.max(10, width * 0.015)}px "Inter", sans-serif`;
    ctx.fillStyle = cc.pAlpha(0.5);
    ctx.textAlign = 'center';
    ctx.fillText(subText, width / 2, height - 18);
  }
}

// === MAIN RENDER ===
export function renderFrame(rc: RenderContext) {
  const { ctx, width, height, themeBg } = rc;
  const cc = makeColorCache(rc.colors);

  // Use theme background if it's a light theme, otherwise use color preset bg
  ctx.fillStyle = themeBg || cc.bg;
  ctx.fillRect(0, 0, width, height);

  // Screen shake
  const hasShake = rc.shakeX !== 0 || rc.shakeY !== 0;
  if (hasShake) {
    ctx.save();
    ctx.translate(rc.shakeX, rc.shakeY);
  }

  drawGrid(ctx, width, height, cc.grid);
  drawBassPulse(rc, cc);

  switch (rc.mode) {
    case 'circular-target': drawCircularTarget(rc, cc); break;
    case 'radar': drawRadar(rc, cc); break;
    case 'waveform': drawWaveform(rc, cc); break;
    case 'particle': drawParticle(rc, cc); break;
    case 'bass-cannon': drawBassCannon(rc, cc); break;
  }

  drawHUDOverlay(rc, cc);

  if (hasShake) ctx.restore();
}
