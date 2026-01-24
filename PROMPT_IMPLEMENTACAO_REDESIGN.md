# PROMPT DE IMPLEMENTAÇÃO — REDESIGN LUMINAR

> Execute este prompt para implementar o Design System Luminar no SGE Diário Digital

---

## 🎯 OBJETIVO

Implementar o redesign completo da plataforma SGE Diário Digital seguindo o Design System Luminar, mantendo compatibilidade com a arquitetura existente (Next.js 16+, MUI v7, TypeScript, Firebase, Zustand).

---

## 📋 CONTEXTO

### Identidade Visual
- **Logo**: Lâmpada com cérebro simbolizando iluminação do conhecimento
- **Cor Primária (Navy)**: #2A3F5F - Confiança, profissionalismo
- **Cor Accent (Gold)**: #E5A53A - Iluminação, excelência
- **Personalidade**: Profissional, acolhedor, moderno

### Stack Existente
- Next.js 16+ (App Router)
- TypeScript 5+ (strict mode)
- MUI v7 (Material Design 3)
- Firebase (Firestore, Auth, Storage)
- Zustand (authStore, uiStore, filterStore)
- PWA com next-pwa

### Arquivos a Modificar
```
src/
├── lib/
│   ├── theme.ts              # ⚠️ PRINCIPAL - Tema MUI completo
│   └── firebase.ts           # Manter inalterado
├── styles/
│   └── globals.css           # Adicionar CSS Variables
├── store/
│   └── uiStore.ts            # Adicionar themeMode
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx    # Atualizar cores sidebar
│   │   ├── Sidebar.tsx       # Atualizar estilos
│   │   └── Header.tsx        # Atualizar estilos
│   └── ui/                   # Atualizar componentes
└── app/
    └── layout.tsx            # Configurar fontes
```

---

## 🚀 TAREFA 1: Criar Tokens CSS

Crie o arquivo `src/styles/tokens.css` com as CSS Variables:

```css
:root {
  /* ===== CORES DA MARCA ===== */
  --brand-primary: #2A3F5F;
  --brand-primary-hover: #1E2D45;
  --brand-primary-active: #162235;
  --brand-primary-light: #3D5A80;
  --brand-secondary: #E5A53A;
  --brand-secondary-hover: #C4892E;
  --brand-secondary-light: #F5C96B;
  --brand-on-primary: #FFFFFF;
  --brand-on-secondary: #1E2D45;

  /* ===== TEXTO ===== */
  --text-primary: #1E2D45;
  --text-secondary: #4A5568;
  --text-muted: #718096;
  --text-disabled: #A0AEC0;
  --text-on-dark: #F8FAFC;
  --text-on-brand: #FFFFFF;
  --text-link: #2A3F5F;
  --text-link-hover: #1E2D45;

  /* ===== SUPERFÍCIES ===== */
  --surface-page: #F8FAFC;
  --surface-section: #F1F5F9;
  --surface-card: #FFFFFF;
  --surface-card-hover: #F8FAFC;
  --surface-subtle: #EDF2F7;
  --surface-elevated: #FFFFFF;
  --surface-overlay: rgba(30, 45, 69, 0.5);
  --surface-sidebar: #2A3F5F;
  --surface-header: #FFFFFF;

  /* ===== AÇÕES ===== */
  --action-primary: #2A3F5F;
  --action-primary-hover: #1E2D45;
  --action-primary-active: #162235;
  --action-secondary-hover: #EDF2F7;
  --action-accent: #E5A53A;
  --action-accent-hover: #C4892E;
  --action-ghost-hover: rgba(42, 63, 95, 0.08);

  /* ===== BORDAS ===== */
  --border-default: #E2E8F0;
  --border-subtle: #EDF2F7;
  --border-strong: #CBD5E0;
  --border-focus: #2A3F5F;
  --border-input: #CBD5E0;
  --border-input-hover: #A0AEC0;
  --border-input-focus: #2A3F5F;

  /* ===== STATUS ===== */
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

  /* ===== EDUCAÇÃO ===== */
  --grade-excellent: #22C55E;
  --grade-good: #3B82F6;
  --grade-average: #F59E0B;
  --grade-below: #F97316;
  --grade-failing: #EF4444;
  --attendance-present: #22C55E;
  --attendance-absent: #EF4444;
  --attendance-justified: #F59E0B;

  /* ===== SOMBRAS ===== */
  --shadow-xs: 0 1px 2px rgba(30, 45, 69, 0.05);
  --shadow-sm: 0 1px 3px rgba(30, 45, 69, 0.08), 0 1px 2px rgba(30, 45, 69, 0.06);
  --shadow-md: 0 4px 6px rgba(30, 45, 69, 0.07), 0 2px 4px rgba(30, 45, 69, 0.06);
  --shadow-lg: 0 10px 15px rgba(30, 45, 69, 0.08), 0 4px 6px rgba(30, 45, 69, 0.05);
  --shadow-xl: 0 20px 25px rgba(30, 45, 69, 0.10), 0 10px 10px rgba(30, 45, 69, 0.04);
  --shadow-card: 0 1px 3px rgba(30, 45, 69, 0.06), 0 1px 2px rgba(30, 45, 69, 0.04);
  --shadow-card-hover: 0 10px 20px rgba(30, 45, 69, 0.08), 0 4px 8px rgba(30, 45, 69, 0.04);
  --shadow-button-primary: 0 4px 14px rgba(42, 63, 95, 0.25);
  --shadow-button-accent: 0 4px 14px rgba(229, 165, 58, 0.35);
  --shadow-dropdown: 0 10px 40px rgba(30, 45, 69, 0.12);
  --shadow-modal: 0 25px 50px rgba(30, 45, 69, 0.2);
  --shadow-sidebar: 4px 0 16px rgba(30, 45, 69, 0.08);

  /* ===== ESPAÇAMENTO ===== */
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

  /* ===== RAIOS ===== */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;

  /* ===== TRANSIÇÕES ===== */
  --transition-fast: 0.15s ease-in-out;
  --transition-normal: 0.2s ease-in-out;
  --transition-slow: 0.3s ease-in-out;

  /* ===== SIDEBAR ===== */
  --sidebar-width-expanded: 260px;
  --sidebar-width-collapsed: 72px;
  --header-height: 64px;
}

/* ===== DARK MODE ===== */
[data-theme="dark"] {
  --brand-primary: #3D5A80;
  --brand-primary-hover: #4A6B94;
  --brand-primary-active: #5B7CA8;
  --brand-secondary: #F5C96B;
  --brand-secondary-hover: #E5A53A;

  --text-primary: #F1F5F9;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;
  --text-disabled: #475569;
  --text-link: #6B9FD4;
  --text-link-hover: #8BB4E0;

  --surface-page: #0F172A;
  --surface-section: #1E293B;
  --surface-card: #1E293B;
  --surface-card-hover: #334155;
  --surface-subtle: #1E293B;
  --surface-elevated: #334155;
  --surface-overlay: rgba(0, 0, 0, 0.7);
  --surface-sidebar: #1E293B;
  --surface-header: #1E293B;

  --action-secondary-hover: #334155;
  --action-ghost-hover: rgba(255, 255, 255, 0.08);

  --border-default: #334155;
  --border-subtle: #1E293B;
  --border-strong: #475569;
  --border-focus: #6B9FD4;
  --border-input: #475569;
  --border-input-hover: #64748B;
  --border-input-focus: #6B9FD4;

  --status-success: #4ADE80;
  --status-success-bg: rgba(34, 197, 94, 0.15);
  --status-warning: #FBBF24;
  --status-warning-bg: rgba(245, 158, 11, 0.15);
  --status-error: #F87171;
  --status-error-bg: rgba(239, 68, 68, 0.15);
  --status-info: #60A5FA;
  --status-info-bg: rgba(59, 130, 246, 0.15);

  --shadow-card: 0 1px 3px rgba(0, 0, 0, 0.2);
  --shadow-card-hover: 0 10px 20px rgba(0, 0, 0, 0.3);
  --shadow-dropdown: 0 10px 40px rgba(0, 0, 0, 0.4);
  --shadow-modal: 0 25px 50px rgba(0, 0, 0, 0.5);
}
```

---

## 🚀 TAREFA 2: Atualizar Theme MUI

Substitua o conteúdo de `src/lib/theme.ts`:

```typescript
'use client';

import { createTheme, ThemeOptions } from '@mui/material/styles';

// ===== PALETA DE CORES =====
const palette = {
  light: {
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
      contrastText: '#1E2D45',
    },
    background: {
      default: '#F8FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1E2D45',
      secondary: '#4A5568',
      disabled: '#A0AEC0',
    },
    divider: '#E2E8F0',
    success: {
      main: '#22C55E',
      light: '#DCFCE7',
      dark: '#16A34A',
      contrastText: '#FFFFFF',
    },
    warning: {
      main: '#F59E0B',
      light: '#FEF3C7',
      dark: '#D97706',
      contrastText: '#1E2D45',
    },
    error: {
      main: '#EF4444',
      light: '#FEE2E2',
      dark: '#DC2626',
      contrastText: '#FFFFFF',
    },
    info: {
      main: '#3B82F6',
      light: '#DBEAFE',
      dark: '#2563EB',
      contrastText: '#FFFFFF',
    },
    grey: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#171923',
    },
  },
  dark: {
    primary: {
      main: '#3D5A80',
      light: '#4A6B94',
      dark: '#2A3F5F',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#F5C96B',
      light: '#FFEAA7',
      dark: '#E5A53A',
      contrastText: '#1E2D45',
    },
    background: {
      default: '#0F172A',
      paper: '#1E293B',
    },
    text: {
      primary: '#F1F5F9',
      secondary: '#94A3B8',
      disabled: '#475569',
    },
    divider: '#334155',
    success: {
      main: '#4ADE80',
      light: 'rgba(34, 197, 94, 0.15)',
      dark: '#22C55E',
      contrastText: '#0F172A',
    },
    warning: {
      main: '#FBBF24',
      light: 'rgba(245, 158, 11, 0.15)',
      dark: '#F59E0B',
      contrastText: '#0F172A',
    },
    error: {
      main: '#F87171',
      light: 'rgba(239, 68, 68, 0.15)',
      dark: '#EF4444',
      contrastText: '#0F172A',
    },
    info: {
      main: '#60A5FA',
      light: 'rgba(59, 130, 246, 0.15)',
      dark: '#3B82F6',
      contrastText: '#0F172A',
    },
    grey: {
      50: '#1E293B',
      100: '#334155',
      200: '#475569',
      300: '#64748B',
      400: '#94A3B8',
      500: '#CBD5E1',
      600: '#E2E8F0',
      700: '#F1F5F9',
      800: '#F8FAFC',
      900: '#FFFFFF',
    },
  },
};

// ===== TIPOGRAFIA =====
const typography = {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h1: {
    fontSize: '2.25rem',
    fontWeight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.02em',
  },
  h2: {
    fontSize: '1.875rem',
    fontWeight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  h3: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: 1.4,
  },
  h5: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  h6: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  body1: {
    fontSize: '1rem',
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  caption: {
    fontSize: '0.75rem',
    lineHeight: 1.5,
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'none' as const,
    letterSpacing: '0.01em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
};

// ===== COMPONENTES =====
const getComponents = (mode: 'light' | 'dark'): ThemeOptions['components'] => ({
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarWidth: 'thin',
        '&::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: mode === 'light' ? '#F1F5F9' : '#1E293B',
        },
        '&::-webkit-scrollbar-thumb': {
          background: mode === 'light' ? '#CBD5E0' : '#475569',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: mode === 'light' ? '#A0AEC0' : '#64748B',
        },
      },
    },
  },

  MuiButton: {
    defaultProps: {
      disableElevation: true,
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.875rem',
        letterSpacing: '0.01em',
        transition: 'all 0.2s ease-in-out',
      },
      sizeMedium: {
        height: 40,
        padding: '8px 16px',
      },
      sizeSmall: {
        height: 32,
        padding: '6px 12px',
        fontSize: '0.8125rem',
      },
      sizeLarge: {
        height: 48,
        padding: '12px 24px',
        fontSize: '1rem',
      },
      containedPrimary: {
        boxShadow: '0 4px 14px rgba(42, 63, 95, 0.25)',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(42, 63, 95, 0.3)',
        },
      },
      containedSecondary: {
        boxShadow: '0 4px 14px rgba(229, 165, 58, 0.35)',
        '&:hover': {
          boxShadow: '0 6px 20px rgba(229, 165, 58, 0.4)',
        },
      },
    },
  },

  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: 16,
        boxShadow: mode === 'light'
          ? '0 1px 3px rgba(30, 45, 69, 0.06), 0 1px 2px rgba(30, 45, 69, 0.04)'
          : '0 1px 3px rgba(0, 0, 0, 0.2)',
        transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
        '&:hover': {
          boxShadow: mode === 'light'
            ? '0 10px 20px rgba(30, 45, 69, 0.08), 0 4px 8px rgba(30, 45, 69, 0.04)'
            : '0 10px 20px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },

  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24,
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },

  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        backgroundImage: 'none',
      },
      rounded: {
        borderRadius: 16,
      },
    },
  },

  MuiDrawer: {
    styleOverrides: {
      paper: {
        backgroundColor: mode === 'light' ? '#2A3F5F' : '#1E293B',
        color: '#F8FAFC',
        borderRight: 'none',
        boxShadow: '4px 0 16px rgba(30, 45, 69, 0.08)',
      },
    },
  },

  MuiListItemButton: {
    styleOverrides: {
      root: {
        borderRadius: 0,
        margin: 0,
        padding: '12px 16px',
        color: 'rgba(255, 255, 255, 0.85)',
        transition: 'all 0.15s ease-in-out',
        '&:hover': {
          backgroundColor: 'rgba(255, 255, 255, 0.08)',
        },
        '&.Mui-selected': {
          backgroundColor: 'rgba(255, 255, 255, 0.12)',
          borderLeft: '3px solid #E5A53A',
          paddingLeft: '13px',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        },
      },
    },
  },

  MuiListItemIcon: {
    styleOverrides: {
      root: {
        color: 'inherit',
        minWidth: 40,
      },
    },
  },

  MuiListItemText: {
    styleOverrides: {
      primary: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
    },
  },

  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: mode === 'light' ? '#CBD5E0' : '#475569',
          transition: 'border-color 0.2s ease-in-out',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderColor: mode === 'light' ? '#A0AEC0' : '#64748B',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderColor: mode === 'light' ? '#2A3F5F' : '#6B9FD4',
          borderWidth: 2,
        },
      },
      input: {
        padding: '12px 16px',
        fontSize: '0.875rem',
      },
    },
  },

  MuiInputLabel: {
    styleOverrides: {
      root: {
        fontSize: '0.875rem',
        '&.Mui-focused': {
          color: mode === 'light' ? '#2A3F5F' : '#6B9FD4',
        },
      },
    },
  },

  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,
        fontWeight: 500,
        fontSize: '0.75rem',
      },
      colorSuccess: {
        backgroundColor: mode === 'light' ? '#DCFCE7' : 'rgba(34, 197, 94, 0.15)',
        color: mode === 'light' ? '#16A34A' : '#4ADE80',
        border: `1px solid ${mode === 'light' ? '#86EFAC' : '#22C55E'}`,
      },
      colorWarning: {
        backgroundColor: mode === 'light' ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)',
        color: mode === 'light' ? '#D97706' : '#FBBF24',
        border: `1px solid ${mode === 'light' ? '#FCD34D' : '#F59E0B'}`,
      },
      colorError: {
        backgroundColor: mode === 'light' ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
        color: mode === 'light' ? '#DC2626' : '#F87171',
        border: `1px solid ${mode === 'light' ? '#FCA5A5' : '#EF4444'}`,
      },
      colorInfo: {
        backgroundColor: mode === 'light' ? '#DBEAFE' : 'rgba(59, 130, 246, 0.15)',
        color: mode === 'light' ? '#2563EB' : '#60A5FA',
        border: `1px solid ${mode === 'light' ? '#93C5FD' : '#3B82F6'}`,
      },
    },
  },

  MuiTableContainer: {
    styleOverrides: {
      root: {
        borderRadius: 16,
        overflow: 'hidden',
      },
    },
  },

  MuiTableHead: {
    styleOverrides: {
      root: {
        backgroundColor: mode === 'light' ? '#F1F5F9' : '#1E293B',
        '& .MuiTableCell-head': {
          fontWeight: 600,
          color: mode === 'light' ? '#4A5568' : '#94A3B8',
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: `1px solid ${mode === 'light' ? '#E2E8F0' : '#334155'}`,
        },
      },
    },
  },

  MuiTableRow: {
    styleOverrides: {
      root: {
        transition: 'background-color 0.15s ease',
        '&:hover': {
          backgroundColor: mode === 'light' ? '#F8FAFC' : '#334155',
        },
        '&.Mui-selected': {
          backgroundColor: mode === 'light' 
            ? 'rgba(42, 63, 95, 0.08)' 
            : 'rgba(61, 90, 128, 0.2)',
          '&:hover': {
            backgroundColor: mode === 'light' 
              ? 'rgba(42, 63, 95, 0.12)' 
              : 'rgba(61, 90, 128, 0.3)',
          },
        },
      },
    },
  },

  MuiTableCell: {
    styleOverrides: {
      root: {
        borderBottom: `1px solid ${mode === 'light' ? '#EDF2F7' : '#1E293B'}`,
        padding: '16px',
        fontSize: '0.875rem',
      },
    },
  },

  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 24,
        boxShadow: mode === 'light'
          ? '0 25px 50px rgba(30, 45, 69, 0.2)'
          : '0 25px 50px rgba(0, 0, 0, 0.5)',
      },
    },
  },

  MuiDialogTitle: {
    styleOverrides: {
      root: {
        fontSize: '1.25rem',
        fontWeight: 600,
        padding: '24px 24px 16px',
      },
    },
  },

  MuiDialogContent: {
    styleOverrides: {
      root: {
        padding: '16px 24px',
      },
    },
  },

  MuiDialogActions: {
    styleOverrides: {
      root: {
        padding: '16px 24px 24px',
        gap: 12,
      },
    },
  },

  MuiAvatar: {
    styleOverrides: {
      root: {
        backgroundColor: mode === 'light' ? '#2A3F5F' : '#3D5A80',
        color: '#FFFFFF',
        fontWeight: 600,
      },
    },
  },

  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: mode === 'light' ? '#1E2D45' : '#334155',
        color: '#FFFFFF',
        fontSize: '0.75rem',
        fontWeight: 500,
        padding: '6px 12px',
        borderRadius: 6,
      },
      arrow: {
        color: mode === 'light' ? '#1E2D45' : '#334155',
      },
    },
  },

  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        fontSize: '0.875rem',
      },
      standardSuccess: {
        backgroundColor: mode === 'light' ? '#DCFCE7' : 'rgba(34, 197, 94, 0.15)',
        color: mode === 'light' ? '#166534' : '#4ADE80',
        borderLeft: '4px solid #22C55E',
      },
      standardWarning: {
        backgroundColor: mode === 'light' ? '#FEF3C7' : 'rgba(245, 158, 11, 0.15)',
        color: mode === 'light' ? '#92400E' : '#FBBF24',
        borderLeft: '4px solid #F59E0B',
      },
      standardError: {
        backgroundColor: mode === 'light' ? '#FEE2E2' : 'rgba(239, 68, 68, 0.15)',
        color: mode === 'light' ? '#991B1B' : '#F87171',
        borderLeft: '4px solid #EF4444',
      },
      standardInfo: {
        backgroundColor: mode === 'light' ? '#DBEAFE' : 'rgba(59, 130, 246, 0.15)',
        color: mode === 'light' ? '#1E40AF' : '#60A5FA',
        borderLeft: '4px solid #3B82F6',
      },
    },
  },

  MuiSnackbar: {
    styleOverrides: {
      root: {
        '& .MuiSnackbarContent-root': {
          borderRadius: 12,
        },
      },
    },
  },

  MuiTabs: {
    styleOverrides: {
      indicator: {
        backgroundColor: mode === 'light' ? '#2A3F5F' : '#6B9FD4',
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
        minHeight: 48,
        '&.Mui-selected': {
          color: mode === 'light' ? '#2A3F5F' : '#6B9FD4',
          fontWeight: 600,
        },
      },
    },
  },

  MuiFab: {
    styleOverrides: {
      primary: {
        backgroundColor: '#E5A53A',
        color: '#1E2D45',
        boxShadow: '0 4px 14px rgba(229, 165, 58, 0.35)',
        '&:hover': {
          backgroundColor: '#C4892E',
          boxShadow: '0 6px 20px rgba(229, 165, 58, 0.4)',
        },
      },
    },
  },

  MuiSpeedDial: {
    styleOverrides: {
      fab: {
        backgroundColor: '#E5A53A',
        color: '#1E2D45',
        '&:hover': {
          backgroundColor: '#C4892E',
        },
      },
    },
  },

  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        backgroundColor: mode === 'light' ? '#E2E8F0' : '#334155',
      },
      bar: {
        borderRadius: 4,
      },
    },
  },

  MuiCircularProgress: {
    styleOverrides: {
      circle: {
        strokeLinecap: 'round',
      },
    },
  },

  MuiSkeleton: {
    styleOverrides: {
      root: {
        backgroundColor: mode === 'light' ? '#E2E8F0' : '#334155',
      },
    },
  },
});

// ===== CRIAR TEMA =====
export const createAppTheme = (mode: 'light' | 'dark') => {
  return createTheme({
    palette: {
      mode,
      ...palette[mode],
    },
    typography,
    shape: {
      borderRadius: 8,
    },
    spacing: 8,
    components: getComponents(mode),
  });
};

// Tema padrão (light)
export const theme = createAppTheme('light');
export const darkTheme = createAppTheme('dark');

// Constantes de layout
export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 72;
export const HEADER_HEIGHT = 64;
```

---

## 🚀 TAREFA 3: Atualizar UI Store

Adicione suporte a tema no `src/store/uiStore.ts`:

```typescript
// Adicionar ao estado
interface UIState {
  // ... existente
  themeMode: 'light' | 'dark' | 'system';
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  getEffectiveTheme: () => 'light' | 'dark';
}

// Adicionar ao store
themeMode: 'system',
setThemeMode: (mode) => set({ themeMode: mode }),
getEffectiveTheme: () => {
  const state = get();
  if (state.themeMode === 'system') {
    return typeof window !== 'undefined' && 
      window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? 'dark' 
      : 'light';
  }
  return state.themeMode;
},
```

---

## 🚀 TAREFA 4: Configurar Fontes

Atualize `src/app/layout.tsx`:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// No layout
<html lang="pt-BR" className={inter.variable}>
```

E adicione ao `globals.css`:

```css
@import './tokens.css';

body {
  font-family: var(--font-inter), Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--surface-page);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

---

## 🚀 TAREFA 5: Atualizar Logo na Sidebar

Adicione a logo Luminar ao topo da sidebar:

```tsx
// Em Sidebar.tsx
<Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
  {/* Logo da lâmpada */}
  <Box
    component="img"
    src="/images/luminar-icon.svg"
    alt="Luminar"
    sx={{ width: 32, height: 32 }}
  />
  {sidebarMode === 'expanded' && (
    <Typography
      variant="h6"
      sx={{
        fontWeight: 700,
        color: '#FFFFFF',
        letterSpacing: '-0.02em',
      }}
    >
      Luminar
    </Typography>
  )}
</Box>
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Arquivos a Criar
- [ ] `src/styles/tokens.css` - CSS Variables
- [ ] `public/images/luminar-icon.svg` - Logo (extrair da PNG)

### Arquivos a Modificar
- [ ] `src/lib/theme.ts` - Tema MUI completo
- [ ] `src/styles/globals.css` - Importar tokens + estilos base
- [ ] `src/store/uiStore.ts` - Adicionar themeMode
- [ ] `src/app/layout.tsx` - Configurar fonte Inter
- [ ] `src/components/layout/Sidebar.tsx` - Cores + logo
- [ ] `src/components/layout/Header.tsx` - Cores
- [ ] `src/components/layout/MainLayout.tsx` - Background

### Componentes a Revisar
- [ ] `DataTable` - Aplicar novos estilos de tabela
- [ ] `FormModal` - Aplicar novos estilos de dialog
- [ ] `ConfirmDialog` - Aplicar novos estilos
- [ ] Todos os botões - Verificar variantes
- [ ] Todos os cards - Verificar sombras
- [ ] Todos os inputs - Verificar estados

### Validações
- [ ] Testar em Light Mode
- [ ] Testar em Dark Mode
- [ ] Testar responsividade mobile
- [ ] Verificar contraste (WCAG 2.1)
- [ ] Testar estados (hover, focus, disabled)
- [ ] Testar PWA offline

---

## 🎨 RESUMO DA PALETA

| Uso | Light | Dark |
|-----|-------|------|
| **Brand Primary** | #2A3F5F | #3D5A80 |
| **Brand Accent** | #E5A53A | #F5C96B |
| **Background** | #F8FAFC | #0F172A |
| **Cards** | #FFFFFF | #1E293B |
| **Text** | #1E2D45 | #F1F5F9 |
| **Sidebar** | #2A3F5F | #1E293B |

---

**Nota**: Este prompt foi otimizado para o SGE Diário Digital. Execute cada tarefa em ordem e teste incrementalmente.
