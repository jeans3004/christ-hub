# Guia de Desenvolvimento - Diario Digital

## Principio Fundamental

**Todo arquivo deve ter no maximo 150-200 linhas de codigo.**

Este guia estabelece os padroes de desenvolvimento para o sistema Diario Digital. Todas as novas implementacoes DEVEM seguir estas diretrizes.

---

## 1. Estrutura de Modulos

### 1.1 Padrao de Pasta para Paginas

Toda nova pagina em `/src/app/diario/` deve seguir esta estrutura:

```
/src/app/diario/[nome-modulo]/
├── page.tsx                    # Pagina principal (80-150 linhas)
├── types.ts                    # Tipos do modulo (50-100 linhas)
├── components/
│   ├── index.ts                # Exports centralizados
│   ├── [Nome]Filters.tsx       # Filtros (70-100 linhas)
│   ├── [Nome]List.tsx          # Lista/Cards (100-200 linhas)
│   ├── [Nome]Table.tsx         # Tabela (se aplicavel)
│   └── [Nome]Modal.tsx         # Modal (100-150 linhas)
├── hooks/
│   ├── index.ts                # Exports centralizados
│   └── use[Nome]Data.ts        # Hook principal (100-150 linhas)
└── utils/                      # (opcional)
    └── [nome]Helpers.ts        # Funcoes utilitarias (50-100 linhas)
```

### 1.2 Exemplo de Estrutura Real

```
/src/app/diario/chamada/
├── page.tsx                    # 145 linhas
├── types.ts                    # 24 linhas
├── components/
│   ├── index.ts
│   ├── ChamadaFilters.tsx      # 141 linhas
│   ├── ChamadaList.tsx         # 199 linhas
│   └── ConteudoModal.tsx       # 56 linhas
└── hooks/
    ├── index.ts
    └── useChamadaData.ts       # 155 linhas
```

---

## 2. Limites de Linhas

### 2.1 Tabela de Limites

| Tipo de Arquivo | Minimo | Ideal | Maximo |
|-----------------|--------|-------|--------|
| page.tsx | 50 | 100 | **150** |
| types.ts | 30 | 60 | 100 |
| Component.tsx | 50 | 120 | **200** |
| useHook.ts | 50 | 100 | **150** |
| utils.ts | 20 | 50 | 100 |
| service.ts | 40 | 80 | 150 |
| index.ts (exports) | 5 | 15 | 30 |

### 2.2 Quando Quebrar um Arquivo

**OBRIGATORIO quebrar quando:**
- Componente > 200 linhas
- Hook > 150 linhas
- Mais de 5 `useState` em um componente
- Mais de 2 modais em uma pagina
- Mais de 3 tabs/sections em um componente

---

## 3. Padroes de Codigo

### 3.1 Estrutura de page.tsx

```typescript
'use client';

/**
 * Pagina de [Nome] - descricao breve.
 */

import { ... } from '@mui/material';
import MainLayout from '@/components/layout/MainLayout';
import { use[Nome]Data } from './hooks';
import { [Nome]Filters, [Nome]List, [Nome]Modal } from './components';

export default function [Nome]Page() {
  // 1. Hooks de dados
  const { data, loading, error, actions } = use[Nome]Data();

  // 2. Estados locais (minimo possivel)
  const [modalOpen, setModalOpen] = useState(false);

  // 3. Handlers simples (logica complexa vai para hooks)
  const handleSubmit = () => { ... };

  // 4. Render
  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">[Titulo]</Typography>

        <[Nome]Filters ... />

        {loading ? <CircularProgress /> : <[Nome]List ... />}

        <[Nome]Modal open={modalOpen} onClose={() => setModalOpen(false)} />
      </Box>
    </MainLayout>
  );
}
```

### 3.2 Estrutura de types.ts

```typescript
/**
 * Tipos do modulo [Nome].
 */

import { EntidadeBase } from '@/types';

/**
 * Dados especificos do modulo
 */
export interface [Nome]Data {
  id: string;
  campo1: string;
  campo2: number;
}

/**
 * Props de componentes do modulo
 */
export interface [Nome]FilterProps {
  ano: number;
  setAno: (ano: number) => void;
  // ...
}

export interface [Nome]ListProps {
  items: [Nome]Data[];
  loading: boolean;
  onItemClick: (item: [Nome]Data) => void;
}

/**
 * Tipos auxiliares
 */
export type [Nome]Status = 'ativo' | 'inativo' | 'pendente';
```

### 3.3 Estrutura de Hook de Dados

```typescript
/**
 * Hook principal de dados para [Nome].
 */

import { useState, useEffect, useCallback } from 'react';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { [nome]Service } from '@/services/firestore';
import { [Nome]Data } from '../types';

interface Use[Nome]DataReturn {
  // Dados
  items: [Nome]Data[];
  loading: boolean;
  error: string | null;

  // Filtros
  ano: number;
  setAno: (ano: number) => void;

  // Acoes
  refresh: () => Promise<void>;
  create: (data: Omit<[Nome]Data, 'id'>) => Promise<void>;
  update: (id: string, data: Partial<[Nome]Data>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function use[Nome]Data(): Use[Nome]DataReturn {
  const { ano, setAno } = useFilterStore();
  const { addToast } = useUIStore();

  const [items, setItems] = useState<[Nome]Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregamento inicial
  useEffect(() => {
    loadData();
  }, [ano]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await [nome]Service.getByAno(ano);
      setItems(data);
    } catch (err) {
      setError('Erro ao carregar dados');
      addToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }, [ano, addToast]);

  // ... demais acoes

  return {
    items,
    loading,
    error,
    ano,
    setAno,
    refresh: loadData,
    create,
    update,
    remove,
  };
}
```

### 3.4 Estrutura de Componente

```typescript
/**
 * [Nome]List - Lista de itens do modulo.
 */

import { Box, Card, Typography, ... } from '@mui/material';
import { [Nome]Data } from '../types';

interface [Nome]ListProps {
  items: [Nome]Data[];
  loading: boolean;
  onItemClick: (item: [Nome]Data) => void;
}

export function [Nome]List({ items, loading, onItemClick }: [Nome]ListProps) {
  if (loading) {
    return <CircularProgress />;
  }

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography color="text.secondary">
          Nenhum item encontrado
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      {items.map((item) => (
        <[Nome]Card
          key={item.id}
          item={item}
          onClick={() => onItemClick(item)}
        />
      ))}
    </Box>
  );
}
```

### 3.5 Estrutura de index.ts (exports)

```typescript
/**
 * Exports dos componentes de [Nome].
 */

export { [Nome]Filters } from './[Nome]Filters';
export { [Nome]List } from './[Nome]List';
export { [Nome]Modal } from './[Nome]Modal';
// ... outros componentes
```

---

## 4. Nomenclatura

### 4.1 Arquivos

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| Pagina | page.tsx | page.tsx |
| Componente | PascalCase.tsx | ChamadaList.tsx |
| Hook | useCamelCase.ts | useChamadaData.ts |
| Tipos | types.ts ou PascalCaseTypes.ts | types.ts |
| Utilitarios | camelCase.ts | chamadaHelpers.ts |
| Servico | camelCaseService.ts | chamadaService.ts |
| Index | index.ts | index.ts |

### 4.2 Variaveis e Funcoes

```typescript
// Componentes: PascalCase
function ChamadaList() { ... }

// Hooks: useCamelCase
function useChamadaData() { ... }

// Funcoes: camelCase
function calcularMedia() { ... }

// Constantes: UPPER_SNAKE_CASE
const MAX_LINHAS = 200;

// Tipos/Interfaces: PascalCase
interface ChamadaData { ... }
type ChamadaStatus = 'presente' | 'ausente';

// Props: PascalCaseProps
interface ChamadaListProps { ... }
```

---

## 5. Imports e Exports

### 5.1 Ordem de Imports

```typescript
// 1. React
import { useState, useEffect, useCallback } from 'react';

// 2. Bibliotecas externas
import { Box, Typography, Button } from '@mui/material';
import { Save, Delete } from '@mui/icons-material';

// 3. Componentes do projeto (absolutos)
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';

// 4. Imports locais (relativos)
import { use[Nome]Data } from './hooks';
import { [Nome]List, [Nome]Modal } from './components';
import { [Nome]Data } from './types';
```

### 5.2 Exports

```typescript
// Preferir named exports
export function [Nome]List() { ... }

// Default export apenas para page.tsx
export default function [Nome]Page() { ... }

// Re-exports em index.ts
export { [Nome]List } from './[Nome]List';
```

---

## 6. Componentes MUI

### 6.1 Grid v2

```typescript
// CORRETO (MUI v7)
<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 6 }}>
    ...
  </Grid>
</Grid>

// INCORRETO (sintaxe antiga)
<Grid container spacing={2}>
  <Grid item xs={12} md={6}>  // NAO USAR
    ...
  </Grid>
</Grid>
```

### 6.2 Estilos

```typescript
// Preferir sx prop
<Box sx={{ p: 2, mb: 3, display: 'flex' }}>

// Usar theme tokens
<Typography sx={{ color: 'text.secondary' }}>

// Responsivo
<Box sx={{
  display: 'flex',
  flexDirection: { xs: 'column', md: 'row' }
}}>
```

---

## 7. Estado e Dados

### 7.1 Gerenciamento de Estado

| Tipo de Estado | Onde Colocar |
|----------------|--------------|
| Estado global (auth, tema) | Zustand stores |
| Filtros persistentes | filterStore |
| Estado de UI (modais, loading) | useState local ou uiStore |
| Dados do servidor | Custom hooks |
| Estado de formulario | react-hook-form |

### 7.2 Regra dos 5 useState

Se um componente tem mais de 5 `useState`, extrair para um hook customizado:

```typescript
// ANTES (ruim)
function Component() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState('');
  // ... muitos estados
}

// DEPOIS (bom)
function Component() {
  const { data, loading, error, selectedId, setSelectedId } = useComponentData();
  const [modalOpen, setModalOpen] = useState(false);
}
```

---

## 8. Firebase/Firestore

### 8.1 Estrutura de Servicos

```typescript
// services/firestore/[nome]Service.ts

import { collection, query, where, getDocs, ... } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { [Nome] } from '@/types';

const COLLECTION = '[nome]s';

export const [nome]Service = {
  async getAll(): Promise<[Nome][]> { ... },
  async getById(id: string): Promise<[Nome] | null> { ... },
  async getByAno(ano: number): Promise<[Nome][]> { ... },
  async create(data: Omit<[Nome], 'id'>): Promise<string> { ... },
  async update(id: string, data: Partial<[Nome]>): Promise<void> { ... },
  async delete(id: string): Promise<void> { ... },
};
```

### 8.2 Tratamento de Erros

```typescript
try {
  const result = await [nome]Service.create(data);
  addToast('Criado com sucesso!', 'success');
  return result;
} catch (error) {
  console.error('Erro ao criar:', error);
  addToast('Erro ao criar. Tente novamente.', 'error');
  throw error;
}
```

---

## 9. Checklist de Nova Feature

### Antes de Comecar

- [ ] Definir estrutura de pastas
- [ ] Criar types.ts com interfaces
- [ ] Identificar dados necessarios

### Durante Desenvolvimento

- [ ] Criar hook de dados primeiro
- [ ] Criar componentes pequenos (<200 linhas)
- [ ] Criar index.ts para exports
- [ ] Criar page.tsx por ultimo

### Antes de Commit

- [ ] Todos arquivos <= 200 linhas
- [ ] Sem erros TypeScript
- [ ] Imports organizados
- [ ] Nomes seguem padrao
- [ ] Funcionalidade testada manualmente
- [ ] Link adicionado em navigation.tsx (se aplicavel)

---

## 10. Anti-Padroes (NAO FAZER)

### 10.1 Arquivos Grandes

```typescript
// NAO: Arquivo monolitico
// page.tsx com 500+ linhas, multiplos modais, toda logica inline

// SIM: Dividir em arquivos menores
// page.tsx + components/ + hooks/
```

### 10.2 Logica no Componente

```typescript
// NAO: Calculos complexos no componente
function Component() {
  const resultado = data.map(x => x.valor * 0.5 + ...).reduce(...);
}

// SIM: Extrair para utils
import { calcularResultado } from './utils';
function Component() {
  const resultado = calcularResultado(data);
}
```

### 10.3 Props Drilling Excessivo

```typescript
// NAO: Passar props por multiplos niveis
<Parent data={data} onSave={onSave} loading={loading} error={error} ... />

// SIM: Usar hooks ou context
const { data, onSave, loading, error } = useParentData();
```

### 10.4 Imports Desorganizados

```typescript
// NAO
import { something } from './local';
import React from 'react';
import { Box } from '@mui/material';
import { useStore } from '@/store';

// SIM (ordem correta)
import React from 'react';
import { Box } from '@mui/material';
import { useStore } from '@/store';
import { something } from './local';
```

---

## 11. Recursos Uteis

### 11.1 Hooks Disponiveis

| Hook | Uso |
|------|-----|
| `useFilterStore` | Filtros globais (ano, turma, etc) |
| `useAuthStore` | Usuario autenticado |
| `useUIStore` | Toasts, sidebar, tema |
| `useModal` | Controle de modal generico |
| `useCRUD` | Operacoes CRUD genericas |
| `usePermissions` | Verificacao de permissoes |

### 11.2 Componentes Reutilizaveis

| Componente | Localizacao |
|------------|-------------|
| MainLayout | @/components/layout |
| DataTable | @/components/ui |
| FormModal | @/components/ui |
| ConfirmDialog | @/components/ui |
| LoadingScreen | @/components/ui |
| ErrorBoundary | @/components/common |

### 11.3 Servicos

| Servico | Uso |
|---------|-----|
| `turmaService` | CRUD de turmas |
| `alunoService` | CRUD de alunos |
| `disciplinaService` | CRUD de disciplinas |
| `chamadaService` | Registros de chamada |
| `notaService` | Registros de notas |
| `storageService` | Upload de arquivos |

---

## 12. Exemplo Completo

### Nova Pagina: Relatorios

```
/src/app/diario/relatorios/
├── page.tsx                    # 120 linhas
├── types.ts                    # 45 linhas
├── components/
│   ├── index.ts                # 10 linhas
│   ├── RelatoriosFilters.tsx   # 85 linhas
│   ├── RelatoriosList.tsx      # 150 linhas
│   └── RelatorioModal.tsx      # 130 linhas
└── hooks/
    ├── index.ts                # 5 linhas
    └── useRelatoriosData.ts    # 140 linhas
```

**Total: 7 arquivos, ~685 linhas, media de 98 linhas/arquivo**

---

*Guia de Desenvolvimento v1.0*
*Diario Digital - Janeiro 2026*

**Regra de Ouro: Se o arquivo passar de 200 linhas, PARE e refatore.**
