# LUMINAR — DESIGN SYSTEM

> **Plataforma Educacional** | SGE Diário Digital  
> Versão 1.0.0 | Janeiro 2026

---

## 📋 VISÃO GERAL

### Sobre a Marca

**Luminar** representa iluminação do conhecimento. A lâmpada com cérebro simboliza:
- 💡 **Iluminação**: Clareza no aprendizado
- 🧠 **Inteligência**: Desenvolvimento cognitivo
- ✨ **Excelência**: Padrão de qualidade educacional

### Personalidade da Marca

| Atributo | Descrição |
|----------|-----------|
| **Tom** | Profissional, acolhedor, confiável |
| **Voz** | Clara, direta, encorajadora |
| **Sensação** | Moderna, sofisticada, acessível |

### Stack Tecnológico

- **Framework**: Next.js 16+ (App Router)
- **UI Library**: MUI v7 (Material Design 3)
- **Linguagem**: TypeScript 5+ (strict mode)
- **Estado**: Zustand
- **PWA**: next-pwa com cache offline

---

## 🎨 PALETA DE CORES

### Cores da Marca (extraídas da logo)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   ████████  Navy Primary     #2A3F5F                       │
│   ████████  Navy Dark        #1E2D45                       │
│   ████████  Navy Light       #3D5A80                       │
│                                                             │
│   ████████  Gold Primary     #E5A53A                       │
│   ████████  Gold Dark        #C4892E                       │
│   ████████  Gold Light       #F5C96B                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Mapeamento Completo de Tokens

#### Cores Primárias (Brand)

| Token | Valor Light Mode | Valor Dark Mode | Uso |
|-------|------------------|-----------------|-----|
| `brand-primary` | #2A3F5F | #3D5A80 | Cor principal da marca |
| `brand-primary-hover` | #1E2D45 | #4A6B94 | Hover em elementos brand |
| `brand-primary-active` | #162235 | #5B7CA8 | Estado pressed |
| `brand-secondary` | #E5A53A | #F5C96B | Cor de destaque/accent |
| `brand-secondary-hover` | #C4892E | #E5A53A | Hover em accent |
| `brand-on-primary` | #FFFFFF | #FFFFFF | Texto sobre brand-primary |
| `brand-on-secondary` | #1E2D45 | #1E2D45 | Texto sobre brand-secondary |

#### Texto

| Token | Valor Light Mode | Valor Dark Mode | Uso |
|-------|------------------|-----------------|-----|
| `text-primary` | #1E2D45 | #F1F5F9 | Títulos, texto principal |
| `text-secondary` | #4A5568 | #94A3B8 | Descrições, legendas |
| `text-muted` | #718096 | #64748B | Placeholders, hints |
| `text-disabled` | #A0AEC0 | #475569 | Texto desabilitado |
| `text-on-dark` | #F8FAFC | #F8FAFC | Texto sobre fundos escuros |
| `text-on-brand` | #FFFFFF | #FFFFFF | Texto sobre cor primária |
| `text-on-accent` | #1E2D45 | #1E2D45 | Texto sobre cor accent |
| `text-link` | #2A3F5F | #6B9FD4 | Links |
| `text-link-hover` | #1E2D45 | #8BB4E0 | Links em hover |

#### Superfícies (Backgrounds)

| Token | Valor Light Mode | Valor Dark Mode | Uso |
|-------|------------------|-----------------|-----|
| `surface-page` | #F8FAFC | #0F172A | Fundo principal |
| `surface-section` | #F1F5F9 | #1E293B | Seções alternadas |
| `surface-card` | #FFFFFF | #1E293B | Cards |
| `surface-card-hover` | #F8FAFC | #334155 | Cards em hover |
| `surface-subtle` | #EDF2F7 | #1E293B | Áreas de destaque leve |
| `surface-elevated` | #FFFFFF | #334155 | Modais, popovers |
| `surface-overlay` | rgba(30,45,69,0.5) | rgba(0,0,0,0.7) | Overlays |
| `surface-sidebar` | #2A3F5F | #1E293B | Sidebar |
| `surface-header` | #FFFFFF | #1E293B | Header |

#### Ações (Botões, Links)

| Token | Valor Light Mode | Valor Dark Mode | Uso |
|-------|------------------|-----------------|-----|
| `action-primary` | #2A3F5F | #3D5A80 | Botões principais |
| `action-primary-hover` | #1E2D45 | #4A6B94 | Hover |
| `action-primary-active` | #162235 | #5B7CA8 | Pressed |
| `action-secondary` | transparent | transparent | Botões secundários |
| `action-secondary-hover` | #EDF2F7 | #334155 | Hover |
| `action-accent` | #E5A53A | #F5C96B | CTAs de destaque |
| `action-accent-hover` | #C4892E | #E5A53A | Hover |
| `action-ghost` | transparent | transparent | Botões ghost |
| `action-ghost-hover` | rgba(42,63,95,0.08) | rgba(255,255,255,0.08) | Hover |

#### Bordas

| Token | Valor Light Mode | Valor Dark Mode | Uso |
|-------|------------------|-----------------|-----|
| `border-default` | #E2E8F0 | #334155 | Bordas padrão |
| `border-subtle` | #EDF2F7 | #1E293B | Bordas sutis |
| `border-strong` | #CBD5E0 | #475569 | Bordas evidentes |
| `border-focus` | #2A3F5F | #6B9FD4 | Focus ring |
| `border-focus-accent` | #E5A53A | #F5C96B | Focus ring accent |
| `border-input` | #CBD5E0 | #475569 | Inputs |
| `border-input-hover` | #A0AEC0 | #64748B | Inputs hover |
| `border-input-focus` | #2A3F5F | #6B9FD4 | Inputs focus |

#### Status

| Token | Valor Light Mode | Valor Dark Mode | Uso |
|-------|------------------|-----------------|-----|
| `status-success` | #22C55E | #4ADE80 | Sucesso |
| `status-success-bg` | #DCFCE7 | rgba(34,197,94,0.15) | Background sucesso |
| `status-success-border` | #86EFAC | #22C55E | Borda sucesso |
| `status-warning` | #F59E0B | #FBBF24 | Alertas |
| `status-warning-bg` | #FEF3C7 | rgba(245,158,11,0.15) | Background alerta |
| `status-warning-border` | #FCD34D | #F59E0B | Borda alerta |
| `status-error` | #EF4444 | #F87171 | Erros |
| `status-error-bg` | #FEE2E2 | rgba(239,68,68,0.15) | Background erro |
| `status-error-border` | #FCA5A5 | #EF4444 | Borda erro |
| `status-info` | #3B82F6 | #60A5FA | Informação |
| `status-info-bg` | #DBEAFE | rgba(59,130,246,0.15) | Background info |
| `status-info-border` | #93C5FD | #3B82F6 | Borda info |

#### Específicos da Educação

| Token | Valor Light Mode | Valor Dark Mode | Uso |
|-------|------------------|-----------------|-----|
| `grade-excellent` | #22C55E | #4ADE80 | Notas A (90-100%) |
| `grade-good` | #3B82F6 | #60A5FA | Notas B (80-89%) |
| `grade-average` | #F59E0B | #FBBF24 | Notas C (70-79%) |
| `grade-below` | #F97316 | #FB923C | Notas D (60-69%) |
| `grade-failing` | #EF4444 | #F87171 | Notas E/F (<60%) |
| `attendance-present` | #22C55E | #4ADE80 | Presente |
| `attendance-absent` | #EF4444 | #F87171 | Ausente |
| `attendance-justified` | #F59E0B | #FBBF24 | Falta justificada |

---

## 📐 ESPAÇAMENTO

### Escala de Espaçamento

```
┌──────────────────────────────────────────────────────────────────────┐
│ Token      │ Valor │ Pixels │ Uso                                   │
├──────────────────────────────────────────────────────────────────────┤
│ space-0    │ 0     │ 0px    │ Reset                                 │
│ space-0.5  │ 0.125 │ 2px    │ Micro ajustes                         │
│ space-1    │ 0.25  │ 4px    │ Ícones inline, gaps mínimos           │
│ space-1.5  │ 0.375 │ 6px    │ Badges, chips                         │
│ space-2    │ 0.5   │ 8px    │ Gaps pequenos, padding de inputs      │
│ space-3    │ 0.75  │ 12px   │ Gaps médios internos                  │
│ space-4    │ 1     │ 16px   │ Padding padrão de componentes         │
│ space-5    │ 1.25  │ 20px   │ Padding médio                         │
│ space-6    │ 1.5   │ 24px   │ Padding de cards                      │
│ space-8    │ 2     │ 32px   │ Gaps entre seções                     │
│ space-10   │ 2.5   │ 40px   │ Padding de seções                     │
│ space-12   │ 3     │ 48px   │ Padding vertical de seções            │
│ space-16   │ 4     │ 64px   │ Seções grandes                        │
│ space-20   │ 5     │ 80px   │ Hero sections                         │
│ space-24   │ 6     │ 96px   │ Espaçamento máximo                    │
└──────────────────────────────────────────────────────────────────────┘
```

### Padrões de Uso

```typescript
// MUI sx prop
<Box sx={{ p: 4 }} />              // padding: space-4 (16px)
<Stack spacing={3} />              // gap: space-3 (12px)
<Card sx={{ p: 6 }} />             // padding: space-6 (24px)
```

---

## 🔤 TIPOGRAFIA

### Família de Fontes

```css
/* Font Stack */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

### Escala Tipográfica

| Token | Tamanho | Line Height | Peso | Uso |
|-------|---------|-------------|------|-----|
| `text-xs` | 12px | 1.5 | 400 | Badges, labels pequenos |
| `text-sm` | 14px | 1.5 | 400 | Captions, texto secundário |
| `text-base` | 16px | 1.5 | 400 | Corpo de texto padrão |
| `text-lg` | 18px | 1.5 | 400 | Texto destacado |
| `text-xl` | 20px | 1.4 | 500 | Subtítulos |
| `text-2xl` | 24px | 1.3 | 600 | Títulos de cards |
| `text-3xl` | 30px | 1.3 | 600 | Títulos de seção |
| `text-4xl` | 36px | 1.2 | 700 | Títulos principais |
| `text-5xl` | 48px | 1.1 | 700 | Headlines hero |
| `text-6xl` | 60px | 1.1 | 700 | Display |

### Pesos

| Token | Valor | Uso |
|-------|-------|-----|
| `font-normal` | 400 | Corpo de texto |
| `font-medium` | 500 | Ênfase leve, labels |
| `font-semibold` | 600 | Títulos, botões |
| `font-bold` | 700 | Headlines, destaque forte |

### Configuração MUI

```typescript
// theme.ts - Typography
typography: {
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  h1: {
    fontSize: '2.25rem',    // 36px
    fontWeight: 700,
    lineHeight: 1.2,
    color: 'var(--text-primary)',
  },
  h2: {
    fontSize: '1.875rem',   // 30px
    fontWeight: 600,
    lineHeight: 1.3,
    color: 'var(--text-primary)',
  },
  h3: {
    fontSize: '1.5rem',     // 24px
    fontWeight: 600,
    lineHeight: 1.3,
    color: 'var(--text-primary)',
  },
  h4: {
    fontSize: '1.25rem',    // 20px
    fontWeight: 500,
    lineHeight: 1.4,
    color: 'var(--text-primary)',
  },
  h5: {
    fontSize: '1.125rem',   // 18px
    fontWeight: 500,
    lineHeight: 1.5,
    color: 'var(--text-primary)',
  },
  h6: {
    fontSize: '1rem',       // 16px
    fontWeight: 500,
    lineHeight: 1.5,
    color: 'var(--text-primary)',
  },
  body1: {
    fontSize: '1rem',       // 16px
    lineHeight: 1.5,
    color: 'var(--text-primary)',
  },
  body2: {
    fontSize: '0.875rem',   // 14px
    lineHeight: 1.5,
    color: 'var(--text-secondary)',
  },
  caption: {
    fontSize: '0.75rem',    // 12px
    lineHeight: 1.5,
    color: 'var(--text-muted)',
  },
  button: {
    fontSize: '0.875rem',   // 14px
    fontWeight: 600,
    textTransform: 'none',
    letterSpacing: '0.01em',
  },
}
```

---

## 🔲 BORDAS E CANTOS

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `radius-none` | 0 | Sem arredondamento |
| `radius-sm` | 6px | Inputs, badges, chips |
| `radius-md` | 8px | Botões |
| `radius-lg` | 12px | Cards pequenos, dropdowns |
| `radius-xl` | 16px | Cards grandes |
| `radius-2xl` | 24px | Cards hero, modais |
| `radius-full` | 9999px | Avatares, pills, toggles |

### Configuração MUI

```typescript
// theme.ts - Shape
shape: {
  borderRadius: 8,  // radius-md como padrão
}

// Componentes específicos
components: {
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 16,  // radius-xl
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,   // radius-md
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 6,   // radius-sm
      },
    },
  },
}
```

---

## 🌑 SOMBRAS

### Escala de Sombras

```css
/* Light Mode Shadows */
--shadow-xs: 0 1px 2px rgba(30, 45, 69, 0.05);
--shadow-sm: 0 1px 3px rgba(30, 45, 69, 0.08), 0 1px 2px rgba(30, 45, 69, 0.06);
--shadow-md: 0 4px 6px rgba(30, 45, 69, 0.07), 0 2px 4px rgba(30, 45, 69, 0.06);
--shadow-lg: 0 10px 15px rgba(30, 45, 69, 0.08), 0 4px 6px rgba(30, 45, 69, 0.05);
--shadow-xl: 0 20px 25px rgba(30, 45, 69, 0.10), 0 10px 10px rgba(30, 45, 69, 0.04);
--shadow-2xl: 0 25px 50px rgba(30, 45, 69, 0.15);

/* Sombras Específicas */
--shadow-card: 0 1px 3px rgba(30, 45, 69, 0.06), 0 1px 2px rgba(30, 45, 69, 0.04);
--shadow-card-hover: 0 10px 20px rgba(30, 45, 69, 0.08), 0 4px 8px rgba(30, 45, 69, 0.04);
--shadow-button-primary: 0 4px 14px rgba(42, 63, 95, 0.25);
--shadow-button-accent: 0 4px 14px rgba(229, 165, 58, 0.35);
--shadow-dropdown: 0 10px 40px rgba(30, 45, 69, 0.12);
--shadow-modal: 0 25px 50px rgba(30, 45, 69, 0.2);
--shadow-sidebar: 4px 0 16px rgba(30, 45, 69, 0.08);

/* Dark Mode Shadows */
--shadow-dark-card: 0 1px 3px rgba(0, 0, 0, 0.2);
--shadow-dark-card-hover: 0 10px 20px rgba(0, 0, 0, 0.3);
--shadow-dark-dropdown: 0 10px 40px rgba(0, 0, 0, 0.4);
--shadow-dark-modal: 0 25px 50px rgba(0, 0, 0, 0.5);
```

### Uso por Componente

| Componente | Sombra | Sombra Hover |
|------------|--------|--------------|
| Card | shadow-card | shadow-card-hover |
| Button Primary | shadow-button-primary | shadow-lg |
| Button Accent | shadow-button-accent | shadow-lg |
| Dropdown | shadow-dropdown | - |
| Modal | shadow-modal | - |
| Sidebar | shadow-sidebar | - |
| Input Focus | shadow-sm (com cor) | - |

---

## 🧩 COMPONENTES

### Botões

#### Variantes

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │
│  │   CONTAINED     │  │    OUTLINED     │  │      TEXT       │      │
│  │                 │  │                 │  │                 │      │
│  │  █████████████  │  │  ╔═══════════╗  │  │    Entrar       │      │
│  │     Salvar      │  │  ║  Cancelar ║  │  │                 │      │
│  │  █████████████  │  │  ╚═══════════╝  │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘      │
│                                                                      │
│  Primary (Navy)       Secondary (Border)    Ghost (Transparent)     │
│                                                                      │
│  ┌─────────────────┐  ┌─────────────────┐                           │
│  │   ACCENT CTA    │  │    LOADING      │                           │
│  │                 │  │                 │                           │
│  │  █████████████  │  │  █████████████  │                           │
│  │    Começar!     │  │   ◌ Salvando... │                           │
│  │  █████████████  │  │  █████████████  │                           │
│  └─────────────────┘  └─────────────────┘                           │
│                                                                      │
│  Accent (Gold)        With Spinner                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Especificações

| Variante | Background | Texto | Borda | Sombra |
|----------|------------|-------|-------|--------|
| **Primary** | action-primary | text-on-brand | none | shadow-button-primary |
| **Primary Hover** | action-primary-hover | text-on-brand | none | shadow-lg |
| **Secondary** | transparent | action-primary | border-default | none |
| **Secondary Hover** | action-secondary-hover | action-primary | border-strong | shadow-sm |
| **Ghost** | transparent | text-primary | none | none |
| **Ghost Hover** | action-ghost-hover | text-primary | none | none |
| **Accent** | action-accent | text-on-accent | none | shadow-button-accent |
| **Accent Hover** | action-accent-hover | text-on-accent | none | shadow-lg |
| **Disabled** | surface-subtle | text-disabled | none | none |

#### Tamanhos

| Tamanho | Height | Padding X | Font Size | Icon Size |
|---------|--------|-----------|-----------|-----------|
| **Small** | 32px | 12px | 13px | 18px |
| **Medium** | 40px | 16px | 14px | 20px |
| **Large** | 48px | 24px | 16px | 24px |

#### Código MUI

```typescript
// theme.ts - MuiButton
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
      backgroundColor: '#2A3F5F',
      color: '#FFFFFF',
      boxShadow: '0 4px 14px rgba(42, 63, 95, 0.25)',
      '&:hover': {
        backgroundColor: '#1E2D45',
        boxShadow: '0 10px 15px rgba(30, 45, 69, 0.08)',
      },
      '&:active': {
        backgroundColor: '#162235',
      },
    },
    outlinedPrimary: {
      borderColor: '#CBD5E0',
      color: '#2A3F5F',
      '&:hover': {
        backgroundColor: '#EDF2F7',
        borderColor: '#A0AEC0',
      },
    },
    textPrimary: {
      color: '#2A3F5F',
      '&:hover': {
        backgroundColor: 'rgba(42, 63, 95, 0.08)',
      },
    },
  },
}

// Botão Accent (Criar como variante custom ou usar color="warning" customizado)
```

---

### Cards

#### Anatomia

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ╔══════════════════════════════════════════════════════════════╗   │
│  ║  ┌────────────────────────────────────────────────────────┐  ║   │
│  ║  │ Header (opcional)                           Action ⋮   │  ║   │
│  ║  └────────────────────────────────────────────────────────┘  ║   │
│  ║  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  ║   │
│  ║                                                              ║   │
│  ║  Content Area                                                ║   │
│  ║                                                              ║   │
│  ║  Corpo do card com informações principais                    ║   │
│  ║                                                              ║   │
│  ║  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌  ║   │
│  ║  ┌────────────────────────────────────────────────────────┐  ║   │
│  ║  │ Footer (opcional)                        [  Ação  ]    │  ║   │
│  ║  └────────────────────────────────────────────────────────┘  ║   │
│  ╚══════════════════════════════════════════════════════════════╝   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Especificações

| Propriedade | Valor |
|-------------|-------|
| Background | surface-card |
| Border Radius | radius-xl (16px) |
| Shadow | shadow-card |
| Shadow Hover | shadow-card-hover |
| Padding | space-6 (24px) |
| Border | 1px solid border-subtle (opcional) |

#### Variantes

| Variante | Uso | Características |
|----------|-----|-----------------|
| **Default** | Cards genéricos | Sombra + background branco |
| **Outlined** | Listas, tabelas | Sem sombra + borda |
| **Elevated** | Destaque | Sombra maior |
| **Interactive** | Cards clicáveis | Hover com sombra + cursor pointer |
| **Status** | Alertas, métricas | Borda lateral colorida |

#### Código MUI

```typescript
// theme.ts - MuiCard
MuiCard: {
  defaultProps: {
    elevation: 0,
  },
  styleOverrides: {
    root: {
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      boxShadow: '0 1px 3px rgba(30, 45, 69, 0.06), 0 1px 2px rgba(30, 45, 69, 0.04)',
      transition: 'box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out',
      '&:hover': {
        boxShadow: '0 10px 20px rgba(30, 45, 69, 0.08), 0 4px 8px rgba(30, 45, 69, 0.04)',
      },
    },
  },
  variants: [
    {
      props: { variant: 'outlined' },
      style: {
        boxShadow: 'none',
        border: '1px solid #E2E8F0',
        '&:hover': {
          boxShadow: 'none',
          borderColor: '#CBD5E0',
        },
      },
    },
  ],
}
```

---

### Inputs

#### Estados

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Default                    Focus                                    │
│  ┌────────────────────┐    ┌────────────────────┐                   │
│  │ Placeholder...     │    │ Digitando...       │ ← Focus ring      │
│  └────────────────────┘    └────────────────────┘   (brand-primary) │
│                                                                      │
│  Filled                     Error                                    │
│  ┌────────────────────┐    ┌────────────────────┐                   │
│  │ Valor preenchido   │    │ Campo inválido     │ ← Borda vermelha  │
│  └────────────────────┘    └────────────────────┘                   │
│                             ⚠ Mensagem de erro                       │
│                                                                      │
│  Disabled                   Success                                  │
│  ┌────────────────────┐    ┌────────────────────┐                   │
│  │ Desabilitado       │    │ Valor válido     ✓ │ ← Ícone/borda     │
│  └────────────────────┘    └────────────────────┘   verde           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Especificações

| Estado | Background | Border | Text | Extra |
|--------|------------|--------|------|-------|
| **Default** | surface-card | border-input | text-muted (placeholder) | - |
| **Hover** | surface-card | border-input-hover | text-muted | - |
| **Focus** | surface-card | border-focus | text-primary | Ring 2px |
| **Filled** | surface-card | border-input | text-primary | - |
| **Error** | surface-card | status-error | text-primary | Mensagem erro |
| **Success** | surface-card | status-success | text-primary | Ícone check |
| **Disabled** | surface-subtle | border-subtle | text-disabled | cursor: not-allowed |

#### Código MUI

```typescript
// theme.ts - MuiTextField / MuiOutlinedInput
MuiOutlinedInput: {
  styleOverrides: {
    root: {
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#CBD5E0',
        transition: 'border-color 0.2s ease-in-out',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#A0AEC0',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#2A3F5F',
        borderWidth: 2,
      },
      '&.Mui-error .MuiOutlinedInput-notchedOutline': {
        borderColor: '#EF4444',
      },
      '&.Mui-disabled': {
        backgroundColor: '#EDF2F7',
        '& .MuiOutlinedInput-notchedOutline': {
          borderColor: '#E2E8F0',
        },
      },
    },
    input: {
      padding: '12px 16px',
      fontSize: '0.875rem',
      '&::placeholder': {
        color: '#718096',
        opacity: 1,
      },
    },
  },
}
```

---

### Sidebar

#### Anatomia (3 Modos)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  EXPANDED (260px)        COLLAPSED (72px)      HIDDEN (0px)         │
│                                                                      │
│  ╔════════════════╗      ╔══════╗              ╔══╗                  │
│  ║ ◉ Luminar      ║      ║  ◉   ║              ║  ║ ← Hamburger     │
│  ║════════════════║      ║══════║              ║  ║   no Header     │
│  ║ 🏠 Menu        ║      ║  🏠  ║              ╚══╝                  │
│  ║ 📋 Chamada     ║      ║  📋  ║                                    │
│  ║ 📊 Notas       ║      ║  📊  ║              Mobile: Drawer       │
│  ║ ├─ AV1        ║      ║      ║              temporário           │
│  ║ └─ AV2        ║      ║      ║                                    │
│  ║ 📝 Conceitos   ║      ║  📝  ║                                    │
│  ║────────────────║      ║──────║                                    │
│  ║ ⚙️ Config      ║      ║  ⚙️  ║                                    │
│  ╚════════════════╝      ╚══════╝                                    │
│                                                                      │
│  Com texto              Apenas ícones                                │
│                         + Tooltips                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Especificações

| Propriedade | Valor |
|-------------|-------|
| Background | surface-sidebar (#2A3F5F) |
| Text Color | text-on-dark (#F8FAFC) |
| Text Muted | rgba(255,255,255,0.7) |
| Width Expanded | 260px |
| Width Collapsed | 72px |
| Shadow | shadow-sidebar |
| Item Height | 48px |
| Item Padding | 12px 16px |
| Item Border Radius | 0 (flush edges) |
| Active Item BG | rgba(255,255,255,0.12) |
| Hover Item BG | rgba(255,255,255,0.08) |
| Active Indicator | 3px borda esquerda brand-secondary |

#### Código MUI

```typescript
// theme.ts - MuiDrawer
MuiDrawer: {
  styleOverrides: {
    paper: {
      backgroundColor: '#2A3F5F',
      color: '#F8FAFC',
      borderRight: 'none',
      boxShadow: '4px 0 16px rgba(30, 45, 69, 0.08)',
    },
  },
}

// MuiListItemButton (sidebar items)
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
}

// MuiListItemIcon
MuiListItemIcon: {
  styleOverrides: {
    root: {
      color: 'inherit',
      minWidth: 40,
    },
  },
}
```

---

### Tabelas (DataTable)

#### Anatomia

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ╔══════════════════════════════════════════════════════════════╗   │
│  ║  Alunos                                    🔍 ▼ Filtros  +   ║   │
│  ╠══════════════════════════════════════════════════════════════╣   │
│  ║  □  Nome          │ Turma     │ Frequência │ Ações          ║   │
│  ╠══════════════════════════════════════════════════════════════╣   │
│  ║  □  João Silva    │ 6º A      │ ████░ 85%  │ ⋮              ║   │
│  ║─────────────────────────────────────────────────────────────║   │
│  ║  □  Maria Santos  │ 6º A      │ █████ 95%  │ ⋮              ║   │
│  ║─────────────────────────────────────────────────────────────║   │
│  ║  □  Pedro Lima    │ 6º B      │ ███░░ 72%  │ ⋮              ║   │
│  ╠══════════════════════════════════════════════════════════════╣   │
│  ║  Mostrando 1-10 de 45            ◀ 1 2 3 4 5 ▶             ║   │
│  ╚══════════════════════════════════════════════════════════════╝   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Especificações

| Elemento | Background | Border | Text |
|----------|------------|--------|------|
| Container | surface-card | radius-xl | - |
| Header Row | surface-subtle | border-default (bottom) | text-secondary |
| Body Row | surface-card | border-subtle (bottom) | text-primary |
| Row Hover | surface-section | - | - |
| Row Selected | brand-primary @ 8% | - | - |
| Pagination | surface-card | border-default (top) | text-secondary |

#### Código MUI

```typescript
// theme.ts - MuiTableContainer, MuiTable, etc.
MuiTableContainer: {
  styleOverrides: {
    root: {
      borderRadius: 16,
      overflow: 'hidden',
    },
  },
}

MuiTableHead: {
  styleOverrides: {
    root: {
      backgroundColor: '#F1F5F9',
      '& .MuiTableCell-head': {
        fontWeight: 600,
        color: '#4A5568',
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        borderBottom: '1px solid #E2E8F0',
      },
    },
  },
}

MuiTableRow: {
  styleOverrides: {
    root: {
      transition: 'background-color 0.15s ease',
      '&:hover': {
        backgroundColor: '#F8FAFC',
      },
      '&.Mui-selected': {
        backgroundColor: 'rgba(42, 63, 95, 0.08)',
        '&:hover': {
          backgroundColor: 'rgba(42, 63, 95, 0.12)',
        },
      },
    },
  },
}

MuiTableCell: {
  styleOverrides: {
    root: {
      borderBottom: '1px solid #EDF2F7',
      padding: '16px',
      fontSize: '0.875rem',
    },
  },
}
```

---

### Chips / Badges

#### Variantes

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Status Badges                                                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ ✓ Ativo │  │ ⚠ Alerta│  │ ✗ Erro  │  │ ℹ Info  │                 │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘                 │
│   Success      Warning       Error        Info                       │
│                                                                      │
│  Grade Badges                                                        │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐                                  │
│  │ A │  │ B │  │ C │  │ D │  │ E │                                  │
│  └───┘  └───┘  └───┘  └───┘  └───┘                                  │
│  Green  Blue   Gold   Orange  Red                                    │
│                                                                      │
│  Filter Chips                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │ 6º Ano     ✗ │  │ Matutino   ✗ │  │ + Filtro    │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│  Selected          Selected          Add Action                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Especificações

| Variante | Background | Text | Border |
|----------|------------|------|--------|
| **Default** | surface-subtle | text-secondary | none |
| **Success** | status-success-bg | status-success | status-success-border |
| **Warning** | status-warning-bg | status-warning | status-warning-border |
| **Error** | status-error-bg | status-error | status-error-border |
| **Info** | status-info-bg | status-info | status-info-border |
| **Brand** | brand-primary | text-on-brand | none |
| **Accent** | brand-secondary | text-on-accent | none |

#### Código MUI

```typescript
// theme.ts - MuiChip
MuiChip: {
  styleOverrides: {
    root: {
      borderRadius: 6,
      fontWeight: 500,
      fontSize: '0.75rem',
    },
    colorSuccess: {
      backgroundColor: '#DCFCE7',
      color: '#22C55E',
      border: '1px solid #86EFAC',
    },
    colorWarning: {
      backgroundColor: '#FEF3C7',
      color: '#D97706',
      border: '1px solid #FCD34D',
    },
    colorError: {
      backgroundColor: '#FEE2E2',
      color: '#EF4444',
      border: '1px solid #FCA5A5',
    },
    colorInfo: {
      backgroundColor: '#DBEAFE',
      color: '#2563EB',
      border: '1px solid #93C5FD',
    },
  },
}
```

---

### Modais

#### Anatomia

```
┌──────────────────────────────────────────────────────────────────────┐
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░╔═══════════════════════════════════════╗░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║  Título do Modal                    ✕ ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░╠═══════════════════════════════════════╣░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║                                       ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║  Conteúdo do modal com formulário    ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║  ou informações importantes.         ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║                                       ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║  ┌─────────────────────────────────┐ ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║  │ Input field                     │ ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║  └─────────────────────────────────┘ ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║                                       ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░╠═══════════════════════════════════════╣░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░║              [ Cancelar ] [ Salvar ] ║░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░╚═══════════════════════════════════════╝░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────────────────────────────────────────────────┘
  Overlay (surface-overlay)
```

#### Especificações

| Elemento | Valor |
|----------|-------|
| Overlay | surface-overlay |
| Background | surface-elevated |
| Border Radius | radius-2xl (24px) |
| Shadow | shadow-modal |
| Width (sm) | 400px |
| Width (md) | 560px |
| Width (lg) | 720px |
| Padding Header | space-6 |
| Padding Content | space-6 |
| Padding Actions | space-4 space-6 |

#### Código MUI

```typescript
// theme.ts - MuiDialog
MuiDialog: {
  styleOverrides: {
    paper: {
      borderRadius: 24,
      boxShadow: '0 25px 50px rgba(30, 45, 69, 0.2)',
    },
  },
}

MuiDialogTitle: {
  styleOverrides: {
    root: {
      fontSize: '1.25rem',
      fontWeight: 600,
      padding: '24px 24px 16px',
    },
  },
}

MuiDialogContent: {
  styleOverrides: {
    root: {
      padding: '16px 24px',
    },
  },
}

MuiDialogActions: {
  styleOverrides: {
    root: {
      padding: '16px 24px 24px',
      gap: 12,
    },
  },
}
```

---

### Toasts / Snackbars

#### Variantes

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ✓  Chamada salva com sucesso!                           ✕   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│   Success                                                            │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ⚠  Atenção: Aluno com mais de 25% de faltas              ✕   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│   Warning                                                            │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ✗  Erro ao salvar. Tente novamente.                      ✕   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│   Error                                                              │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  ℹ  Nova atualização disponível                           ✕   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│   Info                                                               │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

#### Especificações

| Variante | Background | Text | Icon | Border Left |
|----------|------------|------|------|-------------|
| **Success** | status-success-bg | text-primary | status-success | 4px status-success |
| **Warning** | status-warning-bg | text-primary | status-warning | 4px status-warning |
| **Error** | status-error-bg | text-primary | status-error | 4px status-error |
| **Info** | status-info-bg | text-primary | status-info | 4px status-info |

---

## 📱 RESPONSIVIDADE

### Breakpoints

| Token | Valor | Dispositivo |
|-------|-------|-------------|
| `xs` | 0-599px | Mobile portrait |
| `sm` | 600-899px | Mobile landscape / Tablet portrait |
| `md` | 900-1199px | Tablet landscape / Small desktop |
| `lg` | 1200-1535px | Desktop |
| `xl` | 1536px+ | Large desktop |

### Grid System

```typescript
// Container max-widths
const containerMaxWidths = {
  xs: '100%',
  sm: '100%',
  md: '900px',
  lg: '1200px',
  xl: '1400px',
};

// Uso
<Container maxWidth="lg">
  <Grid container spacing={{ xs: 2, md: 3 }}>
    <Grid item xs={12} md={6} lg={4}>
      <Card />
    </Grid>
  </Grid>
</Container>
```

### Sidebar Behavior

| Breakpoint | Comportamento |
|------------|---------------|
| `xs`, `sm` | Hidden (Drawer temporário) |
| `md` | Collapsed (apenas ícones) |
| `lg`, `xl` | Expanded (completa) |

---

## 🌓 DARK MODE

### Estratégia

O Dark Mode usa as mesmas cores semânticas, mas com valores diferentes para preservar contraste e legibilidade.

### Diferenças Principais

| Token | Light | Dark |
|-------|-------|------|
| `surface-page` | #F8FAFC | #0F172A |
| `surface-card` | #FFFFFF | #1E293B |
| `text-primary` | #1E2D45 | #F1F5F9 |
| `brand-primary` | #2A3F5F | #3D5A80 |
| `border-default` | #E2E8F0 | #334155 |

### Implementação MUI

```typescript
// theme.ts
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode values
          primary: { main: '#2A3F5F' },
          secondary: { main: '#E5A53A' },
          background: {
            default: '#F8FAFC',
            paper: '#FFFFFF',
          },
          text: {
            primary: '#1E2D45',
            secondary: '#4A5568',
          },
        }
      : {
          // Dark mode values
          primary: { main: '#3D5A80' },
          secondary: { main: '#F5C96B' },
          background: {
            default: '#0F172A',
            paper: '#1E293B',
          },
          text: {
            primary: '#F1F5F9',
            secondary: '#94A3B8',
          },
        }),
  },
});
```

---

## ✅ ESTADOS OBRIGATÓRIOS

Todo componente interativo **DEVE** ter:

| Estado | Descrição | Implementação |
|--------|-----------|---------------|
| **Default** | Estado normal | Estilos base |
| **Hover** | Mouse sobre | `:hover` com transição |
| **Focus** | Navegação teclado | `:focus-visible` com ring |
| **Active** | Sendo clicado | `:active` |
| **Disabled** | Não interativo | opacity: 0.5, cursor: not-allowed |
| **Loading** | Aguardando | Spinner + texto |

### Focus Ring Padrão

```css
/* Focus ring consistente */
.focus-ring {
  outline: none;
  box-shadow: 0 0 0 3px rgba(42, 63, 95, 0.2);
}

/* Para elementos sobre fundo escuro */
.focus-ring-light {
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.3);
}
```

---

## 🎯 EXEMPLOS DE USO

### Card de Aluno

```tsx
<Card sx={{ p: 3 }}>
  <Stack direction="row" spacing={2} alignItems="center">
    <Avatar 
      src={aluno.fotoUrl} 
      sx={{ 
        width: 48, 
        height: 48,
        bgcolor: 'brand.primary',
      }}
    >
      {aluno.nome[0]}
    </Avatar>
    <Box flex={1}>
      <Typography variant="subtitle1" fontWeight={600}>
        {aluno.nome}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {aluno.turma} • Matrícula: {aluno.matricula}
      </Typography>
    </Box>
    <Chip 
      label={`${aluno.frequencia}%`}
      color={aluno.frequencia >= 75 ? 'success' : 'error'}
      size="small"
    />
  </Stack>
</Card>
```

### Formulário com Validação

```tsx
<Stack spacing={3}>
  <TextField
    label="Nome completo"
    value={nome}
    onChange={(e) => setNome(e.target.value)}
    error={!!errors.nome}
    helperText={errors.nome}
    fullWidth
  />
  
  <Stack direction="row" spacing={2} justifyContent="flex-end">
    <Button variant="outlined" onClick={onCancel}>
      Cancelar
    </Button>
    <Button 
      variant="contained" 
      onClick={onSave}
      disabled={isLoading}
    >
      {isLoading ? 'Salvando...' : 'Salvar'}
    </Button>
  </Stack>
</Stack>
```

### Dashboard Métrica

```tsx
<Card 
  sx={{ 
    p: 3,
    borderLeft: '4px solid',
    borderLeftColor: 'status.success',
  }}
>
  <Typography variant="body2" color="text.secondary" gutterBottom>
    Total de Alunos
  </Typography>
  <Typography variant="h3" fontWeight={700} color="text.primary">
    1,247
  </Typography>
  <Stack direction="row" alignItems="center" spacing={0.5} mt={1}>
    <TrendingUp sx={{ color: 'status.success', fontSize: 16 }} />
    <Typography variant="caption" color="status.success">
      +12% este mês
    </Typography>
  </Stack>
</Card>
```

---

## 📁 ESTRUTURA DE ARQUIVOS

```
src/
├── lib/
│   ├── theme.ts              # Tema MUI principal
│   ├── tokens.ts             # Tokens CSS/JS exportados
│   └── colorUtils.ts         # Utilitários de cor
├── styles/
│   ├── globals.css           # CSS global + CSS Variables
│   └── tokens.css            # CSS Variables dos tokens
└── components/
    └── ui/
        ├── Button/
        ├── Card/
        ├── Input/
        └── ...
```

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### Fase 1: Fundação
- [ ] Criar `src/lib/tokens.ts` com todos os tokens
- [ ] Criar `src/styles/tokens.css` com CSS Variables
- [ ] Atualizar `src/lib/theme.ts` com nova paleta
- [ ] Configurar fontes (Inter) no `_document.tsx`

### Fase 2: Componentes Base
- [ ] Atualizar estilos do MuiButton
- [ ] Atualizar estilos do MuiCard
- [ ] Atualizar estilos do MuiTextField
- [ ] Atualizar estilos do MuiChip
- [ ] Atualizar estilos do MuiDrawer (Sidebar)

### Fase 3: Componentes Específicos
- [ ] Atualizar DataTable
- [ ] Atualizar FormModal
- [ ] Atualizar Toast/Snackbar
- [ ] Atualizar Sidebar/Navigation

### Fase 4: Dark Mode
- [ ] Implementar toggle de tema
- [ ] Testar contraste em Dark Mode
- [ ] Ajustar tokens conforme necessário

### Fase 5: Validação
- [ ] Testar em mobile (PWA)
- [ ] Verificar acessibilidade (contrast ratios)
- [ ] Validar estados de todos os componentes

---

## 📚 REFERÊNCIAS

- [MUI v7 Documentation](https://mui.com/)
- [Material Design 3](https://m3.material.io/)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)

---

**Documento criado para: SGE Diário Digital - Luminar**  
**Versão**: 1.0.0  
**Data**: Janeiro 2026  
**Autor**: Design System Team
