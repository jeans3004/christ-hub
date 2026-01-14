# Analise Completa do Projeto: SGE Diario Digital

## Sumario Executivo

Este documento apresenta uma analise detalhada do sistema **Diario Digital** - um sistema de gestao escolar desenvolvido com Next.js 16, React 19, Material-UI v7, Firebase e Zustand. O objetivo e fornecer informacoes para planejamento de reestruturacao de codigo visando reducao de linhas e melhoria da arquitetura.

---

## 1. Informacoes Gerais do Projeto

| Atributo | Valor |
|----------|-------|
| **Nome** | Diario Digital (SGE) |
| **Framework** | Next.js 16.1.1 (App Router) |
| **UI Library** | Material-UI v7.3.7 |
| **Backend** | Firebase (Firestore + Auth) |
| **State Management** | Zustand v5.0.9 |
| **Linguagem** | TypeScript 5.9.3 |
| **Total de Arquivos** | 41 arquivos em src/ |
| **Total de Linhas** | ~9.042 linhas de codigo |

---

## 2. Dependencias do Projeto

```json
{
  "Core": {
    "next": "^16.1.1",
    "react": "^19.2.3",
    "react-dom": "^19.2.3",
    "typescript": "^5.9.3"
  },
  "UI": {
    "@mui/material": "^7.3.7",
    "@mui/icons-material": "^7.3.7",
    "@emotion/react": "^11.14.0",
    "@emotion/styled": "^11.14.1",
    "@emotion/cache": "^11.14.0",
    "@mui/material-nextjs": "^7.3.7"
  },
  "Backend": {
    "firebase": "^12.7.0"
  },
  "Formularios": {
    "react-hook-form": "^7.70.0",
    "@hookform/resolvers": "^5.2.2",
    "zod": "^3.23.8"
  },
  "Estado Global": {
    "zustand": "^5.0.9"
  },
  "Graficos": {
    "recharts": "^3.6.0"
  },
  "Testes": {
    "jest": "^30.2.0",
    "jest-environment-jsdom": "^30.2.0",
    "@testing-library/react": "^16.3.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@playwright/test": "^1.57.0"
  }
}
```

---

## 3. Estrutura de Pastas Completa

```
src/
├── app/                                    # Next.js App Router
│   ├── layout.tsx                          # Layout raiz (47 linhas)
│   ├── page.tsx                            # Pagina index - redirect (15 linhas)
│   ├── globals.css                         # Estilos globais (25 linhas)
│   │
│   ├── login/
│   │   └── page.tsx                        # Pagina de login (275 linhas)
│   │
│   └── diario/
│       ├── menu/
│       │   └── page.tsx                    # Dashboard principal (231 linhas)
│       │
│       ├── chamada/
│       │   └── page.tsx                    # Gestao de chamada (503 linhas)
│       │
│       ├── notas/
│       │   └── page.tsx                    # Gestao de notas (1.382 linhas) ⚠️ MAIOR ARQUIVO
│       │
│       ├── conceitos/
│       │   └── page.tsx                    # Gestao de conceitos (145 linhas)
│       │
│       ├── aniversariantes/
│       │   └── page.tsx                    # Lista de aniversariantes (150 linhas)
│       │
│       ├── graficos/
│       │   └── page.tsx                    # Graficos e relatorios (201 linhas)
│       │
│       ├── professores/
│       │   └── page.tsx                    # CRUD de professores (358 linhas)
│       │
│       ├── ocorrencias/
│       │   └── page.tsx                    # Gestao de ocorrencias (361 linhas)
│       │
│       ├── agenda/
│       │   └── page.tsx                    # Calendario/Agenda (172 linhas)
│       │
│       ├── senha/
│       │   └── page.tsx                    # Alteracao de senha (201 linhas)
│       │
│       ├── usuarios/
│       │   └── page.tsx                    # Gestao de usuarios (placeholder)
│       │
│       ├── configuracoes/
│       │   └── page.tsx                    # Configuracoes do sistema (placeholder)
│       │
│       ├── familia/
│       │   └── page.tsx                    # Portal familia (placeholder)
│       │
│       └── cadastros/
│           ├── alunos/
│           │   └── page.tsx                # CRUD de alunos (409 linhas)
│           │
│           ├── turmas/
│           │   └── page.tsx                # CRUD de turmas (360 linhas)
│           │
│           └── disciplinas/
│               └── page.tsx                # CRUD de disciplinas (427 linhas)
│
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx                  # Wrapper de pagina (43 linhas)
│   │   ├── Header.tsx                      # Barra superior (259 linhas)
│   │   └── Sidebar.tsx                     # Menu lateral (360 linhas)
│   │
│   ├── ui/
│   │   ├── DataTable.tsx                   # Tabela reutilizavel (266 linhas)
│   │   ├── FormModal.tsx                   # Modal de formulario (82 linhas)
│   │   ├── MenuCard.tsx                    # Card do dashboard (119 linhas)
│   │   ├── FilterPanel.tsx                 # Painel de filtros (60 linhas)
│   │   ├── ConfirmDialog.tsx               # Dialog de confirmacao (58 linhas)
│   │   ├── ToastProvider.tsx               # Sistema de notificacoes (31 linhas)
│   │   └── LoadingScreen.tsx               # Tela de carregamento (27 linhas)
│   │
│   └── providers/
│       └── ThemeProvider.tsx               # Provider de tema (43 linhas)
│
├── hooks/
│   ├── useAuth.ts                          # Logica de autenticacao (205 linhas)
│   ├── usePermissions.ts                   # Verificacao de permissoes (51 linhas)
│   └── useFirestoreData.ts                 # Hooks de dados (262 linhas)
│
├── lib/
│   ├── firebase.ts                         # Inicializacao Firebase (39 linhas)
│   ├── permissions.ts                      # Sistema RBAC (288 linhas)
│   ├── theme.ts                            # Configuracao tema MUI (411 linhas)
│   ├── tokens.ts                           # Design tokens (348 linhas)
│   └── validations.ts                      # Schemas Zod (165 linhas)
│
├── services/
│   └── firestore.ts                        # Camada de dados (270 linhas)
│
├── store/
│   ├── authStore.ts                        # Estado de autenticacao (35 linhas)
│   ├── uiStore.ts                          # Estado de UI (63 linhas)
│   └── filterStore.ts                      # Estado de filtros (50 linhas)
│
└── types/
    └── index.ts                            # Interfaces TypeScript (246 linhas)
```

---

## 4. Analise Detalhada por Arquivo

### 4.1 Tipos e Interfaces (`src/types/index.ts` - 246 linhas)

**Proposito:** Definicoes centrais de tipos para toda a aplicacao.

**Exports Principais:**
```typescript
// Enums
export const Meses = ['Janeiro', 'Fevereiro', ...] as const;
export const Turnos = ['Matutino', 'Vespertino', 'Noturno'] as const;
export const Series = ['6o Ano - Ensino Fundamental II', ...] as const;

// Hierarquia de roles
export const RoleHierarchy = {
  professor: 1,
  coordenador: 2,
  administrador: 3,
} as const;

// Interfaces principais
export interface Usuario { id, nome, cpf, email, tipo: UserRole, ... }
export interface Professor { id, nome, cpf, disciplinas[], turmas[], ... }
export interface Turma { id, nome, serie, turno, ano, ... }
export interface Aluno { id, nome, turmaId, matricula, ... }
export interface Disciplina { id, nome, codigo, turmaIds[], ... }
export interface Chamada { id, turmaId, disciplinaId, data, presencas[], ... }
export interface Nota { id, alunoId, bimestre, tipo, valor, composicao?, ... }
export interface NotaComposicao { id, nome, porcentagem, valor }
export interface Conceito { id, alunoId, mes, conceito: 'A'|'B'|'C'|'D'|'E', ... }
export interface Ocorrencia { id, alunoId, motivo, status, ... }
```

**Dependencias:** Firebase (Timestamp)

---

### 4.2 Configuracao Firebase (`src/lib/firebase.ts` - 39 linhas)

**Proposito:** Inicializacao singleton do Firebase.

**Exports:**
- `auth` - Instancia Firebase Authentication
- `db` - Instancia Firestore
- `storage` - Instancia Firebase Storage

**Caracteristicas:**
- Suporte a emuladores para desenvolvimento
- Variaveis de ambiente: `NEXT_PUBLIC_FIREBASE_*`

---

### 4.3 Sistema de Permissoes RBAC (`src/lib/permissions.ts` - 288 linhas)

**Proposito:** Controle de acesso baseado em papeis (RBAC).

**Hierarquia de Roles:**
```
professor (1) → coordenador (2) → administrador (3)
```

**Categorias de Permissoes (60+):**
- Dashboard: `dashboard:access`
- Chamada: `chamada:view`, `chamada:create`, `chamada:edit`, `chamada:delete`
- Notas: `notas:view`, `notas:create`, `notas:edit`, `notas:delete`
- Conceitos: `conceitos:view`, `conceitos:create`, `conceitos:edit`, `conceitos:delete`
- Turmas: `turmas:view`, `turmas:create`, `turmas:edit`, `turmas:delete`
- Alunos: `alunos:view`, `alunos:create`, `alunos:edit`, `alunos:delete`
- Professores: `professores:view`, `professores:create`, `professores:edit`, `professores:delete`
- Ocorrencias: `ocorrencias:view`, `ocorrencias:create`, `ocorrencias:approve`
- Graficos: `graficos:view`
- Aniversariantes: `aniversariantes:view`
- Usuarios: `usuarios:view`, `usuarios:create`, `usuarios:edit`, `usuarios:delete`
- Sistema: `sistema:view`, `sistema:edit`

**Funcoes Principais:**
```typescript
hasPermission(usuario, permission): boolean
hasAnyPermission(usuario, permissions[]): boolean
hasAllPermissions(usuario, permissions[]): boolean
hasMinimumRole(usuario, minRole): boolean
isAdmin(usuario): boolean
isCoordinatorOrAbove(usuario): boolean
canAccessDiscipline(usuario, disciplinaId): boolean
canAccessTurma(usuario, turmaId): boolean
getRoleDisplayName(role): string
getRoleColor(role): 'error' | 'primary' | 'secondary'
```

---

### 4.4 Design Tokens (`src/lib/tokens.ts` - 348 linhas)

**Proposito:** Tokens de design centralizados (Material Design 3).

**Paleta de Cores:**
- **Primaria:** Violeta (#7C3AED) - inspirado Plurall
- **Secundaria:** Slate/Gray (#64748B)
- **Terciaria:** Cyan (#06B6D4)

**Exports:**
```typescript
export const lightColors = { ... }     // Cores tema claro
export const darkColors = { ... }      // Cores tema escuro
export const semanticColors = { ... }  // Success, warning, error, info
export const typography = { ... }      // 12 niveis tipograficos (Inter font)
export const elevation = { ... }       // 5 niveis de sombra
export const shape = { ... }           // Border radius tokens
export const motion = { ... }          // Timing e easing de animacoes
export const stateLayer = { ... }      // Opacidades de estados
```

---

### 4.5 Tema MUI (`src/lib/theme.ts` - 411 linhas)

**Proposito:** Configuracao completa do tema Material-UI.

**Caracteristicas:**
- Factory function `createAppTheme(mode: 'light' | 'dark')`
- Paleta estendida com 20+ cores customizadas
- Cores especiais: `header`, `sidebar`, `surfaceVariant`, `onSurface`
- Overrides de componentes MUI

**Componentes Customizados:**
- MuiButton, MuiCard, MuiDialog, MuiDrawer
- MuiListItemButton (sidebar), MuiTabs, MuiChip
- MuiTableCell, MuiTextField, MuiOutlinedInput

---

### 4.6 Schemas de Validacao (`src/lib/validations.ts` - 165 linhas)

**Proposito:** Schemas Zod para validacao de formularios.

**Schemas (18 total):**
```typescript
loginSchema           // CPF + senha
alterarSenhaSchema    // Senha atual + nova + confirmacao
professorSchema       // Dados do professor
alunoSchema           // Dados do aluno
turmaSchema           // Serie, turno, ano
disciplinaSchema      // Nome, codigo, turmas
chamadaSchema         // Registro de chamada
notaSchema            // Nota 0-10
conceitoSchema        // Conceito A-E
ocorrenciaSchema      // Registro de ocorrencia
// + filtros diversos
```

---

### 4.7 Servico Firestore (`src/services/firestore.ts` - 270 linhas)

**Proposito:** Camada de acesso a dados com operacoes CRUD.

**Funcoes Genericas:**
```typescript
getDocument<T>(collection, id): Promise<T | null>
getDocuments<T>(collection, ...constraints): Promise<T[]>
createDocument<T>(collection, data): Promise<string>
updateDocument<T>(collection, id, data): Promise<void>
deleteDocument(collection, id): Promise<void>
```

**Servicos por Entidade:**

| Servico | Metodos |
|---------|---------|
| `usuarioService` | get, getAll, getByEmail |
| `professorService` | get, getAll, getAtivos, create, update, delete |
| `alunoService` | get, getAll, getByTurma, create, update, delete |
| `turmaService` | get, getAll, getByAno, create, update, delete |
| `disciplinaService` | get, getAll, getAtivas, create, update, delete |
| `chamadaService` | get, getByTurmaData, create, update, delete |
| `notaService` | get, getByAlunoTurmaDisciplina, create, update, delete |
| `conceitoService` | get, getByAlunoMes, create, update, delete |
| `ocorrenciaService` | get, getByStatus, getByAluno, create, update, delete, aprovar, cancelar |

---

### 4.8 Hook de Autenticacao (`src/hooks/useAuth.ts` - 205 linhas)

**Proposito:** Logica central de autenticacao e integracao Firebase Auth.

**Funcoes:**
```typescript
login(cpf, senha): Promise<void>      // Login email/senha (converte CPF)
loginWithGoogle(): Promise<void>       // Login OAuth Google
logout(): Promise<void>                // Sign out + limpar estado
```

**Caracteristicas:**
- Suporte a modo demo (`NEXT_PUBLIC_DEMO_MODE`)
- Auto-cria perfil de usuario no primeiro login
- Atribuicao de role baseada em email (admins hardcoded)
- Mensagens de erro em portugues
- Notificacoes toast

---

### 4.9 Hook de Permissoes (`src/hooks/usePermissions.ts` - 51 linhas)

**Proposito:** Wrapper conveniente para verificacoes de permissao.

**Exports:**
```typescript
can(permission): boolean
canAny(permissions[]): boolean
canAll(permissions[]): boolean
hasMinRole(role): boolean
isAdmin(): boolean
isCoordinatorOrAbove(): boolean
isProfessor(): boolean
canAccessDiscipline(id): boolean
canAccessTurma(id): boolean
role: UserRole
roleDisplayName: string
roleColor: 'error' | 'primary' | 'secondary'
```

---

### 4.10 Hooks de Dados (`src/hooks/useFirestoreData.ts` - 262 linhas)

**Proposito:** Hooks customizados para busca e gerenciamento de dados Firestore.

**Hooks Disponiveis:**

| Hook | Parametros | Retorno |
|------|------------|---------|
| `useTurmas` | `ano?` | turmas, loading, error, refetch |
| `useDisciplinas` | - | disciplinas, loading, error, refetch |
| `useAlunosByTurma` | `turmaId` | alunos, loading, error, refetch |
| `useChamada` | `turmaId, disciplinaId, data` | chamada, loading, error, refetch, saveChamada |
| `useNotas` | `turmaId, disciplinaId, bimestre, ano, alunoIds` | notas, loading, error, refetch, saveNota |

---

### 4.11 Stores Zustand

#### authStore.ts (35 linhas)
```typescript
interface AuthState {
  user: User | null;           // Firebase Auth user
  usuario: Usuario | null;     // Firestore user document
  isLoading: boolean;
  isAuthenticated: boolean;
}

// Actions: setUser, setUsuario, setLoading, logout
// Persistencia: localStorage (apenas usuario)
```

#### uiStore.ts (63 linhas)
```typescript
interface UIState {
  sidebarOpen: boolean;
  toasts: Toast[];
  isLoading: boolean;
  themeMode: 'light' | 'dark' | 'system';
}

// Actions: toggleSidebar, setSidebarOpen, addToast, removeToast, setLoading, setThemeMode, toggleTheme
// Toasts auto-removidos apos 5 segundos
// Persistencia: localStorage (apenas themeMode)
```

#### filterStore.ts (50 linhas)
```typescript
interface FilterState {
  ano: number;          // Ano letivo (default: ano atual)
  serieId: string;
  turmaId: string;
  disciplinaId: string;
  mes: string;
  bimestre: 1 | 2 | 3 | 4;
}

// Actions: setters individuais + resetFilters
// Persistencia: localStorage (todos os campos)
```

---

### 4.12 Componentes de Layout

#### MainLayout.tsx (43 linhas)
- Wrapper para paginas autenticadas
- Props: `children`, `title`, `showSidebar`
- DRAWER_WIDTH: 260px

#### Header.tsx (259 linhas)
- Barra de navegacao superior fixa
- Logo SVG + texto "diario"
- Botao menu mobile
- Lado direito: ajuda, notificacoes, tema, avatar com dropdown

#### Sidebar.tsx (360 linhas)
- Menu de navegacao lateral responsivo
- 5 secoes de navegacao com filtragem por role
- Secoes colapsaveis
- Highlight de rota ativa

**Estrutura de Navegacao:**
```
1. HOME
   - Inicio → /diario/menu

2. GESTAO
   - Painel de Gestao (colapsavel)
     - Chamada → /diario/chamada
     - Notas → /diario/notas
     - Conceitos → /diario/conceitos
     - Graficos → /diario/graficos (coordenador+)
   - Gestor de turmas (coordenador+)
     - Professores → /diario/professores
     - Ocorrencias → /diario/ocorrencias
   - Familia → /diario/familia (coordenador+)

3. SALA DE AULA
   - Calendario → /diario/agenda
   - Aniversariantes → /diario/aniversariantes (coordenador+)

4. CADASTROS (coordenador+)
   - Turmas → /diario/cadastros/turmas
   - Alunos → /diario/cadastros/alunos
   - Disciplinas → /diario/cadastros/disciplinas

5. ADMINISTRACAO (coordenador+)
   - Usuarios → /diario/usuarios
   - Configuracoes → /diario/configuracoes (admin)
```

---

### 4.13 Componentes UI Reutilizaveis

#### DataTable.tsx (266 linhas)
```typescript
interface Props<T> {
  columns: Column<T>[];        // Definicoes de colunas
  data: T[];                   // Dados da tabela
  actions?: Action<T>[];       // Botoes de acao por linha
  loading?: boolean;
  emptyMessage?: string;
  rowKey: keyof T;             // Identificador de linha
  pagination?: boolean;
  initialRowsPerPage?: number;
}

// Features: ordenacao, paginacao, loading state, hover effects
```

#### FormModal.tsx (82 linhas)
- Wrapper para modais de formulario
- Props: `open`, `onClose`, `title`, `children`, `actions`

#### MenuCard.tsx (119 linhas)
- Card para dashboard
- Props: `title`, `icon`, `href`, `color`, `description`

#### FilterPanel.tsx (60 linhas)
- Painel de filtros generico
- Layout responsivo

#### ConfirmDialog.tsx (58 linhas)
- Dialog de confirmacao de acao
- Props: `open`, `title`, `message`, `onConfirm`, `onCancel`

#### ToastProvider.tsx (31 linhas)
- Sistema de notificacoes toast
- Usa Snackbar do MUI

#### LoadingScreen.tsx (27 linhas)
- Tela de carregamento com CircularProgress

---

## 5. Paginas da Aplicacao

### 5.1 Login (`/login` - 275 linhas)

**Funcionalidades:**
- Logo SVG animado
- Login Google (principal)
- Login email/senha (fallback colapsavel)
- Validacao CPF
- Toggle visibilidade senha
- Redirect apos login

---

### 5.2 Dashboard (`/diario/menu` - 231 linhas)

**Funcionalidades:**
- Saudacao com nome do usuario
- Cards de acesso rapido (Chamada, Notas, Agenda, Calendario)
- Banner promocional com gradiente
- Secao de anuncios (placeholder)

---

### 5.3 Chamada (`/diario/chamada` - 503 linhas)

**Funcionalidades:**
- Filtros: Ano, Turma, Disciplina, Data
- Lista de alunos com avatares coloridos
- Toggle presenca/falta por aluno
- Botoes "Marcar todos presente/ausente"
- Estatisticas de presenca
- Modal para registro de conteudo
- Salvar chamada no Firebase

---

### 5.4 Notas (`/diario/notas` - 1.382 linhas) ⚠️ MAIOR ARQUIVO

**Funcionalidades:**
- Filtros multi-nivel (disciplina, turma, bimestre, aluno)
- Tabela de notas (AV1, AV2, REC, MEDIA)
- Sistema de composicao de notas:
  - Template (icone lapis): define componentes com valores maximos (soma = 10)
  - Entrada de notas (icone engrenagem): valores limitados ao maximo do componente
  - Calculo: NF = N1 + N2 + ... + Nn (soma direta)
- Validacao de entrada com alertas toast
- Salvamento imediato no Firebase
- Operacoes em lote
- Cards de estatisticas

**Complexidade:**
- Estado extenso com multiplos modais
- Logica de composicao de notas
- Multiplas transformacoes de dados
- Gestao complexa de estado

---

### 5.5 Conceitos (`/diario/conceitos` - 145 linhas)

**Funcionalidades:**
- Entrada mensal de conceitos (A-E)
- Filtros por turma/disciplina/mes

---

### 5.6 Aniversariantes (`/diario/aniversariantes` - 150 linhas)

**Funcionalidades:**
- Lista de aniversariantes do mes
- Filtro por mes

---

### 5.7 Graficos (`/diario/graficos` - 201 linhas)

**Funcionalidades:**
- Graficos de desempenho usando Recharts
- Filtros por periodo

---

### 5.8 Professores (`/diario/professores` - 358 linhas)

**Funcionalidades:**
- CRUD completo de professores
- Tabela com acoes
- Modal de criacao/edicao
- Vinculacao com disciplinas e turmas

---

### 5.9 Ocorrencias (`/diario/ocorrencias` - 361 linhas)

**Funcionalidades:**
- CRUD de ocorrencias disciplinares
- Status: pendente, aprovada, cancelada
- Workflow de aprovacao
- Filtros por status/aluno

---

### 5.10 Agenda (`/diario/agenda` - 172 linhas)

**Funcionalidades:**
- Visualizacao de calendario
- (Em desenvolvimento)

---

### 5.11 Senha (`/diario/senha` - 201 linhas)

**Funcionalidades:**
- Formulario de alteracao de senha
- Validacao senha atual
- Confirmacao de nova senha

---

### 5.12 Cadastros

#### Alunos (`/diario/cadastros/alunos` - 409 linhas)
- CRUD completo de alunos
- Vinculacao com turma
- Importacao em lote (futuro)

#### Turmas (`/diario/cadastros/turmas` - 360 linhas)
- CRUD completo de turmas
- Selecao de serie e turno
- Ano letivo

#### Disciplinas (`/diario/cadastros/disciplinas` - 427 linhas)
- CRUD completo de disciplinas
- Selecao multipla de turmas vinculadas
- Codigo opcional

---

## 6. Padroes Arquiteturais Identificados

### 6.1 Arquitetura Baseada em Componentes
- Componentes React funcionais com hooks
- Separacao clara: layout, UI, paginas
- Biblioteca de componentes reutilizaveis

### 6.2 Gestao de Estado
- **Global:** Stores Zustand (auth, ui, filters)
- **Local:** React hooks (useState)
- **Derivado:** Custom hooks para data fetching
- **Persistencia:** localStorage para auth e preferencias

### 6.3 Camada de Servicos
- `firestore.ts` como data access layer
- Funcoes CRUD genericas + servicos especificos por entidade
- Encapsula complexidade do Firestore

### 6.4 Data Fetching via Hooks
- Custom hooks em `useFirestoreData.ts`
- Pattern: `useEffect` + `useCallback` para carga assincrona
- Estados de loading/error incluidos

### 6.5 RBAC (Role-Based Access Control)
- Modelo de permissoes em `permissions.ts`
- Hierarquia: professor < coordenador < admin
- Verificacoes em nivel de componente via `usePermissions`
- Sidebar filtra automaticamente por permissoes

### 6.6 Validacao de Formularios
- Schemas Zod centralizados em `validations.ts`
- Integracao react-hook-form + Zod resolver
- Regras de validacao consistentes

### 6.7 Sistema de Tema
- Design tokens centralizados
- Suporte light/dark mode (persistido via Zustand)
- Overrides de componentes MUI

### 6.8 Next.js App Router
- Roteamento baseado em arquivos
- Grupos de rotas aninhados (`/diario/*`)
- Heranca de layouts
- Componentes client com `'use client'`

---

## 7. Arquivos Candidatos a Refatoracao

### 7.1 CRITICO - Tamanho e Complexidade

#### `/src/app/diario/notas/page.tsx` - 1.382 linhas 🔴

**Problemas:**
- Unico componente gerenciando toda a gestao de notas
- Estado complexo com multiplos modais
- Logica de composicao de notas misturada com UI
- Dificil manutencao e teste

**Recomendacao:**
```
/src/app/diario/notas/
├── page.tsx                    # Pagina principal (~100 linhas)
├── components/
│   ├── GradeTable.tsx          # Tabela de notas (~200 linhas)
│   ├── GradeFilters.tsx        # Filtros (~100 linhas)
│   ├── GradeStats.tsx          # Cards de estatisticas (~80 linhas)
│   ├── CompositionModal.tsx    # Modal de composicao (~250 linhas)
│   └── TemplateModal.tsx       # Modal de template (~200 linhas)
├── hooks/
│   ├── useGradeData.ts         # Logica de dados (~150 linhas)
│   └── useGradeComposition.ts  # Logica de composicao (~150 linhas)
└── utils/
    └── gradeCalculations.ts    # Funcoes de calculo (~50 linhas)
```

**Meta:** 7-8 arquivos focados com menos de 250 linhas cada

---

### 7.2 ALTA PRIORIDADE

#### `/src/components/layout/Sidebar.tsx` - 360 linhas

**Problemas:**
- Dados de navegacao misturados com logica de renderizacao
- Logica de filtragem de permissoes inline

**Recomendacao:**
```
/src/components/layout/
├── Sidebar.tsx                 # Componente principal (~120 linhas)
├── navigation/
│   ├── navigationData.ts       # Dados de navegacao (~60 linhas)
│   ├── NavItem.tsx             # Item de navegacao (~80 linhas)
│   └── NavSection.tsx          # Secao de navegacao (~50 linhas)
└── hooks/
    └── useNavigationFilter.ts  # Filtragem por permissao (~50 linhas)
```

---

#### Paginas de Cadastro (Padrao CRUD Duplicado)

**Arquivos similares:**
- `/diario/professores/page.tsx` (358 linhas)
- `/diario/cadastros/alunos/page.tsx` (409 linhas)
- `/diario/cadastros/turmas/page.tsx` (360 linhas)
- `/diario/cadastros/disciplinas/page.tsx` (427 linhas)

**Oportunidade:**
Criar componente generico `CRUDPage<T>`:
```typescript
interface CRUDPageProps<T> {
  title: string;
  service: FirestoreService<T>;
  columns: Column<T>[];
  formFields: FormField[];
  validationSchema: ZodSchema;
  emptyIcon: ReactNode;
  emptyMessage: string;
}
```

**Economia estimada:** ~800 linhas (50% de reducao nos 4 arquivos)

---

#### `/src/lib/permissions.ts` - 288 linhas

**Recomendacao:**
```
/src/lib/permissions/
├── index.ts                    # Exports publicos (~20 linhas)
├── rolePermissions.ts          # Mapeamento role->permissions (~100 linhas)
├── permissionChecks.ts         # Funcoes de verificacao (~80 linhas)
└── roleHelpers.ts              # Funcoes auxiliares de role (~50 linhas)
```

---

### 7.3 MEDIA PRIORIDADE

#### Componentes de UI que podem ser simplificados

| Componente | Linhas | Sugestao |
|------------|--------|----------|
| Header.tsx | 259 | Extrair UserMenu, ThemeToggle, NotificationBell |
| DataTable.tsx | 266 | Considerar biblioteca (TanStack Table) |
| MenuCard.tsx | 119 | Simplificar estilos inline |

---

## 8. Estatisticas de Codigo

| Metrica | Valor |
|---------|-------|
| **Arquivos em src/** | 41 |
| **Linhas totais** | ~9.042 |
| **Componentes de pagina** | 15 |
| **Componentes UI** | 7 |
| **Hooks customizados** | 3 |
| **Stores Zustand** | 3 |
| **Servicos** | 1 (9 entity services) |
| **Schemas de validacao** | 18 |
| **Rotas** | 15 |
| **Maior arquivo** | notas/page.tsx (1.382 linhas) |
| **Colecoes Firebase** | 9 |
| **Tipos de role** | 3 |
| **Permissoes** | 60+ |

---

## 9. Distribuicao de Linhas por Tipo

```
Paginas (app/):        ~5.200 linhas (57%)
├── notas/page.tsx:     1.382 linhas (15%)
├── chamada/page.tsx:     503 linhas (6%)
├── disciplinas/page.tsx: 427 linhas (5%)
├── alunos/page.tsx:      409 linhas (5%)
├── ocorrencias/page.tsx: 361 linhas (4%)
├── turmas/page.tsx:      360 linhas (4%)
├── professores/page.tsx: 358 linhas (4%)
├── login/page.tsx:       275 linhas (3%)
├── menu/page.tsx:        231 linhas (3%)
└── outras paginas:       ~900 linhas (10%)

Componentes (components/): ~1.100 linhas (12%)
├── Sidebar.tsx:            360 linhas
├── DataTable.tsx:          266 linhas
├── Header.tsx:             259 linhas
└── outros:                 ~215 linhas

Lib (lib/): ~1.250 linhas (14%)
├── theme.ts:               411 linhas
├── tokens.ts:              348 linhas
├── permissions.ts:         288 linhas
└── outros:                 ~203 linhas

Hooks (hooks/): ~520 linhas (6%)
Services (services/): ~270 linhas (3%)
Stores (store/): ~150 linhas (2%)
Types (types/): ~250 linhas (3%)
```

---

## 10. Roadmap de Refatoracao Sugerido

### Fase 1: Critica (Imediato)
1. **Quebrar notas/page.tsx** (1.382 → ~8 arquivos)
   - Extrair componentes de modal
   - Extrair hooks de logica
   - Extrair funcoes de calculo

2. **Extrair constantes de navegacao** do Sidebar
   - Criar arquivo de configuracao
   - Componentizar itens de navegacao

3. **Criar abstracao para padrao CRUD**
   - Componente generico CRUDPage
   - Reduzir duplicacao em 4 paginas

### Fase 2: Importante
1. Extrair mapeamentos de permissao para constantes
2. Implementar CRUDPage nas paginas de cadastro
3. Adicionar error boundaries
4. Adicionar memoizacao de componentes (useMemo, useCallback)

### Fase 3: Melhorias
1. Adicionar testes unitarios para servicos e hooks
2. Implementar paginas faltantes (usuarios, configuracoes)
3. Adicionar logging de validacao entrada/saida
4. Internacionalizacao (i18n)

---

## 11. Observacoes de Qualidade

### Pontos Positivos
- ✅ Uso consistente de TypeScript
- ✅ Estilo de codigo consistente
- ✅ Boa composicao de componentes
- ✅ Sistema de permissoes robusto
- ✅ Design system bem definido

### Areas de Melhoria
- ⚠️ Falta de error boundaries
- ⚠️ Sem testes unitarios (jest configurado mas nao usado)
- ⚠️ Valores hardcoded em componentes
- ⚠️ Arquivos grandes dificultam manutencao
- ⚠️ Duplicacao de logica CRUD
- ⚠️ Modo demo bypassa autenticacao completamente
- ⚠️ Emails de admin hardcoded no codigo fonte

---

## 12. Colecoes Firebase

```
usuarios         # Usuarios do sistema (staff)
professores      # Dados especificos de professores
alunos           # Cadastro de alunos
turmas           # Classes/turmas
disciplinas      # Materias/disciplinas
chamadas         # Registros de presenca
notas            # Registros de notas
conceitos        # Registros de conceitos mensais
ocorrencias      # Registros de ocorrencias disciplinares
```

---

## 13. Conclusao

O projeto **Diario Digital** e uma aplicacao bem estruturada para gestao escolar, com arquitetura moderna usando Next.js 16, React 19 e Firebase. Os principais pontos de atencao para refatoracao sao:

1. **notas/page.tsx** - Com 1.382 linhas, e o arquivo mais critico para refatoracao
2. **Padrao CRUD duplicado** - 4 paginas com estrutura similar que podem compartilhar codigo
3. **Sidebar.tsx** - Dados de navegacao devem ser extraidos para configuracao

A meta principal deve ser reduzir arquivos com mais de 400 linhas em componentes menores e mais focados, melhorando manutenibilidade e testabilidade.

---

*Documento gerado para planejamento de reestruturacao de codigo.*
*Versao: 1.0 | Data: Janeiro 2026*
