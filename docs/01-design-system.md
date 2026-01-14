# Design System - SGE Diario Digital

**Versao:** 1.0
**Baseado em:** Material Design 3 (M3)
**Data:** 2026-01-08

---

## 1. Fundamentos

### 1.1 Seed Color

A cor seed escolhida para gerar a paleta MD3:

```
Seed Color: #1565C0 (Material Blue 800)
```

Esta cor foi escolhida por:
- Profissionalismo (contexto educacional)
- Boa legibilidade em ambos os temas
- Harmoniza com cores semanticas

### 1.2 Paleta de Cores MD3

#### Light Theme

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#1565C0` | Elementos principais, CTA |
| `onPrimary` | `#FFFFFF` | Texto sobre primary |
| `primaryContainer` | `#D4E3FF` | Containers destacados |
| `onPrimaryContainer` | `#001C3A` | Texto em containers |
| `secondary` | `#545F71` | Elementos secundarios |
| `onSecondary` | `#FFFFFF` | Texto sobre secondary |
| `secondaryContainer` | `#D8E3F8` | Containers secundarios |
| `onSecondaryContainer` | `#111C2B` | Texto em containers sec. |
| `tertiary` | `#6E5676` | Acentos, destaques |
| `onTertiary` | `#FFFFFF` | Texto sobre tertiary |
| `tertiaryContainer` | `#F8D8FF` | Containers terciarios |
| `onTertiaryContainer` | `#271430` | Texto em containers terc. |
| `error` | `#BA1A1A` | Erros, alertas criticos |
| `onError` | `#FFFFFF` | Texto sobre error |
| `errorContainer` | `#FFDAD6` | Containers de erro |
| `onErrorContainer` | `#410002` | Texto em containers erro |
| `surface` | `#F9F9FF` | Background principal |
| `onSurface` | `#1A1C1E` | Texto principal |
| `surfaceVariant` | `#E0E2EC` | Backgrounds alternativos |
| `onSurfaceVariant` | `#44474E` | Texto secundario |
| `outline` | `#74777F` | Bordas, divisores |
| `outlineVariant` | `#C4C6D0` | Bordas sutis |
| `surfaceContainerLowest` | `#FFFFFF` | Elevation 0 |
| `surfaceContainerLow` | `#F3F3FA` | Elevation 1 |
| `surfaceContainer` | `#EDEDF4` | Elevation 2 |
| `surfaceContainerHigh` | `#E7E8EE` | Elevation 3 |
| `surfaceContainerHighest` | `#E2E2E9` | Elevation 4-5 |
| `inverseSurface` | `#2F3033` | Snackbars, tooltips |
| `inverseOnSurface` | `#F1F0F7` | Texto em inverse |
| `inversePrimary` | `#A5C8FF` | Primary em inverse |

#### Dark Theme

| Token | Valor | Uso |
|-------|-------|-----|
| `primary` | `#A5C8FF` | Elementos principais |
| `onPrimary` | `#00315E` | Texto sobre primary |
| `primaryContainer` | `#004785` | Containers destacados |
| `onPrimaryContainer` | `#D4E3FF` | Texto em containers |
| `secondary` | `#BCC7DB` | Elementos secundarios |
| `onSecondary` | `#263141` | Texto sobre secondary |
| `secondaryContainer` | `#3C4758` | Containers secundarios |
| `onSecondaryContainer` | `#D8E3F8` | Texto em containers sec. |
| `tertiary` | `#DBBCE3` | Acentos, destaques |
| `onTertiary` | `#3D2846` | Texto sobre tertiary |
| `tertiaryContainer` | `#553F5D` | Containers terciarios |
| `onTertiaryContainer` | `#F8D8FF` | Texto em containers terc. |
| `error` | `#FFB4AB` | Erros, alertas criticos |
| `onError` | `#690005` | Texto sobre error |
| `errorContainer` | `#93000A` | Containers de erro |
| `onErrorContainer` | `#FFDAD6` | Texto em containers erro |
| `surface` | `#121316` | Background principal |
| `onSurface` | `#E2E2E9` | Texto principal |
| `surfaceVariant` | `#44474E` | Backgrounds alternativos |
| `onSurfaceVariant` | `#C4C6D0` | Texto secundario |
| `outline` | `#8E9099` | Bordas, divisores |
| `outlineVariant` | `#44474E` | Bordas sutis |
| `surfaceContainerLowest` | `#0D0E11` | Elevation 0 |
| `surfaceContainerLow` | `#1A1C1E` | Elevation 1 |
| `surfaceContainer` | `#1E2022` | Elevation 2 |
| `surfaceContainerHigh` | `#282A2D` | Elevation 3 |
| `surfaceContainerHighest` | `#333537` | Elevation 4-5 |
| `inverseSurface` | `#E2E2E9` | Snackbars, tooltips |
| `inverseOnSurface` | `#2F3033` | Texto em inverse |
| `inversePrimary` | `#1565C0` | Primary em inverse |

### 1.3 Cores Semanticas Adicionais

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| `success` | `#2E7D32` | `#81C784` | Sucesso, confirmacao |
| `onSuccess` | `#FFFFFF` | `#1B5E20` | Texto sobre success |
| `successContainer` | `#C8E6C9` | `#1B5E20` | Container success |
| `warning` | `#ED6C02` | `#FFB74D` | Avisos, atencao |
| `onWarning` | `#FFFFFF` | `#E65100` | Texto sobre warning |
| `warningContainer` | `#FFE0B2` | `#E65100` | Container warning |
| `info` | `#0288D1` | `#4FC3F7` | Informacoes |
| `onInfo` | `#FFFFFF` | `#01579B` | Texto sobre info |
| `infoContainer` | `#B3E5FC` | `#01579B` | Container info |

---

## 2. Tipografia

### 2.1 Type Scale MD3

| Role | Font | Weight | Size | Line Height | Letter Spacing |
|------|------|--------|------|-------------|----------------|
| `displayLarge` | Roboto | 400 | 57px | 64px | -0.25px |
| `displayMedium` | Roboto | 400 | 45px | 52px | 0px |
| `displaySmall` | Roboto | 400 | 36px | 44px | 0px |
| `headlineLarge` | Roboto | 400 | 32px | 40px | 0px |
| `headlineMedium` | Roboto | 400 | 28px | 36px | 0px |
| `headlineSmall` | Roboto | 400 | 24px | 32px | 0px |
| `titleLarge` | Roboto | 400 | 22px | 28px | 0px |
| `titleMedium` | Roboto | 500 | 16px | 24px | 0.15px |
| `titleSmall` | Roboto | 500 | 14px | 20px | 0.1px |
| `bodyLarge` | Roboto | 400 | 16px | 24px | 0.5px |
| `bodyMedium` | Roboto | 400 | 14px | 20px | 0.25px |
| `bodySmall` | Roboto | 400 | 12px | 16px | 0.4px |
| `labelLarge` | Roboto | 500 | 14px | 20px | 0.1px |
| `labelMedium` | Roboto | 500 | 12px | 16px | 0.5px |
| `labelSmall` | Roboto | 500 | 11px | 16px | 0.5px |

### 2.2 Mapeamento para MUI

| MD3 Role | MUI Variant | Uso no SGE |
|----------|-------------|------------|
| `displayLarge` | - | Nao usado |
| `displayMedium` | - | Nao usado |
| `displaySmall` | `h1` | Titulos de pagina |
| `headlineLarge` | `h2` | Secoes principais |
| `headlineMedium` | `h3` | Subsecoes |
| `headlineSmall` | `h4` | Cards, dialogs |
| `titleLarge` | `h5` | Titulos menores |
| `titleMedium` | `h6` | Subtitulos |
| `titleSmall` | `subtitle1` | Labels de secao |
| `bodyLarge` | `body1` | Texto principal |
| `bodyMedium` | `body2` | Texto secundario |
| `bodySmall` | `caption` | Texto auxiliar |
| `labelLarge` | `button` | Botoes |
| `labelMedium` | `overline` | Labels pequenas |
| `labelSmall` | - | Badges, chips |

---

## 3. Elevacao

### 3.1 Niveis de Elevacao MD3

| Level | dp | Shadow | Surface Tint | Uso |
|-------|-----|--------|--------------|-----|
| 0 | 0dp | Nenhuma | 0% | Backgrounds |
| 1 | 1dp | Sutil | 5% | Cards em repouso |
| 2 | 3dp | Leve | 8% | Cards elevados |
| 3 | 6dp | Media | 11% | FABs, Menus |
| 4 | 8dp | Pronunciada | 12% | Dialogs |
| 5 | 12dp | Forte | 14% | Modais, Drawers |

### 3.2 Implementacao de Sombras

```typescript
// Light theme shadows
const shadows = {
  level0: 'none',
  level1: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
  level2: '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
  level3: '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)',
  level4: '0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3)',
  level5: '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 4px 4px rgba(0,0,0,0.3)',
};

// Dark theme - usa surface tint em vez de sombras
```

---

## 4. Forma (Shape)

### 4.1 Corner Radius MD3

| Shape | Radius | Uso |
|-------|--------|-----|
| `none` | 0dp | Imagens full-bleed |
| `extraSmall` | 4dp | Badges, tooltips |
| `small` | 8dp | Chips, text fields |
| `medium` | 12dp | Cards, menus |
| `large` | 16dp | FABs pequenos |
| `extraLarge` | 28dp | Dialogs, sheets |
| `full` | 50% | Botoes pill, avatares |

### 4.2 Aplicacao no SGE

| Componente | Shape |
|------------|-------|
| Button | `full` (20dp) |
| Card | `medium` (12dp) |
| Dialog | `extraLarge` (28dp) |
| TextField | `small` (8dp) |
| Chip | `small` (8dp) |
| Avatar | `full` |
| Menu | `medium` (12dp) |
| Snackbar | `extraSmall` (4dp) |

---

## 5. Estados (States)

### 5.1 State Layers

| Estado | Opacidade | Aplicacao |
|--------|-----------|-----------|
| Hover | 8% | Cursor sobre elemento |
| Focus | 12% | Foco via teclado |
| Pressed | 12% | Clique/touch ativo |
| Dragged | 16% | Arrastar elemento |
| Selected | 8% + icon | Item selecionado |
| Activated | 12% | Item ativo (nav) |
| Disabled | 38% opacity no conteudo | Desabilitado |

### 5.2 Implementacao

```typescript
// State layer sobre primary container
const stateLayer = {
  hover: 'rgba(21, 101, 192, 0.08)',      // primary @ 8%
  focus: 'rgba(21, 101, 192, 0.12)',      // primary @ 12%
  pressed: 'rgba(21, 101, 192, 0.12)',    // primary @ 12%
  dragged: 'rgba(21, 101, 192, 0.16)',    // primary @ 16%
};
```

---

## 6. Motion

### 6.1 Duracoes

| Tipo | Duracao | Uso |
|------|---------|-----|
| `short1` | 50ms | Micro-interacoes |
| `short2` | 100ms | Hover, focus |
| `short3` | 150ms | Selecao |
| `short4` | 200ms | Fade simples |
| `medium1` | 250ms | Expansao |
| `medium2` | 300ms | Abertura menus |
| `medium3` | 350ms | Transicoes pagina |
| `medium4` | 400ms | Dialogs |
| `long1` | 450ms | Animacoes complexas |
| `long2` | 500ms | Sheets |
| `long3` | 550ms | Navegacao |
| `long4` | 600ms | Animacoes longas |

### 6.2 Easings

```typescript
const easing = {
  standard: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  standardAccelerate: 'cubic-bezier(0.3, 0.0, 1, 1)',
  standardDecelerate: 'cubic-bezier(0, 0.0, 0, 1)',
  emphasized: 'cubic-bezier(0.2, 0.0, 0, 1.0)',
  emphasizedAccelerate: 'cubic-bezier(0.3, 0.0, 0.8, 0.15)',
  emphasizedDecelerate: 'cubic-bezier(0.05, 0.7, 0.1, 1.0)',
};
```

---

## 7. Componentes

### 7.1 Botoes

| Tipo | Uso | Enfase |
|------|-----|--------|
| Filled | CTA principal | Alta |
| Filled Tonal | Acoes secundarias | Media-alta |
| Outlined | Acoes alternativas | Media |
| Text | Acoes terciarias | Baixa |
| Elevated | Quando precisa elevacao | Media |

### 7.2 Cards

| Tipo | Uso | Elevacao |
|------|-----|----------|
| Elevated | Conteudo destacado | Level 1 |
| Filled | Grupos de conteudo | Level 0 + tint |
| Outlined | Listagens | Level 0 + outline |

### 7.3 Navigation

| Componente | Breakpoint | Uso |
|------------|------------|-----|
| Navigation Bar | < 600dp | Mobile |
| Navigation Rail | 600-1240dp | Tablet |
| Navigation Drawer | > 1240dp | Desktop |

---

## 8. Acessibilidade

### 8.1 Contraste Minimo

| Elemento | Ratio Minimo |
|----------|--------------|
| Texto normal | 4.5:1 |
| Texto grande (>18px bold ou >24px) | 3:1 |
| Componentes UI | 3:1 |
| Estados focus | 3:1 |

### 8.2 Touch Targets

| Elemento | Tamanho Minimo |
|----------|---------------|
| Botoes | 48x48dp |
| IconButtons | 48x48dp |
| Checkboxes | 48x48dp |
| Links | 48dp altura |

### 8.3 Focus Indicators

```typescript
const focusStyle = {
  outline: '2px solid',
  outlineColor: 'primary.main',
  outlineOffset: '2px',
};
```

---

## 9. Tokens CSS Custom Properties

```css
:root {
  /* Primary */
  --md-sys-color-primary: #1565C0;
  --md-sys-color-on-primary: #FFFFFF;
  --md-sys-color-primary-container: #D4E3FF;
  --md-sys-color-on-primary-container: #001C3A;

  /* Surface */
  --md-sys-color-surface: #F9F9FF;
  --md-sys-color-on-surface: #1A1C1E;
  --md-sys-color-surface-variant: #E0E2EC;
  --md-sys-color-on-surface-variant: #44474E;

  /* Outline */
  --md-sys-color-outline: #74777F;
  --md-sys-color-outline-variant: #C4C6D0;

  /* Elevation */
  --md-sys-elevation-level0: none;
  --md-sys-elevation-level1: 0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15);
  --md-sys-elevation-level2: 0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15);
  --md-sys-elevation-level3: 0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3);

  /* Shape */
  --md-sys-shape-corner-none: 0px;
  --md-sys-shape-corner-extra-small: 4px;
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;
  --md-sys-shape-corner-extra-large: 28px;
  --md-sys-shape-corner-full: 9999px;

  /* Motion */
  --md-sys-motion-duration-short1: 50ms;
  --md-sys-motion-duration-short2: 100ms;
  --md-sys-motion-duration-medium1: 250ms;
  --md-sys-motion-duration-medium2: 300ms;
  --md-sys-motion-easing-standard: cubic-bezier(0.2, 0.0, 0, 1.0);
}

[data-theme="dark"] {
  --md-sys-color-primary: #A5C8FF;
  --md-sys-color-on-primary: #00315E;
  --md-sys-color-primary-container: #004785;
  --md-sys-color-on-primary-container: #D4E3FF;
  --md-sys-color-surface: #121316;
  --md-sys-color-on-surface: #E2E2E9;
  /* ... etc */
}
```

---

*Documento de referencia para implementacao do Design System MD3 no SGE Diario Digital.*
