# LUMINAR DESIGN SYSTEM — IMPLEMENTAÇÃO

> **Instruções para Claude Code**: Leia este arquivo e implemente as alterações no projeto SGE Diário Digital.
> Estilo baseado no Highpoint (Eleken) - Clean, modular, cards com sombras sutis.

---

## 🎯 RESUMO

Implementar redesign da plataforma educacional Luminar com:
- **Paleta**: Navy (#2A3F5F) + Gold (#E5A53A) + Cinzas
- **Estilo**: Cards modulares, sombras sutis, hierarquia com tons de cinza
- **Fonte**: IBM Plex Sans (ou Inter como fallback)
- **Framework**: MUI v7 com Material Design 3

---

## 📁 ARQUIVOS PARA CRIAR/MODIFICAR

### 1. CRIAR: `src/styles/tokens.css`

```css
/* LUMINAR DESIGN TOKENS - Estilo Highpoint */

:root {
  /* ===== BRAND ===== */
  --color-primary: #2A3F5F;
  --color-primary-hover: #1E2D45;
  --color-primary-light: #3D5A80;
  --color-accent: #E5A53A;
  --color-accent-hover: #C4892E;
  --color-accent-light: #F5C96B;

  /* ===== BACKGROUNDS ===== */
  --bg-page: #F5F7FA;
  --bg-card: #FFFFFF;
  --bg-card-hover: #FAFBFC;
  --bg-sidebar: #2A3F5F;
  --bg-header: #FFFFFF;
  --bg-input: #FFFFFF;
  --bg-subtle: #F0F2F5;
  --bg-muted: #E8ECF0;

  /* ===== TEXT ===== */
  --text-primary: #1A202C;
  --text-secondary: #4A5568;
  --text-muted: #718096;
  --text-disabled: #A0AEC0;
  --text-on-primary: #FFFFFF;
  --text-on-accent: #1A202C;
  --text-link: #2A3F5F;

  /* ===== BORDERS ===== */
  --border-light: #E2E8F0;
  --border-default: #CBD5E0;
  --border-focus: #2A3F5F;
  --border-input: #E2E8F0;

  /* ===== STATUS ===== */
  --color-success: #38A169;
  --color-success-bg: #C6F6D5;
  --color-warning: #D69E2E;
  --color-warning-bg: #FEFCBF;
  --color-error: #E53E3E;
  --color-error-bg: #FED7D7;
  --color-info: #3182CE;
  --color-info-bg: #BEE3F8;

  /* ===== EDUCATION ===== */
  --grade-a: #38A169;
  --grade-b: #3182CE;
  --grade-c: #D69E2E;
  --grade-d: #DD6B20;
  --grade-e: #E53E3E;
  --presence: #38A169;
  --absence: #E53E3E;
  --justified: #D69E2E;

  /* ===== SHADOWS (Estilo Highpoint - sutis) ===== */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.08);
  --shadow-dropdown: 0 4px 16px rgba(0, 0, 0, 0.12);
  --shadow-modal: 0 20px 40px rgba(0, 0, 0, 0.16);
  --shadow-button: 0 2px 4px rgba(42, 63, 95, 0.2);

  /* ===== SPACING ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  /* ===== RADIUS ===== */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* ===== LAYOUT ===== */
  --sidebar-expanded: 260px;
  --sidebar-collapsed: 72px;
  --header-height: 64px;
}

/* DARK MODE */
[data-theme="dark"] {
  --bg-page: #0D1117;
  --bg-card: #161B22;
  --bg-card-hover: #1C2128;
  --bg-sidebar: #161B22;
  --bg-header: #161B22;
  --bg-input: #0D1117;
  --bg-subtle: #1C2128;
  --bg-muted: #21262D;

  --text-primary: #F0F6FC;
  --text-secondary: #8B949E;
  --text-muted: #6E7681;
  --text-disabled: #484F58;

  --border-light: #21262D;
  --border-default: #30363D;
  --border-focus: #58A6FF;
  --border-input: #30363D;

  --color-primary: #58A6FF;
  --color-primary-hover: #79B8FF;
  --color-accent: #F5C96B;

  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-card-hover: 0 4px 12px rgba(0, 0, 0, 0.4);
}
```

---

### 2. MODIFICAR: `src/lib/theme.ts`

Substituir conteúdo completo por:

```typescript
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
  },
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
```

---

### 3. MODIFICAR: `src/app/globals.css`

Adicionar no topo:

```css
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
@import './tokens.css';

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-page);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Selection */
::selection {
  background-color: rgba(42, 63, 95, 0.2);
  color: var(--text-primary);
}

/* Focus visible */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Links */
a {
  color: var(--text-link);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
```

---

### 4. MODIFICAR: `src/app/layout.tsx`

Adicionar fonte IBM Plex Sans:

```tsx
import { IBM_Plex_Sans } from 'next/font/google';

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-ibm-plex',
});

// No return do layout:
<html lang="pt-BR" className={ibmPlexSans.variable}>
```

---

## 🎨 RESUMO VISUAL

### Cores Principais
| Nome | Hex | Uso |
|------|-----|-----|
| Navy | `#2A3F5F` | Botões, sidebar, links |
| Gold | `#E5A53A` | Accent, FAB, destaques |
| Background | `#F5F7FA` | Fundo da página |
| Card | `#FFFFFF` | Cards, modais |
| Text | `#1A202C` | Texto principal |
| Muted | `#718096` | Texto secundário |

### Componentes Estilo Highpoint
- **Cards**: Borda sutil + sombra leve + hover suave
- **Botões**: Sem elevation, sombra sutil no primary
- **Sidebar**: Navy sólido, item ativo com borda gold
- **Tabelas**: Header cinza claro, rows com hover sutil
- **Inputs**: Borda clara, focus azul navy

---

## ✅ CHECKLIST

- [ ] Criar `src/styles/tokens.css`
- [ ] Atualizar `src/lib/theme.ts`
- [ ] Atualizar `src/app/globals.css`
- [ ] Atualizar `src/app/layout.tsx` (fonte)
- [ ] Testar componentes visuais
- [ ] Verificar sidebar e header
- [ ] Testar dark mode (opcional)

---

**Execute**: `npm run dev` e verifique as alterações no navegador.
