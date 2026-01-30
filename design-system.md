# Design System - Sistema de Controle de Pontos

> Documentação extraída automaticamente do dashboard em: `https://sistema-ponto-gules.vercel.app/colaborador/dashboard`
> 
> Framework: **Tailwind CSS v4** com tema customizado

---

## 1. Paleta de Cores

### 1.1 Cores Primárias (Green)

A cor primária do sistema é verde, utilizada para elementos de destaque, header e estados ativos.

| Token                    | Tailwind Class  | Hex       | RGB                  | Uso                          |
|--------------------------|-----------------|-----------|----------------------|------------------------------|
| `--color-primary-50`     | `bg-green-50`   | `#ecfdf5` | `rgb(236, 253, 245)` | Background sutil             |
| `--color-primary-100`    | `bg-green-100`  | `#dbfce7` | `rgb(219, 252, 231)` | Background badges/tags       |
| `--color-primary-200`    | `border-green-200` | `#b9f8cf` | `rgb(185, 248, 207)` | Bordas em destaque        |
| `--color-primary-400`    | `bg-green-400`  | `#4ade80` | `rgb(74, 222, 128)`  | Ícones, indicadores          |
| `--color-primary-600`    | `bg-green-600`  | `#00a63e` | `rgb(0, 166, 62)`    | Botões, links, header        |
| `--color-primary-700`    | `text-green-700`| `#15803d` | `rgb(21, 128, 61)`   | Texto em destaque            |
| `--color-primary-800`    | `text-green-800`| `#016630` | `rgb(1, 102, 48)`    | Texto em badges              |
| `--color-primary-900`    | `text-green-900`| `#14532d` | `rgb(20, 83, 45)`    | Texto escuro                 |

### 1.2 Cores Neutras (Gray)

| Token                    | Tailwind Class  | Hex       | RGB                  | Uso                          |
|--------------------------|-----------------|-----------|----------------------|------------------------------|
| `--color-neutral-50`     | `bg-gray-50`    | `#f9fafb` | `rgb(249, 250, 251)` | Background cards             |
| `--color-neutral-100`    | `bg-gray-100`   | `#f3f4f6` | `rgb(243, 244, 246)` | Hover states                 |
| `--color-neutral-200`    | `border-gray-200`| `#e5e7eb` | `rgb(229, 231, 235)` | Bordas padrão               |
| `--color-neutral-300`    | `bg-gray-300`   | `#d1d5dc` | `rgb(209, 213, 220)` | Botões disabled              |
| `--color-neutral-500`    | `text-gray-500` | `#6a7282` | `rgb(106, 114, 130)` | Texto secundário             |
| `--color-neutral-600`    | `text-gray-600` | `#4a5565` | `rgb(74, 85, 101)`   | Texto de apoio               |
| `--color-neutral-700`    | `text-gray-700` | `#374151` | `rgb(55, 65, 81)`    | Texto padrão                 |
| `--color-neutral-900`    | `bg-gray-900`   | `#101828` | `rgb(16, 24, 40)`    | Background escuro, texto     |

### 1.3 Cores de Estado

#### Sucesso (Green)
```css
--color-success-light: #dbfce7;  /* bg-green-100 */
--color-success-main: #00a63e;   /* bg-green-600 */
--color-success-dark: #016630;   /* text-green-800 */
```

#### Erro/Perigo (Red)
| Token                    | Tailwind Class  | Hex       | Uso                          |
|--------------------------|-----------------|-----------|------------------------------|
| `--color-danger-100`     | `bg-red-100`    | `#fee2e2` | Background de alerta         |
| `--color-danger-500`     | `bg-red-500`    | `#ef4444` | Botão "Registrar Saída"      |
| `--color-danger-600`     | `bg-red-600`    | `#dc2626` | Hover do botão danger        |

#### Aviso (Orange)
| Token                    | Tailwind Class  | Hex       | Uso                          |
|--------------------------|-----------------|-----------|------------------------------|
| `--color-warning-100`    | `bg-orange-100` | `#ffedd5` | Background de aviso          |
| `--color-warning-500`    | `bg-orange-500` | `#f97316` | Botão "Iniciar Almoço"       |
| `--color-warning-600`    | `bg-orange-600` | `#ea580c` | Hover warning                |

#### Info (Blue)
| Token                    | Tailwind Class  | Hex       | Uso                          |
|--------------------------|-----------------|-----------|------------------------------|
| `--color-info-100`       | `bg-blue-100`   | `#dbeafe` | Background informativo       |
| `--color-info-600`       | `bg-blue-600`   | `#155dfc` | Botões de navegação, links   |

#### Especial (Purple/Indigo)
| Token                    | Tailwind Class  | Hex       | Uso                          |
|--------------------------|-----------------|-----------|------------------------------|
| `--color-purple-100`     | `bg-purple-100` | `#f3e8ff` | Background cards especiais   |
| `--color-purple-500`     | `bg-purple-500` | `#a855f7` | Botão "Iniciar HTP"          |
| `--color-indigo-600`     | `text-indigo-600`| `#4f46e5`| Links secundários            |

### 1.4 Cores Especiais

```css
/* Backgrounds */
--color-background-page: #101828;     /* bg-gray-900 */
--color-background-card: #ffffff;     /* bg-white */
--color-background-overlay: rgba(255, 255, 255, 0.95); /* bg-white/95 */

/* Texto */
--color-text-primary: #101828;        /* text-gray-900 */
--color-text-secondary: #4a5565;      /* text-gray-600 */
--color-text-muted: #6a7282;          /* text-gray-500 */
--color-text-inverse: #ffffff;        /* text-white */
```

---

## 2. Tipografia

### 2.1 Família de Fontes

```css
--font-family-primary: "Inter", "Inter Fallback", sans-serif;
--font-family-system: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
```

**Tailwind config:**
```js
fontFamily: {
  sans: ['Inter', 'Inter Fallback', ...defaultTheme.fontFamily.sans],
}
```

### 2.2 Tamanhos de Fonte

| Token              | Tailwind Class | Tamanho | Line Height | Uso                    |
|--------------------|----------------|---------|-------------|------------------------|
| `--text-xs`        | `text-xs`      | 12px    | 16px        | Labels, captions       |
| `--text-sm`        | `text-sm`      | 14px    | 20px        | Texto secundário       |
| `--text-base`      | `text-base`    | 16px    | 24px        | Texto padrão           |
| `--text-lg`        | `text-lg`      | 20px    | 28px        | Subtítulos             |
| `--text-xl`        | `text-xl`      | 20px    | 28px        | Títulos de seção       |
| `--text-2xl`       | `text-2xl`     | 24px    | 32px        | Títulos médios         |
| `--text-3xl`       | `text-3xl`     | 30px    | 36px        | Títulos grandes        |
| `--text-4xl`       | `text-4xl`     | 36px    | 40px        | Títulos de página      |

### 2.3 Pesos de Fonte

| Token                  | Tailwind Class   | Valor | Uso                      |
|------------------------|------------------|-------|--------------------------|
| `--font-weight-normal` | `font-normal`    | 400   | Texto padrão             |
| `--font-weight-medium` | `font-medium`    | 500   | Labels, botões           |
| `--font-weight-semibold`| `font-semibold` | 600   | Títulos de cards         |
| `--font-weight-bold`   | `font-bold`      | 700   | Headings, destaques      |

### 2.4 Hierarquia de Headings

```css
/* H1 - Título principal */
h1 {
  font-size: 20px;        /* text-lg sm:text-xl */
  font-weight: 700;       /* font-bold */
  line-height: 25px;      /* leading-tight */
  color: var(--color-neutral-900);
}

/* H2 - Títulos de seção */
h2 {
  font-size: 30px;        /* text-3xl */
  font-weight: 700;       /* font-bold */
  line-height: 36px;
  color: var(--color-neutral-900);
}

/* H3 - Subtítulos */
h3 {
  font-size: 16px;        /* text-base */
  font-weight: 600;       /* font-semibold */
  line-height: 24px;
  color: var(--color-neutral-900);
}
```

---

## 3. Espaçamentos

### 3.1 Escala Base (Tailwind)

| Token   | Tailwind | Valor | Uso comum                    |
|---------|----------|-------|------------------------------|
| `--sp-1`| `1`      | 4px   | Gaps mínimos                 |
| `--sp-2`| `2`      | 8px   | Padding interno pequeno      |
| `--sp-3`| `3`      | 12px  | Padding de botões            |
| `--sp-4`| `4`      | 16px  | Padding padrão de cards      |
| `--sp-6`| `6`      | 24px  | Padding de seções            |
| `--sp-8`| `8`      | 32px  | Espaçamento entre seções     |

### 3.2 Classes de Espaçamento Utilizadas

**Padding:**
```css
p-3   /* 12px */
p-4   /* 16px */
p-6   /* 24px */
p-8   /* 32px */
px-3  /* horizontal: 12px */
px-4  /* horizontal: 16px */
px-8  /* horizontal: 32px */
py-2  /* vertical: 8px */
py-3  /* vertical: 12px */
py-6  /* vertical: 24px */
```

**Gap (Flexbox/Grid):**
```css
gap-1   /* 4px */
gap-2   /* 8px */
gap-4   /* 16px */
gap-8   /* 32px */
```

**Space Between:**
```css
space-x-1  /* horizontal: 4px */
space-x-2  /* horizontal: 8px */
space-x-3  /* horizontal: 12px */
space-x-4  /* horizontal: 16px */
space-y-3  /* vertical: 12px */
space-y-4  /* vertical: 16px */
space-y-6  /* vertical: 24px */
space-y-8  /* vertical: 32px */
```

---

## 4. Componentes UI

### 4.1 Botões

#### Botão Primário (Danger/Exit)
```html
<button class="w-full py-6 px-8 rounded-xl font-bold text-2xl 
  flex items-center justify-center space-x-4 
  transition-all duration-300 transform hover:scale-105 shadow-2xl 
  bg-gradient-to-r from-red-500 to-red-600 
  hover:from-red-600 hover:to-red-700 text-white">
  Registrar Saída
</button>
```
- Background: Gradiente `#ef4444` → `#dc2626`
- Texto: `#ffffff`
- Padding: `24px 32px`
- Border Radius: `12px` (rounded-xl)

#### Botão Secundário (Warning/Lunch)
```html
<button class="flex-1 py-4 px-6 rounded-xl font-semibold text-lg 
  flex items-center justify-center space-x-3 
  transition-all duration-300 hover:scale-105 shadow-lg 
  bg-gradient-to-r from-orange-500 to-orange-600 
  hover:from-orange-600 hover:to-orange-700 text-white">
  Iniciar Almoço
</button>
```
- Background: Gradiente `#f97316` → `#ea580c`
- Texto: `#ffffff`
- Padding: `16px 24px`

#### Botão Especial (HTP/Purple)
```html
<button class="flex-1 py-4 px-6 rounded-xl font-semibold text-lg 
  flex items-center justify-center space-x-3 
  transition-all duration-300 hover:scale-105 shadow-lg 
  bg-gradient-to-r from-purple-500 to-purple-600 
  hover:from-purple-600 hover:to-purple-700 text-white">
  Iniciar HTP
</button>
```
- Background: Gradiente `#a855f7` → `#9333ea`

#### Botão Disabled
```html
<button class="flex-1 py-4 px-6 rounded-xl font-semibold text-lg 
  flex items-center justify-center space-x-3 
  bg-gray-300 text-gray-600 cursor-not-allowed" disabled>
  Finalizar Almoço
</button>
```
- Background: `#d1d5dc` (gray-300)
- Texto: `#4a5565` (gray-600)
- Cursor: `not-allowed`

#### Botão de Navegação (Blue)
```html
<button class="flex items-center justify-center space-x-2 
  bg-blue-600 hover:bg-blue-700 text-white 
  px-4 py-2 rounded-xl transition-colors">
  <span>Dashboard</span>
</button>
```
- Background: `#155dfc` → `#1d4ed8`

#### Botão Badge (Green Tag)
```html
<button class="flex items-center bg-green-100 text-green-800 
  border-green-200 border rounded-xl px-3 py-2 
  transition-all duration-200 hover:shadow-md hover:scale-105">
  <span>Nível de Acesso</span>
  <span>Colaborador</span>
</button>
```
- Background: `#dbfce7`
- Texto: `#016630`
- Border: `#b9f8cf`

### 4.2 Cards

#### Card Principal
```html
<div class="bg-white rounded-2xl shadow-lg p-6 space-y-6">
  <!-- Conteúdo -->
</div>
```
- Background: `#ffffff`
- Border Radius: `16px` (rounded-2xl)
- Shadow: `shadow-lg`
- Padding: `24px`

#### Card Header (Banner Verde)
```html
<div class="bg-gradient-to-r from-green-600 to-green-700 
  rounded-2xl shadow-2xl p-6 text-white">
  <h2 class="text-3xl font-bold">Bom dia, Jean!</h2>
  <p class="text-green-200">Dashboard do Colaborador</p>
</div>
```
- Gradiente: `#00a63e` → `#15803d`
- Border Radius: `16px`

#### Card de Perfil
```html
<div class="bg-white rounded-2xl shadow-lg p-6">
  <img class="w-16 h-16 rounded-full border-4 border-green-400" />
  <h3 class="font-bold text-gray-900">Nome</h3>
  <span class="text-blue-600 text-sm">Colaborador</span>
</div>
```

### 4.3 Badges/Status

#### Status Ativo
```html
<span class="inline-flex items-center space-x-1">
  <span class="w-2 h-2 bg-green-400 rounded-full"></span>
  <span class="text-green-200">Trabalhando</span>
</span>
```

#### Badge de Nível
```html
<span class="bg-green-100 text-green-800 border border-green-200 
  rounded-xl px-3 py-2 text-sm font-medium">
  Colaborador
</span>
```

### 4.4 Links de Ação

```html
<a href="/historico" class="flex items-center justify-between p-4 
  bg-gray-50 hover:bg-gray-100 rounded-xl 
  transition-all duration-200 group">
  <div class="flex items-center space-x-3">
    <span class="text-blue-600">📋</span>
    <div>
      <p class="font-medium text-gray-900">Ver Histórico</p>
      <p class="text-sm text-gray-500">Seus registros de ponto</p>
    </div>
  </div>
  <span class="text-green-600 group-hover:translate-x-1 transition-transform">→</span>
</a>
```

### 4.5 Indicadores de Status

#### GPS/Localização
```html
<div class="flex items-center space-x-2 text-green-600">
  <span>📍</span>
  <span class="text-sm">Localização válida (14m do trabalho)</span>
</div>
```

#### Sistema Verificado
```html
<div class="flex items-center space-x-2 text-green-600">
  <span>✓</span>
  <span class="text-sm">Sistema verificado</span>
</div>
```

---

## 5. Bordas e Sombras

### 5.1 Border Radius

| Token                  | Tailwind Class  | Valor   | Uso                    |
|------------------------|-----------------|---------|------------------------|
| `--radius-sm`          | `rounded`       | 4px     | Elementos pequenos     |
| `--radius-md`          | `rounded-lg`    | 8px     | Botões, inputs         |
| `--radius-lg`          | `rounded-xl`    | 12px    | Cards pequenos         |
| `--radius-xl`          | `rounded-2xl`   | 16px    | Cards principais       |
| `--radius-full`        | `rounded-full`  | 9999px  | Avatares, badges       |

### 5.2 Box Shadows

```css
/* Shadow padrão para cards */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -4px rgba(0, 0, 0, 0.1);

/* Shadow intenso para botões de ação */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

**Classes Tailwind:**
```css
shadow-lg   /* Cards */
shadow-2xl  /* Botões principais, modais */
shadow-md   /* Hover effects */
```

### 5.3 Bordas

```css
/* Borda padrão */
border: 1px solid var(--color-neutral-200);  /* border border-gray-200 */

/* Borda de destaque */
border: 2px solid var(--color-primary-200);  /* border-2 border-green-200 */

/* Borda de avatar */
border: 4px solid var(--color-primary-400);  /* border-4 border-green-400 */
```

---

## 6. Gradientes

### 6.1 Gradientes de Background

```css
/* Header Verde */
.header-gradient {
  background: linear-gradient(to right, #00a63e, #15803d);
  /* bg-gradient-to-r from-green-600 to-green-700 */
}

/* Botão Vermelho (Saída) */
.btn-danger-gradient {
  background: linear-gradient(to right, #ef4444, #dc2626);
  /* bg-gradient-to-r from-red-500 to-red-600 */
}

/* Botão Laranja (Almoço) */
.btn-warning-gradient {
  background: linear-gradient(to right, #f97316, #ea580c);
  /* bg-gradient-to-r from-orange-500 to-orange-600 */
}

/* Botão Roxo (HTP) */
.btn-purple-gradient {
  background: linear-gradient(to right, #a855f7, #9333ea);
  /* bg-gradient-to-r from-purple-500 to-purple-600 */
}

/* Overlay backdrop */
.backdrop-gradient {
  background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.95));
  /* bg-gradient-to-b */
}
```

---

## 7. Transições e Animações

### 7.1 Transições Padrão

```css
/* Transição de cores */
transition-colors: color 200ms, background-color 200ms, border-color 200ms;

/* Transição completa */
transition-all: all 200ms;
transition-all: all 300ms;  /* Para animações mais suaves */
```

### 7.2 Efeitos de Hover

```css
/* Scale up */
.hover-scale {
  transition: transform 300ms;
}
.hover-scale:hover {
  transform: scale(1.05);  /* hover:scale-105 */
}

/* Translate (setas de navegação) */
.hover-translate {
  transition: transform 200ms;
}
.hover-translate:hover {
  transform: translateX(4px);  /* group-hover:translate-x-1 */
}
```

---

## 8. Responsividade

### 8.1 Breakpoints Tailwind

```css
sm: 640px   /* Tablets pequenos */
md: 768px   /* Tablets */
lg: 1024px  /* Desktop */
xl: 1280px  /* Desktop grande */
2xl: 1536px /* Widescreen */
```

### 8.2 Padrões Responsivos Utilizados

```html
<!-- Texto responsivo -->
<h1 class="text-lg sm:text-xl">Título</h1>

<!-- Padding responsivo -->
<div class="px-3 lg:px-4 py-2 lg:py-3">Conteúdo</div>

<!-- Space responsivo -->
<div class="space-x-2 lg:space-x-3">Items</div>

<!-- Grid responsivo (inferido) -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Cards
</div>
```

---

## 9. Tokens CSS Custom Properties

```css
:root {
  /* Cores Primárias */
  --color-primary-50: #ecfdf5;
  --color-primary-100: #dbfce7;
  --color-primary-200: #b9f8cf;
  --color-primary-400: #4ade80;
  --color-primary-600: #00a63e;
  --color-primary-700: #15803d;
  --color-primary-800: #016630;
  --color-primary-900: #14532d;
  
  /* Cores Neutras */
  --color-neutral-50: #f9fafb;
  --color-neutral-100: #f3f4f6;
  --color-neutral-200: #e5e7eb;
  --color-neutral-300: #d1d5dc;
  --color-neutral-500: #6a7282;
  --color-neutral-600: #4a5565;
  --color-neutral-700: #374151;
  --color-neutral-900: #101828;
  
  /* Cores Semânticas */
  --color-danger-500: #ef4444;
  --color-danger-600: #dc2626;
  --color-warning-500: #f97316;
  --color-warning-600: #ea580c;
  --color-info-600: #155dfc;
  --color-purple-500: #a855f7;
  
  /* Tipografia */
  --font-family-primary: "Inter", "Inter Fallback", sans-serif;
  --font-size-xs: 12px;
  --font-size-sm: 14px;
  --font-size-base: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 30px;
  --font-size-4xl: 36px;
  
  /* Espaçamentos */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}
```

---

## 10. Resumo de Classes Mais Utilizadas

### Background
`bg-white`, `bg-gray-50`, `bg-gray-900`, `bg-green-100`, `bg-green-600`, `bg-blue-600`, `bg-gradient-to-r`

### Texto
`text-gray-900`, `text-gray-600`, `text-gray-500`, `text-green-800`, `text-green-600`, `text-white`, `text-blue-600`

### Bordas
`border`, `border-2`, `border-4`, `border-gray-200`, `border-green-200`, `rounded-xl`, `rounded-2xl`, `rounded-full`

### Layout
`flex`, `flex-col`, `items-center`, `justify-center`, `justify-between`, `space-x-2`, `space-y-4`, `gap-4`

### Tamanhos
`w-full`, `w-16`, `h-16`, `p-4`, `p-6`, `px-3`, `py-2`, `py-6`

### Efeitos
`shadow-lg`, `shadow-2xl`, `transition-all`, `duration-200`, `duration-300`, `hover:scale-105`, `hover:shadow-md`

---

*Documentação gerada automaticamente em: 26/01/2026*
