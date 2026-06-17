export type VisualMode = 'circular-target' | 'radar' | 'waveform' | 'particle' | 'bass-cannon';
export type ColorPreset = 'hazard' | 'cyber' | 'matrix' | 'plasma' | 'blood' | 'arctic' | 'phantom';
export type AspectRatio = 'landscape' | 'square' | 'vertical';
export type PerformanceMode = 'light' | 'balanced' | 'ultra';
export type ExportFormat = 'webm' | 'mp4';
export type ExportDuration = 5 | 10 | 15 | 30 | 'full';
export type AppTheme = 'light' | 'dark' | 'blue' | 'purple' | 'green';
export type RepeatMode = 'none' | 'one' | 'all' | 'shuffle';
export type CanvasResolution = '480p' | '720p' | '1080p' | '2k' | '4k';

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

export const APP_THEMES: Record<AppTheme, AppThemeConfig> = {
  'light': {
    name: 'LIGHT',
    label: 'Light',
    primary: '#1a1a2e',
    panel: '#ffffff',
    panelBorder: '#e5e7eb',
    panelBg: '#f9fafb',
    glow: '#3b82f622',
  },
  'dark': {
    name: 'DARK',
    label: 'Dark',
    primary: '#e2e8f0',
    panel: '#1e1e2e',
    panelBorder: '#313244',
    panelBg: '#181825',
    glow: '#89b4fa22',
  },
  'blue': {
    name: 'BLUE',
    label: 'Blue',
    primary: '#3b82f6',
    panel: '#0f172a',
    panelBorder: '#1e293b',
    panelBg: '#0f172a',
    glow: '#3b82f633',
  },
  'purple': {
    name: 'PURPLE',
    label: 'Purple',
    primary: '#a855f7',
    panel: '#1a1025',
    panelBorder: '#2e1f47',
    panelBg: '#150d20',
    glow: '#a855f733',
  },
  'green': {
    name: 'GREEN',
    label: 'Green',
    primary: '#22c55e',
    panel: '#0f1a14',
    panelBorder: '#1a3a28',
    panelBg: '#0c1510',
    glow: '#22c55e33',
  },
};

export const COLOR_PRESETS: Record<ColorPreset, ColorScheme> = {
  hazard: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#ef4444',
    glow: '#f59e0baa',
    bg: '#0a0a0a',
    grid: '#f59e0b18',
    name: 'HAZARD',
  },
  cyber: {
    primary: '#06b6d4',
    secondary: '#0891b2',
    accent: '#8b5cf6',
    glow: '#06b6d4aa',
    bg: '#060612',
    grid: '#06b6d418',
    name: 'CYBER',
  },
  matrix: {
    primary: '#22c55e',
    secondary: '#16a34a',
    accent: '#eab308',
    glow: '#22c55eaa',
    bg: '#060a06',
    grid: '#22c55e18',
    name: 'MATRIX',
  },
  plasma: {
    primary: '#a855f7',
    secondary: '#9333ea',
    accent: '#ec4899',
    glow: '#a855f7aa',
    bg: '#0a0614',
    grid: '#a855f718',
    name: 'PLASMA',
  },
  blood: {
    primary: '#ef4444',
    secondary: '#dc2626',
    accent: '#f97316',
    glow: '#ef4444aa',
    bg: '#140606',
    grid: '#ef444418',
    name: 'BLOOD',
  },
  arctic: {
    primary: '#38bdf8',
    secondary: '#0ea5e9',
    accent: '#e0f2fe',
    glow: '#38bdf8aa',
    bg: '#060a14',
    grid: '#38bdf818',
    name: 'ARCTIC',
  },
  phantom: {
    primary: '#d4d4d4',
    secondary: '#a3a3a3',
    accent: '#525252',
    glow: '#d4d4d488',
    bg: '#0a0a0a',
    grid: '#d4d4d412',
    name: 'PHANTOM',
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
