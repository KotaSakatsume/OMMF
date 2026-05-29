// ========================================
// OMMF Design System
// 黒ベース × 白極太フォント × ネオンアクセント
// ========================================

export const Colors = {
  // Base
  background: '#000000',
  surface: '#0A0A0A',
  surfaceLight: '#141414',
  surfaceElevated: '#1A1A1A',
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textMuted: '#555555',
  
  // Accent
  neonRed: '#FF2D55',
  neonRedDim: '#FF2D5533',
  neonGreen: '#39FF14',
  neonGreenDim: '#39FF1433',
  neonBlue: '#00D4FF',
  neonBlueDim: '#00D4FF33',
  neonYellow: '#FFE600',
  neonYellowDim: '#FFE60033',
  
  // Status
  danger: '#FF3B30',
  success: '#34C759',
  warning: '#FF9500',
  
  // Gradients
  gradientStart: '#FF2D55',
  gradientEnd: '#FF6B35',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 36,
  display: 48,
  hero: 64,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

// Exercise presets for quick selection
export const EXERCISES = [
  'Bench Press',
  'Squat',
  'Deadlift',
  'Overhead Press',
  'Barbell Row',
  'Incline Press',
  'Dumbbell Press',
  'Leg Press',
  'Hip Thrust',
  'Other',
];
