'use client';

import { createTheme, responsiveFontSizes, ThemeOptions, PaletteMode } from '@mui/material/styles';
import { lightColors, darkColors, semanticColors, typography, elevation, shape } from './tokens';

// Extend MUI palette
declare module '@mui/material/styles' {
  interface Palette {
    surfaceVariant: Palette['primary'];
    outline: Palette['primary'];
    outlineVariant: Palette['primary'];
    surfaceContainer: Palette['primary'];
    surfaceContainerLow: Palette['primary'];
    surfaceContainerHigh: Palette['primary'];
    onSurface: Palette['primary'];
    onSurfaceVariant: Palette['primary'];
    primaryContainer: Palette['primary'];
    onPrimaryContainer: Palette['primary'];
    secondaryContainer: Palette['primary'];
    onSecondaryContainer: Palette['primary'];
    header: {
      background: string;
      text: string;
    };
    sidebar: {
      background: string;
      text: string;
      hover: string;
      active: string;
      activeText: string;
      section: string;
    };
  }
  interface PaletteOptions {
    surfaceVariant?: PaletteOptions['primary'];
    outline?: PaletteOptions['primary'];
    outlineVariant?: PaletteOptions['primary'];
    surfaceContainer?: PaletteOptions['primary'];
    surfaceContainerLow?: PaletteOptions['primary'];
    surfaceContainerHigh?: PaletteOptions['primary'];
    onSurface?: PaletteOptions['primary'];
    onSurfaceVariant?: PaletteOptions['primary'];
    primaryContainer?: PaletteOptions['primary'];
    onPrimaryContainer?: PaletteOptions['primary'];
    secondaryContainer?: PaletteOptions['primary'];
    onSecondaryContainer?: PaletteOptions['primary'];
    header?: {
      background: string;
      text: string;
    };
    sidebar?: {
      background: string;
      text: string;
      hover: string;
      active: string;
      activeText: string;
      section: string;
    };
  }
}

const getDesignTokens = (mode: PaletteMode): ThemeOptions => {
  const colors = mode === 'light' ? lightColors : darkColors;
  const semantic = mode === 'light' ? semanticColors.light : semanticColors.dark;

  return {
    palette: {
      mode,
      primary: {
        main: colors.primary,
        light: colors.primaryLight,
        dark: colors.primaryHover,
        contrastText: colors.onPrimary,
      },
      secondary: {
        main: colors.secondary,
        light: colors.secondaryContainer,
        dark: colors.onSecondaryContainer,
        contrastText: colors.onSecondary,
      },
      error: {
        main: colors.error,
        light: colors.errorContainer,
        dark: colors.onErrorContainer,
        contrastText: colors.onError,
      },
      warning: {
        main: semantic.warning,
        light: semantic.warningContainer,
        dark: semantic.onWarningContainer,
        contrastText: semantic.onWarning,
      },
      info: {
        main: semantic.info,
        light: semantic.infoContainer,
        dark: semantic.onInfoContainer,
        contrastText: semantic.onInfo,
      },
      success: {
        main: semantic.success,
        light: semantic.successContainer,
        dark: semantic.onSuccessContainer,
        contrastText: semantic.onSuccess,
      },
      background: {
        default: colors.surface,
        paper: colors.surfaceContainerLowest,
      },
      text: {
        primary: colors.onSurface,
        secondary: colors.onSurfaceVariant,
        disabled: mode === 'light' ? 'rgba(30, 27, 75, 0.38)' : 'rgba(226, 232, 240, 0.38)',
      },
      divider: colors.outlineVariant,
      action: {
        active: colors.onSurfaceVariant,
        hover: mode === 'light' ? 'rgba(124, 58, 237, 0.08)' : 'rgba(167, 139, 250, 0.08)',
        selected: mode === 'light' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(167, 139, 250, 0.12)',
        disabled: mode === 'light' ? 'rgba(30, 27, 75, 0.38)' : 'rgba(226, 232, 240, 0.38)',
        disabledBackground: mode === 'light' ? 'rgba(30, 27, 75, 0.12)' : 'rgba(226, 232, 240, 0.12)',
        focus: mode === 'light' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(167, 139, 250, 0.12)',
      },
      // Custom palette extensions
      surfaceVariant: { main: colors.surfaceVariant, contrastText: colors.onSurfaceVariant },
      outline: { main: colors.outline, contrastText: colors.onSurface },
      outlineVariant: { main: colors.outlineVariant, contrastText: colors.onSurface },
      surfaceContainer: { main: colors.surfaceContainer, contrastText: colors.onSurface },
      surfaceContainerLow: { main: colors.surfaceContainerLow, contrastText: colors.onSurface },
      surfaceContainerHigh: { main: colors.surfaceContainerHigh, contrastText: colors.onSurface },
      onSurface: { main: colors.onSurface, contrastText: colors.surface },
      onSurfaceVariant: { main: colors.onSurfaceVariant, contrastText: colors.surfaceVariant },
      primaryContainer: { main: colors.primaryContainer, contrastText: colors.onPrimaryContainer },
      onPrimaryContainer: { main: colors.onPrimaryContainer, contrastText: colors.primaryContainer },
      secondaryContainer: { main: colors.secondaryContainer, contrastText: colors.onSecondaryContainer },
      onSecondaryContainer: { main: colors.onSecondaryContainer, contrastText: colors.secondaryContainer },
      header: {
        background: colors.headerBg,
        text: colors.headerText,
      },
      sidebar: {
        background: colors.sidebarBg,
        text: colors.sidebarText,
        hover: colors.sidebarHover,
        active: colors.sidebarActive,
        activeText: colors.sidebarActiveText,
        section: colors.sidebarSection,
      },
    },
    typography: {
      fontFamily: typography.bodyLarge.fontFamily,
      h1: { ...typography.displaySmall },
      h2: { ...typography.headlineLarge },
      h3: { ...typography.headlineMedium },
      h4: { ...typography.headlineSmall },
      h5: { ...typography.titleLarge },
      h6: { ...typography.titleMedium },
      subtitle1: { ...typography.titleSmall },
      subtitle2: { ...typography.labelLarge },
      body1: { ...typography.bodyLarge },
      body2: { ...typography.bodyMedium },
      caption: { ...typography.bodySmall },
      overline: { ...typography.labelMedium, textTransform: 'uppercase' as const },
      button: { ...typography.labelLarge, textTransform: 'none' as const },
    },
    shape: {
      borderRadius: shape.medium,
    },
    shadows: [
      'none',
      elevation.level1, elevation.level1,
      elevation.level2, elevation.level2, elevation.level2,
      elevation.level3, elevation.level3, elevation.level3, elevation.level3,
      elevation.level4, elevation.level4, elevation.level4, elevation.level4, elevation.level4, elevation.level4,
      elevation.level5, elevation.level5, elevation.level5, elevation.level5, elevation.level5, elevation.level5, elevation.level5, elevation.level5, elevation.level5,
    ] as any,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            scrollbarColor: `${colors.outline} ${colors.surfaceContainerLow}`,
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-thumb': { borderRadius: 9999, backgroundColor: colors.outline },
            '&::-webkit-scrollbar-track': { backgroundColor: colors.surfaceContainerLow },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.full,
            padding: '10px 24px',
            minHeight: 44,
            fontWeight: 500,
            boxShadow: 'none',
            textTransform: 'none',
            transition: 'all 150ms ease',
            '&:hover': { boxShadow: 'none' },
            '&:focus-visible': {
              outline: `2px solid ${colors.primary}`,
              outlineOffset: 2,
            },
          },
          contained: {
            '&:hover': {
              backgroundColor: colors.primaryHover,
              boxShadow: elevation.level1,
            },
          },
          containedPrimary: {
            backgroundColor: colors.primary,
            '&:hover': { backgroundColor: colors.primaryHover },
          },
          outlined: {
            borderColor: colors.outline,
            '&:hover': {
              borderColor: colors.primary,
              backgroundColor: mode === 'light' ? 'rgba(124, 58, 237, 0.08)' : 'rgba(167, 139, 250, 0.08)',
            },
          },
          text: {
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(124, 58, 237, 0.08)' : 'rgba(167, 139, 250, 0.08)',
            },
          },
        },
        defaultProps: { disableElevation: true },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: shape.medium,
            boxShadow: elevation.level1,
            backgroundColor: colors.surfaceContainerLowest,
            border: `1px solid ${colors.outlineVariant}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: shape.medium,
            backgroundImage: 'none',
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', fullWidth: true },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: shape.small,
              '& fieldset': { borderColor: colors.outline },
              '&:hover fieldset': { borderColor: colors.onSurfaceVariant },
              '&.Mui-focused fieldset': { borderColor: colors.primary, borderWidth: 2 },
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: shape.small,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: shape.extraLarge,
            boxShadow: elevation.level5,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            backgroundColor: colors.headerBg,
            color: colors.headerText,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: colors.sidebarBg,
            borderRight: `1px solid ${colors.outlineVariant}`,
            boxShadow: 'none',
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            margin: 0,
            padding: '6px 16px',
            color: colors.sidebarText,
            '&:hover': { backgroundColor: colors.sidebarHover },
            '&.Mui-selected': {
              backgroundColor: colors.sidebarActive,
              color: colors.sidebarActiveText,
              '&:hover': { backgroundColor: colors.sidebarActive },
              '& .MuiListItemIcon-root': { color: colors.sidebarActiveText },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: colors.onSurfaceVariant,
            minWidth: 40,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            minHeight: 48,
            '&.Mui-selected': { color: colors.primary },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            height: 3,
            borderRadius: '3px 3px 0 0',
            backgroundColor: colors.primary,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: shape.small },
          filled: {
            backgroundColor: colors.primaryContainer,
            color: colors.onPrimaryContainer,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: { borderRadius: shape.medium },
          standardInfo: {
            backgroundColor: semantic.infoContainer,
            color: semantic.onInfoContainer,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: colors.inverseSurface,
            color: colors.inverseOnSurface,
            borderRadius: shape.extraSmall,
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: colors.primaryContainer,
            color: colors.onPrimaryContainer,
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: shape.full,
            '&:hover': {
              backgroundColor: mode === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.08)',
            },
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: { borderColor: colors.outlineVariant },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            backgroundColor: colors.surfaceContainerHigh,
          },
          root: {
            borderColor: colors.outlineVariant,
          },
        },
      },
    },
    breakpoints: {
      values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    },
  };
};

export const createAppTheme = (mode: PaletteMode) => {
  let theme = createTheme(getDesignTokens(mode));
  theme = responsiveFontSizes(theme);
  return theme;
};

const theme = createAppTheme('light');
export default theme;
