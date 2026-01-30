# LUMINAR DESIGN SYSTEM — DARK MODE PREMIUM

> **Instruções para Claude Code**: Leia este arquivo completo e implemente todas as alterações no projeto SGE Diário Digital.
> **Estilo**: Dashboard Dark Mode Premium (inspirado nas referências visuais fornecidas)
> **Stack**: MUI v7 + Next.js 16 + TypeScript

---

## 🎯 VISÃO GERAL

### Características do Design
- **Modo**: Dark Mode como padrão (com suporte a Light Mode)
- **Cards**: Bordas arredondadas (16px), sem borda visível, fundo elevado
- **Tabelas**: Rows com hover sutil, sem bordas pesadas, header discreto
- **Status Chips**: Coloridos com fundo transparente e borda
- **Progress Bars**: Finas e coloridas
- **Sidebar**: Ícones com tooltip, fundo escuro
- **Typography**: Inter/IBM Plex Sans, hierarquia clara
- **Sombras**: Sutis, quase imperceptíveis no dark mode

### Paleta de Cores Luminar (Dark Mode)
```
Background Page:    #0D1117 (quase preto)
Background Card:    #161B22 (cinza escuro)
Background Elevated: #21262D (cinza médio)
Background Subtle:  #30363D (bordas sutis)

Brand Primary:      #3D5A80 (Navy claro para dark)
Brand Secondary:    #F5C96B (Gold claro para dark)

Accent Purple:      #8B5CF6 (gráficos, destaques)
Accent Blue:        #58A6FF (links, progress)
Accent Cyan:        #39D0D8 (indicadores)

Text Primary:       #F0F6FC (branco suave)
Text Secondary:     #8B949E (cinza claro)
Text Muted:         #6E7681 (cinza médio)

Status Success:     #3FB950
Status Warning:     #D29922
Status Error:       #F85149
Status Info:        #58A6FF

Border Default:     #30363D
Border Subtle:      #21262D
```

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### TAREFA 1: Criar `src/styles/tokens.css`

```css
/* =====================================================
   LUMINAR DESIGN SYSTEM - DARK MODE PREMIUM
   SGE Diário Digital | Janeiro 2026
   ===================================================== */

:root {
  /* ===== MODO PADRÃO: DARK ===== */
  --color-scheme: dark;

  /* ===== BRAND ===== */
  --brand-primary: #3D5A80;
  --brand-primary-hover: #4A6B94;
  --brand-primary-light: #58A6FF;
  --brand-secondary: #F5C96B;
  --brand-secondary-hover: #E5A53A;

  /* ===== BACKGROUNDS ===== */
  --bg-page: #0D1117;
  --bg-card: #161B22;
  --bg-card-hover: #1C2128;
  --bg-elevated: #21262D;
  --bg-subtle: #30363D;
  --bg-sidebar: #0D1117;
  --bg-header: #161B22;
  --bg-input: #0D1117;
  --bg-input-hover: #161B22;
  --bg-overlay: rgba(0, 0, 0, 0.7);

  /* ===== TEXT ===== */
  --text-primary: #F0F6FC;
  --text-secondary: #8B949E;
  --text-muted: #6E7681;
  --text-disabled: #484F58;
  --text-on-brand: #FFFFFF;
  --text-link: #58A6FF;
  --text-link-hover: #79C0FF;

  /* ===== BORDERS ===== */
  --border-default: #30363D;
  --border-subtle: #21262D;
  --border-strong: #484F58;
  --border-focus: #58A6FF;
  --border-input: #30363D;
  --border-input-hover: #484F58;
  --border-input-focus: #58A6FF;

  /* ===== ACCENTS ===== */
  --accent-purple: #8B5CF6;
  --accent-purple-bg: rgba(139, 92, 246, 0.15);
  --accent-blue: #58A6FF;
  --accent-blue-bg: rgba(88, 166, 255, 0.15);
  --accent-cyan: #39D0D8;
  --accent-cyan-bg: rgba(57, 208, 216, 0.15);
  --accent-pink: #F778BA;
  --accent-pink-bg: rgba(247, 120, 186, 0.15);

  /* ===== STATUS ===== */
  --status-success: #3FB950;
  --status-success-bg: rgba(63, 185, 80, 0.15);
  --status-success-border: rgba(63, 185, 80, 0.4);
  --status-warning: #D29922;
  --status-warning-bg: rgba(210, 153, 34, 0.15);
  --status-warning-border: rgba(210, 153, 34, 0.4);
  --status-error: #F85149;
  --status-error-bg: rgba(248, 81, 73, 0.15);
  --status-error-border: rgba(248, 81, 73, 0.4);
  --status-info: #58A6FF;
  --status-info-bg: rgba(88, 166, 255, 0.15);
  --status-info-border: rgba(88, 166, 255, 0.4);

  /* ===== EDUCATION ===== */
  --grade-a: #3FB950;
  --grade-a-bg: rgba(63, 185, 80, 0.15);
  --grade-b: #58A6FF;
  --grade-b-bg: rgba(88, 166, 255, 0.15);
  --grade-c: #D29922;
  --grade-c-bg: rgba(210, 153, 34, 0.15);
  --grade-d: #F78166;
  --grade-d-bg: rgba(247, 129, 102, 0.15);
  --grade-e: #F85149;
  --grade-e-bg: rgba(248, 81, 73, 0.15);

  --presence: #3FB950;
  --presence-bg: rgba(63, 185, 80, 0.15);
  --absence: #F85149;
  --absence-bg: rgba(248, 81, 73, 0.15);
  --justified: #D29922;
  --justified-bg: rgba(210, 153, 34, 0.15);

  /* ===== SHADOWS ===== */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.4);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-modal: 0 24px 48px rgba(0, 0, 0, 0.6);
  --shadow-button: 0 2px 4px rgba(0, 0, 0, 0.3);
  --shadow-glow-primary: 0 0 20px rgba(61, 90, 128, 0.3);
  --shadow-glow-accent: 0 0 20px rgba(139, 92, 246, 0.3);

  /* ===== SPACING ===== */
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* ===== RADIUS ===== */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 9999px;

  /* ===== TRANSITIONS ===== */
  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
  --transition-slow: 0.3s ease;

  /* ===== LAYOUT ===== */
  --sidebar-expanded: 260px;
  --sidebar-collapsed: 72px;
  --header-height: 64px;

  /* ===== Z-INDEX ===== */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-tooltip: 1070;
  --z-toast: 1080;
}

/* ===== LIGHT MODE ===== */
[data-theme="light"] {
  --color-scheme: light;

  --brand-primary: #2A3F5F;
  --brand-primary-hover: #1E2D45;
  --brand-secondary: #E5A53A;
  --brand-secondary-hover: #C4892E;

  --bg-page: #F5F7FA;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F8FAFC;
  --bg-elevated: #FFFFFF;
  --bg-subtle: #F1F5F9;
  --bg-sidebar: #2A3F5F;
  --bg-header: #FFFFFF;
  --bg-input: #FFFFFF;
  --bg-input-hover: #F8FAFC;
  --bg-overlay: rgba(0, 0, 0, 0.5);

  --text-primary: #1A202C;
  --text-secondary: #4A5568;
  --text-muted: #718096;
  --text-disabled: #A0AEC0;
  --text-link: #2A3F5F;
  --text-link-hover: #1E2D45;

  --border-default: #E2E8F0;
  --border-subtle: #EDF2F7;
  --border-strong: #CBD5E0;
  --border-focus: #2A3F5F;
  --border-input: #E2E8F0;
  --border-input-hover: #CBD5E0;
  --border-input-focus: #2A3F5F;

  --status-success: #22C55E;
  --status-success-bg: #DCFCE7;
  --status-success-border: #86EFAC;
  --status-warning: #F59E0B;
  --status-warning-bg: #FEF3C7;
  --status-warning-border: #FCD34D;
  --status-error: #EF4444;
  --status-error-bg: #FEE2E2;
  --status-error-border: #FCA5A5;
  --status-info: #3B82F6;
  --status-info-bg: #DBEAFE;
  --status-info-border: #93C5FD;

  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 8px 24px rgba(0, 0, 0, 0.1);
  --shadow-dropdown: 0 8px 24px rgba(0, 0, 0, 0.12);
  --shadow-modal: 0 24px 48px rgba(0, 0, 0, 0.15);
}
```

---

### TAREFA 2: Substituir `src/lib/theme.ts`

```typescript
'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

// Layout constants
export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 72;
export const HEADER_HEIGHT = 64;

// Luminar Dark Mode Premium Colors
const darkPalette = {
  primary: {
    main: '#3D5A80',
    light: '#58A6FF',
    dark: '#2A3F5F',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#F5C96B',
    light: '#FFEAA7',
    dark: '#E5A53A',
    contrastText: '#0D1117',
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
            background: `linear-gradient(135deg, ${palette.primary.main} 0%, ${palette.primary.dark} 100%)`,
            boxShadow: isDark ? '0 2px 8px rgba(61, 90, 128, 0.4)' : '0 2px 8px rgba(42, 63, 95, 0.25)',
            '&:hover': {
              background: `linear-gradient(135deg, ${palette.primary.light} 0%, ${palette.primary.main} 100%)`,
              boxShadow: isDark ? '0 4px 16px rgba(61, 90, 128, 0.5)' : '0 4px 16px rgba(42, 63, 95, 0.3)',
            },
          },
          containedSecondary: {
            background: `linear-gradient(135deg, ${palette.secondary.main} 0%, ${palette.secondary.dark} 100%)`,
            color: isDark ? '#0D1117' : '#1A202C',
            boxShadow: isDark ? '0 2px 8px rgba(245, 201, 107, 0.4)' : '0 2px 8px rgba(229, 165, 58, 0.3)',
            '&:hover': {
              background: `linear-gradient(135deg, ${palette.secondary.light} 0%, ${palette.secondary.main} 100%)`,
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
            backgroundColor: isDark ? '#0D1117' : '#2A3F5F',
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
              borderLeft: '3px solid #F5C96B',
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
              borderColor: isDark ? '#58A6FF' : '#2A3F5F',
              borderWidth: 2,
            },
          },
          input: {
            padding: '10px 14px',
            '&::placeholder': { color: palette.text.muted, opacity: 1 },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            color: palette.text.secondary,
            '&.Mui-focused': { color: isDark ? '#58A6FF' : '#2A3F5F' },
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
              backgroundColor: isDark ? alpha('#58A6FF', 0.08) : alpha('#2A3F5F', 0.08),
              '&:hover': {
                backgroundColor: isDark ? alpha('#58A6FF', 0.12) : alpha('#2A3F5F', 0.12),
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
              color: isDark ? '#58A6FF' : '#2A3F5F',
            },
          },
        },
      },

      // ===== DIALOG / MODAL =====
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
            backgroundColor: isDark ? '#58A6FF' : '#2A3F5F',
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
              color: isDark ? '#F0F6FC' : '#2A3F5F',
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
              backgroundColor: isDark ? '#58A6FF' : '#2A3F5F',
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
            color: palette.text.muted,
          },
        },
      },

      // ===== FAB =====
      MuiFab: {
        styleOverrides: {
          primary: {
            background: `linear-gradient(135deg, ${palette.secondary.main} 0%, ${palette.secondary.dark} 100%)`,
            color: isDark ? '#0D1117' : '#1A202C',
            boxShadow: '0 4px 16px rgba(245, 201, 107, 0.4)',
            '&:hover': {
              background: `linear-gradient(135deg, ${palette.secondary.light} 0%, ${palette.secondary.main} 100%)`,
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
```

---

### TAREFA 3: Atualizar `src/app/globals.css`

Adicionar no topo do arquivo:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import '../styles/tokens.css';

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
  color-scheme: dark;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-page);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
}

/* Selection */
::selection {
  background-color: rgba(88, 166, 255, 0.3);
  color: var(--text-primary);
}

/* Focus Visible */
:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

/* Links */
a {
  color: var(--text-link);
  text-decoration: none;
  transition: color 0.15s ease;
}

a:hover {
  color: var(--text-link-hover);
}

/* Scrollbar global */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-default);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--border-strong);
}

/* Custom utility classes */
.gradient-text {
  background: linear-gradient(135deg, var(--brand-primary) 0%, var(--accent-blue) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.glow-primary {
  box-shadow: 0 0 20px rgba(61, 90, 128, 0.3);
}

.glow-accent {
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

.card-hover {
  transition: all 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}
```

---

### TAREFA 4: Atualizar `src/app/layout.tsx`

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

// No return do layout, adicionar a classe:
<html lang="pt-BR" className={inter.variable} data-theme="dark">
```

---

### TAREFA 5: Adicionar suporte a tema no `src/store/uiStore.ts`

Adicionar ao store existente:

```typescript
// Adicionar ao interface UIState:
themeMode: 'light' | 'dark' | 'system';
setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
getEffectiveTheme: () => 'light' | 'dark';

// Adicionar ao create:
themeMode: 'dark', // Default dark

setThemeMode: (mode) => {
  set({ themeMode: mode });
  // Atualizar data-theme no documento
  if (typeof document !== 'undefined') {
    const effectiveTheme = mode === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    document.documentElement.setAttribute('data-theme', effectiveTheme);
  }
},

getEffectiveTheme: () => {
  const { themeMode } = get();
  if (themeMode === 'system' && typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return themeMode === 'system' ? 'dark' : themeMode;
},
```

---

### TAREFA 6: Criar componente de toggle de tema (opcional)

Criar `src/components/ui/ThemeToggle.tsx`:

```tsx
'use client';

import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { DarkMode, LightMode, SettingsBrightness, Check } from '@mui/icons-material';
import { useState } from 'react';
import { useUIStore } from '@/store/uiStore';

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useUIStore();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSelect = (mode: 'light' | 'dark' | 'system') => {
    setThemeMode(mode);
    handleClose();
  };

  const getIcon = () => {
    switch (themeMode) {
      case 'light': return <LightMode />;
      case 'dark': return <DarkMode />;
      default: return <SettingsBrightness />;
    }
  };

  return (
    <>
      <Tooltip title="Tema">
        <IconButton onClick={handleClick} sx={{ color: 'text.secondary' }}>
          {getIcon()}
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => handleSelect('light')}>
          <ListItemIcon><LightMode fontSize="small" /></ListItemIcon>
          <ListItemText>Claro</ListItemText>
          {themeMode === 'light' && <Check fontSize="small" sx={{ ml: 1 }} />}
        </MenuItem>
        <MenuItem onClick={() => handleSelect('dark')}>
          <ListItemIcon><DarkMode fontSize="small" /></ListItemIcon>
          <ListItemText>Escuro</ListItemText>
          {themeMode === 'dark' && <Check fontSize="small" sx={{ ml: 1 }} />}
        </MenuItem>
        <MenuItem onClick={() => handleSelect('system')}>
          <ListItemIcon><SettingsBrightness fontSize="small" /></ListItemIcon>
          <ListItemText>Sistema</ListItemText>
          {themeMode === 'system' && <Check fontSize="small" sx={{ ml: 1 }} />}
        </MenuItem>
      </Menu>
    </>
  );
}
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Arquivos a Criar
- [ ] `src/styles/tokens.css` - CSS Variables completo
- [ ] `src/components/ui/ThemeToggle.tsx` - Toggle de tema (opcional)

### Arquivos a Modificar
- [ ] `src/lib/theme.ts` - Substituir completamente
- [ ] `src/app/globals.css` - Adicionar imports e estilos base
- [ ] `src/app/layout.tsx` - Configurar fonte Inter e data-theme
- [ ] `src/store/uiStore.ts` - Adicionar suporte a tema

### Verificações Pós-Implementação
- [ ] Testar modo dark (padrão)
- [ ] Testar modo light
- [ ] Verificar sidebar (cores e hover)
- [ ] Verificar cards (bordas, hover, sombras)
- [ ] Verificar tabelas (header, rows, hover)
- [ ] Verificar chips de status (cores corretas)
- [ ] Verificar inputs (focus, hover)
- [ ] Verificar botões (gradientes, hover)
- [ ] Verificar modais (backdrop, bordas)
- [ ] Testar responsividade mobile
- [ ] Verificar scrollbars customizadas

---

## 🎨 RESUMO VISUAL

### Paleta Dark Mode
| Elemento | Cor | Hex |
|----------|-----|-----|
| Page Background | Preto suave | `#0D1117` |
| Card Background | Cinza escuro | `#161B22` |
| Elevated | Cinza médio | `#21262D` |
| Border | Cinza borda | `#30363D` |
| Text Primary | Branco suave | `#F0F6FC` |
| Text Secondary | Cinza claro | `#8B949E` |
| Accent Blue | Azul | `#58A6FF` |
| Accent Gold | Dourado | `#F5C96B` |
| Success | Verde | `#3FB950` |
| Warning | Amarelo | `#D29922` |
| Error | Vermelho | `#F85149` |

### Características
- **Border Radius**: Cards 16px, Buttons/Inputs 8px, Chips 6px
- **Shadows**: Sutis no dark, mais pronunciadas no hover
- **Transitions**: 0.15s ease (rápido e suave)
- **Gradients**: Botões primary/secondary com gradiente
- **Hover States**: Background sutil + border mais claro

---

## 🚀 COMANDO PARA EXECUTAR

Após colocar este arquivo na raiz do projeto, execute:

```
Leia o arquivo LUMINAR_DARK_MODE_PREMIUM.md e implemente todas as alterações.
Comece criando o tokens.css, depois substitua o theme.ts, atualize o globals.css
e o layout.tsx. Por fim, atualize o uiStore.ts para suporte a temas.
```

Ou de forma mais direta:

```
Implemente o Design System Dark Mode Premium do arquivo LUMINAR_DARK_MODE_PREMIUM.md
```
