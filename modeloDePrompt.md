Atue como um engenheiro de prompts sênior especializado em desenvolvimento Next.js/React com experiência em sistemas educacionais. Sua tarefa é refinar o prompt que fornecerei, tornando-o compatível com a arquitetura existente do sistema SGE Diário Digital.

## Contexto do Sistema

### Stack Tecnológico
- **Framework**: Next.js 16+ (App Router)
- **Linguagem**: TypeScript 5+ (strict mode)
- **UI**: MUI v7 (Material UI com Material Design 3) - tema customizado
- **Backend**: Firebase (Firestore, Auth com Google, Storage)
- **Estado**: Zustand (stores: authStore, uiStore, filterStore)
- **WhatsApp**: Evolution API v2.2.3 (Baileys)
- **PWA**: next-pwa com service worker e cache offline
- **Hospedagem**: Vercel (Frontend) + Oracle Cloud Free Tier (Evolution API)

### Arquitetura e Padrões Obrigatórios

**Estrutura de Arquivos** (máximo 150-200 linhas por arquivo):
```
src/
├── app/
│   ├── api/                      # API Routes
│   │   ├── whatsapp/             # Rotas WhatsApp (send, send-bulk, status, qrcode, groups)
│   │   └── seed/                 # Rotas de seed (dados fictícios)
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
│   ├── ui/                       # Componentes genéricos (DataTable, FormModal, ConfirmDialog, ResponsiveContainer, OfflineIndicator)
│   ├── common/                   # Componentes compartilhados (DisciplinaSelect, etc.)
│   └── layout/                   # MainLayout, Sidebar (3 modos), Header
├── hooks/                        # Hooks globais (useAuth, useModal, usePermissions, useResponsive, useOffline)
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
- Responsividade: usar `useResponsive()` para breakpoints

---

## Responsividade e PWA

### Sidebar com 3 Modos
```typescript
// uiStore.ts
type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

// Larguras
DRAWER_WIDTH = 260;           // Modo expanded
DRAWER_WIDTH_COLLAPSED = 72;  // Modo collapsed (apenas ícones)

// Comportamento
// - Mobile: Drawer temporário (abre/fecha)
// - Desktop expanded: Largura completa com texto
// - Desktop collapsed: Apenas ícones com tooltips
// - Hidden: Completamente oculto
```

### Estilo da Sidebar
```typescript
// theme.ts - MuiListItemButton
{
  borderRadius: 0,
  margin: 0,
  padding: '6px 16px',
  // Sem espaços entre elementos
}
```

### Hook useResponsive
```typescript
const { isMobile, isTablet, isDesktop, currentBreakpoint } = useResponsive();

// Breakpoints MUI
// xs: 0-600px (mobile)
// sm: 600-900px (tablet portrait)
// md: 900-1200px (tablet landscape / small desktop)
// lg: 1200-1536px (desktop)
// xl: 1536px+ (large desktop)
```

### Componentes Responsivos
```typescript
// ResponsiveContainer - Container com padding responsivo
<ResponsiveContainer maxWidth="lg" fullHeight>
  {children}
</ResponsiveContainer>

// ResponsiveGrid - Grid auto-fill responsivo
<ResponsiveGrid minItemWidth={280} gap={2}>
  {items.map(item => <Card key={item.id} />)}
</ResponsiveGrid>

// ResponsiveStack - Stack que vira coluna no mobile
<ResponsiveStack direction="row" spacing={2} reverseOnMobile>
  <Sidebar />
  <Content />
</ResponsiveStack>
```

### PWA Configuration
```javascript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Google Fonts - CacheFirst (1 ano)
    // Static fonts - StaleWhileRevalidate (7 dias)
    // Images - StaleWhileRevalidate (24h)
    // Next.js images - StaleWhileRevalidate (24h)
    // JS/CSS - StaleWhileRevalidate (24h)
    // API routes - NetworkFirst (24h)
    // Others - NetworkFirst (24h)
  ],
});
```

### Offline Indicator
```typescript
// Hook para detectar offline
const { isOffline, isOnline, wasOffline } = useOffline();

// Componente de indicador
<OfflineIndicator
  position="top"
  showRetryButton
  dismissable
/>
```

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
  turma?: string;                      // Nome da turma (desnormalizado)
  serie?: string;                      // Série (desnormalizado)
  turno?: Turno;                       // Turno (desnormalizado)
  dataNascimento?: Date;
  fotoUrl?: string;                    // URL da foto no Google Drive (thumbnail)
  fotoFileId?: string;                 // ID do arquivo no Google Drive
  responsavelNome?: string;
  responsavelTelefone?: string;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// URL da foto (formato embeddable do Drive)
// https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
```

### Turma
```typescript
interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: 'Matutino' | 'Vespertino' | 'Noturno';
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
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: Date;
  tempo: 1 | 2;
  presencas: PresencaAluno[];
  conteudo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PresencaAluno {
  alunoId: string;
  alunoNome: string;
  presente: boolean;
  justificativa?: string;
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
  tipo: 'AV1' | 'AV2' | 'AV3' | 'REC' | 'MEDIA';
  composicao?: NotaComposicao[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface NotaComposicao {
  id: string;
  nome: string;
  porcentagem: number;
  valor: number | null;
  quantidadeRubricas: 1 | 2 | 3;
  rubricaIds?: string[];
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
  mes: Mes;
  ano: number;
  conceito: 'A' | 'B' | 'C' | 'D' | 'E';
  observacao?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Ocorrencia
```typescript
interface Ocorrencia {
  id: string;
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  serie: string;
  motivo: string;
  descricao?: string;
  usuarioId: string;
  usuarioNome: string;
  data: Date;
  status: 'pendente' | 'aprovada' | 'cancelada';
  aprovadaPor?: string;
  aprovadaEm?: Date;
  canceladaPor?: string;
  canceladaEm?: Date;
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
  disciplinaId: string;
  rubricaId: string;
  componenteId: string;
  av: 'av1' | 'av2';
  professorId: string;
  bimestre: number;
  ano: number;
  nivel: 'A' | 'B' | 'C' | 'D' | 'E';
  observacao?: string;
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
  nome?: string;
  layout: { rows: number; columns: number };
  assentos: Assento[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Assento {
  row: number;
  column: number;
  alunoId: string | null;
  tipo: 'mesa' | 'vazio' | 'professor';
}
```

### HorarioAula
```typescript
interface HorarioAula {
  id: string;
  professorId: string;
  professorIds?: string[];           // Para disciplinas com múltiplos professores (ex: Trilhas)
  turmaId: string;
  disciplinaId: string;
  diaSemana: DiaSemana;              // 0=Dom, 1=Seg, ..., 6=Sab
  horaInicio: string;                // "07:00"
  horaFim: string;                   // "07:45"
  sala?: string;
  ano: number;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface HorarioSlot {
  horaInicio: string;
  horaFim: string;
  label: string;                     // "1º Tempo", "2º Tempo", etc
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
  grupoId?: string;
  grupoNome?: string;
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
| `/diario/chamada` | Registro de presença + Relatórios + Trilhas | chamada:view |
| `/diario/notas` | Notas com composição | notas:view |
| `/diario/conceitos` | Avaliações por rubricas | conceitos:view |
| `/diario/dossie` | Dossiê completo do aluno | alunos:view |
| `/diario/mapeamento` | Mapa de sala interativo (drag-and-drop, swap, touch) | chamada:view |
| `/diario/ocorrencias` | Gestão de ocorrências | ocorrencias:view |
| `/diario/professores` | Cadastro com Google Auth | professores:view |
| `/diario/mensagens` | WhatsApp com compositor avançado | mensagens:view |
| `/diario/graficos` | Visualizações | coordenador+ |
| `/diario/agenda` | Agenda escolar | todos |
| `/diario/aniversariantes` | Relatório de aniversários | todos |
| `/diario/senha` | Alteração de senha | todos |
| `/diario/horarios` | Grade de horários por turno | horarios:view |
| `/cadastros/turmas` | CRUD de turmas | turmas:view |
| `/cadastros/alunos` | CRUD de alunos | alunos:view |
| `/cadastros/disciplinas` | Hierarquia de disciplinas | coordenador+ |

---

## Módulo de Horários (Detalhado)

### Estrutura de Arquivos
```
src/app/diario/horarios/
├── page.tsx                       # Página principal com toggle grade/individual
├── types.ts                       # Tipos locais (HorarioCellProps, HorarioFormData)
├── components/
│   ├── index.ts
│   ├── HorariosFilters.tsx       # Filtros (ano, turma, professor)
│   ├── HorarioGrid.tsx           # Grade por turma/professor (visão individual)
│   ├── HorarioGridByTurno.tsx    # Grade por turno (Matutino/Vespertino)
│   ├── HorarioCell.tsx           # Célula individual com disciplina/professor
│   ├── HorarioModal.tsx          # Form criar/editar (multi-professor para Trilhas)
│   └── WhatsAppSendButton.tsx    # Botão envio WhatsApp
└── hooks/
    ├── index.ts
    ├── useHorariosLoader.ts      # Carrega horários, turmas, disciplinas, professores
    ├── useHorariosActions.ts     # CRUD + envio WhatsApp
    └── useHorariosData.ts        # Composição de hooks
```

### Visualizações
```typescript
// Dois modos de visualização
type GridViewType = 'grade' | 'individual';

// Grade: Colunas = Turmas, Linhas = Dias × Tempos (7 tempos × 5 dias = 35 linhas)
// Separado por turno (Matutino/Vespertino)

// Individual: Grade por turma ou professor selecionado
```

### Time Slots
```typescript
// Matutino (45 min cada)
const MATUTINO_SLOTS = [
  { horaInicio: '07:00', horaFim: '07:45', label: '1º' },
  { horaInicio: '07:45', horaFim: '08:30', label: '2º' },
  { horaInicio: '08:30', horaFim: '09:15', label: '3º' },
  { horaInicio: '09:15', horaFim: '10:00', label: '4º' },
  { horaInicio: '10:00', horaFim: '10:45', label: '5º' },
  { horaInicio: '10:45', horaFim: '11:30', label: '6º' },
  { horaInicio: '11:30', horaFim: '12:15', label: '7º' },
];

// Vespertino (45 min, exceto sexta-feira)
const VESPERTINO_SLOTS = [
  { horaInicio: '13:00', horaFim: '13:45', label: '1º' },
  // ... até 7º tempo
];

// Sexta Vespertino (35 min - horário especial)
const SEXTA_VESPERTINO_SLOTS = [
  { horaInicio: '13:00', horaFim: '13:35', label: '1º' },
  // ... até 7º tempo
];
```

### Multi-Professor (Trilhas)
```typescript
// Disciplinas com múltiplos professores
const DISCIPLINAS_MULTIPLOS_PROFESSORES = ['trilhas', 'trilha'];

// HorarioAula.professorIds contém array de IDs
// Modal detecta automaticamente pelo nome da disciplina
```

### Ordenação de Turmas
```typescript
// Ordem: Ensino Fundamental II → Ensino Médio
// Dentro de cada ensino: por série (6º, 7º, 8º, 9º | 1ª, 2ª, 3ª)
// Mesma série: por turma (A, B, C)

const ensinoOrder = {
  'Ensino Fundamental II': 1,
  'Ensino Médio': 2,
};
```

### Envio de Horários via WhatsApp
```typescript
// Opções de envio
- Por dia específico (Segunda, Terça, etc)
- Semana completa
- Todos os professores de uma vez ("Enviar para Todos")

// Formato da mensagem
// Inclui: tempo, horário início/fim, turma, sala
// Rodapé com nome do remetente e escola
// Suporte a "Super Admin" para email específico
```

### Responsividade Mobile
- Scroll horizontal touch em tabelas (WebkitOverflowScrolling)
- Sticky columns para primeira coluna
- Filtros adaptáveis com breakpoints
- Toggle buttons com apenas ícones em mobile

### API de Notificações Automáticas
```
GET/POST /api/horarios/send-notifications

Query Parameters:
- dia: DiaSemana (1-5, padrão: dia atual)
- secret: string (autenticação)
- testAll: boolean (teste para todos professores)

Uso:
- Integração com cron-job.org para disparo automático
- Envia horário do dia para cada professor via WhatsApp
- Formato: Lista de aulas com turma, disciplina, horário e sala
```

---

## Módulo de Chamada (Detalhado)

### Estrutura de Arquivos
```
src/app/diario/chamada/
├── page.tsx                       # Página principal com abas (Chamada/Relatórios)
├── types.ts                       # Tipos locais (cores de avatar)
├── components/
│   ├── index.ts
│   ├── ChamadaFilters.tsx        # Filtros (ano, turma, disciplina, data)
│   ├── ChamadaList.tsx           # Lista de alunos com checkbox de presença
│   ├── ConteudoModal.tsx         # Modal para registrar conteúdo ministrado
│   ├── ObservacaoPopover.tsx     # Popover para justificativa de falta
│   ├── EspelhoChamada.tsx        # Componente legado (ainda disponível)
│   ├── RelatoriosChamada.tsx     # Seletor de tipos de relatório
│   └── relatorios/               # Sub-componentes de relatórios
│       ├── index.ts
│       ├── utils.ts              # Utilitários (formatação, impressão)
│       ├── RelatorioDia.tsx      # Espelho do dia
│       ├── RelatorioPeriodo.tsx  # Resumo por período
│       ├── RelatorioFaltas.tsx   # Alunos com mais faltas
│       ├── RelatorioTurma.tsx    # Histórico por turma
│       └── RelatorioConsolidado.tsx # Visão geral de todas as turmas
└── hooks/
    ├── index.ts
    └── useChamadaData.ts         # Hook principal de chamada
```

### Funcionalidades Principais
```typescript
// Duas abas na página
type TabChamada = 'registrar' | 'relatorios';

// Registro de chamada
- Seleção de turma, disciplina e data
- Lista de alunos com checkbox (presente/ausente)
- Botões "Todos Presentes" / "Todos Ausentes"
- Observações por aluno (justificativa de falta)
- Conteúdo ministrado na aula

// Relatórios disponíveis
type TipoRelatorio = 'dia' | 'periodo' | 'faltas' | 'turma' | 'consolidado';
```

### Filtro por Vínculo do Professor
```typescript
// Professores veem apenas turmas e disciplinas vinculadas
// Coordenadores e admins veem todas

// Filtro de turmas (professor)
const turmas = usuario?.tipo === 'professor'
  ? todasTurmas.filter(t => usuario.turmaIds?.includes(t.id))
  : todasTurmas;

// Filtro de disciplinas (professor)
// Inclui disciplinas diretamente vinculadas + disciplinas filhas (via parentId)
const disciplinas = todasDisciplinas.filter(d => {
  const profDisciplinas = usuario.disciplinaIds || [];
  return profDisciplinas.includes(d.id) ||
    (d.parentId && profDisciplinas.includes(d.parentId));
});
```

### Tratamento de Timezone
```typescript
// IMPORTANTE: Usar T12:00:00 para evitar problemas de timezone
// new Date('2026-01-23') cria UTC meia-noite, que pode virar dia anterior em GMT-4

// ❌ Errado
new Date(dataChamada)

// ✅ Correto
new Date(dataChamada + 'T12:00:00')
```

### Tipos de Relatórios

#### 1. Espelho do Dia (`RelatorioDia`)
- Todas as chamadas de um dia específico
- Lista detalhada de alunos com status (P/F)
- Conteúdo ministrado em cada aula
- Resumo com totais de presença/falta

#### 2. Relatório por Período (`RelatorioPeriodo`)
- Resumo de chamadas em um período (semana, mês)
- Tabela com estatísticas diárias
- Frequência geral do período
- Detalhes por turma/disciplina

#### 3. Relatório de Faltas (`RelatorioFaltas`)
- Alunos ordenados por quantidade de faltas
- Alertas visuais para frequência crítica (<75%) e alerta (75-85%)
- Barra de progresso de frequência individual
- Justificativas registradas

#### 4. Relatório por Turma (`RelatorioTurma`)
- Histórico completo de uma turma específica
- Grade com P/F por data para cada aluno
- Colunas com todas as datas de aula do período
- Frequência individual de cada aluno

#### 5. Relatório Consolidado (`RelatorioConsolidado`)
- Visão geral de todas as turmas
- Cards com métricas (turmas, chamadas, presenças, faltas)
- Frequência média geral com destaque da melhor/pior turma
- Tabela comparativa entre turmas

### Funções de Impressão
```typescript
// utils.ts - Função genérica de impressão
printReport({
  title: 'Título do Relatório',
  subtitle?: 'Subtítulo',
  professor?: 'Nome do Professor',
  periodo?: 'DD/MM/YYYY a DD/MM/YYYY',
  content: htmlContent,
  showSignature?: true,  // Linha para assinatura
});
```

### Serviço de Chamada
```typescript
// chamadaService (services/firestore/chamadaService.ts)
chamadaService.get(id)
chamadaService.getByTurmaData(turmaId, data)
chamadaService.getByTurmaAno(turmaId, ano)
chamadaService.getByProfessorData(professorId, data)       // Para relatórios
chamadaService.getByProfessorPeriodo(professorId, inicio, fim)  // Para relatórios
chamadaService.create(data)
chamadaService.update(id, data)
chamadaService.delete(id)
```

### Indicadores Visuais
```typescript
// Cores de frequência
const getFrequenciaColor = (freq: number) => {
  if (freq < 75) return 'error';    // Crítico (vermelho)
  if (freq < 85) return 'warning';  // Alerta (amarelo)
  return 'success';                  // OK (verde)
};
```

---

## Módulo de Trilhas - Novo Ensino Médio (Detalhado)

### Conceito
Trilhas são itinerários formativos do Novo Ensino Médio onde alunos são agrupados por **Área do Conhecimento** (BNCC) e **Série**, não por turma tradicional.

### Áreas do Conhecimento (BNCC)
```typescript
// src/constants/areasConhecimento.ts
const AREAS_CONHECIMENTO = [
  { id: 'linguagens', nome: 'Linguagens e suas Tecnologias', cor: '#4CAF50', sigla: 'LIN' },
  { id: 'matematica', nome: 'Matemática e suas Tecnologias', cor: '#2196F3', sigla: 'MAT' },
  { id: 'ciencias_natureza', nome: 'Ciências da Natureza e suas Tecnologias', cor: '#FF9800', sigla: 'CNT' },
  { id: 'ciencias_humanas', nome: 'Ciências Humanas e Sociais Aplicadas', cor: '#9C27B0', sigla: 'CHS' },
  { id: 'formacao_tecnica', nome: 'Formação Técnica e Profissional', cor: '#795548', sigla: 'FTP' },
];

const SERIES_ENSINO_MEDIO = ['1ª Série', '2ª Série', '3ª Série'];

type AreaConhecimentoId = 'linguagens' | 'matematica' | 'ciencias_natureza' | 'ciencias_humanas' | 'formacao_tecnica';
```

### Estrutura de Arquivos
```
src/app/diario/chamada/
├── components/trilhas/
│   ├── index.ts
│   ├── TrilhasConfig.tsx      # Configuração (coordenador/admin)
│   ├── TrilhasView.tsx        # Chamada (professor)
│   ├── AreaCard.tsx           # Card expansível por área
│   ├── SerieGroup.tsx         # Grupo de alunos por série
│   ├── TrilhaStatusBadge.tsx  # Badge de status
│   ├── TrilhaConteudoModal.tsx
│   └── NaoRealizadaModal.tsx
├── hooks/
│   ├── useTrilhasLoader.ts    # Carrega alunos por área/série
│   └── useTrilhasActions.ts   # Ações de chamada
```

### Fluxo de Uso

#### 1. Coordenador/Admin (TrilhasConfig)
```typescript
// Atribuição de alunos às áreas
- Lista todos alunos do Ensino Médio por série
- Permite selecionar múltiplos alunos
- Dropdown para escolher área do conhecimento
- Salva areaConhecimentoId no registro do aluno
- Mostra resumo de alunos por área
```

#### 2. Professor (TrilhasView)
```typescript
// Chamada por área/série
- Vê apenas alunos atribuídos às áreas
- Accordions por área (cores distintas)
- Dentro de cada área: séries com lista de alunos
- Marcar presença, conteúdo, "não realizada"
- Salvar em batch todas as chamadas
```

### Entidades

```typescript
// Aluno (campo adicionado)
interface Aluno {
  // ... campos existentes
  areaConhecimentoId?: string;  // Área do conhecimento para Trilhas
}

// Chamada de Trilha
interface ChamadaTrilha {
  id: string;                    // formato: ano_areaId_serie_data
  data: Date;
  ano: number;
  areaConhecimentoId: string;
  serie: '1ª Série' | '2ª Série' | '3ª Série';
  professorId: string;
  professorNome: string;
  presencas: PresencaAlunoTrilha[];
  conteudo?: string;
  realizada: boolean;
  observacao?: string;           // Motivo se não realizada
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface PresencaAlunoTrilha {
  alunoId: string;
  alunoNome: string;
  turmaId: string;               // Turma de origem
  turmaNome: string;
  presente: boolean;
  justificativa?: string;
}
```

### Serviço Firestore
```typescript
// chamadaTrilhaService (services/firestore/chamadaTrilhaService.ts)
chamadaTrilhaService.get(id)
chamadaTrilhaService.getByData(data, ano)
chamadaTrilhaService.getByAreaData(areaId, data, ano)
chamadaTrilhaService.getByPeriodo(inicio, fim, ano)
chamadaTrilhaService.getByProfessorPeriodo(professorId, inicio, fim)
chamadaTrilhaService.upsert(input)           // Criar/atualizar
chamadaTrilhaService.upsertBatch(inputs)     // Batch para múltiplas séries
chamadaTrilhaService.marcarNaoRealizada(areaId, serie, data, ano, professorId, professorNome, observacao?)
```

### Índices Firestore
```json
// chamadaTrilhas
{ "ano": "ASC", "data": "ASC" }
{ "areaConhecimentoId": "ASC", "ano": "ASC", "data": "ASC" }
{ "professorId": "ASC", "data": "ASC" }
```

### Helpers
```typescript
import { getAreaById, getAreaColor, getAreaSigla, getAreaNome } from '@/constants';

getAreaById('linguagens')     // { id, nome, cor, sigla }
getAreaColor('matematica')    // '#2196F3'
getAreaSigla('ciencias_natureza') // 'CNT'
```

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

## Módulo de Mapeamento de Sala (Detalhado)

### Estrutura de Arquivos
```
src/app/diario/mapeamento/
├── page.tsx                    # Página principal
├── types.ts                    # Tipos do módulo (CelulaMapa, AlunoMapa, ModoEdicao)
├── components/
│   ├── index.ts
│   ├── MapeamentoFilters.tsx   # Filtros (ano, turma, disciplina)
│   ├── ClassroomGrid.tsx       # Grid visual da sala
│   ├── SeatCell.tsx            # Célula individual (mesa/vazio/professor)
│   ├── StudentList.tsx         # Lista de alunos disponíveis
│   ├── ModoToolbar.tsx         # Toolbar de modos de edição
│   ├── ModoInstrucoes.tsx      # Instruções por modo
│   └── TouchDragContext.tsx    # Contexto para drag-and-drop touch
└── hooks/
    ├── index.ts
    ├── useMapeamentoData.ts    # Hook principal
    ├── useMapeamentoLoader.ts  # Carregamento de dados
    ├── useMapeamentoActions.ts # Ações (atribuir, swap, distribuir)
    └── mapeamentoTypes.ts      # Tipos dos hooks
```

### Funcionalidades
```typescript
// Modos de edição
type ModoEdicao = 'visualizar' | 'selecionar' | 'editar_tipo' | 'remover';

// Tipos de célula
type TipoCelula = 'mesa' | 'vazio' | 'professor';

// Ações disponíveis
interface MapeamentoActions {
  atribuirAluno(row, col, alunoId);      // Atribui aluno (com swap automático)
  alternarTipoCelula(row, col);          // Cicla entre mesa/vazio/professor
  distribuirAleatorio();                  // Distribui alunos aleatoriamente
  limparTodos();                          // Remove todos os alunos
  atualizarLayout({ rows, columns });     // Altera dimensões do grid
  salvar();                               // Persiste no Firestore
  resetar();                              // Volta ao layout padrão
}
```

### Drag-and-Drop
- **Mouse**: Arrastar alunos da lista ou entre mesas
- **Touch (tablet/mobile)**: Suporte via TouchDragContext
- **Swap automático**: Ao soltar em mesa ocupada, troca os dois alunos
- **Visual feedback**: Preview flutuante durante arrasto

### Componentes Visuais
```typescript
// SeatCell - Célula do mapa
<SeatCell
  celula={celula}
  modoEdicao={modo}
  onDrop={(alunoId) => handleDrop(row, col, alunoId)}
  onTouchDrop={(targetRow, targetCol, alunoId) => handleDrop(targetRow, targetCol, alunoId)}
/>

// ClassroomGrid - Grid com controles de dimensão
<ClassroomGrid
  layout={{ rows: 5, columns: 6 }}
  celulas={celulas}
  onLayoutChange={handleLayoutChange}
  onDrop={handleDrop}
/>
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
chamadaService         // getByTurmaData(), getByTurmaAno(), getByProfessorData(), getByProfessorPeriodo(), create(), update()
chamadaTrilhaService   // getByData(), getByAreaData(), getByPeriodo(), upsert(), upsertBatch(), marcarNaoRealizada()
notaService            // getByAlunoTurmaDisciplina(), create(), update()
rubricaService         // getAll(), getAtivas(), create(), update()
avaliacaoRubricaService // getByTurma(), getByAluno(), create(), update()
ocorrenciaService      // getByStatus(), getByAluno(), create(), update()
mapeamentoSalaService  // getByTurmaProfessorAno(), create(), update()
horarioService         // getByAno(), getByTurma(), getByProfessor(), checkConflict(), create(), update(), deactivate()
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

### Google Drive Service (Shared Drive)
```typescript
// services/driveService.ts
createDriveService(accessToken: string): DriveService

// DriveService methods
driveService.findFolder(name: string, parentId?: string, searchAnywhere?: boolean): Promise<DriveFile | null>
driveService.createFolder(name: string, parentId?: string): Promise<string>
driveService.findOrCreateFolder(name: string, parentId?: string): Promise<string>
driveService.initializeFolderStructure(): Promise<DriveFolderIds>
driveService.uploadFile(options: DriveUploadOptions): Promise<DriveUploadResult>
driveService.listFiles(folderId: string): Promise<DriveFile[]>
driveService.getFile(fileId: string): Promise<DriveFile>
driveService.deleteFile(fileId: string): Promise<void>
driveService.setPublicAccess(fileId: string): Promise<string>
driveService.moveFile(fileId: string, newFolderId: string): Promise<void>

// Helpers
getOcorrenciasFolderForYear(service, folderIds, ano): Promise<string>
getMensagensFolderForMonth(service, folderIds, ano, mes): Promise<string>
```

### Estrutura de Pastas no Drive
```
SGE_NOVO/                           # Pasta raiz (ID em NEXT_PUBLIC_DRIVE_PARENT_FOLDER_ID)
└── SGE Diário Digital/
    ├── Fotos/
    │   └── Alunos/                 # Fotos de perfil dos alunos
    ├── Ocorrencias/
    │   └── [Ano]/                  # Anexos de ocorrências por ano
    ├── Mensagens/
    │   └── [Ano]/
    │       └── [Mes]/              # Mídias de mensagens por mês
    ├── Exports/                    # Relatórios exportados
    └── Comunicados/                # Documentos de comunicados
```

### Upload de Foto do Aluno
```typescript
// hooks/useStudentPhoto.ts
const { uploadPhoto, isUploading } = useStudentPhoto();

// Upload para Drive com URL embeddable
const photoUrl = await uploadPhoto(alunoId, file);
// Retorna: https://drive.google.com/thumbnail?id=FILE_ID&sz=w400
```

### Configuração de Shared Drive
O sistema usa Google Shared Drive (Drive Compartilhado) para armazenamento:

```typescript
// Parâmetros obrigatórios para Shared Drive
const params = {
  supportsAllDrives: 'true',
  includeItemsFromAllDrives: 'true',
  corpora: 'drive',
  driveId: SHARED_DRIVE_ID,
};
```

### Drive Store (Zustand)
```typescript
// store/driveStore.ts
useDriveStore().accessToken        // Token de acesso (em memória)
useDriveStore().folderIds          // IDs das pastas do Drive
useDriveStore().isInitialized      // Drive está inicializado
useDriveStore().pendingUploads     // Uploads pendentes
useDriveStore().setAccessToken(token, expiresIn)
useDriveStore().isTokenValid()
useDriveStore().reset()
```

### Drive Upload Hook
```typescript
// hooks/useDriveUpload.ts
const { upload, uploadMultiple, uploadState, isConnected, initializeDrive } = useDriveUpload();

// Upload para pasta específica
await upload(file, 'OCORRENCIAS', { ano: 2026 });
await upload(file, 'MENSAGENS', { ano: 2026, mes: 1 });
await upload(file, 'EXPORTS');
await upload(file, 'COMUNICADOS');
```

---

## Componentes UI Reutilizáveis

### Componentes Globais
```typescript
// components/ui/
DataTable              // Tabela com ações, loading, empty state
FormModal              // Modal com formulário, loading, submit
ConfirmDialog          // Diálogo de confirmação
LoadingScreen          // Tela de carregamento
ResponsiveContainer    // Container com padding responsivo
ResponsiveGrid         // Grid auto-fill responsivo
ResponsiveStack        // Stack que vira coluna no mobile
OfflineIndicator       // Indicador de status offline

// components/common/
DisciplinaSelect       // Select de disciplinas (filtra grupos)
TurmaSelect            // Select de turmas por ano
CheckboxSelector       // Seletor de múltiplos itens com agrupamento

// components/drive/
DriveUploadButton      // Botão de upload para Google Drive com progresso
DriveFileList          // Lista de arquivos anexados (com ícones por tipo)
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

## Autenticação e Domínio

### Restrição de Domínio
O login com Google é restrito ao domínio `@christmaster.com.br`:

```typescript
// src/lib/permissions.ts
export const ALLOWED_DOMAIN = 'christmaster.com.br';

export function isAllowedDomain(email: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}
```

### Google Provider Configuration
```typescript
// src/hooks/auth/authConstants.ts
export const googleProvider = new GoogleAuthProvider();

// Escopo do Google Drive (acesso completo para Shared Drives)
googleProvider.addScope('https://www.googleapis.com/auth/drive');

// Limita ao domínio permitido (só mostra contas @christmaster.com.br)
googleProvider.setCustomParameters({
  prompt: 'consent',
  hd: 'christmaster.com.br', // Hosted domain
});
```

### Fluxo de Autenticação
1. Usuário clica em "Entrar com Google"
2. Popup mostra apenas contas `@christmaster.com.br`
3. Após login, valida domínio novamente (dupla proteção)
4. Se domínio inválido: logout automático + mensagem de erro
5. Token do Drive é capturado e armazenado no `driveStore`
6. Pastas do Drive são inicializadas em background

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
  // Horários
  | 'horarios:view' | 'horarios:create' | 'horarios:edit' | 'horarios:delete'
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
# Evolution API (WhatsApp)
EVOLUTION_API_URL=http://163.176.239.167:8080
EVOLUTION_API_KEY=B6D711FCDE4D4FD5936544120E713976
EVOLUTION_INSTANCE_NAME=christmaster

# Google Drive (Shared Drive)
NEXT_PUBLIC_SHARED_DRIVE_ID=0APjN-eFge5YuUk9PVA
NEXT_PUBLIC_DRIVE_PARENT_FOLDER_ID=1MLrHoHK-rb__WI2__T78n_4kg1rbZOUl
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

# Notificações Automáticas (Cron)
GET/POST /api/horarios/send-notifications  # Envia horário do dia para professores
```

### Servidor Evolution API
- **IP**: 163.176.239.167
- **Porta**: 8080
- **VM**: Oracle Cloud Free Tier (VM.Standard.E2.1.Micro)
- **SSH**: `ssh -i ~/.ssh/evolution_key ubuntu@163.176.239.167`

---

## API de Seed (Dados Fictícios)

### Endpoint
```
POST /api/seed/alunos    # Popula turmas com 20 alunos cada
GET  /api/seed/alunos    # Info sobre jogadores disponíveis
```

### Dados Gerados
- **Nomes**: Jogadores lendários do futebol brasileiro (1970-2000)
  - Era 1970 (Tri): Pelé, Jairzinho, Tostão, Gérson, Rivelino...
  - Era 1982 (Geração de Ouro): Zico, Sócrates, Falcão, Júnior...
  - Era 1994 (Tetra): Romário, Bebeto, Raí, Cafu, Roberto Carlos...
  - Era 1998-2002 (Penta): Ronaldo, Rivaldo, Denílson, Leonardo...
  - Lendas históricas: Garrincha, Didi, Nílton Santos, Zagallo...
- **Data de Nascimento**: Aleatória entre 2008-2012
- **Matrícula**: Gerada automaticamente (formato: AAAATTTNNN)
- **20 alunos por turma** com nomes embaralhados

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
9. **Responsividade**: Use useResponsive() e componentes responsivos
10. **PWA**: Considere funcionamento offline quando aplicável

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

*Versão: 2.10.0 | Última atualização: 23/01/2026*
