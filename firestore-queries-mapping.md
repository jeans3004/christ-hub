# Mapeamento de Queries Compostas - Firestore

Este documento lista todas as queries que requerem indices compostos no Firestore.

## Resumo de Indices Necessarios

| Collection | Campos | Tipo | Arquivo |
|------------|--------|------|---------|
| turmas | ano, ativo, nome (asc) | where+where+orderBy | turmaService.ts:14 |
| alunos | turmaId, ativo, nome (asc) | where+where+orderBy | alunoService.ts:14 |
| mapeamentoSala | turmaId, ano | where+where | mapeamentoSalaService.ts:14 |
| mapeamentoSala | professorId, ano | where+where | mapeamentoSalaService.ts:17 |
| mapeamentoSala | turmaId, professorId, ano | where+where+where | mapeamentoSalaService.ts:21-23 |
| ocorrencias | status, data (desc) | where+orderBy | ocorrenciaService.ts:14-23 |
| ocorrencias | status, data (>=, <=), data (desc) | where+range+orderBy | ocorrenciaService.ts:14-23 |
| ocorrencias | alunoId, data (desc) | where+orderBy | ocorrenciaService.ts:28 |
| notas | alunoId, turmaId, disciplinaId, ano | where+where+where+where | notaService.ts:15-18 |
| chamadas | turmaId, data (>=, <=) | where+range+range | chamadaService.ts:20-22 |
| chamadas | turmaId, data (>=, <=) | where+range+range | chamadaService.ts:31-33 |
| disciplinas | ordem (asc), nome (asc) | orderBy+orderBy | disciplinaService.ts:13 |
| disciplinas | ativo, ordem (asc), nome (asc) | where+orderBy+orderBy | disciplinaService.ts:14 |
| disciplinas | parentId, ativo, ordem (asc) | where+where+orderBy | disciplinaService.ts:21-23 |
| disciplinas | parentId, ativo, ordem (asc) | where+where+orderBy | disciplinaService.ts:27-29 |
| disciplinas | parentId, ativo, ordem (asc) | where+where+orderBy | disciplinaService.ts:33-35 |
| professores | ativo, nome (asc) | where+orderBy | professorService.ts:13 |
| rubricas | ativo, ordem (asc) | where+orderBy | rubricaService.ts:12 |
| avaliacaoRubricas | turmaId, bimestre, ano | where+where+where | avaliacaoRubricaService.ts:15-17 |
| avaliacaoRubricas | turmaId, bimestre, ano, av | where+where+where+where | avaliacaoRubricaService.ts:22-25 |
| avaliacaoRubricas | alunoId, ano | where+where | avaliacaoRubricaService.ts:29 |
| avaliacaoRubricas | alunoId, ano (desc) | where+orderBy | avaliacaoRubricaService.ts:32 |
| avaliacaoRubricas | alunoId, bimestre, ano | where+where+where | avaliacaoRubricaService.ts:36-38 |
| conceitos | alunoId, mes, ano | where+where+where | conceitoService.ts:15-17 |
| templateComposicao | turmaId, disciplinaId, bimestre, av, ano | where*5 | templateComposicaoService.ts:21-25 |
| templateComposicao | turmaId, disciplinaId, bimestre, ano | where*4 | templateComposicaoService.ts:37-40 |

---

## Detalhamento por Servico

### 1. turmaService.ts
```typescript
// Linha 12 - Query simples (indice automatico)
getAll: () => getDocuments<Turma>(COLLECTION, [orderBy('nome')])

// Linha 14 - REQUER INDICE COMPOSTO
getByAno: (ano: number) =>
  getDocuments<Turma>(COLLECTION, [
    where('ano', '==', ano),
    where('ativo', '==', true),
    orderBy('nome')
  ])
// INDICE: turmas -> ano ASC, ativo ASC, nome ASC
```

### 2. alunoService.ts
```typescript
// Linha 12 - Query simples (indice automatico)
getAll: () => getDocuments<Aluno>(COLLECTION, [orderBy('nome')])

// Linha 14 - REQUER INDICE COMPOSTO
getByTurma: (turmaId: string) =>
  getDocuments<Aluno>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('ativo', '==', true),
    orderBy('nome')
  ])
// INDICE: alunos -> turmaId ASC, ativo ASC, nome ASC
```

### 3. mapeamentoSalaService.ts
```typescript
// Linha 14 - REQUER INDICE COMPOSTO
getByTurma: (turmaId: string, ano: number) =>
  getDocuments<MapeamentoSala>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('ano', '==', ano)
  ])
// INDICE: mapeamentoSala -> turmaId ASC, ano ASC

// Linha 17 - REQUER INDICE COMPOSTO
getByProfessor: (professorId: string, ano: number) =>
  getDocuments<MapeamentoSala>(COLLECTION, [
    where('professorId', '==', professorId),
    where('ano', '==', ano)
  ])
// INDICE: mapeamentoSala -> professorId ASC, ano ASC

// Linhas 21-23 - REQUER INDICE COMPOSTO
getByTurmaProfessorAno: (turmaId, professorId, ano) =>
  getDocuments<MapeamentoSala>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('professorId', '==', professorId),
    where('ano', '==', ano)
  ])
// INDICE: mapeamentoSala -> turmaId ASC, professorId ASC, ano ASC
```

### 4. ocorrenciaService.ts
```typescript
// Linhas 14-23 - REQUER INDICE COMPOSTO
getByStatus: (status, ano?) => {
  const constraints = [where('status', '==', status)];
  if (ano) {
    constraints.push(
      where('data', '>=', Timestamp.fromDate(startOfYear)),
      where('data', '<=', Timestamp.fromDate(endOfYear))
    );
  }
  constraints.push(orderBy('data', 'desc'));
}
// INDICE: ocorrencias -> status ASC, data DESC
// INDICE (com ano): ocorrencias -> status ASC, data ASC (para range)

// Linha 28 - REQUER INDICE COMPOSTO
getByAluno: (alunoId: string) =>
  getDocuments<Ocorrencia>(COLLECTION, [
    where('alunoId', '==', alunoId),
    orderBy('data', 'desc')
  ])
// INDICE: ocorrencias -> alunoId ASC, data DESC
```

### 5. notaService.ts
```typescript
// Linhas 15-18 - REQUER INDICE COMPOSTO
getByAlunoTurmaDisciplina: (alunoId, turmaId, disciplinaId, ano) =>
  getDocuments<Nota>(COLLECTION, [
    where('alunoId', '==', alunoId),
    where('turmaId', '==', turmaId),
    where('disciplinaId', '==', disciplinaId),
    where('ano', '==', ano)
  ])
// INDICE: notas -> alunoId ASC, turmaId ASC, disciplinaId ASC, ano ASC
```

### 6. chamadaService.ts
```typescript
// Linhas 20-22 - REQUER INDICE COMPOSTO
getByTurmaData: (turmaId, data) =>
  getDocuments<Chamada>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('data', '>=', Timestamp.fromDate(startOfDay)),
    where('data', '<=', Timestamp.fromDate(endOfDay))
  ])
// INDICE: chamadas -> turmaId ASC, data ASC

// Linhas 31-33 - REQUER INDICE COMPOSTO
getByTurmaAno: (turmaId, ano) =>
  getDocuments<Chamada>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('data', '>=', Timestamp.fromDate(startOfYear)),
    where('data', '<=', Timestamp.fromDate(endOfYear))
  ])
// INDICE: chamadas -> turmaId ASC, data ASC (mesmo indice anterior)
```

### 7. disciplinaService.ts
```typescript
// Linha 13 - REQUER INDICE COMPOSTO
getAll: () => getDocuments<Disciplina>(COLLECTION, [
  orderBy('ordem'),
  orderBy('nome')
])
// INDICE: disciplinas -> ordem ASC, nome ASC

// Linha 14 - REQUER INDICE COMPOSTO
getAtivas: () => getDocuments<Disciplina>(COLLECTION, [
  where('ativo', '==', true),
  orderBy('ordem'),
  orderBy('nome')
])
// INDICE: disciplinas -> ativo ASC, ordem ASC, nome ASC

// Linhas 21-23, 27-29, 33-35 - REQUER INDICE COMPOSTO
getRootAtivas / getByParent / countChildren: () =>
  getDocuments<Disciplina>(COLLECTION, [
    where('parentId', '==', parentId),
    where('ativo', '==', true),
    orderBy('ordem')
  ])
// INDICE: disciplinas -> parentId ASC, ativo ASC, ordem ASC
```

### 8. professorService.ts
```typescript
// Linha 13 - REQUER INDICE COMPOSTO
getAtivos: () => getDocuments<Professor>(COLLECTION, [
  where('ativo', '==', true),
  orderBy('nome')
])
// INDICE: professores -> ativo ASC, nome ASC
```

### 9. rubricaService.ts
```typescript
// Linha 12 - REQUER INDICE COMPOSTO
getAll: () => getDocuments<Rubrica>(COLLECTION, [
  where('ativo', '==', true),
  orderBy('ordem', 'asc')
])
// INDICE: rubricas -> ativo ASC, ordem ASC
```

### 10. avaliacaoRubricaService.ts
```typescript
// Linhas 15-17 - REQUER INDICE COMPOSTO
getByTurma: (turmaId, bimestre, ano) =>
  getDocuments<AvaliacaoRubrica>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('bimestre', '==', bimestre),
    where('ano', '==', ano)
  ])
// INDICE: avaliacaoRubricas -> turmaId ASC, bimestre ASC, ano ASC

// Linhas 22-25 - REQUER INDICE COMPOSTO
getByTurmaAv: (turmaId, bimestre, ano, av) =>
  getDocuments<AvaliacaoRubrica>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('bimestre', '==', bimestre),
    where('ano', '==', ano),
    where('av', '==', av)
  ])
// INDICE: avaliacaoRubricas -> turmaId ASC, bimestre ASC, ano ASC, av ASC

// Linha 29 - REQUER INDICE COMPOSTO
getByAluno: (alunoId, ano) =>
  getDocuments<AvaliacaoRubrica>(COLLECTION, [
    where('alunoId', '==', alunoId),
    where('ano', '==', ano)
  ])
// INDICE: avaliacaoRubricas -> alunoId ASC, ano ASC

// Linha 32 - REQUER INDICE COMPOSTO
getByAlunoCompleto: (alunoId) =>
  getDocuments<AvaliacaoRubrica>(COLLECTION, [
    where('alunoId', '==', alunoId),
    orderBy('ano', 'desc')
  ])
// INDICE: avaliacaoRubricas -> alunoId ASC, ano DESC

// Linhas 36-38 - REQUER INDICE COMPOSTO
getByAlunoBimestre: (alunoId, bimestre, ano) =>
  getDocuments<AvaliacaoRubrica>(COLLECTION, [
    where('alunoId', '==', alunoId),
    where('bimestre', '==', bimestre),
    where('ano', '==', ano)
  ])
// INDICE: avaliacaoRubricas -> alunoId ASC, bimestre ASC, ano ASC
```

### 11. conceitoService.ts
```typescript
// Linhas 15-17 - REQUER INDICE COMPOSTO
getByAlunoMes: (alunoId, mes, ano) =>
  getDocuments<Conceito>(COLLECTION, [
    where('alunoId', '==', alunoId),
    where('mes', '==', mes),
    where('ano', '==', ano)
  ])
// INDICE: conceitos -> alunoId ASC, mes ASC, ano ASC
```

### 12. templateComposicaoService.ts
```typescript
// Linhas 21-25 - REQUER INDICE COMPOSTO
getByTurma: (turmaId, disciplinaId, bimestre, av, ano) =>
  getDocuments<TemplateComposicao>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('disciplinaId', '==', disciplinaId),
    where('bimestre', '==', bimestre),
    where('av', '==', av),
    where('ano', '==', ano)
  ])
// INDICE: templateComposicao -> turmaId, disciplinaId, bimestre, av, ano (todos ASC)

// Linhas 37-40 - REQUER INDICE COMPOSTO
getByTurmaBimestre: (turmaId, disciplinaId, bimestre, ano) =>
  getDocuments<TemplateComposicao>(COLLECTION, [
    where('turmaId', '==', turmaId),
    where('disciplinaId', '==', disciplinaId),
    where('bimestre', '==', bimestre),
    where('ano', '==', ano)
  ])
// INDICE: templateComposicao -> turmaId, disciplinaId, bimestre, ano (todos ASC)
```

---

## Indices Unicos Necessarios (Consolidado)

Total: **20 indices compostos**

```json
{
  "indexes": [
    { "collection": "turmas", "fields": ["ano", "ativo", "nome"] },
    { "collection": "alunos", "fields": ["turmaId", "ativo", "nome"] },
    { "collection": "mapeamentoSala", "fields": ["turmaId", "ano"] },
    { "collection": "mapeamentoSala", "fields": ["professorId", "ano"] },
    { "collection": "mapeamentoSala", "fields": ["turmaId", "professorId", "ano"] },
    { "collection": "ocorrencias", "fields": [["status", "ASC"], ["data", "DESC"]] },
    { "collection": "ocorrencias", "fields": [["alunoId", "ASC"], ["data", "DESC"]] },
    { "collection": "notas", "fields": ["alunoId", "turmaId", "disciplinaId", "ano"] },
    { "collection": "chamadas", "fields": ["turmaId", "data"] },
    { "collection": "disciplinas", "fields": ["ordem", "nome"] },
    { "collection": "disciplinas", "fields": ["ativo", "ordem", "nome"] },
    { "collection": "disciplinas", "fields": ["parentId", "ativo", "ordem"] },
    { "collection": "professores", "fields": ["ativo", "nome"] },
    { "collection": "rubricas", "fields": ["ativo", "ordem"] },
    { "collection": "avaliacaoRubricas", "fields": ["turmaId", "bimestre", "ano"] },
    { "collection": "avaliacaoRubricas", "fields": ["turmaId", "bimestre", "ano", "av"] },
    { "collection": "avaliacaoRubricas", "fields": ["alunoId", "ano"] },
    { "collection": "avaliacaoRubricas", "fields": [["alunoId", "ASC"], ["ano", "DESC"]] },
    { "collection": "avaliacaoRubricas", "fields": ["alunoId", "bimestre", "ano"] },
    { "collection": "conceitos", "fields": ["alunoId", "mes", "ano"] },
    { "collection": "templateComposicao", "fields": ["turmaId", "disciplinaId", "bimestre", "av", "ano"] },
    { "collection": "templateComposicao", "fields": ["turmaId", "disciplinaId", "bimestre", "ano"] }
  ]
}
```

---

## Proximo Passo

Execute o comando abaixo para exportar os indices atuais do Firebase:

```bash
firebase firestore:indexes > firestore-indexes-export.json
```

Depois, compartilhe o conteudo do arquivo `firestore-indexes-export.json` para comparacao.
