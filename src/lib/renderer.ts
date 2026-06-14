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
}

function drawCircularTarget(rc: RenderContext) {
  const { ctx, width, height, engine, colors, time, bassPulse } = rc;
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
      ctx.strokeStyle = colors.primary + Math.floor((1 - i * 0.3) * bassPulse * 80).toString(16).padStart(2, '0');
      ctx.lineWidth = 3 - i;
      ctx.stroke();
    }
  }

  // Concentric rings with glow
  for (let i = 6; i >= 1; i--) {
    const r = maxR * (i / 6);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.strokeStyle = colors.primary + (i === 1 ? 'cc' : '33');
    ctx.lineWidth = i === 1 ? 2 : 0.8;
    if (i <= 2) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 10 + bassPulse * 15;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Crosshairs with glow
  ctx.strokeStyle = colors.primary + '55';
  ctx.lineWidth = 0.6;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 5;
  for (let a = 0; a < 360; a += 45) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * maxR * 0.12, Math.sin(rad) * maxR * 0.12);
    ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Frequency bars in circular layout - MORE BARS, MORE GLOW
  const barCount = 80;
  const step = Math.floor(engine.frequencyData.length / barCount);
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
    const val = engine.frequencyData[i * step] / 255;
    const barH = val * maxR * 0.5;
    const innerR = maxR * 0.22 + bassPulse * 8;

    ctx.save();
    ctx.rotate(angle);

    // Bar body
    ctx.beginPath();
    ctx.moveTo(innerR, -2);
    ctx.lineTo(innerR + barH, -2);
    ctx.lineTo(innerR + barH, 2);
    ctx.lineTo(innerR, 2);
    ctx.closePath();

    const alpha = 0.4 + val * 0.6;
    ctx.fillStyle = colors.primary + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    if (val > 0.6) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = val * 20;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Tip glow dot
    if (val > 0.5) {
      ctx.beginPath();
      ctx.arc(innerR + barH, 0, 2 + val * 2, 0, Math.PI * 2);
      ctx.fillStyle = colors.accent + Math.floor(val * 200).toString(16).padStart(2, '0');
      ctx.shadowColor = colors.accent;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  }

  // Inner spectrum ring
  const innerR2 = maxR * 0.18;
  ctx.beginPath();
  ctx.arc(0, 0, innerR2, 0, Math.PI * 2);
  ctx.strokeStyle = colors.accent + '66';
  ctx.lineWidth = 3;
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 12 + bassPulse * 20;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Center bass pulse - HUGE
  const pulseR = 18 + bassPulse * 50;
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, pulseR);
  gradient.addColorStop(0, colors.primary + 'ff');
  gradient.addColorStop(0.3, colors.primary + 'aa');
  gradient.addColorStop(0.7, colors.primary + '44');
  gradient.addColorStop(1, colors.primary + '00');
  ctx.beginPath();
  ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 30 + bassPulse * 40;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Rotating sweep with wider trail
  const sweepAngle = (time * 0.8) % (Math.PI * 2);
  const sweepGrad = ctx.createConicGradient(sweepAngle, 0, 0);
  sweepGrad.addColorStop(0, colors.primary + '66');
  sweepGrad.addColorStop(0.08, colors.primary + '33');
  sweepGrad.addColorStop(0.15, colors.primary + '00');
  sweepGrad.addColorStop(1, colors.primary + '00');
  ctx.beginPath();
  ctx.arc(0, 0, maxR, 0, Math.PI * 2);
  ctx.fillStyle = sweepGrad;
  ctx.fill();

  ctx.restore();
}

function drawRadar(rc: RenderContext) {
  const { ctx, width, height, engine, colors, time, bassPulse } = rc;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.38;

  ctx.save();
  ctx.translate(cx, cy);

  // Expanding shockwave rings on bass
  if (bassPulse > 0.4) {
    for (let i = 0; i < 4; i++) {
      const phase = (time * 2 + i * 0.5) % 3;
      const r = phase * maxR;
      const alpha = Math.max(0, 1 - phase / 3) * bassPulse;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = colors.primary + Math.floor(alpha * 100).toString(16).padStart(2, '0');
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Grid rings with glow
  for (let i = 1; i <= 6; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, maxR * (i / 6), 0, Math.PI * 2);
    ctx.strokeStyle = i % 2 === 0 ? colors.grid : colors.primary + '1a';
    ctx.lineWidth = i === 6 ? 1.5 : 0.5;
    if (i === 6) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Radial lines
  for (let a = 0; a < 360; a += 30) {
    const rad = (a * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(rad) * maxR, Math.sin(rad) * maxR);
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }

  // Degree markers
  ctx.font = `${Math.max(8, maxR * 0.06)}px "Share Tech Mono", monospace`;
  ctx.fillStyle = colors.primary + '55';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let a = 0; a < 360; a += 90) {
    const rad = (a * Math.PI) / 180;
    const labelR = maxR + 15;
    ctx.fillText(`${a}°`, Math.cos(rad) * labelR, Math.sin(rad) * labelR);
  }

  // Sweep line with GLOW
  const sweepAngle = time * 2;
  ctx.save();
  ctx.rotate(sweepAngle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(maxR, 0);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 20;
  ctx.stroke();

  // Wide sweep fan
  const sweepGrad = ctx.createLinearGradient(0, 0, maxR, 0);
  sweepGrad.addColorStop(0, colors.primary + '88');
  sweepGrad.addColorStop(0.5, colors.primary + '33');
  sweepGrad.addColorStop(1, colors.primary + '00');
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(maxR, -maxR * 0.2);
  ctx.lineTo(maxR, 0);
  ctx.closePath();
  ctx.fillStyle = sweepGrad;
  ctx.fill();
  ctx.restore();

  // Frequency dots - MORE, BIGGER
  const dotCount = 48;
  const step = Math.floor(engine.frequencyData.length / dotCount);
  for (let i = 0; i < dotCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    if (val < 0.15) continue;
    const angle = (i / dotCount) * Math.PI * 2 + time * 0.4;
    const dist = val * maxR * 0.9;
    const x = Math.cos(angle) * dist;
    const y = Math.sin(angle) * dist;
    const size = 2 + val * 5;

    // Outer glow
    ctx.beginPath();
    ctx.arc(x, y, size * 4, 0, Math.PI * 2);
    ctx.fillStyle = colors.glow + Math.floor(val * 25).toString(16).padStart(2, '0');
    ctx.fill();

    // Core
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary + Math.floor((0.5 + val * 0.5) * 255).toString(16).padStart(2, '0');
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = val * 15;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Center energy burst
  const burstR = 6 + bassPulse * 12;
  ctx.beginPath();
  ctx.arc(0, 0, burstR, 0, Math.PI * 2);
  ctx.fillStyle = colors.accent;
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 20 + bassPulse * 30;
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawWaveform(rc: RenderContext) {
  const { ctx, width, height, engine, colors, bassPulse } = rc;
  const cy = height / 2;
  const bufLen = engine.timeDomainData.length;

  // Glow background on bass
  if (bassPulse > 0.3) {
    const grad = ctx.createRadialGradient(width / 2, cy, 0, width / 2, cy, width * 0.4);
    grad.addColorStop(0, colors.primary + Math.floor(bassPulse * 25).toString(16).padStart(2, '0'));
    grad.addColorStop(1, colors.primary + '00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }

  // Frequency bars at bottom - THICKER, GLOWING
  const barCount = 100;
  const barStep = Math.floor(engine.frequencyData.length / barCount);
  const barW = width / barCount;
  for (let i = 0; i < barCount; i++) {
    const val = engine.frequencyData[i * barStep] / 255;
    const barH = val * height * 0.35;
    const alpha = 0.3 + val * 0.7;
    ctx.fillStyle = colors.primary + Math.floor(alpha * 255).toString(16).padStart(2, '0');
    if (val > 0.7) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = val * 12;
    }
    ctx.fillRect(i * barW, height - barH, barW - 1, barH);
    ctx.shadowBlur = 0;

    // Top cap glow
    if (val > 0.5) {
      ctx.fillStyle = colors.accent + Math.floor(val * 150).toString(16).padStart(2, '0');
      ctx.fillRect(i * barW, height - barH - 3, barW - 1, 3);
    }
  }

  // Main waveform - THICK, GLOWING
  ctx.beginPath();
  const sliceWidth = width / bufLen;
  let x = 0;
  for (let i = 0; i < bufLen; i++) {
    const v = engine.timeDomainData[i] / 128.0;
    const y = (v * height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }

  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 20 + bassPulse * 25;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Secondary glow line
  ctx.strokeStyle = colors.accent + '44';
  ctx.lineWidth = 6;
  ctx.shadowColor = colors.accent;
  ctx.shadowBlur = 15;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Mirror waveform
  ctx.beginPath();
  x = 0;
  for (let i = 0; i < bufLen; i++) {
    const v = engine.timeDomainData[i] / 128.0;
    const y = height - (v * height) / 2;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
    x += sliceWidth;
  }
  ctx.strokeStyle = colors.secondary + '55';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Center line with glow
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.strokeStyle = colors.primary + '20';
  ctx.lineWidth = 0.8;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 5;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function drawParticle(rc: RenderContext) {
  const { ctx, width, height, engine, colors, time, bassPulse } = rc;
  const cx = width / 2;
  const cy = height / 2;

  // Particle field - MORE PARTICLES
  const particleCount = 200;
  const step = Math.floor(engine.frequencyData.length / particleCount);

  for (let i = 0; i < particleCount; i++) {
    const val = engine.frequencyData[i * step] / 255;
    const angle = (i / particleCount) * Math.PI * 2 + time * 0.25;
    const baseDist = 40 + (i / particleCount) * Math.min(width, height) * 0.38;
    const dist = baseDist + val * 100 + bassPulse * 30;

    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const size = 1 + val * 5;

    // Outer glow
    if (val > 0.3) {
      ctx.beginPath();
      ctx.arc(x, y, size * 5, 0, Math.PI * 2);
      ctx.fillStyle = colors.glow + Math.floor(val * 20).toString(16).padStart(2, '0');
      ctx.fill();
    }

    // Core particle
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = colors.primary + Math.floor((0.4 + val * 0.6) * 255).toString(16).padStart(2, '0');
    if (val > 0.5) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = val * 18;
    }
    ctx.fill();
    ctx.shadowBlur = 0;

    // Connect nearby particles with glowing lines
    if (i > 0 && val > 0.35) {
      const prevVal = engine.frequencyData[(i - 1) * step] / 255;
      if (prevVal > 0.35) {
        const prevAngle = ((i - 1) / particleCount) * Math.PI * 2 + time * 0.25;
        const prevDist = 40 + ((i - 1) / particleCount) * Math.min(width, height) * 0.38 + prevVal * 100;
        const px = cx + Math.cos(prevAngle) * prevDist;
        const py = cy + Math.sin(prevAngle) * prevDist;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(px, py);
        ctx.strokeStyle = colors.primary + '30';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  // Center energy ball - HUGE with layered glow
  const energyR = 25 + bassPulse * 60;
  const layers = [
    { r: energyR * 2, alpha: 0.05 },
    { r: energyR * 1.5, alpha: 0.1 },
    { r: energyR, alpha: 0.2 },
    { r: energyR * 0.5, alpha: 0.5 },
  ];
  for (const layer of layers) {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, layer.r);
    grad.addColorStop(0, colors.primary + Math.floor(layer.alpha * 255).toString(16).padStart(2, '0'));
    grad.addColorStop(1, colors.primary + '00');
    ctx.beginPath();
    ctx.arc(cx, cy, layer.r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Bright core
  ctx.beginPath();
  ctx.arc(cx, cy, 5 + bassPulse * 8, 0, Math.PI * 2);
  ctx.fillStyle = colors.primary;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 30;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Orbiting rings
  for (let r = 0; r < 4; r++) {
    const ringR = 70 + r * 45 + bassPulse * 20;
    ctx.beginPath();
    ctx.arc(cx, cy, ringR, 0, Math.PI * 2);
    ctx.strokeStyle = colors.primary + (r === 0 ? '44' : '1a');
    ctx.lineWidth = r === 0 ? 1.5 : 0.5;
    if (r === 0) {
      ctx.shadowColor = colors.glow;
      ctx.shadowBlur = 8;
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
}

function drawBassCannon(rc: RenderContext) {
  const { ctx, width, height, engine, colors, time, bassPulse } = rc;
  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.min(width, height) * 0.4;

  // Massive bass shockwaves
  for (let i = 0; i < 5; i++) {
    const phase = (time * 3 + i * 0.7) % 4;
    const r = phase * maxR;
    const alpha = Math.max(0, 1 - phase / 4) * bassPulse * 0.8;
    if (alpha < 0.02) continue;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = colors.primary + Math.floor(alpha * 200).toString(16).padStart(2, '0');
    ctx.lineWidth = 4 - phase;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Center explosion
  const explosionR = 10 + bassPulse * 80;
  const explosionGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, explosionR);
  explosionGrad.addColorStop(0, '#ffffff');
  explosionGrad.addColorStop(0.2, colors.primary);
  explosionGrad.addColorStop(0.5, colors.primary + '66');
  explosionGrad.addColorStop(1, colors.primary + '00');
  ctx.beginPath();
  ctx.arc(cx, cy, explosionR, 0, Math.PI * 2);
  ctx.fillStyle = explosionGrad;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 40 + bassPulse * 40;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Radial burst lines
  const burstCount = 36;
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    const val = engine.frequencyData[i * Math.floor(engine.frequencyData.length / burstCount)] / 255;
    const innerR = 20 + bassPulse * 30;
    const outerR = innerR + val * maxR * 0.6;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.strokeStyle = colors.primary + Math.floor((0.3 + val * 0.7) * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 2 + val * 3;
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = val * 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Frequency spectrum ring
  const specCount = 120;
  const specStep = Math.floor(engine.frequencyData.length / specCount);
  for (let i = 0; i < specCount; i++) {
    const angle = (i / specCount) * Math.PI * 2;
    const val = engine.frequencyData[i * specStep] / 255;
    const innerR = maxR * 0.5;
    const outerR = innerR + val * maxR * 0.35;

    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
    ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
    ctx.strokeStyle = colors.accent + Math.floor(val * 180).toString(16).padStart(2, '0');
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  // Corner targeting brackets
  const bSize = 40;
  const corners = [
    [30, 30, 1, 1],
    [width - 30, 30, -1, 1],
    [30, height - 30, 1, -1],
    [width - 30, height - 30, -1, -1],
  ];
  ctx.strokeStyle = colors.accent + '88';
  ctx.lineWidth = 2;
  for (const [bx, by, dx, dy] of corners) {
    ctx.beginPath();
    ctx.moveTo(bx, by + bSize * dy);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + bSize * dx, by);
    ctx.stroke();
  }
}

function drawGrid(rc: RenderContext) {
  const { ctx, width, height, colors } = rc;
  const gridSize = 40;

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 0.3;

  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function drawHUDOverlay(rc: RenderContext) {
  const { ctx, width, height, colors, mainText, subText, bassPulse, engine } = rc;

  // Corner brackets - GLOWING
  const bracketSize = 35;
  ctx.strokeStyle = colors.primary + '88';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = 8;

  const corners = [
    { x: 15, y: 15, dx: 1, dy: 1 },
    { x: width - 15, y: 15, dx: -1, dy: 1 },
    { x: 15, y: height - 15, dx: 1, dy: -1 },
    { x: width - 15, y: height - 15, dx: -1, dy: -1 },
  ];

  for (const c of corners) {
    ctx.beginPath();
    ctx.moveTo(c.x, c.y + bracketSize * c.dy);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(c.x + bracketSize * c.dx, c.y);
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Top info bar
  ctx.font = `${Math.max(9, width * 0.012)}px "Share Tech Mono", monospace`;
  ctx.textAlign = 'left';
  ctx.fillStyle = colors.primary + '44';
  ctx.fillText(`BASS: ${(engine.bassEnergy * 100).toFixed(0)}%  MID: ${(engine.midEnergy * 100).toFixed(0)}%  HIGH: ${(engine.highEnergy * 100).toFixed(0)}%`, 20, 30);

  ctx.textAlign = 'right';
  ctx.fillText(`PEAK: ${(engine.peak * 100).toFixed(0)}%  PULSE: ${(bassPulse * 100).toFixed(0)}%`, width - 20, 30);

  // Main text - GLOWING
  if (mainText) {
    ctx.font = `bold ${Math.max(18, width * 0.04)}px "Share Tech Mono", monospace`;
    ctx.fillStyle = colors.primary;
    ctx.textAlign = 'center';
    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 15 + bassPulse * 15;
    ctx.fillText(mainText, width / 2, height - 45);
    ctx.shadowBlur = 0;

    // Text underline
    const textW = ctx.measureText(mainText).width;
    ctx.beginPath();
    ctx.moveTo(width / 2 - textW / 2, height - 38);
    ctx.lineTo(width / 2 + textW / 2, height - 38);
    ctx.strokeStyle = colors.primary + '66';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Sub text
  if (subText) {
    ctx.font = `${Math.max(10, width * 0.018)}px "Share Tech Mono", monospace`;
    ctx.fillStyle = colors.secondary + 'aa';
    ctx.textAlign = 'center';
    ctx.fillText(subText, width / 2, height - 22);
  }
}

function drawBassPulse(rc: RenderContext) {
  const { ctx, width, height, colors, bassPulse } = rc;
  if (bassPulse < 0.2) return;

  const cx = width / 2;
  const cy = height / 2;
  const maxR = Math.max(width, height) * 0.6;

  // Multiple layered pulses
  for (let i = 0; i < 3; i++) {
    const r = maxR * bassPulse * (1 + i * 0.2);
    const alpha = Math.floor(bassPulse * (25 - i * 8));
    if (alpha < 1) continue;
    const grad = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
    grad.addColorStop(0, colors.primary + '00');
    grad.addColorStop(0.6, colors.primary + '00');
    grad.addColorStop(1, colors.primary + alpha.toString(16).padStart(2, '0'));
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}

function drawCRTOverlay(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // Scanlines
  ctx.fillStyle = 'rgba(0,0,0,0.04)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  // Moving scanline bar
  const scanY = ((time * 80) % (height + 60)) - 30;
  const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
  scanGrad.addColorStop(0, 'rgba(255,255,255,0)');
  scanGrad.addColorStop(0.5, 'rgba(255,255,255,0.03)');
  scanGrad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = scanGrad;
  ctx.fillRect(0, scanY - 30, width, 60);

  // Vignette
  const vigGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.75);
  vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
  vigGrad.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vigGrad;
  ctx.fillRect(0, 0, width, height);

  // Chromatic aberration simulation (subtle color shift on edges)
  ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = 'rgba(255,0,0,0.01)';
  ctx.fillRect(2, 0, width, height);
  ctx.fillStyle = 'rgba(0,0,255,0.01)';
  ctx.fillRect(-2, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  // Noise grain
  const noiseCount = 80;
  for (let i = 0; i < noiseCount; i++) {
    const nx = Math.random() * width;
    const ny = Math.random() * height;
    const na = Math.random() * 0.06;
    ctx.fillStyle = `rgba(255,255,255,${na})`;
    ctx.fillRect(nx, ny, 1, 1);
  }
}

export function renderFrame(rc: RenderContext) {
  const { ctx, width, height, colors } = rc;

  // Clear with slight trail for intensity
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // Apply screen shake
  if (rc.shakeX !== 0 || rc.shakeY !== 0) {
    ctx.save();
    ctx.translate(rc.shakeX, rc.shakeY);
  }

  // Grid
  drawGrid(rc);

  // Bass pulse (behind everything)
  drawBassPulse(rc);

  // Main visualization
  switch (rc.mode) {
    case 'circular-target':
      drawCircularTarget(rc);
      break;
    case 'radar':
      drawRadar(rc);
      break;
    case 'waveform':
      drawWaveform(rc);
      break;
    case 'particle':
      drawParticle(rc);
      break;
    case 'bass-cannon':
      drawBassCannon(rc);
      break;
  }

  // HUD overlay
  drawHUDOverlay(rc);

  // End screen shake
  if (rc.shakeX !== 0 || rc.shakeY !== 0) {
    ctx.restore();
  }

  // CRT overlay (on top of everything)
  drawCRTOverlay(ctx, width, height, rc.time);
}
