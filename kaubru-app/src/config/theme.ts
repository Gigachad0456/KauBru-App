// ─── Design tokens extracted from the KauBru design mockups ─────────────────

export const COLORS = {
  // Backgrounds — brighter, warmer white
  bg: '#FAFAF7',           // bright warm white (was dull cream)
  bgCard: '#FFFFFF',
  bgCardAlt: '#F2F0EB',    // light warm grey for inputs
  bgGreen: '#1C3A2A',
  bgGreenLight: '#EBF2EC', // light green tint

  // Primary
  primary: '#1C3A2A',
  primaryMid: '#2D5016',
  primaryLight: '#4A7C59',

  // Accent
  gold: '#C9A84C',
  goldLight: '#F0E4B8',
  accent: '#D4AF37',       // More vibrant gold
  secondary: '#6B4E31',    // Earthy brown

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8A8A8A',
  textLight: '#FFFFFF',
  textGreen: '#1C3A2A',

  // Status
  success: '#2D7A4F',
  warning: '#C9A84C',
  error: '#C0392B',
  pending: '#C9A84C',
  approved: '#2D7A4F',
  rejected: '#C0392B',

  // Glassmorphism / Overlays
  glass: 'rgba(255, 255, 255, 0.7)',
  glassDark: 'rgba(0, 0, 0, 0.5)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',

  // Misc
  border: '#E4E0D8',
  borderDark: '#C8C4BC',
  shadow: 'rgba(0,0,0,0.07)',
  white: '#FFFFFF',
  black: '#000000',

  // Legacy aliases
  cyan: '#1C3A2A',
  violet: '#2D5016',
  cyanLight: '#4A7C59',
  violetLight: '#C9A84C',
  gradStart: '#FAFAF7',
  gradMid: '#F5F2EC',
  gradEnd: '#EEE9E0',
  bgCardBorder: '#E4E0D8',
};

export const GRADIENTS = {
  primary: ['#1C3A2A', '#2D5016'],
  premium: ['#1C3A2A', '#4A7C59'],
  gold: ['#C9A84C', '#F0E4B8'],
  glass: ['rgba(255, 255, 255, 0.8)', 'rgba(255, 255, 255, 0.4)'],
  surface: ['#FFFFFF', '#FAFAF7'],
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  serif: 'Georgia',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  tabBar: 100,  // bottom padding to clear the floating tab bar
};

export const SHADOW = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
  },
  premium: {
    shadowColor: '#1C3A2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
};

