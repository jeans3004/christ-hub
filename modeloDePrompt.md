Atue como um engenheiro de prompts sênior especializado em desenvolvimento Next.js/React com experiência em sistemas educacionais. Sua tarefa é refinar o prompt que fornecerei, tornando-o compatível com a arquitetura existente do sistema SGE Diário Digital.

## Contexto do Sistema

### Stack Tecnológico
- **Framework**: Next.js 16+ (App Router)
- **Linguagem**: TypeScript 5+ (strict mode)
- **UI**: MUI v7 (Material UI com Material Design 3) - tema customizado
- **Backend**: Firebase (Firestore, Auth com Google, Storage)
- **Estado**: Zustand (stores: authStore, uiStore, filterStore)
- **WhatsApp**: Evolution API v2.2.3 (Baileys)
- **Hospedagem**: Vercel (Frontend) + Oracle Cloud Free Tier (Evolution API)

### Arquitetura e Padrões Obrigatórios

**Estrutura de Arquivos** (máximo 150-200 linhas por arquivo):
```
src/
├── app/
│   ├── api/                      # API Routes
│   │   └── whatsapp/             # Rotas WhatsApp (send, send-bulk, status, qrcode, groups)
│   ├── diario/[modulo]/
│   │   ├── page.tsx              # Página principal (apenas orquestração)
│   │   ├── types.ts              # Tipos específicos do módulo
│   │   ├── components/           # Componentes do módulo
│   │   │   ├── index.ts          # Re-exports
│   │   │   └── [Component].tsx
│   │   ├── hooks/
│   │   │   ├── index.ts          # Re-exports
│   │   │   ├── use[Modulo]Loader.ts  # Carregamento de dados
│   │   │   └── use[Modulo]Actions.ts # Ações/mutações
│   │   └── utils/                # Utilitários específicos do módulo
│   └── login/
├── components/
│   ├── ui/                       # Componentes genéricos (DataTable, FormModal, ConfirmDialog)
│   ├── common/                   # Componentes compartilhados (DisciplinaSelect, etc.)
│   └── layout/                   # MainLayout, Sidebar, etc.
├── hooks/                        # Hooks globais (useAuth, useModal, usePermissions)
├── services/
│   ├── firestore/                # Serviços por entidade ([entidade]Service.ts)
│   └── whatsappService.ts        # Cliente Evolution API
├── store/                        # Zustand stores
├── types/                        # Tipos globais (index.ts)
├── constants/                    # Constantes (navigation.tsx, permissions.ts)
└── lib/                          # Configurações (firebase.ts, theme.ts)
```

**Convenções de Código**:
- Hooks de dados: separar em Loader (fetch), Actions (mutations)
- Componentes: extrair sub-componentes quando > 150 linhas
- Sub-componentes: pasta própria dentro de components/ (ex: components/composer/)
- Serviços: `[entidade]Service` em `services/firestore/` com métodos CRUD
- Modais: usar hook `useModal<T>()` para gerenciar estado
- Permissões: usar `usePermissions()` com `can('permissao:acao')`
- Toast: usar `useUIStore().addToast(message, 'success'|'error'|'warning'|'info')`
- Filtros: usar `useFilterStore()` para ano/turma globais

---

## Entidades do Sistema (Firestore)

### Usuario/Professor
```typescript
interface Usuario {
  id: string;
  nome: string;
  email: string;
  cpf?: string;
  celular?: string;                    // Telefone para WhatsApp
  tipo: 'professor' | 'coordenador' | 'administrador';
  disciplinaIds?: string[];
  turmaIds?: string[];
  permissions: Permission[];
  // Integração Google Auth
  googleUid?: string | null;
  googleEmail?: string;
  authStatus?: 'pending' | 'linked';
  firstLoginAt?: Date | null;
  createdBy?: string;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Aluno
```typescript
interface Aluno {
  id: string;
  nome: string;
  matricula?: string;
  turmaId: string;
  dataNascimento?: Date;
  fotoUrl?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Turma
```typescript
interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: 'matutino' | 'vespertino' | 'noturno';
  ano: number;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Disciplina (com hierarquia)
```typescript
interface Disciplina {
  id: string;
  nome: string;
  codigo?: string;
  turmaIds: string[];
  parentId?: string | null;  // Hierarquia (max 3 níveis)
  ordem: number;
  isGroup?: boolean;         // Grupo organizacional (não selecionável)
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Rubrica
```typescript
interface Rubrica {
  id: string;
  nome: string;
  descricao?: string;
  niveis: { nivel: 'A'|'B'|'C'|'D'|'E', descricao: string }[];
  tipo: 'geral' | 'professor';
  criadorId?: string;
  ordem: number;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Chamada
```typescript
interface Chamada {
  id: string;
  alunoId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: Date;
  presente: boolean;
  justificativa?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Nota
```typescript
interface Nota {
  id: string;
  alunoId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  bimestre: 1 | 2 | 3 | 4;
  ano: number;
  valor: number;
  tipo: 'prova' | 'trabalho' | 'participacao' | 'outro';
  descricao?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Conceito
```typescript
interface Conceito {
  id: string;
  alunoId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  bimestre: 1 | 2 | 3 | 4;
  ano: number;
  valor: 'A' | 'B' | 'C' | 'D' | 'E';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Ocorrencia
```typescript
interface Ocorrencia {
  id: string;
  alunoId: string;
  turmaId: string;
  professorId: string;
  data: Date;
  tipo: 'positiva' | 'negativa' | 'neutra';
  descricao: string;
  gravidade?: 'leve' | 'media' | 'grave';
  status?: 'aberta' | 'resolvida';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### AvaliacaoRubrica
```typescript
interface AvaliacaoRubrica {
  id: string;
  alunoId: string;
  turmaId: string;
  rubricaId: string;
  disciplinaId?: string;
  bimestre: 1 | 2 | 3 | 4;
  ano: number;
  nivel: 'A' | 'B' | 'C' | 'D' | 'E';
  professorId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### MapeamentoSala
```typescript
interface MapeamentoSala {
  id: string;
  turmaId: string;
  professorId: string;
  ano: number;
  layout: { rows: number; cols: number };
  assentos: { row: number; col: number; alunoId: string }[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### MensagemLog
```typescript
interface MensagemLog {
  id: string;
  destinatarioId: string;
  destinatarioNome: string;
  destinatarioNumero: string;
  mensagem: string;
  tipo: 'individual' | 'broadcast' | 'grupo';
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed';
  enviadoPorId: string;
  enviadoPorNome: string;
  templateId?: string;
  messageId?: string;
  erro?: string;
  enviadoEm: Date;
  entregueEm?: Date;
  lidoEm?: Date;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### TemplateMensagem
```typescript
interface TemplateMensagem {
  id: string;
  nome: string;
  conteudo: string;           // Suporta variáveis: {{nome}}, {{turma}}, etc
  variaveis: string[];        // Lista de variáveis extraídas automaticamente
  categoria: 'aviso' | 'lembrete' | 'comunicado' | 'outro';
  criadoPorId: string;
  criadoPorNome: string;
  usageCount: number;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## Módulos Implementados

| Rota | Descrição | Permissão |
|------|-----------|-----------|
| `/diario/menu` | Dashboard inicial | todos |
| `/diario/chamada` | Registro de presença | chamada:view |
| `/diario/notas` | Notas com composição | notas:view |
| `/diario/conceitos` | Avaliações por rubricas | conceitos:view |
| `/diario/dossie` | Dossiê completo do aluno | alunos:view |
| `/diario/mapeamento` | Mapa de sala interativo | chamada:view |
| `/diario/ocorrencias` | Gestão de ocorrências | ocorrencias:view |
| `/diario/professores` | Cadastro com Google Auth | professores:view |
| `/diario/mensagens` | WhatsApp com compositor avançado | mensagens:view |
| `/diario/graficos` | Visualizações | coordenador+ |
| `/diario/agenda` | Agenda escolar | todos |
| `/diario/aniversariantes` | Relatório de aniversários | todos |
| `/diario/senha` | Alteração de senha | todos |
| `/cadastros/turmas` | CRUD de turmas | turmas:view |
| `/cadastros/alunos` | CRUD de alunos | alunos:view |
| `/cadastros/disciplinas` | Hierarquia de disciplinas | coordenador+ |

---

## Módulo de Mensagens WhatsApp (Detalhado)

### Estrutura de Arquivos
```
src/app/diario/mensagens/
├── page.tsx                    # Página principal
├── types.ts                    # Tipos do módulo
├── components/
│   ├── index.ts
│   ├── MensagemComposer.tsx   # Compositor principal
│   ├── DestinatarioSelector.tsx
│   ├── HistoricoTable.tsx
│   ├── StatusIndicator.tsx
│   └── composer/              # Sub-componentes do compositor
│       ├── index.ts
│       ├── FormatToolbar.tsx  # Barra de formatação (negrito, itálico, etc)
│       ├── TextEditor.tsx     # Editor com formatação e atalhos
│       ├── MessagePreview.tsx # Preview estilo bolha WhatsApp
│       ├── MediaUploader.tsx  # Upload de mídia
│       ├── MediaPreview.tsx   # Preview de mídia anexada
│       ├── TemplateSelector.tsx # Seletor de templates
│       ├── VariableInputs.tsx # Inputs de variáveis
│       └── EmojiPicker.tsx    # Seletor de emojis
├── hooks/
│   ├── index.ts
│   ├── useMensagensLoader.ts  # Carrega destinatários, histórico, templates
│   ├── useMensagensActions.ts # Ações de envio
│   ├── useComposer.ts         # Estado do compositor
│   ├── useFormatting.ts       # Aplicação de formatação
│   └── useTemplates.ts        # CRUD de templates
└── utils/
    ├── index.ts
    ├── formatWhatsApp.ts      # Formatação WhatsApp <-> HTML
    └── variableReplacer.ts    # Substituição de variáveis
```

### Tipos do Compositor
```typescript
// Tipos de mensagem suportados
type TipoMensagemMedia = 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'sticker';

// Payload da mensagem
interface MensagemPayload {
  tipo: TipoMensagemMedia;
  texto?: string;
  mediaUrl?: string;
  mediaBase64?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  linkPreview?: boolean;
  variaveis?: Record<string, string>;
}

// Tipos de formatação
type FormatType = 'bold' | 'italic' | 'strike' | 'mono' | 'code' | 'list' | 'quote';

// Marcadores de formatação WhatsApp
const FORMAT_MARKERS = {
  bold: { prefix: '*', suffix: '*' },
  italic: { prefix: '_', suffix: '_' },
  strike: { prefix: '~', suffix: '~' },
  mono: { prefix: '`', suffix: '`' },
  code: { prefix: '```\n', suffix: '\n```' },
  list: { prefix: '• ', suffix: '' },
  quote: { prefix: '> ', suffix: '' },
};
```

---

## Serviços Disponíveis

### Firestore Services
```typescript
// services/firestore/
alunoService           // getByTurma(), getAll(), create(), update(), delete()
turmaService           // getByAno(), getAll(), create(), update(), delete()
disciplinaService      // getSelectable(), getSelectableByTurma(), getAtivas(), getByParent()
usuarioService         // getProfessores(), getByGoogleEmail(), linkUidToEmail(), checkEmailExists()
chamadaService         // getByTurmaData(), getByTurmaAno(), getByAlunoAno(), create(), update()
notaService            // getByAlunoTurmaDisciplina(), create(), update()
rubricaService         // getAll(), getAtivas(), create(), update()
avaliacaoRubricaService // getByTurma(), getByAluno(), create(), update()
ocorrenciaService      // getByStatus(), getByAluno(), create(), update()
mapeamentoSalaService  // getByTurmaProfessorAno(), create(), update()
templateMensagemService // getAll(), create(), update(), incrementUsage(), processTemplate()
mensagemLogService     // getByPeriodo(), create(), update()
```

### WhatsApp Service
```typescript
// services/whatsappService.ts
export const whatsappService = {
  // Envio de mensagens
  sendText(numero: string, mensagem: string): Promise<SendMessageResult>,
  sendToGroup(groupId: string, mensagem: string): Promise<SendMessageResult>,
  sendImage(numero: string, media: { base64?: string; url?: string }, caption?: string): Promise<SendMessageResult>,
  sendDocument(numero: string, media: { base64?: string; url?: string; filename?: string }, caption?: string): Promise<SendMessageResult>,
  sendAudio(numero: string, media: { base64?: string; url?: string }): Promise<SendMessageResult>,
  sendVideo(numero: string, media: { base64?: string; url?: string }, caption?: string): Promise<SendMessageResult>,
  sendLocation(numero: string, location: { latitude: number; longitude: number; name?: string }): Promise<SendMessageResult>,
  sendContact(numero: string, contact: { name: string; phone: string }): Promise<SendMessageResult>,
  sendSticker(numero: string, media: { base64?: string; url?: string }): Promise<SendMessageResult>,

  // Status e conexão
  getStatus(): Promise<WhatsAppStatus>,
  getQRCode(): Promise<{ qrcode?: string; pairingCode?: string; error?: string }>,
  getGroups(): Promise<{ groups: GrupoWhatsApp[]; error?: string }>,
  disconnect(): Promise<{ success: boolean; error?: string }>,
  createInstance(): Promise<{ success: boolean; error?: string }>,
  checkNumber(numero: string): Promise<{ exists: boolean; jid?: string; error?: string }>,
};
```

### Storage Service
```typescript
// services/storageService.ts
storageService.uploadAlunoPhoto(alunoId: string, file: File): Promise<string>
storageService.deleteAlunoPhoto(alunoId: string): Promise<void>
storageService.getAlunoPhotoUrl(alunoId: string): Promise<string | null>
```

---

## Componentes UI Reutilizáveis

### Componentes Globais
```typescript
// components/ui/
DataTable              // Tabela com ações, loading, empty state
FormModal              // Modal com formulário, loading, submit
ConfirmDialog          // Diálogo de confirmação
LoadingOverlay         // Overlay de carregamento

// components/common/
DisciplinaSelect       // Select de disciplinas (filtra grupos)
TurmaSelect            // Select de turmas por ano
CheckboxSelector       // Seletor de múltiplos itens com agrupamento
```

### Componentes do Compositor de Mensagens
```typescript
// app/diario/mensagens/components/composer/
FormatToolbar          // Barra de formatação WhatsApp
TextEditor             // Editor com formatação e atalhos (Ctrl+B, Ctrl+I)
MessagePreview         // Preview estilo bolha WhatsApp
MediaUploader          // Upload de mídia (imagem, documento, áudio, vídeo)
MediaPreview           // Preview de mídia anexada
TemplateSelector       // Seletor de templates com busca e filtros
VariableInputs         // Inputs para variáveis de template
EmojiPicker            // Seletor de emojis com categorias
```

---

## Sistema de Permissões

```typescript
type Permission =
  // Alunos
  | 'alunos:view' | 'alunos:create' | 'alunos:edit' | 'alunos:delete'
  // Turmas
  | 'turmas:view' | 'turmas:create' | 'turmas:edit' | 'turmas:delete'
  // Disciplinas
  | 'disciplinas:view' | 'disciplinas:create' | 'disciplinas:edit' | 'disciplinas:delete'
  // Professores
  | 'professores:view' | 'professores:create' | 'professores:edit' | 'professores:delete'
  // Chamada
  | 'chamada:view' | 'chamada:edit'
  // Notas
  | 'notas:view' | 'notas:edit'
  // Conceitos
  | 'conceitos:view' | 'conceitos:edit'
  // Ocorrências
  | 'ocorrencias:view' | 'ocorrencias:create' | 'ocorrencias:edit' | 'ocorrencias:delete'
  // Mensagens
  | 'mensagens:view' | 'mensagens:send' | 'mensagens:templates'
  // Relatórios
  | 'relatorios:view'
  // Admin
  | 'admin:full';

// Uso
const { can } = usePermissions();
if (!can('mensagens:send')) return <AccessDenied />;
```

---

## Integração WhatsApp (Evolution API)

### Configuração (.env.local)
```env
EVOLUTION_API_URL=http://163.176.239.167:8080
EVOLUTION_API_KEY=B6D711FCDE4D4FD5936544120E713976
EVOLUTION_INSTANCE_NAME=christmaster
```

### Limitação Conhecida (v2.2.3)
> ⚠️ **SessionError: No sessions** em grupos - Bug do Baileys/LID afeta envio para grupos.
> Mensagens individuais funcionam normalmente. Aguardando fix na Evolution API.

### Endpoints da API Interna
```
GET  /api/whatsapp/status     # Status da conexão (retorna errorType, errorCode)
GET  /api/whatsapp/qrcode     # QR Code para conectar
POST /api/whatsapp/send       # Enviar mensagem individual
POST /api/whatsapp/send-bulk  # Enviar para múltiplos
POST /api/whatsapp/send-group # Enviar para grupo (⚠️ SessionError temporário)
POST /api/whatsapp/send-poll  # Enviar enquete
GET  /api/whatsapp/groups     # Listar grupos
```

### Servidor Evolution API
- **IP**: 163.176.239.167
- **Porta**: 8080
- **VM**: Oracle Cloud Free Tier (VM.Standard.E2.1.Micro)
- **SSH**: `ssh -i ~/.ssh/evolution_key ubuntu@163.176.239.167`

---

## Critérios de Refinamento

1. **Compatibilidade Arquitetural**: Garanta que a solicitação siga os padrões de modularização
2. **Reutilização**: Verifique se já existe algo similar que pode ser estendido
3. **Consistência de UI**: Use componentes MUI existentes e o tema do sistema
4. **Controle de Acesso**: Inclua verificações de permissão (`can('recurso:acao')`)
5. **Tipagem Forte**: Defina interfaces TypeScript claras
6. **Separação de Responsabilidades**: Hooks para lógica, componentes para UI
7. **Firestore**: Considere índices compostos necessários para queries
8. **Componentes < 200 linhas**: Extrair sub-componentes quando necessário

---

## Formato da Resposta

1. **Análise de Compatibilidade**:
   - O que já existe no sistema que pode ser reutilizado?
   - Quais padrões devem ser seguidos?
   - Há conflitos com a arquitetura existente?

2. **Prompt Refinado** com:
   - Estrutura de arquivos a criar/modificar
   - Interfaces/tipos necessários
   - Hooks e componentes específicos
   - Integrações com serviços existentes
   - Índices Firestore necessários (se houver queries compostas)

3. **Checklist de Implementação**:
   - [ ] Arquivos a criar
   - [ ] Arquivos a modificar
   - [ ] Tipos a adicionar em `types/index.ts`
   - [ ] Serviços a usar/criar
   - [ ] Permissões necessárias
   - [ ] Índices Firestore (se aplicável)

4. **Alertas** (se houver):
   - Funcionalidades que já existem
   - Padrões que estão sendo violados
   - Sugestões de abordagem alternativa

---

## Prompt a Refinar

"""
[DESCREVA AQUI A FUNCIONALIDADE OU MODIFICAÇÃO QUE DESEJA IMPLEMENTAR NO SISTEMA]
"""

---

*Observação: Priorize sempre a reutilização de código existente e a manutenção dos padrões estabelecidos. Se a solicitação violar a arquitetura, sugira uma abordagem compatível.*

*Versão: 2.2.0 | Última atualização: 20/01/2026*
