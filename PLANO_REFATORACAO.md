# Plano de Refatoracao - Diario Digital

## Status Atual: Refatoracao Parcial Concluida

Este documento apresenta o plano de refatoracao atualizado para o sistema **Diario Digital**.

**Meta Principal**: Todos os arquivos com maximo de **150-200 linhas**.

---

## 1. Progresso da Refatoracao

### 1.1 Modulos Concluidos

| Modulo | Status | Arquivos | Maior Arquivo |
|--------|--------|----------|---------------|
| Chamada | CONCLUIDO | 7 | 199 linhas |
| Ocorrencias | CONCLUIDO | 6 | 141 linhas |
| Header | CONCLUIDO | 4 | 129 linhas |
| Sidebar | CONCLUIDO | 3 | 155 linhas |

### 1.2 Modulos Parcialmente Concluidos

| Modulo | Status | Problema |
|--------|--------|----------|
| Dossie | 80% | useDossieData (266 linhas), exportPdf (303 linhas) |
| Mapeamento | 70% | useMapeamentoData (338 linhas), page (243 linhas) |
| Conceitos | 60% | AvaliacaoTab (338 linhas), RubricaModal (220 linhas) |
| Notas | 30% | Multiplos componentes >300 linhas |

### 1.3 Modulos Nao Iniciados

| Modulo | Linhas | Tipo |
|--------|--------|------|
| cadastros/disciplinas | 386 | Pagina monolitica |
| cadastros/alunos | 379 | Pagina monolitica |
| professores | 358 | Pagina monolitica |
| cadastros/turmas | 312 | Pagina monolitica |
| menu | 231 | Pagina monolitica |
| login | 275 | Pagina monolitica |

---

## 2. Trabalho Pendente

### 2.1 Prioridade CRITICA

#### Refatorar Modulo Notas (3.067 linhas total)

**Arquivos a quebrar:**

| Arquivo | Linhas | Acao |
|---------|--------|------|
| AvaliacaoRubricasTab.tsx | 639 | Dividir em 4 componentes |
| NotasTable.tsx | 485 | Dividir em 3 componentes |
| ComposicaoModal.tsx | 470 | Dividir em 3 componentes |
| page.tsx | 396 | Extrair logica para hooks |
| RubricasTab.tsx | 340 | Dividir em 2 componentes |
| useNotasComposition.ts | 349 | Dividir em 2 hooks |
| RubricaModal.tsx | 265 | Dividir em 2 componentes |
| useNotasTemplates.ts | 231 | Simplificar ou dividir |

**Estrutura proposta:**

```
notas/
├── page.tsx                    # 100-150 linhas
├── types.ts                    # 100 linhas
├── components/
│   ├── index.ts
│   ├── filters/
│   │   └── NotasFilters.tsx    # 100 linhas
│   ├── table/
│   │   ├── NotasTable.tsx      # 150 linhas
│   │   ├── NotasTableRow.tsx   # 100 linhas
│   │   └── NotasTableCell.tsx  # 80 linhas
│   ├── modals/
│   │   ├── TemplateModal.tsx   # 150 linhas
│   │   ├── ComposicaoModal.tsx # 150 linhas
│   │   ├── ComposicaoForm.tsx  # 100 linhas
│   │   └── ComposicaoItem.tsx  # 80 linhas
│   └── rubrica/
│       ├── RubricasTab.tsx     # 150 linhas
│       ├── RubricaCard.tsx     # 100 linhas
│       ├── RubricaModal.tsx    # 150 linhas
│       ├── AvaliacaoTab.tsx    # 150 linhas
│       ├── AvaliacaoList.tsx   # 150 linhas
│       └── AvaliacaoItem.tsx   # 100 linhas
├── hooks/
│   ├── index.ts
│   ├── useNotasData.ts         # 150 linhas
│   ├── useNotasTemplates.ts    # 100 linhas
│   ├── useNotasComposition.ts  # 150 linhas
│   └── useNotasRubricas.ts     # 100 linhas
└── utils/
    ├── gradeCalculations.ts    # 50 linhas
    └── notasHelpers.ts         # 50 linhas
```

---

#### Refatorar firestore.ts (475 linhas)

**Estrutura proposta:**

```
services/
├── index.ts                    # Exports
├── firestore/
│   ├── base.ts                 # Funcoes CRUD genericas (80 linhas)
│   ├── usuarioService.ts       # Usuario (50 linhas)
│   ├── professorService.ts     # Professor (60 linhas)
│   ├── alunoService.ts         # Aluno (60 linhas)
│   ├── turmaService.ts         # Turma (50 linhas)
│   ├── disciplinaService.ts    # Disciplina (60 linhas)
│   ├── chamadaService.ts       # Chamada (60 linhas)
│   ├── notaService.ts          # Nota (80 linhas)
│   ├── conceitoService.ts      # Conceito (50 linhas)
│   ├── ocorrenciaService.ts    # Ocorrencia (70 linhas)
│   ├── rubricaService.ts       # Rubrica (60 linhas)
│   └── mapeamentoService.ts    # Mapeamento (50 linhas)
└── storageService.ts           # Storage (143 linhas)
```

---

#### Refatorar Hooks Globais (920 linhas total)

| Hook | Linhas | Acao |
|------|--------|------|
| useFirestoreData.ts | 395 | Dividir por entidade |
| useAuth.ts | 269 | Extrair logica de login |
| useCRUD.ts | 261 | Simplificar ou dividir |

**Estrutura proposta:**

```
hooks/
├── index.ts
├── auth/
│   ├── useAuth.ts              # 100 linhas
│   ├── useLogin.ts             # 80 linhas
│   └── useGoogleAuth.ts        # 60 linhas
├── data/
│   ├── useTurmas.ts            # 60 linhas
│   ├── useDisciplinas.ts       # 60 linhas
│   ├── useAlunos.ts            # 80 linhas
│   ├── useChamada.ts           # 80 linhas
│   └── useNotas.ts             # 80 linhas
├── crud/
│   ├── useCRUD.ts              # 100 linhas
│   └── useCRUDHelpers.ts       # 60 linhas
├── useModal.ts                 # 134 linhas
└── usePermissions.ts           # 51 linhas
```

---

### 2.2 Prioridade ALTA

#### Refatorar Paginas de Cadastro

As 4 paginas de cadastro seguem padrao identico. Criar componentes reutilizaveis:

```
cadastros/
├── shared/
│   ├── CRUDPage.tsx            # Pagina generica (150 linhas)
│   ├── CRUDTable.tsx           # Tabela (100 linhas)
│   ├── CRUDModal.tsx           # Modal (100 linhas)
│   └── CRUDFilters.tsx         # Filtros (80 linhas)
├── alunos/
│   ├── page.tsx                # 80 linhas (usa CRUDPage)
│   ├── types.ts                # 30 linhas
│   └── config.ts               # 50 linhas (colunas, campos)
├── turmas/
│   ├── page.tsx                # 80 linhas
│   ├── types.ts                # 30 linhas
│   └── config.ts               # 50 linhas
├── disciplinas/
│   ├── page.tsx                # 80 linhas
│   ├── types.ts                # 30 linhas
│   └── config.ts               # 60 linhas
└── professores/                # Mover para cadastros/
    ├── page.tsx                # 80 linhas
    ├── types.ts                # 30 linhas
    └── config.ts               # 60 linhas
```

**Economia estimada:** ~800 linhas (50% de reducao)

---

#### Refatorar Conceitos (1.023 linhas)

| Arquivo | Linhas | Acao |
|---------|--------|------|
| AvaliacaoTab.tsx | 338 | Dividir em 2 componentes |
| RubricaModal.tsx | 220 | Dividir em 2 componentes |
| RubricasTab.tsx | 219 | Dividir em 2 componentes |

---

### 2.3 Prioridade MEDIA

#### Refatorar Modulos Parciais

| Modulo | Arquivo | Linhas | Acao |
|--------|---------|--------|------|
| Dossie | useDossieData.ts | 266 | Dividir em 2 hooks |
| Dossie | exportPdf.ts | 303 | Dividir em funcoes |
| Dossie | AlunoDetailModal.tsx | 243 | Dividir em 2 componentes |
| Mapeamento | useMapeamentoData.ts | 338 | Dividir em 2 hooks |
| Mapeamento | page.tsx | 243 | Extrair componentes |

#### Refatorar Lib (1.007 linhas)

| Arquivo | Linhas | Acao |
|---------|--------|------|
| theme.ts | 411 | Dividir em palette, components |
| tokens.ts | 348 | Dividir em colors, typography |
| permissions.ts | 288 | Dividir em roles, checks |

---

## 3. Padrao de Refatoracao

### 3.1 Limites de Linhas por Tipo

| Tipo | Minimo | Ideal | Maximo |
|------|--------|-------|--------|
| page.tsx | 50 | 100 | 150 |
| types.ts | 30 | 60 | 100 |
| Component.tsx | 50 | 120 | 200 |
| useHook.ts | 50 | 100 | 150 |
| utils.ts | 20 | 50 | 100 |
| service.ts | 40 | 80 | 150 |

### 3.2 Regras de Quebra

1. **Componente > 200 linhas**: Extrair sub-componentes
2. **Hook > 150 linhas**: Dividir por responsabilidade
3. **Mais de 5 useState**: Criar hook customizado
4. **Mais de 2 modais**: Extrair para arquivos separados
5. **Logica de negocio**: Mover para utils/

### 3.3 Nomenclatura

```
Componentes: PascalCase.tsx
Hooks: useNomeDoHook.ts
Utils: camelCase.ts
Types: types.ts (por modulo) ou NomeTypes.ts
Services: nomeService.ts
```

---

## 4. Checklist de Refatoracao

### Ao quebrar um componente:

- [ ] Arquivo original <= 200 linhas
- [ ] Novos arquivos <= 200 linhas
- [ ] Tipos extraidos para types.ts
- [ ] Logica de negocio em utils/ ou hooks/
- [ ] index.ts atualizado com exports
- [ ] Imports atualizados em page.tsx
- [ ] Testes passando (se existirem)
- [ ] Sem erros TypeScript

### Ao criar novo modulo:

- [ ] Estrutura de pastas criada
- [ ] types.ts definido
- [ ] components/index.ts criado
- [ ] hooks/index.ts criado (se necessario)
- [ ] page.tsx <= 150 linhas
- [ ] Todos componentes <= 200 linhas
- [ ] Link adicionado em navigation.tsx

---

## 5. Estimativa de Trabalho

### Fase 1: Critica (2-3 dias)
- Refatorar modulo Notas
- Quebrar firestore.ts
- Refatorar hooks globais

### Fase 2: Alta (1-2 dias)
- Criar componentes CRUD reutilizaveis
- Aplicar em paginas de cadastro
- Refatorar conceitos

### Fase 3: Media (1 dia)
- Finalizar dossie e mapeamento
- Refatorar lib/

### Fase 4: Finalizacao (0.5 dia)
- Refatorar paginas restantes (menu, login, senha)
- Documentacao final

**Total estimado:** 5-7 dias de trabalho

---

## 6. Metricas de Sucesso

| Metrica | Antes | Meta |
|---------|-------|------|
| Arquivos > 300 linhas | 16 | 0 |
| Arquivos > 200 linhas | 26 | 5 (apenas lib/) |
| Media de linhas/arquivo | 188 | 120 |
| Modulos refatorados | 5 | 15 |

---

*Documento atualizado em Janeiro 2026*
*Versao: 2.0 - Refatoracao em andamento*
