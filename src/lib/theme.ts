'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

// Layout constants
export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 72;
export const HEADER_HEIGHT = 64;

// Luminar Green Design System (based on design-system.md)
const darkPalette = {
  primary: {
    main: '#00a63e',      // Green-600
    light: '#4ade80',     // Green-400
    dark: '#15803d',      // Green-700
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#155dfc',      // Blue-600
    light: '#3b82f6',     // Blue-500
    dark: '#1d4ed8',      // Blue-700
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#0D1117',
    paper: '#161B22',
  },
  text: {
    primary: '#F0F6FC',
    secondary: '#8B949E',
    disabled: '#484F58',
  },
  divider: '#30363D',
  success: {
    main: '#3FB950',
    light: alpha('#3FB950', 0.15),
    dark: '#2EA043',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#D29922',
    light: alpha('#D29922', 0.15),
    dark: '#9E6A03',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#F85149',
    light: alpha('#F85149', 0.15),
    dark: '#DA3633',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#58A6FF',
    light: alpha('#58A6FF', 0.15),
    dark: '#388BFD',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F0F6FC',
    100: '#C9D1D9',
    200: '#B1BAC4',
    300: '#8B949E',
    400: '#6E7681',
    500: '#484F58',
    600: '#30363D',
    700: '#21262D',
    800: '#161B22',
    900: '#0D1117',
  },
  action: {
    active: '#F0F6FC',
    hover: alpha('#F0F6FC', 0.08),
    selected: alpha('#F0F6FC', 0.12),
    disabled: '#484F58',
    disabledBackground: '#21262D',
  },
};

const lightPalette = {
  primary: {
    main: '#00a63e',      // Green-600
    light: '#4ade80',     // Green-400
    dark: '#016630',      // Green-800
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#155dfc',      // Blue-600
    light: '#3b82f6',     // Blue-500
    dark: '#1d4ed8',      // Blue-700
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F5F7FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A202C',
    secondary: '#4A5568',
    disabled: '#A0AEC0',
  },
  divider: '#E2E8F0',
  success: { main: '#22C55E', light: '#DCFCE7', dark: '#16A34A', contrastText: '#FFFFFF' },
  warning: { main: '#F59E0B', light: '#FEF3C7', dark: '#D97706', contrastText: '#1A202C' },
  error: { main: '#EF4444', light: '#FEE2E2', dark: '#DC2626', contrastText: '#FFFFFF' },
  info: { main: '#3B82F6', light: '#DBEAFE', dark: '#2563EB', contrastText: '#FFFFFF' },
  grey: {
    50: '#F8FAFC', 100: '#F1F5F9', 200: '#E2E8F0', 300: '#CBD5E0',
    400: '#A0AEC0', 500: '#718096', 600: '#4A5568', 700: '#2D3748',
    800: '#1A202C', 900: '#171923',
  },
};

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => {
  const isDark = mode === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  return {
    palette: {
      mode,
      ...palette,
    },
    typography: {
      fontFamily: '"Inter", "IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.025em', color: palette.text.primary },
      h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '-0.02em' },
      h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
      h4: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.4 },
      h5: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
      h6: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
      body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8125rem', lineHeight: 1.5, color: palette.text.secondary },
      caption: { fontSize: '0.75rem', lineHeight: 1.5, color: palette.text.secondary },
      button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' as const, letterSpacing: '0.01em' },
      overline: { fontSize: '0.6875rem', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: palette.text.secondary },
    },
    shape: { borderRadius: 12 },
    shadows: [
      'none',
      isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
      isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
      isDark ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.08)',
      isDark ? '0 4px 8px rgba(0,0,0,0.4)' : '0 4px 8px rgba(0,0,0,0.08)',
      isDark ? '0 6px 12px rgba(0,0,0,0.4)' : '0 6px 12px rgba(0,0,0,0.1)',
      isDark ? '0 8px 16px rgba(0,0,0,0.4)' : '0 8px 16px rgba(0,0,0,0.1)',
      isDark ? '0 12px 24px rgba(0,0,0,0.5)' : '0 12px 24px rgba(0,0,0,0.12)',
      isDark ? '0 16px 32px rgba(0,0,0,0.5)' : '0 16px 32px rgba(0,0,0,0.12)',
      isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.15)',
      isDark ? '0 24px 48px rgba(0,0,0,0.6)' : '0 24px 48px rgba(0,0,0,0.15)',
      ...Array(14).fill('none'),
    ] as ThemeOptions['shadows'],
    components: {
      // ===== BASELINE =====
      MuiCssBaseline: {
        styleOverrides: {
          'html, body': {
            backgroundColor: palette.background.default,
            color: palette.text.primary,
          },
          body: {
            scrollbarWidth: 'thin',
            scrollbarColor: `${isDark ? '#30363D' : '#CBD5E0'} transparent`,
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#30363D' : '#CBD5E0',
              borderRadius: 4,
              '&:hover': { background: isDark ? '#484F58' : '#A0AEC0' },
            },
          },
          '::selection': {
            backgroundColor: alpha(palette.primary.main, 0.3),
            color: palette.text.primary,
          },
        },
      },

      // ===== BUTTONS =====
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 16px',
            transition: 'all 0.15s ease',
            '&:focus-visible': {
              outline: `2px solid ${palette.primary.light}`,
              outlineOffset: 2,
            },
          },
          sizeMedium: { height: 40 },
          sizeSmall: { height: 32, padding: '6px 12px', fontSize: '0.8125rem' },
          sizeLarge: { height: 48, padding: '12px 24px', fontSize: '0.9375rem' },
          containedPrimary: {
            backgroundColor: palette.primary.main,
            '&:hover': {
              backgroundColor: palette.primary.dark,
            },
          },
          containedSecondary: {
            backgroundColor: palette.secondary.main,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: palette.secondary.dark,
            },
          },
          outlined: {
            borderColor: isDark ? '#30363D' : '#E2E8F0',
            '&:hover': {
              borderColor: isDark ? '#484F58' : '#CBD5E0',
              backgroundColor: isDark ? alpha('#F0F6FC', 0.04) : alpha('#2A3F5F', 0.04),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: isDark ? alpha('#F0F6FC', 0.08) : alpha('#2A3F5F', 0.08),
            },
          },
        },
      },

      // ===== CARDS =====
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 16,
            backgroundColor: palette.background.paper,
            border: `1px solid ${isDark ? '#21262D' : '#E2E8F0'}`,
            transition: 'all 0.2s ease',
            '&:hover': {
              borderColor: isDark ? '#30363D' : '#CBD5E0',
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.08)',
            },
          },
        },
      },
      MuiCardContent: {
        styleOverrides: {
          root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
        },
      },
      MuiCardHeader: {
        styleOverrides: {
          root: { padding: '16px 20px' },
          title: { fontSize: '1rem', fontWeight: 600 },
          subheader: { fontSize: '0.8125rem', color: palette.text.secondary },
        },
      },

      // ===== PAPER =====
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: palette.background.paper,
          },
          rounded: { borderRadius: 16 },
        },
      },

      // ===== DRAWER / SIDEBAR =====
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: isDark ? '#0D1117' : '#00a63e',
            color: '#F0F6FC',
            borderRight: `1px solid ${isDark ? '#21262D' : 'transparent'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            padding: '10px 16px',
            color: 'rgba(255, 255, 255, 0.7)',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              color: '#F0F6FC',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderLeft: '3px solid #4ade80',
              paddingLeft: 13,
              color: '#F0F6FC',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.12)' },
            },
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: { color: 'inherit', minWidth: 40, opacity: 0.85 },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: { fontSize: '0.875rem', fontWeight: 500 },
        },
      },

      // ===== INPUTS =====
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#30363D' : '#E2E8F0',
              transition: 'border-color 0.15s ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#484F58' : '#CBD5E0',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#4ade80' : '#00a63e',
              borderWidth: 2,
            },
          },
          input: {
            padding: '10px 14px',
            '&::placeholder': { color: palette.text.secondary, opacity: 1 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            color: palette.text.secondary,
            '&.Mui-focused': { color: isDark ? '#4ade80' : '#00a63e' },
          },
        },
      },
      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
      },
      MuiSelect: {
        styleOverrides: {
          root: { borderRadius: 8 },
        },
      },

      // ===== CHIPS =====
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 500,
            fontSize: '0.75rem',
            height: 24,
          },
          colorSuccess: {
            backgroundColor: isDark ? 'rgba(63, 185, 80, 0.15)' : '#DCFCE7',
            color: isDark ? '#3FB950' : '#166534',
            border: `1px solid ${isDark ? 'rgba(63, 185, 80, 0.4)' : '#86EFAC'}`,
          },
          colorWarning: {
            backgroundColor: isDark ? 'rgba(210, 153, 34, 0.15)' : '#FEF3C7',
            color: isDark ? '#D29922' : '#92400E',
            border: `1px solid ${isDark ? 'rgba(210, 153, 34, 0.4)' : '#FCD34D'}`,
          },
          colorError: {
            backgroundColor: isDark ? 'rgba(248, 81, 73, 0.15)' : '#FEE2E2',
            color: isDark ? '#F85149' : '#991B1B',
            border: `1px solid ${isDark ? 'rgba(248, 81, 73, 0.4)' : '#FCA5A5'}`,
          },
          colorInfo: {
            backgroundColor: isDark ? 'rgba(88, 166, 255, 0.15)' : '#DBEAFE',
            color: isDark ? '#58A6FF' : '#1E40AF',
            border: `1px solid ${isDark ? 'rgba(88, 166, 255, 0.4)' : '#93C5FD'}`,
          },
          colorPrimary: {
            backgroundColor: isDark ? 'rgba(61, 90, 128, 0.2)' : alpha('#2A3F5F', 0.1),
            color: isDark ? '#58A6FF' : '#2A3F5F',
            border: `1px solid ${isDark ? 'rgba(61, 90, 128, 0.4)' : alpha('#2A3F5F', 0.3)}`,
          },
          colorSecondary: {
            backgroundColor: isDark ? 'rgba(245, 201, 107, 0.15)' : alpha('#E5A53A', 0.15),
            color: isDark ? '#F5C96B' : '#92400E',
            border: `1px solid ${isDark ? 'rgba(245, 201, 107, 0.4)' : alpha('#E5A53A', 0.4)}`,
          },
        },
      },

      // ===== TABLES =====
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${isDark ? '#21262D' : '#E2E8F0'}`,
            backgroundColor: palette.background.paper,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? '#161B22' : '#F8FAFC',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: palette.text.secondary,
              borderBottom: `1px solid ${isDark ? '#30363D' : '#E2E8F0'}`,
              padding: '12px 16px',
            },
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: 'background-color 0.15s ease',
            '&:hover': {
              backgroundColor: isDark ? '#1C2128' : '#F8FAFC',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? alpha('#4ade80', 0.08) : alpha('#00a63e', 0.08),
              '&:hover': {
                backgroundColor: isDark ? alpha('#4ade80', 0.12) : alpha('#00a63e', 0.12),
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDark ? '#21262D' : '#EDF2F7'}`,
            padding: '12px 16px',
            fontSize: '0.875rem',
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${isDark ? '#21262D' : '#E2E8F0'}`,
          },
          selectLabel: { fontSize: '0.8125rem' },
          displayedRows: { fontSize: '0.8125rem' },
        },
      },

      // ===== CHECKBOX =====
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isDark ? '#484F58' : '#A0AEC0',
            '&.Mui-checked': {
              color: isDark ? '#4ade80' : '#00a63e',
            },
          },
        },
      },

      // ===== DIALOG / MODAL =====
      MuiModal: {
        styleOverrides: {
          root: {
            '& .MuiBox-root': {
              backgroundColor: palette.background.paper,
            },
          },
        },
      },
      MuiBackdrop: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 20,
            backgroundColor: palette.background.paper,
            border: `1px solid ${isDark ? '#30363D' : '#E2E8F0'}`,
            boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.6)' : '0 24px 48px rgba(0,0,0,0.15)',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: '1.125rem',
            fontWeight: 600,
            padding: '20px 24px 12px',
            color: palette.text.primary,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: { padding: '12px 24px' },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '16px 24px 20px',
            gap: 8,
          },
        },
      },

      // ===== ALERTS =====
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            fontSize: '0.875rem',
            border: '1px solid',
          },
          standardSuccess: {
            backgroundColor: isDark ? 'rgba(63, 185, 80, 0.1)' : '#DCFCE7',
            borderColor: isDark ? 'rgba(63, 185, 80, 0.3)' : '#86EFAC',
            color: isDark ? '#3FB950' : '#166534',
            '& .MuiAlert-icon': { color: isDark ? '#3FB950' : '#22C55E' },
          },
          standardWarning: {
            backgroundColor: isDark ? 'rgba(210, 153, 34, 0.1)' : '#FEF3C7',
            borderColor: isDark ? 'rgba(210, 153, 34, 0.3)' : '#FCD34D',
            color: isDark ? '#D29922' : '#92400E',
            '& .MuiAlert-icon': { color: isDark ? '#D29922' : '#F59E0B' },
          },
          standardError: {
            backgroundColor: isDark ? 'rgba(248, 81, 73, 0.1)' : '#FEE2E2',
            borderColor: isDark ? 'rgba(248, 81, 73, 0.3)' : '#FCA5A5',
            color: isDark ? '#F85149' : '#991B1B',
            '& .MuiAlert-icon': { color: isDark ? '#F85149' : '#EF4444' },
          },
          standardInfo: {
            backgroundColor: isDark ? 'rgba(88, 166, 255, 0.1)' : '#DBEAFE',
            borderColor: isDark ? 'rgba(88, 166, 255, 0.3)' : '#93C5FD',
            color: isDark ? '#58A6FF' : '#1E40AF',
            '& .MuiAlert-icon': { color: isDark ? '#58A6FF' : '#3B82F6' },
          },
        },
      },

      // ===== TABS =====
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: 44,
          },
          indicator: {
            backgroundColor: isDark ? '#4ade80' : '#00a63e',
            height: 3,
            borderRadius: '3px 3px 0 0',
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.875rem',
            minHeight: 44,
            padding: '8px 16px',
            color: palette.text.secondary,
            '&.Mui-selected': {
              color: isDark ? '#F0F6FC' : '#00a63e',
              fontWeight: 600,
            },
          },
        },
      },

      // ===== AVATAR =====
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#30363D' : '#E2E8F0',
            color: palette.text.primary,
            fontWeight: 600,
          },
          colorDefault: {
            backgroundColor: palette.primary.main,
            color: '#FFFFFF',
          },
        },
      },

      // ===== TOOLTIP =====
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#30363D' : '#1A202C',
            color: '#F0F6FC',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          },
          arrow: {
            color: isDark ? '#30363D' : '#1A202C',
          },
        },
      },

      // ===== MENU =====
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundColor: palette.background.paper,
            border: `1px solid ${isDark ? '#30363D' : '#E2E8F0'}`,
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.12)',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            padding: '8px 16px',
            borderRadius: 6,
            margin: '2px 8px',
            '&:hover': {
              backgroundColor: isDark ? '#21262D' : '#F1F5F9',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? '#30363D' : '#E2E8F0',
              '&:hover': {
                backgroundColor: isDark ? '#484F58' : '#CBD5E0',
              },
            },
          },
        },
      },

      // ===== PROGRESS =====
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            height: 6,
            backgroundColor: isDark ? '#21262D' : '#E2E8F0',
          },
          bar: {
            borderRadius: 4,
          },
          colorPrimary: {
            '& .MuiLinearProgress-bar': {
              backgroundColor: isDark ? '#4ade80' : '#00a63e',
            },
          },
        },
      },

      // ===== BADGE =====
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontWeight: 600,
            fontSize: '0.6875rem',
          },
        },
      },

      // ===== BREADCRUMBS =====
      MuiBreadcrumbs: {
        styleOverrides: {
          root: {
            fontSize: '0.8125rem',
          },
          separator: {
            color: palette.text.secondary,
          },
        },
      },

      // ===== FAB =====
      MuiFab: {
        styleOverrides: {
          primary: {
            backgroundColor: palette.primary.main,
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: palette.primary.dark,
            },
          },
        },
      },

      // ===== SKELETON =====
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#21262D' : '#E2E8F0',
          },
        },
      },

      // ===== SNACKBAR =====
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#30363D' : '#1A202C',
            color: '#F0F6FC',
            borderRadius: 12,
          },
        },
      },

      // ===== APP BAR / HEADER =====
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.paper,
            color: palette.text.primary,
            boxShadow: 'none',
            borderBottom: `1px solid ${isDark ? '#21262D' : '#E2E8F0'}`,
          },
        },
      },

      // ===== DIVIDER =====
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? '#21262D' : '#E2E8F0',
          },
        },
      },

      // ===== TOGGLE BUTTON =====
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderColor: isDark ? '#30363D' : '#E2E8F0',
            color: palette.text.secondary,
            textTransform: 'none',
            '&.Mui-selected': {
              backgroundColor: isDark ? '#21262D' : '#E2E8F0',
              color: palette.text.primary,
              borderColor: isDark ? '#484F58' : '#CBD5E0',
              '&:hover': {
                backgroundColor: isDark ? '#30363D' : '#CBD5E0',
              },
            },
          },
        },
      },
    },
  };
};

// Theme creators
export const createAppTheme = (mode: 'light' | 'dark' = 'dark') => createTheme(getDesignTokens(mode));

// Export default themes
export const darkTheme = createAppTheme('dark');
export const lightTheme = createAppTheme('light');
export const theme = darkTheme; // Default is dark

export default theme;
