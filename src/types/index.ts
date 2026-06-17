export type VisualMode = 'circular-target' | 'radar' | 'waveform' | 'particle' | 'bass-cannon' | 'neon-grid' | 'dna-helix' | 'wave-tunnel' | 'starburst' | 'pulse-rings' | 'lava-lamp' | 'glitch' | 'spiral' | 'hexagon' | 'matrix-rain' | 'aurora' | 'orbit' | 'wave-bars' | 'ripple' | 'heartbeat' | 'mosaic' | 'fractal';
export type VisualMovement = 'static' | 'sequential' | 'random';
export type ColorPreset = 'neon-sunset' | 'cyber-noir' | 'toxic-green' | 'vaporwave' | 'bloodmoon' | 'glacial' | 'phantom-purple';
export type AspectRatio = 'landscape' | 'square' | 'vertical';
export type PerformanceMode = 'light' | 'balanced' | 'ultra';
export type ExportFormat = 'webm' | 'mp4';
export type ExportDuration = 5 | 10 | 15 | 30 | 'full';
export type RepeatMode = 'none' | 'one' | 'all' | 'shuffle';
export type CanvasResolution = '480p' | '720p' | '1080p' | '2k' | '4k';

export type ThemeName = 'darkmatter' | 'claude' | 'minimal' | 'vercel' | 'supabase' | 'amethyst' | 'whatsapp' | 'shark' | 'domo' | 'zenshin' | 'coldstream' | 'awesome';
export type ThemeMode = 'light' | 'dark';
export type AppTheme = `${ThemeName}-${ThemeMode}`;

export interface Track {
  id: string;
  file: File;
  name: string;
  url: string;
  duration: number;
}

export interface ColorScheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
  bg: string;
  grid: string;
  name: string;
}

export interface AppThemeConfig {
  name: string;
  label: string;
  primary: string;
  panel: string;
  panelBorder: string;
  panelBg: string;
  glow: string;
}

export const THEME_NAMES: Record<ThemeName, string> = {
  darkmatter: 'Dark Matter',
  claude: 'Claude',
  minimal: 'Minimal',
  vercel: 'Vercel',
  supabase: 'Supabase',
  amethyst: 'Amethyst',
  whatsapp: 'WhatsApp',
  shark: 'Shark',
  domo: 'Domo',
  zenshin: 'Zenshin',
  coldstream: 'Coldstream',
  awesome: 'Awesome',
};

export const APP_THEMES: Record<AppTheme, AppThemeConfig> = {
  // ========== DARK MATTER ==========
  'darkmatter-light': {
    name: 'DARK MATTER',
    label: 'Dark Matter',
    primary: '#374151',
    panel: '#ffffff',
    panelBorder: '#e5e7eb',
    panelBg: '#f9fafb',
    glow: '#6366f122',
  },
  'darkmatter-dark': {
    name: 'DARK MATTER',
    label: 'Dark Matter',
    primary: '#c7d2fe',
    panel: '#0f1023',
    panelBorder: '#1e1b4b',
    panelBg: '#0a0b1a',
    glow: '#6366f144',
  },

  // ========== CLAUDE ==========
  'claude-light': {
    name: 'CLAUDE',
    label: 'Claude',
    primary: '#92400e',
    panel: '#fffbeb',
    panelBorder: '#fde68a',
    panelBg: '#fef3c7',
    glow: '#f59e0b22',
  },
  'claude-dark': {
    name: 'CLAUDE',
    label: 'Claude',
    primary: '#fcd34d',
    panel: '#1c1917',
    panelBorder: '#44403c',
    panelBg: '#1a1816',
    glow: '#f59e0b44',
  },

  // ========== MODERN MINIMAL ==========
  'minimal-light': {
    name: 'MINIMAL',
    label: 'Minimal',
    primary: '#171717',
    panel: '#ffffff',
    panelBorder: '#e5e5e5',
    panelBg: '#fafafa',
    glow: '#00000010',
  },
  'minimal-dark': {
    name: 'MINIMAL',
    label: 'Minimal',
    primary: '#f5f5f5',
    panel: '#0a0a0a',
    panelBorder: '#262626',
    panelBg: '#111111',
    glow: '#ffffff10',
  },

  // ========== VERCEL ==========
  'vercel-light': {
    name: 'VERCEL',
    label: 'Vercel',
    primary: '#000000',
    panel: '#ffffff',
    panelBorder: '#eaeaea',
    panelBg: '#fafafa',
    glow: '#00000015',
  },
  'vercel-dark': {
    name: 'VERCEL',
    label: 'Vercel',
    primary: '#ededed',
    panel: '#000000',
    panelBorder: '#333333',
    panelBg: '#0a0a0a',
    glow: '#ffffff20',
  },

  // ========== SUPABASE ==========
  'supabase-light': {
    name: 'SUPABASE',
    label: 'Supabase',
    primary: '#1a1a2e',
    panel: '#ffffff',
    panelBorder: '#d1fae5',
    panelBg: '#ecfdf5',
    glow: '#10b98122',
  },
  'supabase-dark': {
    name: 'SUPABASE',
    label: 'Supabase',
    primary: '#6ee7b7',
    panel: '#0a1a14',
    panelBorder: '#064e3b',
    panelBg: '#061f16',
    glow: '#10b98144',
  },

  // ========== AMETHYST ==========
  'amethyst-light': {
    name: 'AMETHYST',
    label: 'Amethyst',
    primary: '#581c87',
    panel: '#ffffff',
    panelBorder: '#e9d5ff',
    panelBg: '#faf5ff',
    glow: '#a855f722',
  },
  'amethyst-dark': {
    name: 'AMETHYST',
    label: 'Amethyst',
    primary: '#d8b4fe',
    panel: '#130a1f',
    panelBorder: '#3b0764',
    panelBg: '#0f0818',
    glow: '#a855f744',
  },

  // ========== WHATSAPP ==========
  'whatsapp-light': {
    name: 'WHATSAPP',
    label: 'WhatsApp',
    primary: '#075e54',
    panel: '#ffffff',
    panelBorder: '#d1fae5',
    panelBg: '#f0fdf4',
    glow: '#25d36622',
  },
  'whatsapp-dark': {
    name: 'WHATSAPP',
    label: 'WhatsApp',
    primary: '#25d366',
    panel: '#0b1a14',
    panelBorder: '#1a3a28',
    panelBg: '#081510',
    glow: '#25d36644',
  },

  // ========== SHARK ==========
  'shark-light': {
    name: 'SHARK',
    label: 'Shark',
    primary: '#1a4d8c',
    panel: '#fcfcfc',
    panelBorder: '#000000',
    panelBg: '#f1f1f1',
    glow: '#66666622',
  },
  'shark-dark': {
    name: 'SHARK',
    label: 'Shark',
    primary: '#7b5cf6',
    panel: '#3f3f6c',
    panelBorder: '#727272',
    panelBg: '#000000',
    glow: '#7b5cf644',
  },

  // ========== DOMO ==========
  'domo-light': {
    name: 'DOMO',
    label: 'Domo',
    primary: '#4287f5',
    panel: '#ffffff',
    panelBorder: '#e8e8e8',
    panelBg: '#f5f5f5',
    glow: '#4287f522',
  },
  'domo-dark': {
    name: 'DOMO',
    label: 'Domo',
    primary: '#4287f5',
    panel: '#313142',
    panelBorder: '#494965',
    panelBg: '#2d2d44',
    glow: '#4287f544',
  },

  // ========== ZENSHIN BRUTALIST ==========
  'zenshin-light': {
    name: 'ZENSHIN',
    label: 'Zenshin',
    primary: '#373a36',
    panel: '#faf7f2',
    panelBorder: '#eaeaea',
    panelBg: '#f6f0e6',
    glow: '#727a6d22',
  },
  'zenshin-dark': {
    name: 'ZENSHIN',
    label: 'Zenshin',
    primary: '#f6f0e6',
    panel: '#373a36',
    panelBorder: '#4c4c4c',
    panelBg: '#373a36',
    glow: '#727a6d44',
  },

  // ========== COLDSTREAM ==========
  'coldstream-light': {
    name: 'COLDSTREAM',
    label: 'Coldstream',
    primary: '#5a6e8a',
    panel: '#ffffff',
    panelBorder: '#ebe0e0',
    panelBg: '#fcfcfc',
    glow: '#7ca1ae22',
  },
  'coldstream-dark': {
    name: 'COLDSTREAM',
    label: 'Coldstream',
    primary: '#5a6e8a',
    panel: '#3b5a6b',
    panelBorder: '#636363',
    panelBg: '#3a3c57',
    glow: '#7ca1ae44',
  },

  // ========== AWESOME ==========
  'awesome-light': {
    name: 'AWESOME',
    label: 'Awesome',
    primary: '#dc4a1a',
    panel: '#ffffff',
    panelBorder: '#e8e8e8',
    panelBg: '#fdf0e6',
    glow: '#dc4a1a22',
  },
  'awesome-dark': {
    name: 'AWESOME',
    label: 'Awesome',
    primary: '#ed5c24',
    panel: '#363755',
    panelBorder: '#4f5075',
    panelBg: '#34365a',
    glow: '#ed5c2444',
  },
};

export const COLOR_PRESETS: Record<ColorPreset, ColorScheme> = {
  'neon-sunset': {
    primary: '#f59e0b',
    secondary: '#ef4444',
    accent: '#fbbf24',
    glow: '#f59e0baa',
    bg: '#0a0a0a',
    grid: '#f59e0b15',
    name: 'NEON SUNSET',
  },
  'cyber-noir': {
    primary: '#06b6d4',
    secondary: '#8b5cf6',
    accent: '#ec4899',
    glow: '#06b6d4aa',
    bg: '#060612',
    grid: '#06b6d415',
    name: 'CYBER NOIR',
  },
  'toxic-green': {
    primary: '#22c55e',
    secondary: '#eab308',
    accent: '#10b981',
    glow: '#22c55eaa',
    bg: '#060a06',
    grid: '#22c55e15',
    name: 'TOXIC GREEN',
  },
  'vaporwave': {
    primary: '#a855f7',
    secondary: '#ec4899',
    accent: '#6366f1',
    glow: '#a855f7aa',
    bg: '#0a0614',
    grid: '#a855f715',
    name: 'VAPORWAVE',
  },
  'bloodmoon': {
    primary: '#ef4444',
    secondary: '#f97316',
    accent: '#dc2626',
    glow: '#ef4444aa',
    bg: '#140606',
    grid: '#ef444415',
    name: 'BLOODMOON',
  },
  'glacial': {
    primary: '#38bdf8',
    secondary: '#06b6d4',
    accent: '#a855f7',
    glow: '#38bdf8aa',
    bg: '#060a14',
    grid: '#38bdf815',
    name: 'GLACIAL',
  },
  'phantom-purple': {
    primary: '#d4d4d4',
    secondary: '#a855f7',
    accent: '#6366f1',
    glow: '#d4d4d488',
    bg: '#0a0a0a',
    grid: '#d4d4d410',
    name: 'PHANTOM PURPLE',
  },
};

export const ASPECT_RATIOS: Record<AspectRatio, { w: number; h: number; label: string }> = {
  landscape: { w: 16, h: 9, label: '16:9' },
  square: { w: 1, h: 1, label: '1:1' },
  vertical: { w: 9, h: 16, label: '9:16' },
};

export const CANVAS_RESOLUTIONS: Record<CanvasResolution, { w: number; h: number; label: string }> = {
  '480p': { w: 854, h: 480, label: '480p' },
  '720p': { w: 1280, h: 720, label: '720p' },
  '1080p': { w: 1920, h: 1080, label: '1080p' },
  '2k': { w: 2560, h: 1440, label: '2K' },
  '4k': { w: 3840, h: 2160, label: '4K' },
};

export const ALL_VISUAL_MODES: VisualMode[] = [
  'circular-target', 'radar', 'waveform', 'particle', 'bass-cannon',
  'neon-grid', 'dna-helix', 'wave-tunnel', 'starburst', 'pulse-rings',
  'lava-lamp', 'glitch', 'spiral', 'hexagon', 'matrix-rain',
  'aurora', 'orbit', 'wave-bars', 'ripple', 'heartbeat', 'mosaic', 'fractal',
];

export const VISUAL_MOVEMENTS: Record<VisualMovement, string> = {
  static: 'Static',
  sequential: 'Sequential',
  random: 'Random',
};
