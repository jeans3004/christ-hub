# Plano de Refatoracao Completo - Diario Digital

## Definicao de Escopo

Este documento apresenta um plano de refatoracao completo para o sistema **Diario Digital**, um PWA de gestao escolar desenvolvido com Next.js 16, React 19, Material-UI v7, Firebase e Zustand.

**Objetivo Principal**: Reduzir complexidade de arquivos, modularizar codigo e estabelecer arquitetura escalavel.

**Stack Atual Confirmada**:
| Tecnologia | Versao | Uso |
|------------|--------|-----|
| Next.js | 16.1.1 | App Router, SSR |
| React | 19.2.3 | Componentizacao |
| TypeScript | 5.9.3 | Tipagem estatica |
| Material-UI | 7.3.7 | Componentes UI |
| Firebase | 12.7.0 | Firestore + Auth |
| Zustand | 5.0.9 | Estado global |
| React Hook Form | 7.70.0 | Formularios |
| Zod | 3.23.8 | Validacao |
| Recharts | 3.6.0 | Graficos |

---

# SECAO 1: Diagnostico Detalhado

## 1.1 Tabela de Arquivos Criticos

| Arquivo | Linhas | Responsabilidades Acumuladas | Criticidade |
|---------|--------|------------------------------|-------------|
| `/app/diario/notas/page.tsx` | 1.382 | Filtros, tabela de notas, 2 modais de template, modal de composicao, calculo de notas, validacao, persistencia Firebase, estatisticas | **CRITICO** |
| `/app/diario/chamada/page.tsx` | 503 | Filtros, lista de alunos, toggle presenca, modal de conteudo, estatisticas, persistencia | **ALTO** |
| `/app/diario/cadastros/disciplinas/page.tsx` | 427 | CRUD completo, tabela, modal de edicao, selecao multipla de turmas, validacao | **ALTO** |
| `/app/diario/cadastros/alunos/page.tsx` | 409 | CRUD completo, tabela, modal de edicao, filtros, validacao | **ALTO** |
| `/lib/theme.ts` | 411 | Configuracao tema, tokens, overrides de 15+ componentes MUI | **MEDIO** |
| `/app/diario/ocorrencias/page.tsx` | 361 | Sistema de tabs, workflow de aprovacao, tabela, modal de edicao | **ALTO** |
| `/app/diario/cadastros/turmas/page.tsx` | 360 | CRUD completo, tabela, modal, validacao | **ALTO** |
| `/components/layout/Sidebar.tsx` | 360 | Navegacao, filtragem por permissao, renderizacao recursiva, responsividade | **ALTO** |
| `/app/diario/professores/page.tsx` | 358 | CRUD completo, tabela, modal, selecao de disciplinas/turmas | **ALTO** |
| `/lib/tokens.ts` | 348 | Design tokens, cores, tipografia, elevacao, motion | **MEDIO** |
| `/lib/permissions.ts` | 288 | 60+ permissoes, mapeamento role->permissions, funcoes de verificacao | **MEDIO** |
| `/app/login/page.tsx` | 275 | Formulario login, OAuth Google, validacao, animacoes | **MEDIO** |
| `/services/firestore.ts` | 270 | 9 servicos de entidade, CRUD generico | **MEDIO** |
| `/components/ui/DataTable.tsx` | 266 | Tabela generica, ordenacao, paginacao, acoes | **MEDIO** |
| `/hooks/useFirestoreData.ts` | 262 | 5 hooks de dados, queries, mutations | **MEDIO** |
| `/components/layout/Header.tsx` | 259 | Menu usuario, notificacoes, tema, navegacao | **MEDIO** |

**Resumo**: 16 arquivos excedem 250 linhas, totalizando ~6.900 linhas (76% do codigo).

---

## 1.2 Code Smells Identificados

### 1.2.1 God Components (Componentes Deus)
**Arquivo**: `/app/diario/notas/page.tsx`
**Problema**: Um unico componente gerencia toda a logica de notas
**Sintomas**:
- 1.382 linhas em um unico arquivo
- 15+ estados com `useState`
- 5+ modais controlados inline
- Logica de negocio misturada com UI
- Multiplas responsabilidades (filtros, tabela, calculos, persistencia)

```typescript
// Exemplo do problema - estados demais em um componente
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [savingComposicao, setSavingComposicao] = useState(false);
const [templateModalOpen, setTemplateModalOpen] = useState(false);
const [composicaoModalOpen, setComposicaoModalOpen] = useState(false);
const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
const [selectedAv, setSelectedAv] = useState<'av1' | 'av2' | null>(null);
const [templateAv1, setTemplateAv1] = useState<NotaComposicao[]>([...]);
const [templateAv2, setTemplateAv2] = useState<NotaComposicao[]>([...]);
const [subNotas, setSubNotas] = useState<NotaComposicao[]>([]);
const [notas, setNotas] = useState<Record<string, NotaRow>>({});
// ... mais 5-10 estados
```

### 1.2.2 Prop Drilling Potencial
**Arquivos**: Paginas de cadastro (alunos, turmas, disciplinas, professores)
**Problema**: Props passadas atraves de multiplos niveis
**Sintomas**:
- Modal recebe props da pagina que vem de hooks
- Callbacks de CRUD passados para componentes filhos
- Estado de loading compartilhado entre componentes

### 1.2.3 Duplicacao de Padrao CRUD
**Arquivos**: 4 paginas de cadastro com estrutura identica
**Problema**: Codigo repetido que poderia ser abstraido
**Comparacao**:

| Pagina | Linhas | Estrutura |
|--------|--------|-----------|
| alunos/page.tsx | 409 | filtros + tabela + modal + CRUD |
| turmas/page.tsx | 360 | filtros + tabela + modal + CRUD |
| disciplinas/page.tsx | 427 | filtros + tabela + modal + CRUD |
| professores/page.tsx | 358 | filtros + tabela + modal + CRUD |
| **Total duplicado** | **1.554** | ~60% codigo identico em estrutura |

### 1.2.4 Logica de Negocio na UI
**Arquivo**: `/app/diario/notas/page.tsx`
**Problema**: Calculos de nota embutidos no componente
**Exemplo**:
```typescript
// Logica de negocio que deveria estar em utils/services
const calcularNotaComposicao = (): number | null => {
  if (subNotas.length === 0) return null;
  let somaNotas = 0;
  for (const sub of subNotas) {
    if (sub.valor === null) return null;
    somaNotas += sub.valor;
  }
  return Math.round(somaNotas * 10) / 10;
};
```

### 1.2.5 Dados de Configuracao Hardcoded
**Arquivo**: `/components/layout/Sidebar.tsx`
**Problema**: Navegacao definida inline no componente
**Impacto**: Dificil adicionar/remover itens de menu, dificil testar

### 1.2.6 Falta de Error Boundaries
**Arquivos**: Todos os componentes de pagina
**Problema**: Erros em um componente podem quebrar a aplicacao inteira
**Sintoma**: Nenhum `ErrorBoundary` implementado

### 1.2.7 Tipagem Incompleta
**Arquivo**: `/services/firestore.ts`
**Problema**: Tipos genericos que poderiam ser mais especificos
**Exemplo**:
```typescript
// Atual - generico demais
export const createDocument = async <T>(collection: string, data: T) => { ... }

// Deveria ter constraints
export const createDocument = async <T extends BaseDocument>(
  collection: CollectionName,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
) => { ... }
```

---

## 1.3 Debitos Tecnicos

### 1.3.1 Arquitetura
| Debito | Impacto | Esforco para Resolver |
|--------|---------|----------------------|
| Ausencia de camada Repository | Acoplamento direto com Firestore | Medio |
| Sem Error Boundaries | App pode quebrar completamente | Baixo |
| Sem code splitting manual | Bundle grande na carga inicial | Medio |
| Falta de lazy loading em rotas | Performance degradada | Baixo |

### 1.3.2 Codigo
| Debito | Impacto | Esforco para Resolver |
|--------|---------|----------------------|
| Componentes > 300 linhas | Dificil manutencao | Alto |
| Hooks muito especificos | Baixa reutilizacao | Medio |
| Validacoes inline | Duplicacao, inconsistencia | Baixo |
| Sem constantes centralizadas | Magic strings espalhados | Baixo |

### 1.3.3 Testes
| Debito | Impacto | Esforco para Resolver |
|--------|---------|----------------------|
| 0% cobertura de testes | Regressoes nao detectadas | Alto |
| Sem estrutura de testes | Dificil adicionar testes depois | Medio |
| Componentes nao testaveis | Dependencias acopladas | Medio |

### 1.3.4 Documentacao
| Debito | Impacto | Esforco para Resolver |
|--------|---------|----------------------|
| Sem JSDoc em funcoes publicas | Onboarding lento | Baixo |
| Sem README por modulo | Difícil entender contexto | Baixo |
| Sem guia de contribuicao | Inconsistencia em PRs | Baixo |

---

# SECAO 2: Plano de Acao Priorizado

## 2.1 Matriz de Priorizacao

| ID | Tarefa | Impacto | Esforco | Prioridade | Dependencias |
|----|--------|---------|---------|------------|--------------|
| R01 | Extrair hooks de notas/page.tsx | Alto | Alto | P1 | - |
| R02 | Componentizar modais de notas | Alto | Medio | P1 | R01 |
| R03 | Criar hook useModal generico | Alto | Baixo | P1 | - |
| R04 | Criar hook useCRUD generico | Alto | Medio | P1 | - |
| R05 | Extrair navegacao do Sidebar | Medio | Baixo | P1 | - |
| R06 | Criar componente CRUDPage generico | Alto | Alto | P2 | R04 |
| R07 | Refatorar paginas de cadastro com CRUDPage | Alto | Medio | P2 | R06 |
| R08 | Extrair logica de permissoes para constantes | Medio | Baixo | P2 | - |
| R09 | Implementar Error Boundaries | Medio | Baixo | P2 | - |
| R10 | Criar Repository layer para Firebase | Medio | Medio | P2 | - |
| R11 | Extrair calculos de notas para utils | Medio | Baixo | P2 | R01 |
| R12 | Criar hook useFirestoreQuery melhorado | Medio | Medio | P3 | R10 |
| R13 | Implementar lazy loading de rotas | Baixo | Baixo | P3 | - |
| R14 | Reorganizar estrutura de pastas | Medio | Alto | P3 | R01-R12 |
| R15 | Adicionar JSDoc em funcoes publicas | Baixo | Baixo | P3 | - |
| R16 | Criar estrutura para testes | Baixo | Medio | P4 | R14 |
| R17 | Componentizar Header (UserMenu, ThemeToggle) | Baixo | Baixo | P4 | - |
| R18 | Memoizar componentes pesados | Baixo | Medio | P4 | R01-R07 |

**Legenda de Prioridade**:
- **P1**: Critico - Fazer imediatamente
- **P2**: Importante - Fazer na sequencia
- **P3**: Desejavel - Fazer quando possivel
- **P4**: Nice-to-have - Fazer se sobrar tempo

---

## 2.2 Roadmap em Sprints

### Sprint 1 - Quick Wins e Fundacao (Semana 1)

**Objetivo**: Criar hooks e componentes base para reutilizacao

| ID | Tarefa | Arquivo(s) | Estimativa |
|----|--------|------------|------------|
| R03 | Criar hook `useModal` | `/hooks/useModal.ts` | 2h |
| R05 | Extrair navegacao do Sidebar | `/constants/navigation.ts` | 2h |
| R09 | Implementar Error Boundaries | `/components/ErrorBoundary.tsx` | 2h |
| R11 | Extrair calculos de notas | `/utils/gradeCalculations.ts` | 3h |

**Entregavel**: 4 novos arquivos utilitarios funcionais

**Criterio de Aceite**:
- [ ] Hook useModal funciona com qualquer modal do sistema
- [ ] Navegacao carregada de arquivo externo sem quebrar Sidebar
- [ ] ErrorBoundary captura erros e exibe fallback
- [ ] Calculos de notas testados manualmente com valores conhecidos

**Codigo - useModal.ts**:
```typescript
// /src/hooks/useModal.ts
import { useState, useCallback } from 'react';

interface UseModalReturn<T = unknown> {
  isOpen: boolean;
  data: T | null;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
}

export function useModal<T = unknown>(initialState = false): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay para animacao de fechamento
    setTimeout(() => setData(null), 200);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return { isOpen, data, open, close, toggle };
}
```

---

### Sprint 2 - Hooks e Utilitarios (Semana 2)

**Objetivo**: Criar abstraçoes para operacoes comuns

| ID | Tarefa | Arquivo(s) | Estimativa |
|----|--------|------------|------------|
| R04 | Criar hook `useCRUD` | `/hooks/useCRUD.ts` | 4h |
| R08 | Extrair permissoes para constantes | `/constants/permissions.ts` | 2h |
| R10 | Criar Repository layer | `/repositories/*.ts` | 6h |

**Entregavel**: Camada de repositorios + hook CRUD generico

**Criterio de Aceite**:
- [ ] useCRUD funciona com qualquer entidade do sistema
- [ ] Repositories abstraem Firestore completamente
- [ ] Permissoes carregadas de arquivo de configuracao
- [ ] Nenhuma quebra de funcionalidade existente

**Codigo - useCRUD.ts**:
```typescript
// /src/hooks/useCRUD.ts
import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';

interface CRUDService<T> {
  getAll: () => Promise<T[]>;
  create: (data: Omit<T, 'id'>) => Promise<string>;
  update: (id: string, data: Partial<T>) => Promise<void>;
  delete: (id: string) => Promise<void>;
}

interface UseCRUDOptions<T> {
  service: CRUDService<T>;
  entityName: string;
  onSuccess?: () => void;
}

interface UseCRUDReturn<T> {
  items: T[];
  loading: boolean;
  saving: boolean;
  error: Error | null;
  loadItems: () => Promise<void>;
  createItem: (data: Omit<T, 'id'>) => Promise<string | null>;
  updateItem: (id: string, data: Partial<T>) => Promise<boolean>;
  deleteItem: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useCRUD<T extends { id: string }>({
  service,
  entityName,
  onSuccess,
}: UseCRUDOptions<T>): UseCRUDReturn<T> {
  const { addToast } = useUIStore();
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await service.getAll();
      setItems(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(error);
      addToast(`Erro ao carregar ${entityName}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [service, entityName, addToast]);

  const createItem = useCallback(async (data: Omit<T, 'id'>): Promise<string | null> => {
    setSaving(true);
    try {
      const id = await service.create(data);
      addToast(`${entityName} criado com sucesso!`, 'success');
      onSuccess?.();
      await loadItems();
      return id;
    } catch (err) {
      addToast(`Erro ao criar ${entityName}`, 'error');
      return null;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, addToast, onSuccess, loadItems]);

  const updateItem = useCallback(async (id: string, data: Partial<T>): Promise<boolean> => {
    setSaving(true);
    try {
      await service.update(id, data);
      addToast(`${entityName} atualizado com sucesso!`, 'success');
      onSuccess?.();
      await loadItems();
      return true;
    } catch (err) {
      addToast(`Erro ao atualizar ${entityName}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, addToast, onSuccess, loadItems]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      await service.delete(id);
      addToast(`${entityName} removido com sucesso!`, 'success');
      onSuccess?.();
      await loadItems();
      return true;
    } catch (err) {
      addToast(`Erro ao remover ${entityName}`, 'error');
      return false;
    } finally {
      setSaving(false);
    }
  }, [service, entityName, addToast, onSuccess, loadItems]);

  return {
    items,
    loading,
    saving,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    refresh: loadItems,
  };
}
```

**Codigo - Repository Base**:
```typescript
// /src/repositories/BaseRepository.ts
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  QueryConstraint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface BaseDocument {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class BaseRepository<T extends BaseDocument> {
  protected abstract collectionName: string;

  protected get collectionRef() {
    return collection(db, this.collectionName);
  }

  protected docRef(id: string) {
    return doc(db, this.collectionName, id);
  }

  protected convertTimestamp(timestamp: unknown): Date {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
    return new Date();
  }

  protected abstract fromFirestore(data: Record<string, unknown>, id: string): T;

  async getById(id: string): Promise<T | null> {
    const docSnap = await getDoc(this.docRef(id));
    if (!docSnap.exists()) return null;
    return this.fromFirestore(docSnap.data(), docSnap.id);
  }

  async getAll(...constraints: QueryConstraint[]): Promise<T[]> {
    const q = query(this.collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => this.fromFirestore(doc.data(), doc.id));
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(this.collectionRef, {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  }

  async update(id: string, data: Partial<Omit<T, 'id' | 'createdAt'>>): Promise<void> {
    await updateDoc(this.docRef(id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
  }

  async delete(id: string): Promise<void> {
    await deleteDoc(this.docRef(id));
  }

  async softDelete(id: string): Promise<void> {
    await this.update(id, { ativo: false } as Partial<Omit<T, 'id' | 'createdAt'>>);
  }
}
```

---

### Sprint 3 - Componentizacao Profunda (Semana 3)

**Objetivo**: Quebrar o arquivo notas/page.tsx em componentes menores

| ID | Tarefa | Arquivo(s) | Estimativa |
|----|--------|------------|------------|
| R01 | Extrair hooks de notas | `/app/diario/notas/hooks/*.ts` | 6h |
| R02 | Componentizar modais de notas | `/app/diario/notas/components/*.tsx` | 8h |

**Entregavel**: notas/page.tsx reduzido de 1.382 para ~200 linhas

**Criterio de Aceite**:
- [ ] Todas as funcionalidades de notas funcionando identicamente
- [ ] Nenhum componente com mais de 300 linhas
- [ ] Composicao de notas salvando corretamente no Firebase
- [ ] Templates de AV1/AV2 persistindo entre sessoes

**Estrutura Proposta para Notas**:
```
/app/diario/notas/
├── page.tsx                        # ~200 linhas - Orquestrador
├── components/
│   ├── NotasFilters.tsx            # ~80 linhas - Filtros
│   ├── NotasTable.tsx              # ~200 linhas - Tabela de notas
│   ├── NotaCell.tsx                # ~100 linhas - Celula editavel
│   ├── NotasStats.tsx              # ~60 linhas - Cards estatisticos
│   ├── TemplateModal.tsx           # ~200 linhas - Modal de template
│   └── ComposicaoModal.tsx         # ~250 linhas - Modal de composicao
├── hooks/
│   ├── useNotasData.ts             # ~150 linhas - Carregamento de dados
│   ├── useNotasComposition.ts      # ~120 linhas - Logica de composicao
│   └── useNotasTemplates.ts        # ~80 linhas - Gestao de templates
└── utils/
    └── gradeCalculations.ts        # ~50 linhas - Calculos
```

---

### Sprint 4 - Padronizacao CRUD (Semana 4)

**Objetivo**: Unificar paginas de cadastro com componente generico

| ID | Tarefa | Arquivo(s) | Estimativa |
|----|--------|------------|------------|
| R06 | Criar CRUDPage generico | `/components/crud/CRUDPage.tsx` | 6h |
| R07 | Refatorar alunos com CRUDPage | `/app/diario/cadastros/alunos/` | 3h |
| R07 | Refatorar turmas com CRUDPage | `/app/diario/cadastros/turmas/` | 3h |
| R07 | Refatorar disciplinas com CRUDPage | `/app/diario/cadastros/disciplinas/` | 3h |
| R07 | Refatorar professores com CRUDPage | `/app/diario/professores/` | 3h |

**Entregavel**: 4 paginas de cadastro usando mesmo componente base

**Criterio de Aceite**:
- [ ] Todas as operacoes CRUD funcionando em cada pagina
- [ ] UI consistente entre todas as paginas de cadastro
- [ ] Validacoes preservadas
- [ ] Reducao de ~800 linhas no total

**Codigo - CRUDPage.tsx**:
```typescript
// /src/components/crud/CRUDPage.tsx
'use client';

import { useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import DataTable, { Column, Action } from '@/components/ui/DataTable';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useModal } from '@/hooks/useModal';
import { useCRUD } from '@/hooks/useCRUD';
import { usePermissions } from '@/hooks/usePermissions';
import { UserRole } from '@/types';

interface CRUDPageProps<T extends { id: string; ativo?: boolean }> {
  // Configuracao
  title: string;
  entityName: string;
  entityNamePlural: string;
  minRole?: UserRole;

  // Dados
  service: {
    getAll: () => Promise<T[]>;
    create: (data: Omit<T, 'id'>) => Promise<string>;
    update: (id: string, data: Partial<T>) => Promise<void>;
    delete: (id: string) => Promise<void>;
  };

  // Tabela
  columns: Column<T>[];
  rowKey?: keyof T;

  // UI
  emptyIcon: React.ReactNode;
  emptyMessage: string;

  // Modal de edicao
  FormModal: React.ComponentType<{
    open: boolean;
    onClose: () => void;
    item: T | null;
    onSave: (data: Omit<T, 'id'>) => Promise<boolean>;
    saving: boolean;
  }>;

  // Acoes customizadas (opcional)
  additionalActions?: Action<T>[];

  // Filtros (opcional)
  FiltersComponent?: React.ComponentType<{
    onFilter: (items: T[]) => T[];
  }>;
}

export function CRUDPage<T extends { id: string; ativo?: boolean; nome?: string }>({
  title,
  entityName,
  entityNamePlural,
  minRole = 'coordenador',
  service,
  columns,
  rowKey = 'id' as keyof T,
  emptyIcon,
  emptyMessage,
  FormModal,
  additionalActions = [],
  FiltersComponent,
}: CRUDPageProps<T>) {
  const { hasMinRole } = usePermissions();
  const canAccess = hasMinRole(minRole);

  const {
    items,
    loading,
    saving,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
  } = useCRUD({ service, entityName });

  const editModal = useModal<T>();
  const deleteModal = useModal<T>();

  useEffect(() => {
    if (canAccess) {
      loadItems();
    }
  }, [canAccess, loadItems]);

  const handleSave = async (data: Omit<T, 'id'>): Promise<boolean> => {
    if (editModal.data?.id) {
      return await updateItem(editModal.data.id, data as Partial<T>);
    }
    const id = await createItem(data);
    return id !== null;
  };

  const handleDelete = async () => {
    if (!deleteModal.data) return;
    const success = await deleteItem(deleteModal.data.id);
    if (success) {
      deleteModal.close();
    }
  };

  const defaultActions: Action<T>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      onClick: (item) => editModal.open(item),
    },
    {
      label: 'Excluir',
      icon: 'delete',
      color: 'error',
      onClick: (item) => deleteModal.open(item),
    },
    ...additionalActions,
  ];

  if (!canAccess) {
    return (
      <MainLayout title={title} showSidebar>
        <Alert severity="error">
          Voce nao tem permissao para acessar esta pagina.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={title} showSidebar>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            {entityNamePlural}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => editModal.open()}
            sx={{ textTransform: 'none' }}
          >
            Novo {entityName}
          </Button>
        </Box>

        {/* Filtros (opcional) */}
        {FiltersComponent && <FiltersComponent onFilter={(filtered) => filtered} />}

        {/* Tabela */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : items.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <Box sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}>
              {emptyIcon}
            </Box>
            <Typography variant="h6" color="text.secondary">
              {emptyMessage}
            </Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => editModal.open()}
              sx={{ mt: 2, textTransform: 'none' }}
            >
              Cadastrar primeiro {entityName.toLowerCase()}
            </Button>
          </Paper>
        ) : (
          <DataTable
            columns={columns}
            data={items}
            actions={defaultActions}
            rowKey={rowKey}
            loading={loading}
          />
        )}
      </Box>

      {/* Modal de Edicao */}
      <FormModal
        open={editModal.isOpen}
        onClose={editModal.close}
        item={editModal.data}
        onSave={handleSave}
        saving={saving}
      />

      {/* Dialog de Confirmacao de Exclusao */}
      <ConfirmDialog
        open={deleteModal.isOpen}
        title={`Confirmar Exclusao`}
        message={`Tem certeza que deseja excluir "${deleteModal.data?.nome || 'este item'}"?`}
        onConfirm={handleDelete}
        onCancel={deleteModal.close}
        confirmLabel="Excluir"
        confirmColor="error"
      />
    </MainLayout>
  );
}
```

---

# SECAO 3: Nova Estrutura de Diretorios

## 3.1 Arvore Proposta

```
/sgeNV/
├── package.json
├── tsconfig.json
├── next.config.js
├── .env.example
├── CHECKLIST.md
├── PROJETO_ANALISE.md
├── PLANO_REFATORACAO.md
│
├── public/
│   ├── manifest.json
│   ├── sw.js
│   ├── offline.html
│   └── icons/
│
└── src/
    │
    ├── app/                              # Next.js App Router
    │   ├── layout.tsx                    # Layout raiz
    │   ├── page.tsx                      # Redirect inicial
    │   ├── globals.css
    │   ├── error.tsx                     # Error boundary global
    │   ├── loading.tsx                   # Loading global
    │   │
    │   ├── login/
    │   │   └── page.tsx
    │   │
    │   └── diario/
    │       ├── layout.tsx                # Layout do diario (MainLayout)
    │       │
    │       ├── menu/
    │       │   └── page.tsx
    │       │
    │       ├── chamada/
    │       │   ├── page.tsx              # ~150 linhas (orquestrador)
    │       │   ├── components/
    │       │   │   ├── ChamadaFilters.tsx
    │       │   │   ├── AlunosList.tsx
    │       │   │   ├── AlunoItem.tsx
    │       │   │   └── ConteudoModal.tsx
    │       │   └── hooks/
    │       │       └── useChamada.ts
    │       │
    │       ├── notas/
    │       │   ├── page.tsx              # ~200 linhas (orquestrador)
    │       │   ├── components/
    │       │   │   ├── NotasFilters.tsx
    │       │   │   ├── NotasTable.tsx
    │       │   │   ├── NotaCell.tsx
    │       │   │   ├── NotasStats.tsx
    │       │   │   ├── TemplateModal.tsx
    │       │   │   └── ComposicaoModal.tsx
    │       │   ├── hooks/
    │       │   │   ├── useNotasData.ts
    │       │   │   ├── useNotasComposition.ts
    │       │   │   └── useNotasTemplates.ts
    │       │   └── utils/
    │       │       └── gradeCalculations.ts
    │       │
    │       ├── conceitos/
    │       │   └── page.tsx
    │       │
    │       ├── graficos/
    │       │   ├── page.tsx
    │       │   └── components/
    │       │       ├── FrequenciaChart.tsx
    │       │       └── NotasChart.tsx
    │       │
    │       ├── ocorrencias/
    │       │   ├── page.tsx
    │       │   ├── components/
    │       │   │   ├── OcorrenciaTabs.tsx
    │       │   │   ├── OcorrenciaTable.tsx
    │       │   │   └── OcorrenciaModal.tsx
    │       │   └── hooks/
    │       │       └── useOcorrencias.ts
    │       │
    │       ├── professores/
    │       │   ├── page.tsx              # Usa CRUDPage
    │       │   └── components/
    │       │       └── ProfessorForm.tsx
    │       │
    │       ├── aniversariantes/
    │       │   └── page.tsx
    │       │
    │       ├── agenda/
    │       │   └── page.tsx
    │       │
    │       ├── senha/
    │       │   └── page.tsx
    │       │
    │       ├── usuarios/
    │       │   └── page.tsx
    │       │
    │       ├── configuracoes/
    │       │   └── page.tsx
    │       │
    │       └── cadastros/
    │           ├── alunos/
    │           │   ├── page.tsx          # Usa CRUDPage
    │           │   └── components/
    │           │       └── AlunoForm.tsx
    │           │
    │           ├── turmas/
    │           │   ├── page.tsx          # Usa CRUDPage
    │           │   └── components/
    │           │       └── TurmaForm.tsx
    │           │
    │           └── disciplinas/
    │               ├── page.tsx          # Usa CRUDPage
    │               └── components/
    │                   └── DisciplinaForm.tsx
    │
    ├── components/
    │   ├── layout/
    │   │   ├── MainLayout.tsx
    │   │   ├── Header/
    │   │   │   ├── index.tsx
    │   │   │   ├── UserMenu.tsx
    │   │   │   ├── ThemeToggle.tsx
    │   │   │   └── NotificationBell.tsx
    │   │   └── Sidebar/
    │   │       ├── index.tsx
    │   │       ├── NavItem.tsx
    │   │       └── NavSection.tsx
    │   │
    │   ├── ui/
    │   │   ├── DataTable/
    │   │   │   ├── index.tsx
    │   │   │   ├── TableHeader.tsx
    │   │   │   ├── TableRow.tsx
    │   │   │   └── TablePagination.tsx
    │   │   ├── FormModal.tsx
    │   │   ├── ConfirmDialog.tsx
    │   │   ├── FilterPanel.tsx
    │   │   ├── MenuCard.tsx
    │   │   ├── ToastProvider.tsx
    │   │   ├── LoadingScreen.tsx
    │   │   └── ErrorFallback.tsx
    │   │
    │   ├── crud/
    │   │   ├── CRUDPage.tsx
    │   │   └── CRUDFilters.tsx
    │   │
    │   └── common/
    │       ├── ErrorBoundary.tsx
    │       └── Suspense.tsx
    │
    ├── hooks/
    │   ├── useAuth.ts
    │   ├── usePermissions.ts
    │   ├── useModal.ts                   # NOVO
    │   ├── useCRUD.ts                    # NOVO
    │   ├── useFirestoreQuery.ts          # NOVO (melhoria do useFirestoreData)
    │   ├── usePagination.ts              # NOVO
    │   └── useFilters.ts                 # NOVO
    │
    ├── repositories/                      # NOVO - Camada de dados
    │   ├── BaseRepository.ts
    │   ├── UsuarioRepository.ts
    │   ├── ProfessorRepository.ts
    │   ├── AlunoRepository.ts
    │   ├── TurmaRepository.ts
    │   ├── DisciplinaRepository.ts
    │   ├── ChamadaRepository.ts
    │   ├── NotaRepository.ts
    │   ├── ConceitoRepository.ts
    │   └── OcorrenciaRepository.ts
    │
    ├── services/                          # Logica de negocio
    │   ├── firestore.ts                   # Manter para compatibilidade
    │   ├── gradeService.ts                # NOVO - Calculos de notas
    │   └── attendanceService.ts           # NOVO - Logica de frequencia
    │
    ├── lib/
    │   ├── firebase.ts
    │   ├── theme.ts
    │   ├── validations.ts
    │   └── permissions/                   # REORGANIZADO
    │       ├── index.ts
    │       ├── rolePermissions.ts
    │       └── permissionChecks.ts
    │
    ├── constants/                         # NOVO
    │   ├── navigation.ts                  # Config de navegacao
    │   ├── routes.ts                      # Constantes de rotas
    │   └── entities.ts                    # Nomes de entidades
    │
    ├── store/
    │   ├── authStore.ts
    │   ├── uiStore.ts
    │   └── filterStore.ts
    │
    ├── types/
    │   ├── index.ts
    │   ├── entities.ts                    # NOVO - Tipos de entidades separados
    │   ├── forms.ts                       # NOVO - Tipos de formularios
    │   └── api.ts                         # NOVO - Tipos de API
    │
    └── utils/                             # NOVO
        ├── formatters.ts                  # CPF, telefone, data, moeda
        ├── validators.ts                  # Validacoes especificas
        └── calculations.ts                # Calculos (media, frequencia)
```

---

## 3.2 Justificativa da Estrutura

### Por que Feature-Based para `/app/diario/`?
- Cada modulo (notas, chamada, ocorrencias) tem seus proprios componentes e hooks
- Facilita encontrar codigo relacionado
- Permite code splitting natural por rota
- Novos desenvolvedores entendem rapidamente onde cada coisa esta

### Por que Layer-Based para `/src/` (fora de app)?
- Componentes compartilhados em `/components/`
- Hooks compartilhados em `/hooks/`
- Repositories em `/repositories/`
- Evita duplicacao de codigo entre modulos

### Por que separar Header e Sidebar em pastas?
- Ambos excedem 250 linhas
- Compostos de subcomponentes logicos
- Facilita manutencao individual de partes

### Por que criar `/constants/`?
- Remove magic strings do codigo
- Centraliza configuracoes
- Facilita mudancas globais

### Por que criar `/repositories/`?
- Abstrai detalhes do Firestore
- Facilita trocar backend no futuro
- Tipagem mais forte
- Testabilidade melhorada

---

## 3.3 Guia de Localizacao

| Tipo de Arquivo | Localizacao | Exemplo |
|-----------------|-------------|---------|
| Pagina de modulo | `/app/diario/[modulo]/page.tsx` | `/app/diario/notas/page.tsx` |
| Componente de modulo | `/app/diario/[modulo]/components/` | `/app/diario/notas/components/NotasTable.tsx` |
| Hook de modulo | `/app/diario/[modulo]/hooks/` | `/app/diario/notas/hooks/useNotasData.ts` |
| Componente compartilhado UI | `/components/ui/` | `/components/ui/DataTable/index.tsx` |
| Componente de layout | `/components/layout/` | `/components/layout/Header/index.tsx` |
| Hook compartilhado | `/hooks/` | `/hooks/useModal.ts` |
| Repository | `/repositories/` | `/repositories/NotaRepository.ts` |
| Servico de negocio | `/services/` | `/services/gradeService.ts` |
| Tipos de entidade | `/types/entities.ts` | `Aluno`, `Nota`, `Chamada` |
| Constantes | `/constants/` | `/constants/navigation.ts` |
| Utilitarios | `/utils/` | `/utils/formatters.ts` |
| Configuracao de lib | `/lib/` | `/lib/firebase.ts` |
| Store Zustand | `/store/` | `/store/authStore.ts` |

---

# SECAO 4: Exemplos Praticos de Refatoracao

## 4.1 Exemplo Completo: Pagina de Notas

### ANTES (Estrutura Problematica)

```typescript
// /app/diario/notas/page.tsx - 1.382 linhas
'use client';

import { useState, useEffect, useCallback } from 'react';
// ... 30+ imports ...

export default function NotasPage() {
  // 15+ estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingComposicao, setSavingComposicao] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [composicaoModalOpen, setComposicaoModalOpen] = useState(false);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);
  const [selectedAv, setSelectedAv] = useState<'av1' | 'av2' | null>(null);
  const [templateAv1, setTemplateAv1] = useState<NotaComposicao[]>([...]);
  const [templateAv2, setTemplateAv2] = useState<NotaComposicao[]>([...]);
  const [subNotas, setSubNotas] = useState<NotaComposicao[]>([]);
  const [notas, setNotas] = useState<Record<string, NotaRow>>({});
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [disciplinas, setDisciplinas] = useState<Disciplina[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  // ... mais estados ...

  // 20+ funcoes
  const loadData = async () => { /* 50 linhas */ };
  const loadNotas = async () => { /* 80 linhas */ };
  const handleNotaChange = () => { /* 30 linhas */ };
  const handleSaveNota = async () => { /* 60 linhas */ };
  const calcularNotaComposicao = () => { /* 20 linhas */ };
  const handleSaveNotasComposicao = async () => { /* 100 linhas */ };
  const handleSubNotaValorChange = () => { /* 25 linhas */ };
  const handleSelectModo = () => { /* 40 linhas */ };
  const gerarFormulaDetalhada = () => { /* 30 linhas */ };
  // ... mais funcoes ...

  // 800+ linhas de JSX
  return (
    <MainLayout>
      {/* Filtros inline - 100 linhas */}
      {/* Tabela de notas - 200 linhas */}
      {/* Modal de template - 150 linhas */}
      {/* Modal de composicao - 200 linhas */}
      {/* Estatisticas - 50 linhas */}
    </MainLayout>
  );
}
```

**Problemas**:
- 15+ estados em um componente = dificil de rastrear
- 20+ funcoes = responsabilidades demais
- 800+ linhas de JSX = impossivel de ler
- Logica de negocio misturada com UI
- Impossivel de testar isoladamente

---

### DEPOIS (Estrutura Refatorada)

**Arquivo 1: Orquestrador Principal**
```typescript
// /app/diario/notas/page.tsx - ~200 linhas
'use client';

import { useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useFilterStore } from '@/store/filterStore';

// Componentes locais
import NotasFilters from './components/NotasFilters';
import NotasTable from './components/NotasTable';
import NotasStats from './components/NotasStats';
import TemplateModal from './components/TemplateModal';
import ComposicaoModal from './components/ComposicaoModal';

// Hooks locais
import { useNotasData } from './hooks/useNotasData';
import { useNotasTemplates } from './hooks/useNotasTemplates';
import { useNotasComposition } from './hooks/useNotasComposition';

export default function NotasPage() {
  const { hasMinRole } = usePermissions();
  const canAccess = hasMinRole('professor');

  const { serieId, disciplinaId, bimestre, ano } = useFilterStore();

  // Hook de dados
  const {
    alunos,
    notas,
    loading,
    saving,
    loadData,
    updateNota,
  } = useNotasData({ serieId, disciplinaId, bimestre, ano });

  // Hook de templates
  const {
    templateAv1,
    templateAv2,
    templateModalOpen,
    selectedAv: templateAv,
    openTemplateModal,
    closeTemplateModal,
    updateTemplate,
  } = useNotasTemplates();

  // Hook de composicao
  const {
    composicaoModalOpen,
    selectedAluno,
    selectedAv,
    subNotas,
    savingComposicao,
    openComposicaoModal,
    closeComposicaoModal,
    updateSubNota,
    saveComposicao,
    calcularNota,
  } = useNotasComposition({
    templateAv1,
    templateAv2,
    notas,
    onSave: loadData,
  });

  useEffect(() => {
    if (canAccess && serieId && disciplinaId) {
      loadData();
    }
  }, [canAccess, serieId, disciplinaId, bimestre, ano, loadData]);

  if (!canAccess) {
    return (
      <MainLayout title="Notas" showSidebar>
        <Alert severity="error">
          Voce nao tem permissao para acessar esta pagina.
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Lancamento de Notas" showSidebar>
      <Box>
        {/* Header */}
        <Typography variant="h5" fontWeight={600} mb={3}>
          Notas
        </Typography>

        {/* Filtros */}
        <NotasFilters
          onTemplateClick={openTemplateModal}
        />

        {/* Conteudo */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Tabela */}
            <NotasTable
              alunos={alunos}
              notas={notas}
              templateAv1={templateAv1}
              templateAv2={templateAv2}
              saving={saving}
              onNotaChange={updateNota}
              onComposicaoClick={openComposicaoModal}
            />

            {/* Estatisticas */}
            <NotasStats notas={notas} alunos={alunos} />
          </>
        )}
      </Box>

      {/* Modais */}
      <TemplateModal
        open={templateModalOpen}
        av={templateAv}
        template={templateAv === 'av1' ? templateAv1 : templateAv2}
        onClose={closeTemplateModal}
        onSave={updateTemplate}
      />

      <ComposicaoModal
        open={composicaoModalOpen}
        aluno={selectedAluno}
        av={selectedAv}
        subNotas={subNotas}
        saving={savingComposicao}
        notaCalculada={calcularNota()}
        onClose={closeComposicaoModal}
        onSubNotaChange={updateSubNota}
        onSave={saveComposicao}
      />
    </MainLayout>
  );
}
```

---

**Arquivo 2: Hook de Dados**
```typescript
// /app/diario/notas/hooks/useNotasData.ts - ~150 linhas
import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { notaService, alunoService, disciplinaService, turmaService } from '@/services/firestore';
import { Aluno, Nota, NotaComposicao } from '@/types';

interface NotaRow {
  alunoId: string;
  av1: number | null;
  av2: number | null;
  rec: number | null;
  media: number | null;
  av1Composicao?: NotaComposicao[];
  av2Composicao?: NotaComposicao[];
  av1NotaId?: string;
  av2NotaId?: string;
  recNotaId?: string;
}

interface UseNotasDataParams {
  serieId: string;
  disciplinaId: string;
  bimestre: 1 | 2 | 3 | 4;
  ano: number;
}

interface UseNotasDataReturn {
  alunos: Aluno[];
  notas: Record<string, NotaRow>;
  loading: boolean;
  saving: boolean;
  error: Error | null;
  loadData: () => Promise<void>;
  updateNota: (alunoId: string, tipo: 'av1' | 'av2' | 'rec', valor: number | null) => Promise<void>;
}

export function useNotasData({
  serieId,
  disciplinaId,
  bimestre,
  ano,
}: UseNotasDataParams): UseNotasDataReturn {
  const { addToast } = useUIStore();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [notas, setNotas] = useState<Record<string, NotaRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadData = useCallback(async () => {
    if (!serieId || !disciplinaId) return;

    setLoading(true);
    setError(null);

    try {
      // Carregar alunos da turma
      const alunosData = await alunoService.getByTurma(serieId);
      const alunosAtivos = alunosData.filter(a => a.ativo);
      setAlunos(alunosAtivos);

      // Carregar notas existentes
      const notasMap: Record<string, NotaRow> = {};

      for (const aluno of alunosAtivos) {
        const notasAluno = await notaService.getByAlunoTurmaDisciplina(
          aluno.id,
          serieId,
          disciplinaId,
          bimestre,
          ano
        );

        notasMap[aluno.id] = {
          alunoId: aluno.id,
          av1: null,
          av2: null,
          rec: null,
          media: null,
        };

        for (const nota of notasAluno) {
          if (nota.tipo === 'AV1') {
            notasMap[aluno.id].av1 = nota.valor;
            notasMap[aluno.id].av1Composicao = nota.composicao;
            notasMap[aluno.id].av1NotaId = nota.id;
          } else if (nota.tipo === 'AV2') {
            notasMap[aluno.id].av2 = nota.valor;
            notasMap[aluno.id].av2Composicao = nota.composicao;
            notasMap[aluno.id].av2NotaId = nota.id;
          } else if (nota.tipo === 'REC') {
            notasMap[aluno.id].rec = nota.valor;
            notasMap[aluno.id].recNotaId = nota.id;
          }
        }

        // Calcular media
        const { av1, av2 } = notasMap[aluno.id];
        if (av1 !== null && av2 !== null) {
          notasMap[aluno.id].media = Math.round(((av1 + av2) / 2) * 10) / 10;
        }
      }

      setNotas(notasMap);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao carregar notas');
      setError(error);
      addToast('Erro ao carregar notas', 'error');
    } finally {
      setLoading(false);
    }
  }, [serieId, disciplinaId, bimestre, ano, addToast]);

  const updateNota = useCallback(async (
    alunoId: string,
    tipo: 'av1' | 'av2' | 'rec',
    valor: number | null
  ) => {
    setSaving(true);
    try {
      const tipoNota = tipo.toUpperCase() as 'AV1' | 'AV2' | 'REC';
      const notaIdKey = `${tipo}NotaId` as 'av1NotaId' | 'av2NotaId' | 'recNotaId';
      const existingNotaId = notas[alunoId]?.[notaIdKey];

      if (existingNotaId && valor !== null) {
        await notaService.update(existingNotaId, { valor });
      } else if (valor !== null) {
        await notaService.create({
          alunoId,
          turmaId: serieId,
          disciplinaId,
          professorId: 'current-user-id', // Pegar do auth
          bimestre,
          tipo: tipoNota,
          valor,
          ano,
        });
      }

      // Atualizar estado local
      setNotas(prev => ({
        ...prev,
        [alunoId]: {
          ...prev[alunoId],
          [tipo]: valor,
        },
      }));

      addToast('Nota salva com sucesso!', 'success');
    } catch (err) {
      addToast('Erro ao salvar nota', 'error');
    } finally {
      setSaving(false);
    }
  }, [notas, serieId, disciplinaId, bimestre, ano, addToast]);

  return {
    alunos,
    notas,
    loading,
    saving,
    error,
    loadData,
    updateNota,
  };
}
```

---

**Arquivo 3: Hook de Composicao**
```typescript
// /app/diario/notas/hooks/useNotasComposition.ts - ~120 linhas
import { useState, useCallback } from 'react';
import { useModal } from '@/hooks/useModal';
import { useUIStore } from '@/store/uiStore';
import { notaService } from '@/services/firestore';
import { Aluno, NotaComposicao } from '@/types';
import { calcularSomaComposicao } from '../utils/gradeCalculations';

interface CompositionData {
  aluno: Aluno;
  av: 'av1' | 'av2';
  composicaoExistente?: NotaComposicao[];
  notaId?: string;
}

interface UseNotasCompositionParams {
  templateAv1: NotaComposicao[];
  templateAv2: NotaComposicao[];
  notas: Record<string, { av1Composicao?: NotaComposicao[]; av2Composicao?: NotaComposicao[]; av1NotaId?: string; av2NotaId?: string }>;
  onSave: () => Promise<void>;
}

export function useNotasComposition({
  templateAv1,
  templateAv2,
  notas,
  onSave,
}: UseNotasCompositionParams) {
  const { addToast } = useUIStore();
  const modal = useModal<CompositionData>();
  const [subNotas, setSubNotas] = useState<NotaComposicao[]>([]);
  const [saving, setSaving] = useState(false);

  const openComposicaoModal = useCallback((aluno: Aluno, av: 'av1' | 'av2') => {
    const template = av === 'av1' ? templateAv1 : templateAv2;
    const composicaoExistente = av === 'av1'
      ? notas[aluno.id]?.av1Composicao
      : notas[aluno.id]?.av2Composicao;
    const notaId = av === 'av1'
      ? notas[aluno.id]?.av1NotaId
      : notas[aluno.id]?.av2NotaId;

    // Usar template como base, preservando valores existentes
    const novasSubNotas = template.map(t => {
      const existente = composicaoExistente?.find(c => c.nome === t.nome);
      return { ...t, valor: existente?.valor ?? null };
    });

    setSubNotas(novasSubNotas);
    modal.open({ aluno, av, composicaoExistente, notaId });
  }, [templateAv1, templateAv2, notas, modal]);

  const updateSubNota = useCallback((id: string, valor: string) => {
    const numValue = valor === '' ? null : parseFloat(valor.replace(',', '.'));
    const componente = subNotas.find(s => s.id === id);
    const notaMaxima = componente?.porcentagem || 10;

    if (numValue !== null && numValue < 0) {
      addToast('A nota nao pode ser negativa', 'warning');
      return;
    }
    if (numValue !== null && numValue > notaMaxima) {
      addToast(`${componente?.nome}: nota maxima e ${notaMaxima}`, 'warning');
      return;
    }

    setSubNotas(prev => prev.map(s =>
      s.id === id ? { ...s, valor: numValue } : s
    ));
  }, [subNotas, addToast]);

  const calcularNota = useCallback((): number | null => {
    return calcularSomaComposicao(subNotas);
  }, [subNotas]);

  const saveComposicao = useCallback(async () => {
    const notaCalculada = calcularNota();
    if (notaCalculada === null) {
      addToast('Preencha todos os componentes', 'warning');
      return;
    }

    if (!modal.data) return;
    const { aluno, av, notaId } = modal.data;

    setSaving(true);
    try {
      const notaData = {
        alunoId: aluno.id,
        turmaId: aluno.turmaId,
        disciplinaId: 'current-discipline', // Pegar do filtro
        professorId: 'current-user', // Pegar do auth
        bimestre: 1 as const, // Pegar do filtro
        tipo: av.toUpperCase() as 'AV1' | 'AV2',
        valor: notaCalculada,
        ano: new Date().getFullYear(),
        composicao: subNotas,
      };

      if (notaId) {
        await notaService.update(notaId, notaData);
      } else {
        await notaService.create(notaData);
      }

      addToast(`Nota ${notaCalculada} salva com sucesso!`, 'success');
      modal.close();
      await onSave();
    } catch (err) {
      addToast('Erro ao salvar nota', 'error');
    } finally {
      setSaving(false);
    }
  }, [modal, subNotas, calcularNota, addToast, onSave]);

  return {
    composicaoModalOpen: modal.isOpen,
    selectedAluno: modal.data?.aluno ?? null,
    selectedAv: modal.data?.av ?? null,
    subNotas,
    savingComposicao: saving,
    openComposicaoModal,
    closeComposicaoModal: modal.close,
    updateSubNota,
    saveComposicao,
    calcularNota,
  };
}
```

---

**Arquivo 4: Utilitarios de Calculo**
```typescript
// /app/diario/notas/utils/gradeCalculations.ts - ~50 linhas
import { NotaComposicao } from '@/types';

/**
 * Calcula a soma de todos os componentes de composicao.
 * Retorna null se algum componente nao tiver valor.
 */
export function calcularSomaComposicao(subNotas: NotaComposicao[]): number | null {
  if (subNotas.length === 0) return null;

  let soma = 0;
  for (const sub of subNotas) {
    if (sub.valor === null) return null;
    soma += sub.valor;
  }

  return Math.round(soma * 10) / 10;
}

/**
 * Calcula a media entre AV1 e AV2.
 */
export function calcularMedia(av1: number | null, av2: number | null): number | null {
  if (av1 === null || av2 === null) return null;
  return Math.round(((av1 + av2) / 2) * 10) / 10;
}

/**
 * Calcula a media final considerando recuperacao.
 */
export function calcularMediaFinal(
  av1: number | null,
  av2: number | null,
  rec: number | null
): number | null {
  const media = calcularMedia(av1, av2);
  if (media === null) return null;

  if (media >= 7) return media;
  if (rec === null) return media;

  return Math.max(media, Math.round(((media + rec) / 2) * 10) / 10);
}

/**
 * Gera formula detalhada para exibicao.
 */
export function gerarFormulaDetalhada(subNotas: NotaComposicao[]): string {
  const partes = subNotas.map(s => {
    const valor = s.valor !== null ? s.valor.toString() : '?';
    return `${s.nome}: ${valor}/${s.porcentagem}`;
  });

  const total = calcularSomaComposicao(subNotas);
  const totalStr = total !== null ? total.toString() : '?';

  return `${partes.join(' + ')} = ${totalStr}`;
}

/**
 * Valida se um template de composicao e valido.
 * A soma dos valores maximos deve ser 10.
 */
export function validarTemplate(template: NotaComposicao[]): boolean {
  const soma = template.reduce((acc, t) => acc + t.porcentagem, 0);
  return soma === 10;
}
```

---

**Arquivo 5: Componente de Tabela**
```typescript
// /app/diario/notas/components/NotasTable.tsx - ~200 linhas
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Typography,
  Avatar,
} from '@mui/material';
import { Aluno, NotaComposicao } from '@/types';
import NotaCell from './NotaCell';

interface NotaRow {
  alunoId: string;
  av1: number | null;
  av2: number | null;
  rec: number | null;
  media: number | null;
  av1Composicao?: NotaComposicao[];
  av2Composicao?: NotaComposicao[];
}

interface NotasTableProps {
  alunos: Aluno[];
  notas: Record<string, NotaRow>;
  templateAv1: NotaComposicao[];
  templateAv2: NotaComposicao[];
  saving: boolean;
  onNotaChange: (alunoId: string, tipo: 'av1' | 'av2' | 'rec', valor: number | null) => void;
  onComposicaoClick: (aluno: Aluno, av: 'av1' | 'av2') => void;
}

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getAvatarColor(nome: string): string {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
  ];
  const index = nome.charCodeAt(0) % colors.length;
  return colors[index];
}

export default function NotasTable({
  alunos,
  notas,
  templateAv1,
  templateAv2,
  saving,
  onNotaChange,
  onComposicaoClick,
}: NotasTableProps) {
  const temComposicaoAv1 = templateAv1.length > 0;
  const temComposicaoAv2 = templateAv2.length > 0;

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell sx={{ minWidth: 200 }}>Aluno</TableCell>
            <TableCell align="center" sx={{ minWidth: 100 }}>AV1</TableCell>
            <TableCell align="center" sx={{ minWidth: 100 }}>AV2</TableCell>
            <TableCell align="center" sx={{ minWidth: 100 }}>REC</TableCell>
            <TableCell align="center" sx={{ minWidth: 100 }}>Media</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {alunos.map(aluno => {
            const notaRow = notas[aluno.id] || {
              av1: null,
              av2: null,
              rec: null,
              media: null,
            };

            return (
              <TableRow key={aluno.id} hover>
                {/* Nome do Aluno */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      sx={{
                        bgcolor: getAvatarColor(aluno.nome),
                        width: 36,
                        height: 36,
                        fontSize: 14,
                      }}
                    >
                      {getInitials(aluno.nome)}
                    </Avatar>
                    <Typography variant="body2" fontWeight={500}>
                      {aluno.nome}
                    </Typography>
                  </Box>
                </TableCell>

                {/* AV1 */}
                <TableCell align="center">
                  <NotaCell
                    valor={notaRow.av1}
                    tipo="av1"
                    temComposicao={temComposicaoAv1}
                    composicao={notaRow.av1Composicao}
                    disabled={saving}
                    onChange={(valor) => onNotaChange(aluno.id, 'av1', valor)}
                    onComposicaoClick={() => onComposicaoClick(aluno, 'av1')}
                  />
                </TableCell>

                {/* AV2 */}
                <TableCell align="center">
                  <NotaCell
                    valor={notaRow.av2}
                    tipo="av2"
                    temComposicao={temComposicaoAv2}
                    composicao={notaRow.av2Composicao}
                    disabled={saving}
                    onChange={(valor) => onNotaChange(aluno.id, 'av2', valor)}
                    onComposicaoClick={() => onComposicaoClick(aluno, 'av2')}
                  />
                </TableCell>

                {/* REC */}
                <TableCell align="center">
                  <NotaCell
                    valor={notaRow.rec}
                    tipo="rec"
                    temComposicao={false}
                    disabled={saving || (notaRow.media !== null && notaRow.media >= 7)}
                    onChange={(valor) => onNotaChange(aluno.id, 'rec', valor)}
                  />
                </TableCell>

                {/* Media */}
                <TableCell align="center">
                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color={
                      notaRow.media === null
                        ? 'text.disabled'
                        : notaRow.media >= 7
                        ? 'success.main'
                        : notaRow.media >= 5
                        ? 'warning.main'
                        : 'error.main'
                    }
                  >
                    {notaRow.media !== null ? notaRow.media.toFixed(1) : '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

---

**Resumo da Refatoracao de Notas**

| Arquivo | Linhas | Responsabilidade |
|---------|--------|------------------|
| `page.tsx` | ~200 | Orquestracao e layout |
| `components/NotasFilters.tsx` | ~80 | Filtros de selecao |
| `components/NotasTable.tsx` | ~200 | Tabela de notas |
| `components/NotaCell.tsx` | ~100 | Celula editavel |
| `components/NotasStats.tsx` | ~60 | Cards estatisticos |
| `components/TemplateModal.tsx` | ~200 | Modal de template |
| `components/ComposicaoModal.tsx` | ~250 | Modal de composicao |
| `hooks/useNotasData.ts` | ~150 | Carregamento de dados |
| `hooks/useNotasComposition.ts` | ~120 | Logica de composicao |
| `hooks/useNotasTemplates.ts` | ~80 | Gestao de templates |
| `utils/gradeCalculations.ts` | ~50 | Calculos |
| **TOTAL** | **~1.490** | 11 arquivos focados |

**Resultado**:
- Arquivo principal reduzido de **1.382 para ~200 linhas** (85% reducao)
- Nenhum arquivo com mais de 250 linhas
- Logica de negocio separada da UI
- Componentes testaveis isoladamente
- Reutilizacao de hooks entre modulos

---

# SECAO 5: Padroes e Convencoes

## 5.1 Convencoes de Nomenclatura

| Categoria | Padrao | Exemplo Correto | Exemplo Incorreto |
|-----------|--------|-----------------|-------------------|
| Componente de pagina | `PascalCase` + descritor | `NotasPage`, `ChamadaPage` | `notas`, `Notas` |
| Componente de UI | `PascalCase` + sufixo tipo | `NotasTable`, `ComposicaoModal` | `Table`, `modal` |
| Hook customizado | `camelCase` + prefixo `use` | `useNotasData`, `useModal` | `notasData`, `getNotas` |
| Servico/Repository | `camelCase` + sufixo | `notaService`, `NotaRepository` | `notas`, `NotaSvc` |
| Tipo/Interface | `PascalCase` | `Aluno`, `NotaComposicao` | `aluno`, `IAluno`, `TAluno` |
| Constante | `SCREAMING_SNAKE_CASE` | `MAX_NOTA`, `ROUTES` | `maxNota`, `Routes` |
| Variavel | `camelCase` | `selectedAluno`, `isLoading` | `selected_aluno`, `IsLoading` |
| Funcao | `camelCase` + verbo | `calcularMedia`, `handleSave` | `media`, `save` |
| Arquivo componente | `PascalCase.tsx` | `NotasTable.tsx` | `notas-table.tsx`, `notasTable.tsx` |
| Arquivo hook | `camelCase.ts` | `useNotasData.ts` | `UseNotasData.ts` |
| Arquivo utils | `camelCase.ts` | `gradeCalculations.ts` | `GradeCalculations.ts` |
| Pasta de modulo | `kebab-case` | `notas/`, `cadastros/` | `Notas/`, `notasModule/` |

---

## 5.2 Estrutura Padrao de Componente

```typescript
// Template padrao para componentes
'use client'; // Apenas se necessario

// 1. Imports externos (bibliotecas)
import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';

// 2. Imports internos (projeto)
import { useUIStore } from '@/store/uiStore';
import { Aluno } from '@/types';

// 3. Imports locais (mesmo modulo)
import { useNotasData } from '../hooks/useNotasData';
import NotaCell from './NotaCell';

// 4. Tipos e interfaces locais
interface ComponentNameProps {
  /** Descricao da prop */
  prop1: string;
  /** Descricao da prop */
  prop2?: number;
  /** Callback quando algo acontece */
  onAction: (value: string) => void;
}

// 5. Constantes locais
const MAX_ITEMS = 10;
const COLORS = ['#red', '#blue'];

// 6. Funcoes auxiliares (fora do componente)
function helperFunction(value: string): string {
  return value.toUpperCase();
}

// 7. Componente principal
export default function ComponentName({
  prop1,
  prop2 = 0,
  onAction,
}: ComponentNameProps) {
  // 7a. Hooks de estado/efeito
  const [state, setState] = useState<string>('');
  const { addToast } = useUIStore();

  // 7b. Callbacks memorizados
  const handleClick = useCallback(() => {
    onAction(state);
  }, [state, onAction]);

  // 7c. Efeitos
  useEffect(() => {
    // Logica de efeito
  }, [prop1]);

  // 7d. Early returns (guards)
  if (!prop1) {
    return <Typography>Sem dados</Typography>;
  }

  // 7e. JSX principal
  return (
    <Box>
      <Typography>{prop1}</Typography>
      <Button onClick={handleClick}>Acao</Button>
    </Box>
  );
}
```

---

## 5.3 Estrutura Padrao de Hook

```typescript
// Template padrao para hooks customizados
import { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

// 1. Tipos de entrada
interface UseHookNameParams {
  /** Descricao do parametro */
  param1: string;
  /** Descricao do parametro */
  param2?: number;
}

// 2. Tipos de saida
interface UseHookNameReturn {
  /** Estado principal */
  data: DataType[];
  /** Estado de carregamento */
  loading: boolean;
  /** Estado de erro */
  error: Error | null;
  /** Funcao para carregar dados */
  load: () => Promise<void>;
  /** Funcao para atualizar */
  update: (id: string, value: string) => Promise<boolean>;
}

// 3. Hook principal
export function useHookName({
  param1,
  param2 = 0,
}: UseHookNameParams): UseHookNameReturn {
  // 3a. Estados
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 3b. Stores/contextos
  const { addToast } = useUIStore();

  // 3c. Callbacks
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Logica de carregamento
      const result = await someService.getAll();
      setData(result);
    } catch (err) {
      const e = err instanceof Error ? err : new Error('Erro desconhecido');
      setError(e);
      addToast('Erro ao carregar', 'error');
    } finally {
      setLoading(false);
    }
  }, [param1, addToast]);

  const update = useCallback(async (id: string, value: string): Promise<boolean> => {
    try {
      await someService.update(id, { value });
      addToast('Atualizado com sucesso!', 'success');
      return true;
    } catch (err) {
      addToast('Erro ao atualizar', 'error');
      return false;
    }
  }, [addToast]);

  // 3d. Efeitos
  useEffect(() => {
    load();
  }, [load]);

  // 3e. Retorno
  return {
    data,
    loading,
    error,
    load,
    update,
  };
}
```

---

## 5.4 Checklist de Code Review

Para cada PR de refatoracao, verificar:

### Estrutura
- [ ] Arquivo tem menos de 300 linhas
- [ ] Componente tem responsabilidade unica
- [ ] Imports organizados (externos > internos > locais)
- [ ] Nao ha codigo duplicado
- [ ] Nao ha magic strings (usar constantes)

### Tipagem
- [ ] Props tipadas com interface
- [ ] Retorno de funcoes tipado
- [ ] Nao usa `any` sem justificativa
- [ ] Generics usados quando apropriado

### Performance
- [ ] useCallback em funcoes passadas como props
- [ ] useMemo em calculos pesados
- [ ] Nao cria objetos inline em JSX
- [ ] Keys unicos em listas

### Hooks
- [ ] Segue regras de hooks (ordem, condicionalidade)
- [ ] Dependencias de useEffect corretas
- [ ] Cleanup em useEffect quando necessario

### UI/UX
- [ ] Loading states tratados
- [ ] Error states tratados
- [ ] Empty states tratados
- [ ] Feedback para acoes do usuario (toasts)

### Acessibilidade
- [ ] Labels em inputs
- [ ] Alt em imagens
- [ ] Aria labels em botoes de icone
- [ ] Navegacao por teclado funciona

---

# SECAO 6: Consideracoes de Migracao

## 6.1 Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigacao |
|-------|---------------|---------|-----------|
| Quebra de funcionalidade durante refatoracao | Media | Alto | Testar manualmente cada fluxo antes e depois |
| Perda de dados no Firebase | Baixa | Critico | Nao alterar logica de persistencia, apenas organizacao |
| Regressao de UI/Layout | Media | Medio | Comparar screenshots antes/depois |
| Performance degradada | Baixa | Medio | Medir bundle size antes/depois |
| Conflitos de merge com desenvolvimento paralelo | Alta | Medio | Comunicar equipe, fazer PRs pequenos e frequentes |
| Introducao de bugs tipagem | Media | Baixo | TypeScript strict habilitado |

---

## 6.2 Estrategia de Rollback

1. **Cada PR e atomico**: Uma refatoracao por PR
2. **Branch de feature**: Cada sprint em branch separada
3. **Testes manuais**: Antes de merge, testar fluxos criticos
4. **Git revert**: Se problema em producao, reverter commit especifico
5. **Feature flags**: Para mudancas grandes, usar flags (ex: `USE_NEW_NOTAS_PAGE`)

**Procedimento de Rollback**:
```bash
# 1. Identificar commit problematico
git log --oneline

# 2. Reverter commit
git revert <commit-hash>

# 3. Push imediato
git push origin main

# 4. Comunicar equipe
```

---

## 6.3 Ordem de Migracao Recomendada

| Ordem | Modulo | Justificativa |
|-------|--------|---------------|
| 1 | Hooks compartilhados (`useModal`, `useCRUD`) | Base para outros modulos |
| 2 | Constantes e utilitarios | Nao afeta UI, facil de testar |
| 3 | Sidebar (navegacao) | Impacto visual, mas nao funcional |
| 4 | Paginas de Cadastro (CRUD) | Estrutura similar, testar padrao |
| 5 | Notas (mais complexo) | Maior arquivo, mais beneficio |
| 6 | Chamada | Segundo mais complexo |
| 7 | Ocorrencias | Terceiro mais complexo |
| 8 | Outros modulos | Menor prioridade |

---

## 6.4 Testes de Regressao

### Apos Sprint 1 (Hooks + Utilitarios)
- [ ] Login funciona normalmente
- [ ] Navegacao entre paginas funciona
- [ ] Notificacoes toast aparecem
- [ ] Sidebar mostra itens corretos por role

### Apos Sprint 2 (CRUD generico)
- [ ] Criar professor funciona
- [ ] Editar aluno funciona
- [ ] Excluir turma funciona
- [ ] Filtros de busca funcionam
- [ ] Validacoes de formulario funcionam

### Apos Sprint 3 (Notas refatorado)
- [ ] Selecionar turma/disciplina/bimestre funciona
- [ ] Tabela de alunos carrega
- [ ] Editar nota diretamente funciona
- [ ] Composicao de nota funciona
- [ ] Template de composicao salva
- [ ] Calculos de media corretos
- [ ] Notas salvam no Firebase

### Apos Sprint 4 (Chamada refatorado)
- [ ] Selecionar turma/disciplina/data funciona
- [ ] Lista de alunos carrega
- [ ] Toggle presenca funciona
- [ ] Marcar todos presente/ausente funciona
- [ ] Registrar conteudo funciona
- [ ] Salvar chamada persiste no Firebase

---

# SECAO 7: Metricas de Sucesso

## 7.1 KPIs da Refatoracao

| Metrica | Valor Atual | Meta | Como Medir |
|---------|-------------|------|------------|
| Maior arquivo (linhas) | 1.382 (notas) | < 300 | `wc -l src/**/*.tsx \| sort -rn \| head` |
| Arquivos > 300 linhas | 16 | 0 | Contagem manual |
| Componentes reutilizados | ~7 | > 15 | Grep por exports em /components |
| Hooks customizados | 3 | > 10 | Contagem em /hooks |
| Repositories | 0 | 9 | Contagem em /repositories |
| Cobertura de tipos | ~80% | > 95% | `tsc --noEmit` sem erros |
| Duplicacao de codigo CRUD | ~1.500 linhas | < 500 | Comparar paginas de cadastro |
| Tempo de build | baseline | < +10% | `npm run build` timing |
| Bundle size | baseline | < +5% | `next build` output |

---

## 7.2 Definition of Done

A refatoracao estara completa quando:

### Criterios Obrigatorios
- [ ] Nenhum arquivo TSX/TS excede 300 linhas (exceto tipos)
- [ ] Todos os hooks CRUD extraidos e funcionais
- [ ] Todas as 4 paginas de cadastro usando CRUDPage
- [ ] notas/page.tsx dividido em 10+ arquivos
- [ ] Repositories implementados para todas as collections
- [ ] Navegacao extraida para constantes
- [ ] Todos os fluxos criticos testados manualmente
- [ ] Zero erros de TypeScript (`tsc --noEmit`)
- [ ] Build passa sem erros
- [ ] Documentacao atualizada

### Criterios Desejaveis
- [ ] Error boundaries implementados
- [ ] Lazy loading de rotas configurado
- [ ] JSDoc em funcoes publicas principais
- [ ] Header refatorado (UserMenu, ThemeToggle)
- [ ] Estrutura de testes definida (nao implementada)

---

## 7.3 Cronograma Estimado

| Sprint | Duracao | Entregaveis Principais |
|--------|---------|------------------------|
| Sprint 1 | 1 semana | Hooks base (useModal, useCRUD), utilitarios, constantes |
| Sprint 2 | 1 semana | Repositories, CRUDPage generico |
| Sprint 3 | 1 semana | notas/page.tsx refatorado completamente |
| Sprint 4 | 1 semana | Paginas de cadastro migradas para CRUDPage |
| Sprint 5 (opcional) | 1 semana | chamada, ocorrencias refatorados |
| Sprint 6 (opcional) | 1 semana | Header, Sidebar, melhorias finais |

**Total Estimado**: 4-6 semanas de desenvolvimento focado

---

# Apendice: Codigo de Referencia Adicional

## A.1 Constantes de Navegacao

```typescript
// /src/constants/navigation.ts
import {
  Home, Dashboard, Groups, School, EventNote,
  FormatListNumbered, Grade, ReportProblem, People,
  BarChart, Cake, Settings, CalendarMonth, MenuBook,
  PersonAdd, Class,
} from '@mui/icons-material';
import { Permission } from '@/lib/permissions';
import { UserRole } from '@/types';

export interface NavItem {
  label: string;
  icon: React.ReactNode;
  href?: string;
  children?: NavItem[];
  permission?: Permission;
  minRole?: UserRole;
}

export interface NavSection {
  title?: string;
  items: NavItem[];
  minRole?: UserRole;
}

export const NAVIGATION: NavSection[] = [
  {
    items: [
      { label: 'Inicio', icon: <Home />, href: '/diario/menu' },
    ],
  },
  {
    title: 'GESTAO',
    items: [
      {
        label: 'Painel de Gestao',
        icon: <Dashboard />,
        children: [
          { label: 'Chamada', icon: <FormatListNumbered />, href: '/diario/chamada', permission: 'chamada:view' },
          { label: 'Notas', icon: <Grade />, href: '/diario/notas', permission: 'notas:view' },
          { label: 'Conceitos', icon: <School />, href: '/diario/conceitos', permission: 'conceitos:view' },
          { label: 'Graficos', icon: <BarChart />, href: '/diario/graficos', permission: 'graficos:view', minRole: 'coordenador' },
        ],
      },
      {
        label: 'Gestor de turmas',
        icon: <Groups />,
        minRole: 'coordenador',
        children: [
          { label: 'Professores', icon: <People />, href: '/diario/professores', permission: 'professores:view' },
          { label: 'Ocorrencias', icon: <ReportProblem />, href: '/diario/ocorrencias', permission: 'ocorrencias:view' },
        ],
      },
    ],
  },
  {
    title: 'SALA DE AULA',
    items: [
      { label: 'Calendario', icon: <CalendarMonth />, href: '/diario/agenda', permission: 'agenda:view' },
      { label: 'Aniversariantes', icon: <Cake />, href: '/diario/aniversariantes', permission: 'aniversariantes:view', minRole: 'coordenador' },
    ],
  },
  {
    title: 'CADASTROS',
    minRole: 'coordenador',
    items: [
      { label: 'Turmas', icon: <Class />, href: '/diario/cadastros/turmas', permission: 'turmas:view' },
      { label: 'Alunos', icon: <PersonAdd />, href: '/diario/cadastros/alunos', permission: 'alunos:view' },
      { label: 'Disciplinas', icon: <MenuBook />, href: '/diario/cadastros/disciplinas' },
    ],
  },
  {
    title: 'ADMINISTRACAO',
    minRole: 'coordenador',
    items: [
      { label: 'Usuarios', icon: <People />, href: '/diario/usuarios', permission: 'usuarios:view' },
      { label: 'Configuracoes', icon: <Settings />, href: '/diario/configuracoes', minRole: 'administrador' },
    ],
  },
];
```

---

## A.2 Error Boundary

```typescript
// /src/components/common/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    // Aqui pode enviar para servico de logging (Sentry, etc)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 500,
            mx: 'auto',
            mt: 4,
          }}
        >
          <ErrorOutline sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Algo deu errado
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Ocorreu um erro inesperado. Tente recarregar a pagina.
          </Typography>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <Box
              sx={{
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                mb: 3,
                textAlign: 'left',
                fontFamily: 'monospace',
                fontSize: 12,
                overflow: 'auto',
              }}
            >
              {this.state.error.message}
            </Box>
          )}
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={this.handleReset}
          >
            Tentar novamente
          </Button>
        </Paper>
      );
    }

    return this.props.children;
  }
}
```

---

## A.3 Formatadores

```typescript
// /src/utils/formatters.ts

/**
 * Formata CPF para exibicao (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Remove formatacao do CPF
 */
export function unformatCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Formata telefone para exibicao ((XX) XXXXX-XXXX)
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formata data para exibicao (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora (DD/MM/YYYY HH:mm)
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata nota para exibicao (sempre 1 casa decimal)
 */
export function formatGrade(value: number | null): string {
  if (value === null) return '-';
  return value.toFixed(1);
}

/**
 * Formata percentual
 */
export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

/**
 * Retorna iniciais de um nome
 */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, maxChars)
    .join('')
    .toUpperCase();
}
```

---

*Documento gerado para planejamento de reestruturacao de codigo.*
*Versao: 1.0 | Data: Janeiro 2026*
*Total de paginas: ~45 | Linhas de codigo exemplo: ~1.200*
