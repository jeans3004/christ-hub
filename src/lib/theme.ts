'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

// Layout constants
export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 72;
export const HEADER_HEIGHT = 64;

// Sistema de Pontos Design System
const darkPalette = {
  primary: {
    main: '#3B82F6',      // Blue-500
    light: '#60A5FA',     // Blue-400
    dark: '#2563EB',      // Blue-600
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#22C55E',      // Green-500
    light: '#4ADE80',     // Green-400
    dark: '#16A34A',      // Green-600
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
    main: '#22C55E',
    light: alpha('#22C55E', 0.15),
    dark: '#16A34A',
    contrastText: '#FFFFFF',
  },
  warning: {
    main: '#F59E0B',
    light: alpha('#F59E0B', 0.15),
    dark: '#D97706',
    contrastText: '#FFFFFF',
  },
  error: {
    main: '#EF4444',
    light: alpha('#EF4444', 0.15),
    dark: '#DC2626',
    contrastText: '#FFFFFF',
  },
  info: {
    main: '#3B82F6',
    light: alpha('#3B82F6', 0.15),
    dark: '#2563EB',
    contrastText: '#FFFFFF',
  },
  grey: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
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
    main: '#3B82F6',      // Blue-500
    light: '#60A5FA',     // Blue-400
    dark: '#1E40AF',      // Blue-800
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#22C55E',      // Green-500
    light: '#4ADE80',     // Green-400
    dark: '#16A34A',      // Green-600
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F4F5F7',   // Neutral light background
    paper: '#FFFFFF',
  },
  text: {
    primary: '#111827',   // Grey-900
    secondary: '#6B7280', // Grey-500
    disabled: '#9CA3AF',  // Grey-400
  },
  divider: '#E5E7EB',    // Grey-200
  success: { main: '#22C55E', light: '#DCFCE7', dark: '#16A34A', contrastText: '#FFFFFF' },
  warning: { main: '#F59E0B', light: '#FEF3C7', dark: '#D97706', contrastText: '#111827' },
  error: { main: '#EF4444', light: '#FEE2E2', dark: '#DC2626', contrastText: '#FFFFFF' },
  info: { main: '#3B82F6', light: '#DBEAFE', dark: '#2563EB', contrastText: '#FFFFFF' },
  grey: {
    50: '#F9FAFB', 100: '#F3F4F6', 200: '#E5E7EB', 300: '#D1D5DB',
    400: '#9CA3AF', 500: '#6B7280', 600: '#4B5563', 700: '#374151',
    800: '#1F2937', 900: '#111827',
  },
};

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => {
  const isDark = mode === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  return {
    palette: {
      mode,
      ...palette,
      // MD3 custom palette tokens (used by MenuCard and other components)
      outline: {
        main: isDark ? '#30363D' : '#E5E7EB',
        light: isDark ? '#484F58' : '#D1D5DB',
        dark: isDark ? '#21262D' : '#D1D5DB',
      },
      onSurface: {
        main: isDark ? '#F0F6FC' : '#111827',
        light: isDark ? '#C9D1D9' : '#6B7280',
        dark: isDark ? '#F0F6FC' : '#111827',
      },
      surfaceContainerLow: {
        main: isDark ? '#161B22' : '#F9FAFB',
        light: isDark ? '#1C2128' : '#FFFFFF',
        dark: isDark ? '#0D1117' : '#F3F4F6',
      },
      primaryContainer: {
        main: isDark ? alpha('#3B82F6', 0.2) : alpha('#3B82F6', 0.1),
        light: isDark ? alpha('#3B82F6', 0.3) : alpha('#3B82F6', 0.15),
        dark: isDark ? alpha('#3B82F6', 0.15) : alpha('#3B82F6', 0.08),
      },
      onPrimaryContainer: {
        main: isDark ? '#60A5FA' : '#1E40AF',
        light: isDark ? '#93C5FD' : '#3B82F6',
        dark: isDark ? '#2563EB' : '#1E3A8A',
      },
      header: {
        background: '#FFFFFF',
        text: '#1F2937',
      },
      sidebar: {
        background: '#1F2937',
        text: '#F0F6FC',
        active: 'rgba(59, 130, 246, 0.15)',
        activeText: '#F0F6FC',
        hover: 'rgba(255, 255, 255, 0.05)',
        section: isDark ? '#8B949E' : 'rgba(255, 255, 255, 0.6)',
      },
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
    shape: { borderRadius: 16 },
    shadows: [
      'none',
      isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.04)',
      isDark ? '0 1px 3px rgba(0,0,0,0.4)' : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
      isDark ? '0 2px 4px rgba(0,0,0,0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
      isDark ? '0 4px 8px rgba(0,0,0,0.4)' : '0 4px 6px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.03)',
      isDark ? '0 6px 12px rgba(0,0,0,0.4)' : '0 6px 12px rgba(0,0,0,0.06)',
      isDark ? '0 8px 16px rgba(0,0,0,0.4)' : '0 8px 16px rgba(0,0,0,0.06)',
      isDark ? '0 12px 24px rgba(0,0,0,0.5)' : '0 12px 24px rgba(0,0,0,0.08)',
      isDark ? '0 16px 32px rgba(0,0,0,0.5)' : '0 16px 32px rgba(0,0,0,0.08)',
      isDark ? '0 20px 40px rgba(0,0,0,0.5)' : '0 20px 40px rgba(0,0,0,0.1)',
      isDark ? '0 24px 48px rgba(0,0,0,0.6)' : '0 24px 48px rgba(0,0,0,0.1)',
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
            scrollbarColor: `${isDark ? '#30363D' : '#D1D5DB'} transparent`,
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': {
              background: isDark ? '#30363D' : '#D1D5DB',
              borderRadius: 4,
              '&:hover': { background: isDark ? '#484F58' : '#9CA3AF' },
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
            borderRadius: 12,
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
            backgroundColor: '#3B82F6',
            '&:hover': {
              backgroundColor: '#2563EB',
            },
          },
          containedSecondary: {
            backgroundColor: '#22C55E',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#16A34A',
            },
          },
          outlined: {
            borderColor: isDark ? '#30363D' : '#E5E7EB',
            '&:hover': {
              borderColor: isDark ? '#484F58' : '#D1D5DB',
              backgroundColor: isDark ? alpha('#F0F6FC', 0.04) : alpha('#3B82F6', 0.04),
            },
          },
          text: {
            '&:hover': {
              backgroundColor: isDark ? alpha('#F0F6FC', 0.08) : alpha('#3B82F6', 0.08),
            },
          },
        },
      },

      // ===== CARDS =====
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: palette.background.paper,
            border: isDark ? `1px solid #21262D` : 'none',
            transition: 'all 0.2s ease',
            boxShadow: isDark
              ? 'none'
              : '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
            '&:hover': {
              borderColor: isDark ? '#30363D' : 'transparent',
              boxShadow: isDark
                ? '0 8px 24px rgba(0,0,0,0.4)'
                : '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
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
          rounded: { borderRadius: 12 },
        },
      },

      // ===== DRAWER / SIDEBAR =====
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#1F2937',
            color: '#F0F6FC',
            borderRight: `1px solid ${isDark ? '#374151' : 'transparent'}`,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            margin: '4px 8px',
            padding: '10px 16px',
            color: 'rgba(255, 255, 255, 0.7)',
            transition: 'all 0.15s ease',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: '#F0F6FC',
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              borderLeft: '3px solid #3B82F6',
              paddingLeft: 13,
              color: '#F0F6FC',
              '&:hover': { backgroundColor: 'rgba(59, 130, 246, 0.2)' },
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
              borderColor: isDark ? '#30363D' : '#E5E7EB',
              transition: 'border-color 0.15s ease',
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: isDark ? '#484F58' : '#D1D5DB',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#3B82F6',
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
            '&.Mui-focused': { color: '#3B82F6' },
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
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : '#DCFCE7',
            color: isDark ? '#22C55E' : '#166534',
            border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.4)' : '#86EFAC'}`,
          },
          colorWarning: {
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7',
            color: isDark ? '#F59E0B' : '#92400E',
            border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.4)' : '#FCD34D'}`,
          },
          colorError: {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
            color: isDark ? '#EF4444' : '#991B1B',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.4)' : '#FCA5A5'}`,
          },
          colorInfo: {
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE',
            color: isDark ? '#60A5FA' : '#1E40AF',
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.4)' : '#93C5FD'}`,
          },
          colorPrimary: {
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : alpha('#3B82F6', 0.1),
            color: isDark ? '#60A5FA' : '#1E40AF',
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.4)' : alpha('#3B82F6', 0.3)}`,
          },
          colorSecondary: {
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : alpha('#22C55E', 0.15),
            color: isDark ? '#4ADE80' : '#166534',
            border: `1px solid ${isDark ? 'rgba(34, 197, 94, 0.4)' : alpha('#22C55E', 0.4)}`,
          },
        },
      },

      // ===== TABLES =====
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: `1px solid ${isDark ? '#21262D' : '#E5E7EB'}`,
            backgroundColor: palette.background.paper,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? '#161B22' : '#F9FAFB',
              fontWeight: 600,
              fontSize: '0.75rem',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: palette.text.secondary,
              borderBottom: `1px solid ${isDark ? '#30363D' : '#E5E7EB'}`,
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
              backgroundColor: isDark ? '#1C2128' : '#F9FAFB',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? alpha('#3B82F6', 0.12) : alpha('#3B82F6', 0.08),
              '&:hover': {
                backgroundColor: isDark ? alpha('#3B82F6', 0.18) : alpha('#3B82F6', 0.12),
              },
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDark ? '#21262D' : '#F3F4F6'}`,
            padding: '12px 16px',
            fontSize: '0.875rem',
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            borderTop: `1px solid ${isDark ? '#21262D' : '#E5E7EB'}`,
          },
          selectLabel: { fontSize: '0.8125rem' },
          displayedRows: { fontSize: '0.8125rem' },
        },
      },

      // ===== CHECKBOX =====
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: isDark ? '#484F58' : '#9CA3AF',
            '&.Mui-checked': {
              color: '#3B82F6',
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
            borderRadius: 16,
            backgroundColor: palette.background.paper,
            border: `1px solid ${isDark ? '#30363D' : '#E5E7EB'}`,
            boxShadow: isDark ? '0 24px 48px rgba(0,0,0,0.6)' : '0 20px 25px rgba(0,0,0,0.15)',
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
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : '#DCFCE7',
            borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : '#86EFAC',
            color: isDark ? '#22C55E' : '#166534',
            '& .MuiAlert-icon': { color: '#22C55E' },
          },
          standardWarning: {
            backgroundColor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
            borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FCD34D',
            color: isDark ? '#F59E0B' : '#92400E',
            '& .MuiAlert-icon': { color: '#F59E0B' },
          },
          standardError: {
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE2E2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
            color: isDark ? '#EF4444' : '#991B1B',
            '& .MuiAlert-icon': { color: '#EF4444' },
          },
          standardInfo: {
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#DBEAFE',
            borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#93C5FD',
            color: isDark ? '#60A5FA' : '#1E40AF',
            '& .MuiAlert-icon': { color: '#3B82F6' },
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
            backgroundColor: '#3B82F6',
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
              color: isDark ? '#F0F6FC' : '#3B82F6',
              fontWeight: 600,
            },
          },
        },
      },

      // ===== AVATAR =====
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#30363D' : '#E5E7EB',
            color: palette.text.primary,
            fontWeight: 600,
          },
          colorDefault: {
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
          },
        },
      },

      // ===== TOOLTIP =====
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#30363D' : '#111827',
            color: '#F0F6FC',
            fontSize: '0.75rem',
            fontWeight: 500,
            padding: '6px 12px',
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          },
          arrow: {
            color: isDark ? '#30363D' : '#111827',
          },
        },
      },

      // ===== MENU =====
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            backgroundColor: palette.background.paper,
            border: `1px solid ${isDark ? '#30363D' : '#E5E7EB'}`,
            boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.5)' : '0 8px 24px rgba(0,0,0,0.08)',
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
              backgroundColor: isDark ? '#21262D' : '#F3F4F6',
            },
            '&.Mui-selected': {
              backgroundColor: isDark ? '#30363D' : '#E5E7EB',
              '&:hover': {
                backgroundColor: isDark ? '#484F58' : '#D1D5DB',
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
            backgroundColor: isDark ? '#21262D' : '#E5E7EB',
          },
          bar: {
            borderRadius: 4,
          },
          colorPrimary: {
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#3B82F6',
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
            backgroundColor: '#3B82F6',
            color: '#FFFFFF',
            '&:hover': {
              backgroundColor: '#2563EB',
            },
          },
        },
      },

      // ===== SKELETON =====
      MuiSkeleton: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#21262D' : '#E5E7EB',
          },
        },
      },

      // ===== SNACKBAR =====
      MuiSnackbarContent: {
        styleOverrides: {
          root: {
            backgroundColor: isDark ? '#30363D' : '#111827',
            color: '#F0F6FC',
            borderRadius: 12,
          },
        },
      },

      // ===== APP BAR / HEADER =====
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: '#FFFFFF',
            color: '#1F2937',
            boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
            borderBottom: `1px solid ${isDark ? '#21262D' : '#E5E7EB'}`,
          },
        },
      },

      // ===== DIVIDER =====
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? '#21262D' : '#E5E7EB',
          },
        },
      },

      // ===== TOGGLE BUTTON =====
      MuiToggleButton: {
        styleOverrides: {
          root: {
            borderColor: isDark ? '#30363D' : '#E5E7EB',
            color: palette.text.secondary,
            textTransform: 'none',
            '&.Mui-selected': {
              backgroundColor: isDark ? '#21262D' : '#E5E7EB',
              color: palette.text.primary,
              borderColor: isDark ? '#484F58' : '#D1D5DB',
              '&:hover': {
                backgroundColor: isDark ? '#30363D' : '#D1D5DB',
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
