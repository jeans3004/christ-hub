'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Layout constants
export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 72;
export const HEADER_HEIGHT = 64;

// Luminar Colors
const colors = {
  primary: {
    main: '#2A3F5F',
    light: '#3D5A80',
    dark: '#1E2D45',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#E5A53A',
    light: '#F5C96B',
    dark: '#C4892E',
    contrastText: '#1A202C',
  },
};

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: colors.primary,
    secondary: colors.secondary,
    background: {
      default: mode === 'light' ? '#F5F7FA' : '#0D1117',
      paper: mode === 'light' ? '#FFFFFF' : '#161B22',
    },
    text: {
      primary: mode === 'light' ? '#1A202C' : '#F0F6FC',
      secondary: mode === 'light' ? '#4A5568' : '#8B949E',
      disabled: mode === 'light' ? '#A0AEC0' : '#484F58',
    },
    divider: mode === 'light' ? '#E2E8F0' : '#30363D',
    success: { main: '#38A169', light: '#C6F6D5', contrastText: '#FFFFFF' },
    warning: { main: '#D69E2E', light: '#FEFCBF', contrastText: '#1A202C' },
    error: { main: '#E53E3E', light: '#FED7D7', contrastText: '#FFFFFF' },
    info: { main: '#3182CE', light: '#BEE3F8', contrastText: '#FFFFFF' },
    grey: {
      50: '#F7FAFC', 100: '#EDF2F7', 200: '#E2E8F0', 300: '#CBD5E0',
      400: '#A0AEC0', 500: '#718096', 600: '#4A5568', 700: '#2D3748',
      800: '#1A202C', 900: '#171923',
    },
    // Material Design 3 tokens
    outline: { main: mode === 'light' ? '#CBD5E0' : '#484F58' },
    onSurface: { main: mode === 'light' ? '#1A202C' : '#F0F6FC' },
    surfaceContainerLow: { main: mode === 'light' ? '#F7FAFC' : '#1C2128' },
    primaryContainer: { main: mode === 'light' ? '#E8EDF5' : '#1E2D45' },
    onPrimaryContainer: { main: mode === 'light' ? '#1E2D45' : '#E8EDF5' },
    header: {
      background: mode === 'light' ? '#2A3F5F' : '#161B22',
      text: '#FFFFFF',
    },
  } as ThemeOptions['palette'],
  typography: {
    fontFamily: '"IBM Plex Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.02em' },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    h4: { fontSize: '1.125rem', fontWeight: 500, lineHeight: 1.4 },
    h5: { fontSize: '1rem', fontWeight: 500, lineHeight: 1.5 },
    h6: { fontSize: '0.875rem', fontWeight: 500, lineHeight: 1.5 },
    body1: { fontSize: '0.9375rem', lineHeight: 1.6 },
    body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
    caption: { fontSize: '0.75rem', lineHeight: 1.5, color: '#718096' },
    button: { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none' as const },
  },
  shape: { borderRadius: 8 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.04)',
    '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    '0 2px 4px rgba(0,0,0,0.06)',
    '0 4px 8px rgba(0,0,0,0.08)',
    '0 4px 12px rgba(0,0,0,0.08)',
    '0 8px 16px rgba(0,0,0,0.1)',
    '0 12px 24px rgba(0,0,0,0.12)',
    '0 16px 32px rgba(0,0,0,0.14)',
    '0 20px 40px rgba(0,0,0,0.16)',
    ...Array(15).fill('none'),
  ] as ThemeOptions['shadows'],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#F5F7FA' : '#0D1117',
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': { width: 6, height: 6 },
          '&::-webkit-scrollbar-track': { background: mode === 'light' ? '#F5F7FA' : '#161B22' },
          '&::-webkit-scrollbar-thumb': {
            background: mode === 'light' ? '#CBD5E0' : '#30363D',
            borderRadius: 3
          },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '8px 16px',
          transition: 'all 0.15s ease',
        },
        sizeMedium: { height: 40 },
        sizeSmall: { height: 32, padding: '6px 12px', fontSize: '0.8125rem' },
        sizeLarge: { height: 48, padding: '12px 24px' },
        containedPrimary: {
          boxShadow: '0 2px 4px rgba(42, 63, 95, 0.2)',
          '&:hover': { boxShadow: '0 4px 8px rgba(42, 63, 95, 0.25)' },
        },
        containedSecondary: {
          color: '#1A202C',
          boxShadow: '0 2px 4px rgba(229, 165, 58, 0.25)',
          '&:hover': { boxShadow: '0 4px 8px rgba(229, 165, 58, 0.3)' },
        },
        outlined: {
          borderColor: mode === 'light' ? '#E2E8F0' : '#30363D',
          '&:hover': {
            borderColor: mode === 'light' ? '#CBD5E0' : '#484F58',
            backgroundColor: mode === 'light' ? '#F7FAFC' : '#1C2128',
          },
        },
      },
    },
    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${mode === 'light' ? '#E2E8F0' : '#30363D'}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            borderColor: mode === 'light' ? '#CBD5E0' : '#484F58',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: { padding: 20, '&:last-child': { paddingBottom: 20 } },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { backgroundImage: 'none' },
        rounded: { borderRadius: 12 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: mode === 'light' ? '#2A3F5F' : '#161B22',
          color: '#FFFFFF',
          borderRight: 'none',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          padding: '10px 16px',
          color: 'rgba(255,255,255,0.8)',
          transition: 'all 0.15s ease',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(255,255,255,0.12)',
            borderLeft: '3px solid #E5A53A',
            paddingLeft: 13,
            color: '#FFFFFF',
            '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)' },
          },
        },
      },
    },
    MuiListItemIcon: {
      styleOverrides: { root: { color: 'inherit', minWidth: 40 } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: mode === 'light' ? '#FFFFFF' : '#0D1117',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? '#E2E8F0' : '#30363D',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: mode === 'light' ? '#CBD5E0' : '#484F58',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#2A3F5F',
            borderWidth: 2,
          },
        },
        input: { padding: '10px 14px' },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 6, fontWeight: 500, fontSize: '0.75rem' },
        colorSuccess: {
          backgroundColor: '#C6F6D5',
          color: '#22543D',
          border: '1px solid #9AE6B4',
        },
        colorWarning: {
          backgroundColor: '#FEFCBF',
          color: '#744210',
          border: '1px solid #FAF089',
        },
        colorError: {
          backgroundColor: '#FED7D7',
          color: '#822727',
          border: '1px solid #FEB2B2',
        },
        colorInfo: {
          backgroundColor: '#BEE3F8',
          color: '#2A4365',
          border: '1px solid #90CDF4',
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: `1px solid ${mode === 'light' ? '#E2E8F0' : '#30363D'}`,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#F7FAFC' : '#1C2128',
          '& .MuiTableCell-head': {
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: mode === 'light' ? '#4A5568' : '#8B949E',
            borderBottom: `1px solid ${mode === 'light' ? '#E2E8F0' : '#30363D'}`,
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': { backgroundColor: mode === 'light' ? '#F7FAFC' : '#1C2128' },
          '&.Mui-selected': {
            backgroundColor: mode === 'light' ? '#EBF8FF' : 'rgba(88,166,255,0.1)',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${mode === 'light' ? '#EDF2F7' : '#21262D'}`,
          padding: '12px 16px',
          fontSize: '0.875rem',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: '0 20px 40px rgba(0,0,0,0.16)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { fontSize: '1.125rem', fontWeight: 600, padding: '20px 24px 12px' },
      },
    },
    MuiDialogContent: {
      styleOverrides: { root: { padding: '12px 24px' } },
    },
    MuiDialogActions: {
      styleOverrides: { root: { padding: '12px 24px 20px', gap: 8 } },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 8, fontSize: '0.875rem' },
        standardSuccess: {
          backgroundColor: '#C6F6D5',
          color: '#22543D',
          '& .MuiAlert-icon': { color: '#38A169' },
        },
        standardWarning: {
          backgroundColor: '#FEFCBF',
          color: '#744210',
          '& .MuiAlert-icon': { color: '#D69E2E' },
        },
        standardError: {
          backgroundColor: '#FED7D7',
          color: '#822727',
          '& .MuiAlert-icon': { color: '#E53E3E' },
        },
        standardInfo: {
          backgroundColor: '#BEE3F8',
          color: '#2A4365',
          '& .MuiAlert-icon': { color: '#3182CE' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#2A3F5F', height: 3, borderRadius: '3px 3px 0 0' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          minHeight: 48,
          '&.Mui-selected': { color: '#2A3F5F', fontWeight: 600 },
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: { backgroundColor: '#2A3F5F', fontWeight: 600 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1A202C',
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 10px',
          borderRadius: 6,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        primary: {
          backgroundColor: '#E5A53A',
          color: '#1A202C',
          boxShadow: '0 4px 12px rgba(229,165,58,0.3)',
          '&:hover': { backgroundColor: '#C4892E' },
        },
      },
    },
  },
});

export const createAppTheme = (mode: 'light' | 'dark' = 'light') => createTheme(getDesignTokens(mode));

export const theme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

export default theme;
