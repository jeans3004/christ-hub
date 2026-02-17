# SGE Integration Expansion - Design Document

**Data**: 2026-02-17
**Status**: Aprovado
**Abordagem**: A - SGE Service Layer

---

## 1. Objetivo

Expandir a integracao do Luminar com o SGE (e-aluno.com.br) de sync unidirecional de chamadas para uma integracao bidirecional completa cobrindo chamada, conteudo, ocorrencias e relatorios. Substituir o proxy atual (`eAlunoProxy.ts`) por um service layer organizado com session pool.

## 2. Decisoes de Design

| Decisao | Escolha |
|---------|---------|
| Sync timing | Imediato (fire-and-forget ao salvar) |
| Direcao | Bidirecional (envio + leitura/importacao) |
| Conteudo | Entidade independente (nao vinculado a chamada) |
| Ocorrencias | Sync bidirecional com modulo existente |
| Relatorios | Dia/mensal nativo no Luminar; faltas/anual via proxy HTML |
| Sessao | Session pool in-memory (TTL 15min, LRU 50 sessoes) |
| Migracao | Substituir eAlunoProxy.ts e /api/ealuno/*, manter collection Firestore |

## 3. Arquitetura

### 3.1 Estrutura de Arquivos

```
src/
├── lib/
│   ├── eAlunoProxy.ts                → DELETAR (fase 3)
│   └── sge/
│       ├── index.ts                   # Re-exports
│       ├── session.ts                 # Session pool
│       ├── client.ts                  # HTTP client base
│       ├── chamadaClient.ts           # CRUD chamada
│       ├── conteudoClient.ts          # CRUD conteudo
│       ├── ocorrenciaClient.ts        # CRUD ocorrencia
│       └── relatorioClient.ts         # Leitura de relatorios
├── app/api/
│   ├── ealuno/                        → DELETAR (fase 3)
│   └── sge/
│       ├── login/route.ts             # POST - login + opcoes
│       ├── data/route.ts              # POST - disciplinas, alunos
│       ├── chamada/route.ts           # POST - enviar chamada
│       ├── chamada-detail/route.ts    # POST - detalhe (leitura)
│       ├── chamada-edit/route.ts      # POST - editar P/F individual
│       ├── chamada-delete/route.ts    # POST - excluir chamada
│       ├── check/route.ts             # POST - verificar existencia em lote
│       ├── conteudo/route.ts          # POST - CRUD conteudo
│       ├── ocorrencia/route.ts        # POST - CRUD ocorrencia
│       └── relatorio/route.ts         # POST/GET - relatorios
├── services/firestore/
│   ├── eAlunoConfigService.ts         → renomear exports pra sgeConfigService
│   └── conteudoService.ts             # NOVO - CRUD conteudo no Firestore
```

### 3.2 Session Pool (`session.ts`)

```
Cache in-memory: Map<cpf, { cookie: string, expiresAt: number }>
- TTL: 15 minutos
- Max: 50 sessoes (LRU eviction - remove a mais antiga ao atingir limite)
- Re-login automatico se sessao expirada (detectado por redirect pra login)
- Thread-safe: lock por CPF pra evitar login duplicado simultaneo
```

### 3.3 Client Base (`client.ts`)

Wrapper de fetch com:
- Cookie injection automatica via session pool
- Deteccao de sessao expirada (HTML contem redirect to index.html)
- Re-login transparente (1 retry)
- Content-Type `application/x-www-form-urlencoded` padrao
- Header `X-Requested-With: XMLHttpRequest`
- Base URL: `https://e-aluno.com.br/christ/diario`

### 3.4 Fluxo de Dados

```
Browser (Professor)
  │
  ├─ Salvar chamada ──→ Firestore (resposta imediata)
  │                       └─ fire-and-forget ──→ /api/sge/chamada
  │                                                  │
  │                                           sge/session.ts (pool)
  │                                                  │
  │                                           sge/chamadaClient.ts
  │                                                  │
  │                                           e-aluno.com.br
  │                                                  │
  │                                           Update Firestore (sgeSyncedAt | sgeSyncError)
  │
  ├─ Consultar SGE ──→ /api/sge/chamada-detail ──→ Parse HTML ──→ Resposta pro browser
  │
  └─ Ver relatorio ──→ /api/sge/relatorio ──→ Parse HTML ou proxy ──→ Resposta
```

## 4. Modulo: Chamada (Bidirecional)

### 4.1 Envio (Luminar → SGE)

Sync imediato ao salvar:
1. `chamadaService.create()` no Firestore (retorna imediato pro browser)
2. Fire-and-forget: `POST /api/sge/chamada`
3. Auto-discover mapeamentos (turma, disciplina, alunos) se nao existirem
4. `insert_chamada.php?lista={ids presentes}`
5. Sucesso: `chamada.sgeSyncedAt = new Date()`
6. Falha: `chamada.sgeSyncError = "mensagem"`

Re-sync de chamadas com erro: botao "Reenviar" individual ou em lote na lista.

### 4.2 Edicao (Luminar → SGE)

Quando professor edita presenca individual:
1. `chamadaService.update()` no Firestore
2. Fire-and-forget: `POST /api/sge/chamada-edit`
3. `edit_chamada.php` com `parametro` ("." ou "F") e `sequencia` (ID do registro)

O `sequencia` e obtido ao sincronizar - buscar detalhamento e salvar mapeamento:
```typescript
chamada.sgeSequenciaMap: Record<string, string>  // alunoId → sequencia
```

### 4.3 Exclusao (Luminar → SGE)

Se chamada tem `sgeSyncedAt`:
1. `POST /api/sge/chamada-delete`
2. `delete_chamada.php` com `serie, turma, turno, disciplina, data`
3. Exclui do Firestore

### 4.4 Leitura (SGE → Luminar)

Botao "Consultar SGE" numa data:
1. `POST /api/sge/chamada-detail`
2. `relatorio_detalhamento_chamada.php` → parse HTML
3. Lista alunos com status P/F + sequencia
4. Mostra comparativo Luminar vs SGE
5. Opcao "Importar do SGE" se nao existe no Luminar

### 4.5 Status Visual (ChamadaList)

| Estado | Chip | Cor |
|--------|------|-----|
| Sem credenciais SGE | - | - |
| Enviando | `SGE ⟳` | warning |
| Sincronizado | `SGE ✓` | success |
| Erro | `SGE ✗` | error (tooltip com erro) |
| Editado local (pendente) | `SGE ~` | info |

## 5. Modulo: Conteudo (Entidade Independente, Bidirecional)

### 5.1 Modelo de Dados

Nova collection `conteudos` no Firestore:

```typescript
interface ConteudoAula {
  id: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: Date;
  tempo: number;             // Numero da aula
  conteudo: string;          // Texto livre
  ano: number;
  // SGE sync
  sgeId?: string;            // sequencia no e-aluno
  sgeSyncedAt?: Date;
  sgeSyncError?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.2 Envio (Luminar → SGE)

```
Professor preenche conteudo da aula
  → conteudoService.create() no Firestore
  → fire-and-forget: POST /api/sge/conteudo { action: 'create' }
      → insert_conteudo.php (data, aula, serie, turma, turno, disciplina, ano, conteudo)
      → "0" = sucesso → salva sgeSyncedAt
```

### 5.3 Edicao

```
Se tem sgeId:
  → POST /api/sge/conteudo { action: 'edit' }
      → edit_conteudo.php (conteudo, sequencia)
Se nao tem:
  → Envia como novo (insert)
```

### 5.4 Exclusao

```
Se tem sgeId:
  → POST /api/sge/conteudo { action: 'delete' }
      → delete_conteudo.php (id)
```

### 5.5 Leitura (SGE → Luminar)

O `relatorio_detalhamento_chamada.php` retorna tabela `#myTableContent` com conteudos do dia.
Ao consultar SGE numa data, parse essa tabela e mostra com opcao "Importar".

### 5.6 UI

Na tela de chamada, dois botoes independentes (como no e-aluno):
- **Chamada** (presenca dos alunos)
- **Conteudo** (texto do que foi ensinado)

Ambos usam mesmos filtros (turma, disciplina, data) mas sao operacoes separadas.

## 6. Modulo: Ocorrencias (Bidirecional)

### 6.1 Modelo de Dados

Campos adicionais no tipo Ocorrencia existente:

```typescript
interface Ocorrencia {
  // ... campos existentes
  sgeId?: number;            // codigo no e-aluno
  sgeSyncedAt?: Date;
  sgeSyncError?: string;
  sgeStatus?: 'aberta' | 'aprovada' | 'cancelada';
}
```

### 6.2 Envio (Luminar → SGE)

```
Professor cria ocorrencia
  → Firestore
  → fire-and-forget: POST /api/sge/ocorrencia { action: 'create' }
      → insert_update_ocorrencia.php (codigo=0, aluno={sgeAlunoId}, motivo, ano)
      → "0" = sucesso
```

### 6.3 Edicao

```
Se tem sgeId:
  → POST /api/sge/ocorrencia { action: 'edit' }
      → insert_update_ocorrencia.php (codigo={sgeId}, aluno=0, motivo, ano)
```

### 6.4 Status

```
POST /api/sge/ocorrencia { action: 'status' }
  → update_status_ocorrencia.php (id, status)
```

### 6.5 Leitura (SGE → Luminar)

```
Botao "Consultar SGE" na tela de ocorrencias
  → POST /api/sge/ocorrencia { action: 'list' }
      → Fetch ocorrencias.php, parse 3 tabs (abertas, aprovadas, canceladas)
  → Mostra lista com opcao "Importar"
```

## 7. Modulo: Relatorios (Somente Leitura)

### 7.1 Nativos no Luminar (parse HTML → MUI)

| Relatorio | Endpoint SGE | Params |
|-----------|-------------|--------|
| Detalhamento dia | `relatorio_detalhamento_chamada.php` | serie, turma, turno, disciplina, data, ano |
| Detalhamento mensal | `relatorio_detalhamento_mensal.php` | serie, turma, turno, disciplina, mes, ano |

Parse do HTML e renderizacao com componentes MUI (Table, Chip, etc).

### 7.2 Proxy HTML (iframe/nova aba)

| Relatorio | Endpoint SGE |
|-----------|-------------|
| Faltas bimestrais | `relatorio_de_faltas.php` |
| Analise anual | `relatorio_de_analise_anual.php` |
| Assinatura | `relatorio_de_assinatura.php` |
| Listagem assinatura | `relatorio_listagem_de_assinatura.php` |

Rota `GET /api/sge/relatorio?tipo=faltas&...&token=...`:
1. Valida token temporario (gerado server-side, TTL 5min)
2. Fetch do e-aluno com sessao do pool
3. Retorna HTML limpo (sem scripts do e-aluno, CSS inline)
4. Renderiza no iframe ou nova aba

## 8. Campos Novos no Firestore

### Chamada (campos adicionais)

```typescript
sgeSequenciaMap?: Record<string, string>;  // alunoId → sequencia no e-aluno
sgeSyncError?: string;                      // mensagem de erro do ultimo sync
```

Nota: `sgeSyncedAt` ja existe.

### ConteudoAula (collection nova: `conteudos`)

```typescript
interface ConteudoAula {
  id: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: Date;
  tempo: number;
  conteudo: string;
  ano: number;
  sgeId?: string;
  sgeSyncedAt?: Date;
  sgeSyncError?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Ocorrencia (campos adicionais)

```typescript
sgeId?: number;
sgeSyncedAt?: Date;
sgeSyncError?: string;
sgeStatus?: 'aberta' | 'aprovada' | 'cancelada';
```

## 9. Migracao

### Fase 1: Criar novo (coexiste com antigo)

- `src/lib/sge/*` (session pool + clients)
- `/api/sge/*` (9 rotas)
- `conteudoService.ts`
- Tipos novos em `types/index.ts`

### Fase 2: Migrar frontend

- `RelatorioSGE.tsx` → usar `/api/sge/*`
- `EAlunoConfigModal.tsx` → renomear `SgeConfigModal`
- `ChamadaList.tsx` → sync imediato + chips
- Chamada page → campo conteudo independente
- Ocorrencias page → sync SGE

### Fase 3: Limpar legado

- Deletar `src/lib/eAlunoProxy.ts`
- Deletar `src/app/api/ealuno/*`
- Renomear exports de `eAlunoConfigService` → `sgeConfigService`
- Manter collection Firestore `eAlunoConfig` (nome inalterado)

### O que NAO muda

- Collection Firestore `eAlunoConfig` (manter nome)
- Formato de encriptacao de credenciais (AES-256-GCM)
- Mapeamentos existentes (turmaMap, disciplinaMap, alunoMap)
- Campos novos sao todos opcionais (`?`)

## 10. Endpoints SGE (e-aluno) Mapeados

Referencia completa dos endpoints PHP utilizados:

| Endpoint | Metodo | Body | Resposta |
|----------|--------|------|----------|
| `flogin.php` | POST | `user`, `user_password` | "0" + Set-Cookie PHPSESSID |
| `chamadas.php` | GET | - | HTML com dropdown cmbSerie |
| `show_chamadas.php?serie&turma&turno&ano` | POST | `show=1` | HTML tabela alunos + checkboxes |
| `get_disciplinas_chamada.php` | POST | `serie, turma, turno, ano, show=1` | JSON array `[{disciplina, descricao}]` |
| `insert_chamada.php?lista={ids}` | POST | `data, aula, serie, turma, turno, disciplina, ano, add=1` | "0" = sucesso |
| `edit_chamada.php` | POST | `parametro ("." ou "F"), sequencia, edit=1` | reload |
| `delete_chamada.php` | POST | `serie, turma, turno, disciplina, data, del=1` | reload |
| `insert_conteudo.php` | POST | `data, aula, serie, turma, turno, disciplina, ano, conteudo, add=1` | "0" = sucesso |
| `get_conteudo.php` | POST | `id, get=1` | JSON `{conteudo, sequencia}` |
| `edit_conteudo.php` | POST | `conteudo, sequencia, edit=1` | reload |
| `delete_conteudo.php` | POST | `id, del=1` | reload |
| `insert_update_ocorrencia.php` | POST | `codigo (0=novo), aluno, motivo, ano, add=1` | "0" = sucesso |
| `get_ocorrencia.php` | POST | `id, get=1` | JSON `{motivo}` |
| `update_status_ocorrencia.php` | POST | `id, status` | sucesso |
| `relatorio_detalhamento_chamada.php` | GET | `serie, turma, turno, disciplina, data, ano` | HTML |
| `relatorio_detalhamento_mensal.php` | GET | `serie, turma, turno, disciplina, mes, txtMes, txtSerie, ano` | HTML |
| `relatorio_de_faltas.php` | GET | `serie, turma, turno, txtSerie, ano` | HTML |
| `relatorio_de_analise_anual.php` | GET | `serie, turma, turno, txtSerie, ano` | HTML |
| `relatorio_de_assinatura.php` | GET | `serie, turma, turno, disciplina, txtDisciplina, txtSerie, mes, txtMes, ano` | HTML |
| `ocorrencias.php` | GET/POST | `cmbAno` | HTML com 4 tabs |

### Notas

- Formato de data no e-aluno: `DD/MM/YYYY` (converter de ISO `YYYY-MM-DD`)
- Resposta "0" = sucesso para todas as operacoes de escrita
- `sequencia` = ID unico do registro individual no e-aluno (aparece no HTML dos relatorios)
- `parametro` na edit_chamada: "." = presente, "F" = falta
- `codigo=0` no insert_update_ocorrencia = criar novo; `codigo>0` = editar existente
