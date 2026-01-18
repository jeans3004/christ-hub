# Analise Completa do Projeto: SGE Diario Digital

## Sumario Executivo

Este documento apresenta a analise atualizada do sistema **Diario Digital** apos a refatoracao parcial. O sistema foi desenvolvido com Next.js 16, React 19, Material-UI v7, Firebase e Zustand. A refatoracao estabeleceu um padrao de arquivos com maximo de **150-200 linhas** por arquivo.

---

## 1. Informacoes Gerais do Projeto

| Atributo | Valor |
|----------|-------|
| **Nome** | Diario Digital (SGE) |
| **Framework** | Next.js 16.1.1 (App Router) |
| **UI Library** | Material-UI v7.3.7 |
| **Backend** | Firebase (Firestore + Auth + Storage) |
| **State Management** | Zustand v5.0.9 |
| **Linguagem** | TypeScript 5.9.3 |
| **Total de Arquivos** | 84 arquivos em src/ |
| **Total de Linhas** | ~15.825 linhas de codigo |

---

## 2. Arquitetura de Modulos Refatorados

### 2.1 Padrao Estabelecido

Cada modulo de pagina segue a estrutura:

```
/src/app/diario/[modulo]/
├── page.tsx              # Pagina principal (~80-150 linhas)
├── types.ts              # Tipos do modulo (~50-100 linhas)
├── components/
│   ├── index.ts          # Exports centralizados
│   ├── Filters.tsx       # Filtros (~70-100 linhas)
│   ├── List.tsx          # Lista/Tabela (~100-200 linhas)
│   ├── Modal.tsx         # Modais (~100-150 linhas)
│   └── ...               # Componentes especificos
├── hooks/
│   ├── index.ts          # Exports centralizados
│   └── useData.ts        # Hook de dados (~100-150 linhas)
└── utils/                # (opcional)
    └── calculations.ts   # Funcoes utilitarias (~50-100 linhas)
```

---

## 3. Status dos Modulos

### 3.1 Modulos Refatorados (Padrao Correto)

| Modulo | Arquivos | Linhas | Status |
|--------|----------|--------|--------|
| Chamada | 7 | 720 | Excelente |
| Ocorrencias | 6 | 558 | Excelente |
| Dossie | 12 | 1.844 | Bom |
| Mapeamento | 6 | 1.309 | Bom |
| Conceitos | 6 | 1.023 | Bom |

### 3.2 Modulos Parcialmente Refatorados

| Modulo | Arquivos | Linhas | Problema |
|--------|----------|--------|----------|
| Notas | 11 | 3.067 | Componentes >200 linhas |

### 3.3 Modulos Nao Refatorados

| Pagina | Linhas | Status |
|--------|--------|--------|
| cadastros/disciplinas | 386 | Monolitico |
| cadastros/alunos | 379 | Monolitico |
| professores | 358 | Monolitico |
| cadastros/turmas | 312 | Monolitico |
| menu | 231 | Monolitico |
| graficos | 201 | Borderline |
| senha | 201 | Borderline |

---

## 4. Estrutura de Pastas Atual

```
src/
├── app/
│   ├── layout.tsx                          # 47 linhas
│   ├── page.tsx                            # 15 linhas (redirect)
│   ├── login/page.tsx                      # 275 linhas
│   └── diario/
│       ├── menu/page.tsx                   # 231 linhas
│       │
│       ├── chamada/                        # REFATORADO
│       │   ├── page.tsx                    # 145 linhas
│       │   ├── types.ts                    # 24 linhas
│       │   ├── components/
│       │   │   ├── ChamadaFilters.tsx      # 141 linhas
│       │   │   ├── ChamadaList.tsx         # 199 linhas
│       │   │   └── ConteudoModal.tsx       # 56 linhas
│       │   └── hooks/
│       │       └── useChamadaData.ts       # 155 linhas
│       │
│       ├── notas/                          # PARCIALMENTE REFATORADO
│       │   ├── page.tsx                    # 396 linhas (!)
│       │   ├── types.ts                    # 130 linhas
│       │   ├── components/
│       │   │   ├── NotasFilters.tsx        # 105 linhas
│       │   │   ├── NotasTable.tsx          # 485 linhas (!)
│       │   │   ├── TemplateModal.tsx       # 188 linhas
│       │   │   ├── ComposicaoModal.tsx     # 470 linhas (!)
│       │   │   ├── RubricasTab.tsx         # 340 linhas (!)
│       │   │   ├── RubricaModal.tsx        # 265 linhas (!)
│       │   │   └── AvaliacaoRubricasTab.tsx # 639 linhas (!)
│       │   └── hooks/
│       │       ├── useNotasData.ts         # 175 linhas
│       │       ├── useNotasTemplates.ts    # 231 linhas (!)
│       │       └── useNotasComposition.ts  # 349 linhas (!)
│       │
│       ├── conceitos/                      # REFATORADO
│       │   ├── page.tsx                    # 107 linhas
│       │   ├── types.ts                    # 74 linhas
│       │   └── components/
│       │       ├── AvaliacaoTab.tsx        # 338 linhas (!)
│       │       ├── RubricasTab.tsx         # 219 linhas (!)
│       │       ├── RubricaModal.tsx        # 220 linhas (!)
│       │       └── NivelChip.tsx           # 65 linhas
│       │
│       ├── dossie/                         # REFATORADO
│       │   ├── page.tsx                    # 80 linhas
│       │   ├── types.ts                    # 73 linhas
│       │   ├── components/
│       │   │   ├── DossieFilters.tsx       # 75 linhas
│       │   │   ├── AlunoCard.tsx           # 113 linhas
│       │   │   ├── AlunoCardList.tsx       # 117 linhas
│       │   │   ├── AlunoDetailModal.tsx    # 243 linhas (!)
│       │   │   ├── PhotoUpload.tsx         # 186 linhas
│       │   │   ├── TabPanelInfo.tsx        # 145 linhas
│       │   │   ├── TabPanelAvaliacoes.tsx  # 162 linhas
│       │   │   ├── TabPanelOcorrencias.tsx # 178 linhas
│       │   │   └── TabPanelFrequencia.tsx  # 198 linhas
│       │   ├── hooks/
│       │   │   ├── useDossieData.ts        # 266 linhas (!)
│       │   │   └── useStudentPhoto.ts      # 105 linhas
│       │   └── utils/
│       │       └── exportPdf.ts            # 303 linhas (!)
│       │
│       ├── mapeamento/                     # REFATORADO
│       │   ├── page.tsx                    # 243 linhas (!)
│       │   ├── types.ts                    # 101 linhas
│       │   ├── components/
│       │   │   ├── MapeamentoFilters.tsx   # 74 linhas
│       │   │   ├── ClassroomGrid.tsx       # 198 linhas
│       │   │   ├── SeatCell.tsx            # 130 linhas
│       │   │   └── StudentList.tsx         # 125 linhas
│       │   └── hooks/
│       │       └── useMapeamentoData.ts    # 338 linhas (!)
│       │
│       ├── ocorrencias/                    # REFATORADO
│       │   ├── page.tsx                    # 84 linhas
│       │   ├── types.ts                    # 108 linhas
│       │   └── components/
│       │       ├── OcorrenciaFilters.tsx   # 29 linhas
│       │       ├── OcorrenciaTabs.tsx      # 141 linhas
│       │       ├── OcorrenciaEditModal.tsx # 55 linhas
│       │       └── TabPanel.tsx            # 14 linhas
│       │
│       ├── graficos/page.tsx               # 201 linhas
│       ├── agenda/page.tsx                 # 172 linhas
│       ├── aniversariantes/page.tsx        # 150 linhas
│       ├── senha/page.tsx                  # 201 linhas
│       ├── professores/page.tsx            # 358 linhas (!)
│       │
│       └── cadastros/
│           ├── alunos/page.tsx             # 379 linhas (!)
│           ├── turmas/page.tsx             # 312 linhas (!)
│           └── disciplinas/page.tsx        # 386 linhas (!)
│
├── components/
│   ├── layout/
│   │   ├── MainLayout.tsx                  # 42 linhas
│   │   ├── Header/
│   │   │   ├── index.tsx                   # 129 linhas
│   │   │   ├── UserMenu.tsx                # 106 linhas
│   │   │   ├── NotificationBell.tsx        # 70 linhas
│   │   │   └── ThemeToggle.tsx             # 73 linhas
│   │   └── Sidebar/
│   │       ├── index.tsx                   # 155 linhas
│   │       ├── NavSection.tsx              # 98 linhas
│   │       └── NavItem.tsx                 # 90 linhas
│   │
│   ├── ui/
│   │   ├── DataTable.tsx                   # 266 linhas
│   │   ├── FormModal.tsx                   # 82 linhas
│   │   ├── MenuCard.tsx                    # 119 linhas
│   │   ├── FilterPanel.tsx                 # 60 linhas
│   │   ├── ConfirmDialog.tsx               # 58 linhas
│   │   ├── ToastProvider.tsx               # 31 linhas
│   │   └── LoadingScreen.tsx               # 27 linhas
│   │
│   ├── common/
│   │   └── ErrorBoundary.tsx               # 228 linhas
│   │
│   └── providers/
│       └── ThemeProvider.tsx               # 68 linhas
│
├── hooks/
│   ├── useAuth.ts                          # 269 linhas (!)
│   ├── useCRUD.ts                          # 261 linhas (!)
│   ├── useFirestoreData.ts                 # 395 linhas (!)
│   ├── useModal.ts                         # 134 linhas
│   └── usePermissions.ts                   # 51 linhas
│
├── services/
│   ├── firestore.ts                        # 475 linhas (!)
│   └── storageService.ts                   # 143 linhas
│
├── store/
│   ├── authStore.ts                        # 35 linhas
│   ├── uiStore.ts                          # 63 linhas
│   └── filterStore.ts                      # 50 linhas
│
├── constants/
│   ├── navigation.tsx                      # 158 linhas
│   ├── permissions.ts                      # 190 linhas
│   └── index.ts                            # 16 linhas
│
├── lib/
│   ├── firebase.ts                         # 39 linhas
│   ├── permissions.ts                      # 288 linhas
│   ├── theme.ts                            # 411 linhas
│   ├── tokens.ts                           # 348 linhas
│   └── validations.ts                      # 165 linhas
│
└── types/
    └── index.ts                            # 300+ linhas
```

**Legenda**: (!) = Arquivo acima de 200 linhas, precisa refatorar

---

## 5. Estatisticas Atualizadas

### 5.1 Distribuicao por Status

| Status | Arquivos | Linhas | % do Total |
|--------|----------|--------|------------|
| Conformes (<200 linhas) | 58 | 5.890 | 37% |
| Nao-conformes (>200 linhas) | 26 | 9.935 | 63% |
| **Total** | 84 | 15.825 | 100% |

### 5.2 Arquivos Criticos (>300 linhas)

| Arquivo | Linhas | Prioridade |
|---------|--------|------------|
| AvaliacaoRubricasTab.tsx | 639 | CRITICA |
| firestore.ts | 475 | CRITICA |
| ComposicaoModal.tsx | 470 | CRITICA |
| NotasTable.tsx | 485 | CRITICA |
| theme.ts | 411 | MEDIA |
| useFirestoreData.ts | 395 | ALTA |
| cadastros/disciplinas | 386 | ALTA |
| cadastros/alunos | 379 | ALTA |
| professores | 358 | ALTA |
| tokens.ts | 348 | MEDIA |
| useNotasComposition.ts | 349 | ALTA |
| useMapeamentoData.ts | 338 | ALTA |
| AvaliacaoTab (conceitos) | 338 | ALTA |
| RubricasTab (notas) | 340 | ALTA |
| cadastros/turmas | 312 | ALTA |
| exportPdf.ts | 303 | MEDIA |

---

## 6. Colecoes Firebase

```
usuarios              # Usuarios do sistema (staff)
professores           # Dados especificos de professores
alunos                # Cadastro de alunos
turmas                # Classes/turmas
disciplinas           # Materias/disciplinas
chamadas              # Registros de presenca
notas                 # Registros de notas
conceitos             # Registros de conceitos mensais
ocorrencias           # Registros de ocorrencias disciplinares
rubricas              # Rubricas de avaliacao
avaliacoesRubricas    # Avaliacoes de rubricas por aluno
mapeamentoSala        # Mapeamentos de assentos
```

---

## 7. Proximos Passos

### 7.1 Prioridade CRITICA
1. Refatorar modulo Notas (3.067 linhas)
2. Quebrar firestore.ts em servicos menores
3. Refatorar hooks globais (useFirestoreData, useAuth, useCRUD)

### 7.2 Prioridade ALTA
1. Refatorar paginas de cadastro (alunos, turmas, disciplinas)
2. Refatorar professores/page.tsx
3. Quebrar componentes grandes no modulo conceitos

### 7.3 Prioridade MEDIA
1. Refatorar lib/theme.ts e lib/tokens.ts
2. Quebrar AlunoDetailModal no dossie
3. Refatorar useMapeamentoData

---

## 8. Meta de Refatoracao

**Objetivo**: Todos os arquivos com no maximo 150-200 linhas.

| Tipo de Arquivo | Meta de Linhas |
|-----------------|----------------|
| page.tsx | 80-150 |
| types.ts | 50-100 |
| components/*.tsx | 100-200 |
| hooks/*.ts | 100-150 |
| utils/*.ts | 50-100 |
| services/*.ts | 100-150 |

---

*Documento atualizado em Janeiro 2026*
*Versao: 2.0 - Pos-refatoracao parcial*
