# Relatorio Comparativo - Indices Firestore

## Resumo Executivo

| Categoria | Quantidade |
|-----------|------------|
| Indices configurados no Firebase | 10 |
| Indices usados pelo codigo | 8 |
| **Indices nao usados (remover)** | **2** |
| **Indices faltando (criar)** | **14** |

---

## Indices NAO USADOS (podem ser removidos)

Estes indices estao configurados no Firebase mas nao sao usados pelo codigo atual:

### 1. chamadas: turmaId ASC, data DESC
```json
{
  "collectionGroup": "chamadas",
  "fields": ["turmaId ASC", "data DESC"]
}
```
**Motivo:** O codigo usa apenas queries com range (`>=`, `<=`) no campo `data`, que requerem ordenacao ASC. O indice com DESC nao e necessario.

### 2. disciplinas: ativo ASC, nome ASC
```json
{
  "collectionGroup": "disciplinas",
  "fields": ["ativo ASC", "nome ASC"]
}
```
**Motivo:** O codigo usa `ativo + ordem + nome`, nunca `ativo + nome` diretamente.

---

## Indices FALTANDO (precisam ser criados)

Estes indices sao necessarios pelo codigo mas nao estao configurados:

### Collection: mapeamentoSala (3 indices)

```json
{
  "collectionGroup": "mapeamentoSala",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "turmaId", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `mapeamentoSalaService.ts:14` - `getByTurma()`

```json
{
  "collectionGroup": "mapeamentoSala",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "professorId", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `mapeamentoSalaService.ts:17` - `getByProfessor()`

```json
{
  "collectionGroup": "mapeamentoSala",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "turmaId", "order": "ASCENDING" },
    { "fieldPath": "professorId", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `mapeamentoSalaService.ts:21-23` - `getByTurmaProfessorAno()`

### Collection: ocorrencias (1 indice)

```json
{
  "collectionGroup": "ocorrencias",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "data", "order": "DESCENDING" }
  ]
}
```
**Usado em:** `ocorrenciaService.ts:14-23` - `getByStatus()`

### Collection: notas (1 indice)

```json
{
  "collectionGroup": "notas",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "alunoId", "order": "ASCENDING" },
    { "fieldPath": "turmaId", "order": "ASCENDING" },
    { "fieldPath": "disciplinaId", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `notaService.ts:15-18` - `getByAlunoTurmaDisciplina()`

### Collection: professores (1 indice)

```json
{
  "collectionGroup": "professores",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "ativo", "order": "ASCENDING" },
    { "fieldPath": "nome", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `professorService.ts:13` - `getAtivos()`

### Collection: avaliacaoRubricas (5 indices)

```json
{
  "collectionGroup": "avaliacaoRubricas",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "turmaId", "order": "ASCENDING" },
    { "fieldPath": "bimestre", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `avaliacaoRubricaService.ts:15-17` - `getByTurma()`

```json
{
  "collectionGroup": "avaliacaoRubricas",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "turmaId", "order": "ASCENDING" },
    { "fieldPath": "bimestre", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" },
    { "fieldPath": "av", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `avaliacaoRubricaService.ts:22-25` - `getByTurmaAv()`

```json
{
  "collectionGroup": "avaliacaoRubricas",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "alunoId", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `avaliacaoRubricaService.ts:29` - `getByAluno()`

```json
{
  "collectionGroup": "avaliacaoRubricas",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "alunoId", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "DESCENDING" }
  ]
}
```
**Usado em:** `avaliacaoRubricaService.ts:32` - `getByAlunoCompleto()`

```json
{
  "collectionGroup": "avaliacaoRubricas",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "alunoId", "order": "ASCENDING" },
    { "fieldPath": "bimestre", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `avaliacaoRubricaService.ts:36-38` - `getByAlunoBimestre()`

### Collection: conceitos (1 indice)

```json
{
  "collectionGroup": "conceitos",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "alunoId", "order": "ASCENDING" },
    { "fieldPath": "mes", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `conceitoService.ts:15-17` - `getByAlunoMes()`

### Collection: templateComposicao (2 indices)

```json
{
  "collectionGroup": "templateComposicao",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "turmaId", "order": "ASCENDING" },
    { "fieldPath": "disciplinaId", "order": "ASCENDING" },
    { "fieldPath": "bimestre", "order": "ASCENDING" },
    { "fieldPath": "av", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `templateComposicaoService.ts:21-25` - `getByTurma()`

```json
{
  "collectionGroup": "templateComposicao",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "turmaId", "order": "ASCENDING" },
    { "fieldPath": "disciplinaId", "order": "ASCENDING" },
    { "fieldPath": "bimestre", "order": "ASCENDING" },
    { "fieldPath": "ano", "order": "ASCENDING" }
  ]
}
```
**Usado em:** `templateComposicaoService.ts:37-40` - `getByTurmaBimestre()`

---

## Arquivo firestore.indexes.json Atualizado

Crie ou atualize o arquivo `firestore.indexes.json` na raiz do projeto:

```json
{
  "indexes": [
    {
      "collectionGroup": "alunos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "ativo", "order": "ASCENDING" },
        { "fieldPath": "nome", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "avaliacaoRubricas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "alunoId", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "avaliacaoRubricas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "alunoId", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "avaliacaoRubricas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "alunoId", "order": "ASCENDING" },
        { "fieldPath": "bimestre", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "avaliacaoRubricas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "bimestre", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "avaliacaoRubricas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "bimestre", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" },
        { "fieldPath": "av", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "chamadas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "conceitos",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "alunoId", "order": "ASCENDING" },
        { "fieldPath": "mes", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "disciplinas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ativo", "order": "ASCENDING" },
        { "fieldPath": "ordem", "order": "ASCENDING" },
        { "fieldPath": "nome", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "disciplinas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "parentId", "order": "ASCENDING" },
        { "fieldPath": "ativo", "order": "ASCENDING" },
        { "fieldPath": "ordem", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "disciplinas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ordem", "order": "ASCENDING" },
        { "fieldPath": "nome", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "mapeamentoSala",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "professorId", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "mapeamentoSala",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "mapeamentoSala",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "professorId", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "alunoId", "order": "ASCENDING" },
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "disciplinaId", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "ocorrencias",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "alunoId", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "ocorrencias",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "professores",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ativo", "order": "ASCENDING" },
        { "fieldPath": "nome", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "rubricas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ativo", "order": "ASCENDING" },
        { "fieldPath": "ordem", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "templateComposicao",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "disciplinaId", "order": "ASCENDING" },
        { "fieldPath": "bimestre", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "templateComposicao",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "turmaId", "order": "ASCENDING" },
        { "fieldPath": "disciplinaId", "order": "ASCENDING" },
        { "fieldPath": "bimestre", "order": "ASCENDING" },
        { "fieldPath": "av", "order": "ASCENDING" },
        { "fieldPath": "ano", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "turmas",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "ano", "order": "ASCENDING" },
        { "fieldPath": "ativo", "order": "ASCENDING" },
        { "fieldPath": "nome", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

## Comandos para Aplicar

1. **Criar os indices faltando:**
```bash
npx firebase-tools deploy --only firestore:indexes --project sgenw-4d2d8
```

2. **Remover indices nao usados (via Console Firebase):**
   - Acesse: https://console.firebase.google.com/project/sgenw-4d2d8/firestore/indexes
   - Delete manualmente:
     - `chamadas: turmaId, data DESC`
     - `disciplinas: ativo, nome`

---

## Nota sobre Indices com Range Queries

Os indices para queries com `>=` e `<=` (como em `chamadas` e `ocorrencias`) requerem que o campo de range seja o ultimo na ordenacao. O Firestore automaticamente cria indices para equality filters + um range filter.
