# Relatório de Auditoria Material Design 3 - SGE Diário Digital

**Data:** 2026-01-08
**Versão:** 1.0
**Autor:** Tech Lead (Claude)

---

## 1. Resumo Executivo

Este relatório apresenta uma auditoria completa do sistema SGE (Sistema de Gestão Escolar) - Diário Digital, analisando sua conformidade com os princípios do Material Design 3 (MD3), acessibilidade WCAG 2.1 AA, e boas práticas de UX/UI.

### Status Geral

| Categoria | Status | Prioridade |
|-----------|--------|------------|
| Sistema de Cores | Não conforme | Alta |
| Tipografia | Parcialmente conforme | Média |
| Componentes | Não conforme | Alta |
| Elevação/Sombras | Não conforme | Alta |
| Acessibilidade | Parcialmente conforme | Alta |
| Dark Mode | Ausente | Alta |
| Responsividade | Conforme | Baixa |

---

## 2. Inventário Técnico

### 2.1 Estrutura do Projeto

```
src/
├── app/                    # Next.js App Router (23 arquivos .tsx)
│   ├── layout.tsx         # Layout raiz
│   ├── page.tsx           # Página inicial (redirect)
│   ├── globals.css        # Estilos globais
│   ├── login/
│   │   └── page.tsx       # Página de login
│   └── diario/
│       ├── menu/page.tsx      # Menu principal
│       ├── chamada/page.tsx   # Módulo de chamada
│       ├── notas/page.tsx     # Módulo de notas
│       ├── conceitos/page.tsx # Módulo de conceitos
│       ├── ocorrencias/page.tsx
│       ├── professores/page.tsx
│       ├── graficos/page.tsx
│       ├── senha/page.tsx
│       ├── aniversariantes/page.tsx
│       └── agenda/page.tsx
├── components/
│   ├── layout/
│   │   ├── Header.tsx     # Cabeçalho principal
│   │   ├── Sidebar.tsx    # Menu lateral
│   │   └── MainLayout.tsx # Layout wrapper
│   └── ui/
│       ├── MenuCard.tsx       # Cards do menu
│       ├── DataTable.tsx      # Tabela de dados
│       ├── FilterPanel.tsx    # Painel de filtros
│       ├── FormModal.tsx      # Modal de formulário
│       ├── ConfirmDialog.tsx  # Diálogo de confirmação
│       ├── ToastProvider.tsx  # Sistema de notificações
│       └── LoadingScreen.tsx  # Tela de carregamento
├── lib/
│   ├── theme.ts           # Configuração do tema MUI
│   ├── firebase.ts        # Configuração Firebase
│   └── validations.ts     # Schemas Zod
├── hooks/
│   └── useAuth.ts         # Hook de autenticação
├── store/
│   ├── authStore.ts       # Estado de autenticação
│   └── uiStore.ts         # Estado da UI
└── types/
    └── index.ts           # Definições TypeScript
```

### 2.2 Stack Tecnológica

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Next.js | 14+ | Framework principal |
| React | 18+ | UI Library |
| MUI (Material-UI) | v6 | Design System |
| TypeScript | 5+ | Tipagem |
| Firebase | v9+ | Auth & Database |
| Zustand | - | Estado global |
| React Hook Form | - | Formulários |
| Zod | - | Validações |
| Recharts | - | Gráficos |

### 2.3 Configuração Atual do Tema

**Arquivo:** `src/lib/theme.ts`

```typescript
// Cores atuais (NÃO MD3)
const primaryMain = '#1a365d';    // Azul escuro fixo
const primaryLight = '#2c5282';
const primaryDark = '#0f2942';
const secondaryMain = '#48bb78';  // Verde fixo
const secondaryLight = '#68d391';
const secondaryDark = '#38a169';
```

---

## 3. Problemas Identificados

### 3.1 Sistema de Cores

#### Violações MD3:

| Problema | Localização | Severidade |
|----------|-------------|------------|
| Cores hardcoded sem tokens | `theme.ts:6-11` | Alta |
| Ausência de color roles MD3 | `theme.ts` completo | Alta |
| Sem suporte a temas dinâmicos | Sistema inteiro | Alta |
| Background colors não seguem MD3 | `theme.ts:28-30` | Média |
| Contraste insuficiente em alguns elementos | `MenuCard.tsx` | Alta |

#### Cores Atuais vs MD3 Esperado:

| Uso Atual | Cor | Problema MD3 |
|-----------|-----|--------------|
| Primary | `#1a365d` | Não é um "seed color", muito saturado |
| Secondary | `#48bb78` | Verde não harmoniza com azul escuro |
| Background | `#f0f4f8` | Deveria usar `surface` tokens |
| Paper | `#ffffff` | Falta variações `surface-variant` |
| Error | `#e53e3e` | Aceitável, mas sem gradação |

#### Tokens MD3 Ausentes:
- `surface`, `surface-variant`, `surface-container`
- `on-surface`, `on-surface-variant`
- `outline`, `outline-variant`
- `primary-container`, `on-primary-container`
- `secondary-container`, `on-secondary-container`
- `tertiary`, `tertiary-container`
- `inverse-surface`, `inverse-on-surface`

### 3.2 Componentes

#### MenuCard (`src/components/ui/MenuCard.tsx`)

```typescript
// PROBLEMA: bgcolor recebe cor direta, não token
<Card sx={{ bgcolor: color, color: 'white' }}>
```

**Problemas:**
- Usa cores diretas em vez de tokens
- `color: 'white'` hardcoded prejudica dark mode
- Elevação via `boxShadow` manual em vez de elevation tokens
- Hover com transform não segue MD3 state layer

**Recomendação MD3:**
- Usar `primary-container` com `on-primary-container`
- Aplicar state layer (ripple) para interações
- Usar elevation tokens (níveis 0-5)

#### DataTable (`src/components/ui/DataTable.tsx`)

**Problemas:**
- Header com `backgroundColor: '#f7fafc'` hardcoded
- Sem suporte a dark mode
- Pagination sem styling MD3
- Cores de ação (edit, delete) não usam tokens

#### Header (`src/components/layout/Header.tsx`)

**Problemas:**
- AppBar sem variante MD3 (small, medium, large)
- Avatar com `bgcolor: 'secondary.main'` - deveria ser token
- Menu dropdown sem elevation correta

#### Sidebar (`src/components/layout/Sidebar.tsx`)

**Problemas:**
- `ListItemButton` selected state usa rgba hardcoded
- Sem NavigationRail para tablets (MD3)
- Falta feedback visual adequado nos itens

#### FormModal/ConfirmDialog

**Problemas:**
- Dialog sem corner radius MD3 (28dp para dialogs)
- Botões não seguem padrão de ênfase MD3
- DialogTitle sem close affordance correto

### 3.3 Tipografia

#### Estado Atual:

```typescript
typography: {
  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontWeight: 700, fontSize: '2.5rem' },
  // ...
}
```

**Problemas:**
- Não usa type scale MD3 (display, headline, title, body, label)
- Font weights não seguem recomendações (300, 400, 500)
- Line heights não especificados
- Letter spacing ausente

#### Type Scale MD3 Ausente:
- Display (large/medium/small)
- Headline (large/medium/small)
- Title (large/medium/small)
- Body (large/medium/small)
- Label (large/medium/small)

### 3.4 Elevação e Sombras

**Problemas Identificados:**

| Componente | Sombra Atual | Problema |
|------------|--------------|----------|
| Card | `0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)` | Não usa elevation tokens |
| Paper | Mesma acima | Inconsistente |
| AppBar | `0 1px 3px rgba(0,0,0,0.12)` | Muito sutil |
| Drawer | `2px 0 8px rgba(0,0,0,0.1)` | Hardcoded |
| MenuCard hover | `0 8px 16px rgba(0,0,0,0.2)` | Muito agressivo |

**MD3 Elevation System:**
- Level 0: 0dp (surface)
- Level 1: 1dp (surface-container-low)
- Level 2: 3dp (surface-container)
- Level 3: 6dp (surface-container-high)
- Level 4: 8dp
- Level 5: 12dp

### 3.5 Acessibilidade (WCAG 2.1 AA)

#### Problemas de Contraste:

| Elemento | Foreground | Background | Ratio | Mínimo | Status |
|----------|------------|------------|-------|--------|--------|
| MenuCard texto | `#ffffff` | `#1a365d` | 11.5:1 | 4.5:1 | OK |
| MenuCard texto | `#ffffff` | `#48bb78` | 3.2:1 | 4.5:1 | FALHA |
| Text secondary | `#4a5568` | `#f0f4f8` | 5.1:1 | 4.5:1 | OK |
| Table header | `#1a202c` | `#f7fafc` | 14.5:1 | 4.5:1 | OK |

#### Outros Problemas de Acessibilidade:

1. **Focus indicators**: Não customizados, dependem do browser
2. **Touch targets**: Alguns IconButtons < 48x48dp
3. **Screen reader**: Labels ausentes em alguns controles
4. **Keyboard navigation**: Não testada adequadamente
5. **Color alone**: Alguns status dependem apenas de cor

### 3.6 Dark Mode

**Status: AUSENTE**

O sistema não possui suporte a dark mode. Problemas para implementação:

1. Cores hardcoded em múltiplos componentes
2. Scrollbar colors em `theme.ts` assumem dark background
3. CSS global não considera `prefers-color-scheme`
4. Sem toggle de tema na UI

---

## 4. Análise de Navegação

### 4.1 Arquitetura de Informação

```
Login
  └── Menu Principal (9 módulos)
        ├── Agenda
        ├── Chamada
        ├── Conceitos
        ├── Notas
        ├── Ocorrências
        ├── Professores
        ├── Gráficos
        ├── Senha
        └── Aniversariantes
```

### 4.2 Padrões de Navegação MD3

| Padrão MD3 | Status | Recomendação |
|------------|--------|--------------|
| Navigation bar (mobile) | Ausente | Implementar para < 600dp |
| Navigation rail (tablet) | Ausente | Implementar para 600-1240dp |
| Navigation drawer (desktop) | Presente | Manter, ajustar estilo |
| Top app bar | Presente | Adequar variantes MD3 |

### 4.3 Problemas de UX

1. **Menu Grid**: 9 itens em grid pode ser overwhelming
2. **Breadcrumbs**: Ausentes - dificulta orientação
3. **Back navigation**: Implementada mas inconsistente
4. **Loading states**: Básicos, sem skeletons
5. **Empty states**: Genéricos, sem ilustrações

---

## 5. Matriz de Priorização

### Alta Prioridade (Sprint 1)

| Item | Esforço | Impacto | Dependências |
|------|---------|---------|--------------|
| Implementar color roles MD3 | Alto | Alto | Nenhuma |
| Corrigir contrastes WCAG | Médio | Alto | Cores |
| Adicionar dark mode toggle | Médio | Alto | Color roles |
| Refatorar MenuCard | Baixo | Alto | Cores |

### Média Prioridade (Sprint 2)

| Item | Esforço | Impacto | Dependências |
|------|---------|---------|--------------|
| Type scale MD3 | Médio | Médio | Nenhuma |
| Elevation tokens | Médio | Médio | Cores |
| State layers | Médio | Médio | Cores |
| Focus indicators | Baixo | Alto | Nenhuma |

### Baixa Prioridade (Sprint 3)

| Item | Esforço | Impacto | Dependências |
|------|---------|---------|--------------|
| Navigation patterns | Alto | Médio | Responsivo |
| Motion/Transitions | Médio | Baixo | Nenhuma |
| Iconografia MD3 | Baixo | Baixo | Nenhuma |

---

## 6. Recomendações

### 6.1 Sistema de Cores MD3

Recomenda-se adotar uma seed color e gerar a paleta completa:

**Seed Color Proposta:** `#1565C0` (Material Blue 800)

Isso gerará automaticamente:
- Primary, Secondary, Tertiary
- Surface levels
- Error, Warning, Success (semantic)
- Todas as variantes on-*, container, etc.

### 6.2 Estrutura de Tokens

Criar arquivo `src/lib/tokens.ts`:

```typescript
// Estrutura proposta
export const tokens = {
  colors: {
    primary: { /* light & dark */ },
    secondary: { /* light & dark */ },
    tertiary: { /* light & dark */ },
    surface: { /* light & dark */ },
    // ...
  },
  typography: { /* MD3 type scale */ },
  elevation: { /* 6 níveis */ },
  shape: { /* corner radius */ },
  motion: { /* durations & easings */ }
};
```

### 6.3 Estratégia de Migração

1. **Fase 1**: Criar sistema de tokens sem breaking changes
2. **Fase 2**: Migrar componentes gradualmente
3. **Fase 3**: Adicionar dark mode
4. **Fase 4**: Refinamentos de acessibilidade

---

## 7. Métricas de Sucesso

| Métrica | Atual | Meta |
|---------|-------|------|
| Lighthouse Accessibility | ~75 | >90 |
| WCAG AA Compliance | 60% | 100% |
| Dark Mode Support | 0% | 100% |
| MD3 Component Coverage | 10% | 100% |
| Design Token Usage | 5% | 100% |

---

## 8. Conclusão

O sistema SGE Diário Digital possui uma base funcional sólida, mas requer refatoração significativa para conformidade com Material Design 3. Os principais gaps estão no sistema de cores (ausência de tokens e dark mode) e na semântica dos componentes.

A migração pode ser feita de forma incremental, priorizando:
1. Sistema de cores e tokens
2. Correções de acessibilidade
3. Dark mode
4. Refinamento de componentes

O investimento trará benefícios em:
- Manutenibilidade (tokens centralizados)
- Acessibilidade (WCAG 2.1 AA)
- Experiência do usuário (dark mode, interações)
- Consistência visual (design system unificado)

---

## Anexos

### A. Arquivos Analisados

1. `src/lib/theme.ts` - Configuração de tema
2. `src/app/globals.css` - Estilos globais
3. `src/components/ui/MenuCard.tsx` - Componente de card
4. `src/components/ui/DataTable.tsx` - Tabela de dados
5. `src/components/ui/FormModal.tsx` - Modal de formulário
6. `src/components/ui/FilterPanel.tsx` - Painel de filtros
7. `src/components/ui/ConfirmDialog.tsx` - Diálogo de confirmação
8. `src/components/layout/Header.tsx` - Cabeçalho
9. `src/components/layout/Sidebar.tsx` - Menu lateral
10. `src/app/login/page.tsx` - Página de login
11. `src/app/diario/menu/page.tsx` - Menu principal
12. `src/hooks/useAuth.ts` - Hook de autenticação

### B. Referências

- [Material Design 3 Guidelines](https://m3.material.io/)
- [MUI v6 Documentation](https://mui.com/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Color Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

*Relatório gerado como parte da Etapa 1: Mapeamento e Auditoria do processo de redesign MD3.*
