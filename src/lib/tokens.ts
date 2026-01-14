/**
 * Design Tokens - SGE Diario Digital
 * Theme: Purple/Violet (Plurall-inspired)
 *
 * Primary Color: #7C3AED (Violet 600)
 */

// Color Tokens - Light Theme
export const lightColors = {
  // Primary (Purple/Violet)
  primary: '#7C3AED',
  onPrimary: '#FFFFFF',
  primaryContainer: '#EDE9FE',
  onPrimaryContainer: '#4C1D95',
  primaryHover: '#6D28D9',
  primaryLight: '#A78BFA',

  // Secondary (Slate/Gray)
  secondary: '#64748B',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#F1F5F9',
  onSecondaryContainer: '#334155',

  // Tertiary (Cyan for accents)
  tertiary: '#06B6D4',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#CFFAFE',
  onTertiaryContainer: '#155E75',

  // Error
  error: '#DC2626',
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2',
  onErrorContainer: '#991B1B',

  // Surface
  surface: '#F8F7FC',
  onSurface: '#1E1B4B',
  surfaceVariant: '#F1F0FB',
  onSurfaceVariant: '#64748B',

  // Surface Containers
  surfaceContainerLowest: '#FFFFFF',
  surfaceContainerLow: '#FAFAFF',
  surfaceContainer: '#F5F3FF',
  surfaceContainerHigh: '#EDE9FE',
  surfaceContainerHighest: '#DDD6FE',

  // Outline
  outline: '#CBD5E1',
  outlineVariant: '#E2E8F0',

  // Inverse
  inverseSurface: '#1E1B4B',
  inverseOnSurface: '#F8F7FC',
  inversePrimary: '#C4B5FD',

  // Header
  headerBg: '#5B21B6',
  headerText: '#FFFFFF',

  // Sidebar
  sidebarBg: '#FFFFFF',
  sidebarText: '#334155',
  sidebarHover: '#F5F3FF',
  sidebarActive: '#EDE9FE',
  sidebarActiveText: '#7C3AED',
  sidebarSection: '#94A3B8',

  // Scrim
  scrim: '#000000',
  shadow: '#000000',
};

// Color Tokens - Dark Theme
export const darkColors = {
  // Primary
  primary: '#A78BFA',
  onPrimary: '#2E1065',
  primaryContainer: '#4C1D95',
  onPrimaryContainer: '#EDE9FE',
  primaryHover: '#C4B5FD',
  primaryLight: '#7C3AED',

  // Secondary
  secondary: '#94A3B8',
  onSecondary: '#1E293B',
  secondaryContainer: '#334155',
  onSecondaryContainer: '#E2E8F0',

  // Tertiary
  tertiary: '#22D3EE',
  onTertiary: '#164E63',
  tertiaryContainer: '#155E75',
  onTertiaryContainer: '#CFFAFE',

  // Error
  error: '#F87171',
  onError: '#7F1D1D',
  errorContainer: '#991B1B',
  onErrorContainer: '#FEE2E2',

  // Surface
  surface: '#0F0D1A',
  onSurface: '#E2E8F0',
  surfaceVariant: '#1E1B4B',
  onSurfaceVariant: '#A5B4FC',

  // Surface Containers
  surfaceContainerLowest: '#09080F',
  surfaceContainerLow: '#13111D',
  surfaceContainer: '#1A1726',
  surfaceContainerHigh: '#231F33',
  surfaceContainerHighest: '#2D2840',

  // Outline
  outline: '#475569',
  outlineVariant: '#334155',

  // Inverse
  inverseSurface: '#E2E8F0',
  inverseOnSurface: '#1E1B4B',
  inversePrimary: '#7C3AED',

  // Header
  headerBg: '#2E1065',
  headerText: '#FFFFFF',

  // Sidebar
  sidebarBg: '#13111D',
  sidebarText: '#CBD5E1',
  sidebarHover: '#1E1B4B',
  sidebarActive: '#4C1D95',
  sidebarActiveText: '#C4B5FD',
  sidebarSection: '#64748B',

  // Scrim
  scrim: '#000000',
  shadow: '#000000',
};

// Semantic Colors
export const semanticColors = {
  light: {
    success: '#16A34A',
    onSuccess: '#FFFFFF',
    successContainer: '#DCFCE7',
    onSuccessContainer: '#166534',

    warning: '#F59E0B',
    onWarning: '#FFFFFF',
    warningContainer: '#FEF3C7',
    onWarningContainer: '#B45309',

    info: '#0EA5E9',
    onInfo: '#FFFFFF',
    infoContainer: '#E0F2FE',
    onInfoContainer: '#0369A1',
  },
  dark: {
    success: '#4ADE80',
    onSuccess: '#166534',
    successContainer: '#166534',
    onSuccessContainer: '#DCFCE7',

    warning: '#FBBF24',
    onWarning: '#B45309',
    warningContainer: '#B45309',
    onWarningContainer: '#FEF3C7',

    info: '#38BDF8',
    onInfo: '#0369A1',
    infoContainer: '#0369A1',
    onInfoContainer: '#E0F2FE',
  },
};

// Typography Scale
export const typography = {
  displayLarge: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 700,
    fontSize: '3rem',
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
  },
  displayMedium: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 700,
    fontSize: '2.25rem',
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
  },
  displaySmall: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 600,
    fontSize: '1.875rem',
    lineHeight: 1.2,
    letterSpacing: '-0.01em',
  },
  headlineLarge: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 600,
    fontSize: '1.5rem',
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
  },
  headlineMedium: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: 1.3,
    letterSpacing: '0',
  },
  headlineSmall: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 600,
    fontSize: '1.125rem',
    lineHeight: 1.35,
    letterSpacing: '0',
  },
  titleLarge: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '1rem',
    lineHeight: 1.4,
    letterSpacing: '0',
  },
  titleMedium: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  titleSmall: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '0.8125rem',
    lineHeight: 1.4,
    letterSpacing: '0.01em',
  },
  bodyLarge: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: 1.5,
    letterSpacing: '0',
  },
  bodyMedium: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem',
    lineHeight: 1.5,
    letterSpacing: '0.01em',
  },
  bodySmall: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 400,
    fontSize: '0.75rem',
    lineHeight: 1.5,
    letterSpacing: '0.02em',
  },
  labelLarge: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '0.875rem',
    lineHeight: 1.4,
    letterSpacing: '0.02em',
  },
  labelMedium: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '0.75rem',
    lineHeight: 1.4,
    letterSpacing: '0.03em',
  },
  labelSmall: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontWeight: 500,
    fontSize: '0.6875rem',
    lineHeight: 1.4,
    letterSpacing: '0.03em',
  },
};

// Elevation
export const elevation = {
  level0: 'none',
  level1: '0px 1px 3px rgba(0, 0, 0, 0.08), 0px 1px 2px rgba(0, 0, 0, 0.06)',
  level2: '0px 4px 6px rgba(0, 0, 0, 0.07), 0px 2px 4px rgba(0, 0, 0, 0.06)',
  level3: '0px 10px 15px rgba(0, 0, 0, 0.08), 0px 4px 6px rgba(0, 0, 0, 0.05)',
  level4: '0px 20px 25px rgba(0, 0, 0, 0.08), 0px 10px 10px rgba(0, 0, 0, 0.04)',
  level5: '0px 25px 50px rgba(0, 0, 0, 0.15)',
};

// Shape
export const shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 24,
  full: 9999,
};

// Motion
export const motion = {
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  },
};

// State layer opacities
export const stateLayer = {
  hover: 0.08,
  focus: 0.12,
  pressed: 0.12,
  dragged: 0.16,
  disabled: 0.38,
  disabledContainer: 0.12,
};

// Combined export
export const tokens = {
  colors: {
    light: { ...lightColors, ...semanticColors.light },
    dark: { ...darkColors, ...semanticColors.dark },
  },
  typography,
  elevation,
  shape,
  motion,
  stateLayer,
};

export default tokens;
