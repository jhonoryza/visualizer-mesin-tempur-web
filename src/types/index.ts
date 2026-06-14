export type VisualMode = 'circular-target' | 'radar' | 'waveform' | 'particle' | 'bass-cannon';
export type ColorPreset = 'hazard' | 'cyber' | 'matrix' | 'plasma' | 'blood' | 'arctic' | 'phantom';
export type AspectRatio = 'landscape' | 'square' | 'vertical';
export type PerformanceMode = 'light' | 'balanced' | 'ultra';
export type ExportFormat = 'webm' | 'mp4';
export type ExportDuration = 5 | 10 | 15 | 30 | 'full';
export type AppTheme = 'tactical-amber' | 'dark-matter' | 'twitter-dark' | 'claude' | 'neon-tokyo';
export type RepeatMode = 'none' | 'one' | 'all' | 'shuffle';

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
  'tactical-amber': {
    name: 'TACTICAL AMBER',
    label: 'Tactical Amber',
    primary: '#f59e0b',
    panel: '#111111',
    panelBorder: '#f59e0b33',
    panelBg: '#0a0a0a',
    glow: '#f59e0b66',
  },
  'dark-matter': {
    name: 'DARK MATTER',
    label: 'Dark Matter',
    primary: '#94a3b8',
    panel: '#0c0f14',
    panelBorder: '#1e293b',
    panelBg: '#0f1318',
    glow: '#47556944',
  },
  'twitter-dark': {
    name: 'TWITTER DARK',
    label: 'Twitter Dark',
    primary: '#1d9bf0',
    panel: '#16181c',
    panelBorder: '#2f3336',
    panelBg: '#16181c',
    glow: '#1d9bf044',
  },
  'claude': {
    name: 'CLAUDE DARK',
    label: 'Claude Dark',
    primary: '#d4a574',
    panel: '#1a1814',
    panelBorder: '#2e2a22',
    panelBg: '#1f1c17',
    glow: '#d4a57444',
  },
  'neon-tokyo': {
    name: 'NEON TOKYO',
    label: 'Neon Tokyo',
    primary: '#f472b6',
    panel: '#0a0612',
    panelBorder: '#f472b644',
    panelBg: '#0c0818',
    glow: '#f472b688',
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
