import { Timestamp } from 'firebase/firestore';

// Enums
export const Meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
] as const;

export const MesesAbrev = [
  'JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN',
  'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'
] as const;

export const Turnos = ['Matutino', 'Vespertino', 'Noturno'] as const;

export const Series = [
  '6o Ano - Ensino Fundamental II',
  '7o Ano - Ensino Fundamental II',
  '8o Ano - Ensino Fundamental II',
  '9o Ano - Ensino Fundamental II',
  '1a Série - Ensino Médio',
  '2a Série - Ensino Médio',
  '3a Série - Ensino Médio',
] as const;

export type Mes = typeof Meses[number];
export type MesAbrev = typeof MesesAbrev[number];
export type Turno = typeof Turnos[number];
export type Serie = typeof Series[number];

// Role hierarchy (higher number = more permissions)
export const RoleHierarchy = {
  professor: 1,
  coordenador: 2,
  administrador: 3,
} as const;

export type UserRole = keyof typeof RoleHierarchy;

// Status de vinculacao com Google Auth
export type AuthStatus = 'pending' | 'linked';

// User / Professor
export interface Usuario {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone?: string;
  celular?: string;  // Telefone celular (opcional)
  tipo: UserRole;
  // For professors - which disciplines they teach
  disciplinaIds?: string[];
  // For professors - which classes they teach
  turmaIds?: string[];
  ativo: boolean;

  // Integracao Google Auth
  googleUid?: string | null;         // UID do Firebase Auth (null se pre-cadastro)
  googleEmail?: string;              // E-mail do Google
  authStatus?: AuthStatus;           // Status de vinculacao
  firstLoginAt?: Date | null;        // Data do primeiro login
  createdBy?: string;                // ID do admin que cadastrou

  createdAt: Date;
  updatedAt: Date;
}

export interface Professor {
  id: string;
  nome: string;
  cpf: string;
  telefone?: string;
  email?: string;
  coordenador: boolean;
  disciplinas: string[];
  turmas: string[];
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Turma
export interface Turma {
  id: string;
  nome: string;
  serie: string;
  turno: Turno;
  ano: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Aluno
export interface Aluno {
  id: string;
  nome: string;
  cpf?: string;
  dataNascimento?: Date;
  turmaId: string;
  turma?: string;
  serie?: string;
  turno?: Turno;
  matricula?: string;
  fotoUrl?: string;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Disciplina
export interface Disciplina {
  id: string;
  nome: string;
  codigo?: string;
  turmaIds: string[];
  parentId?: string | null;  // Referencia ao pai (hierarquia)
  ordem: number;             // Ordenacao dentro do nivel
  isGroup?: boolean;         // true = grupo organizacional, nao selecionavel
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Chamada (Presença)
export interface Chamada {
  id: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: Date;
  tempo: 1 | 2;
  presencas: PresencaAluno[];
  conteudo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresencaAluno {
  alunoId: string;
  alunoNome: string;
  presente: boolean;
  justificativa?: string;
}

// Componente de composição de nota
export interface NotaComposicao {
  id: string;
  nome: string;
  porcentagem: number; // Valor máximo do componente
  valor: number | null;
  quantidadeRubricas: 1 | 2 | 3; // Quantidade de rubricas para avaliar (1-3)
  rubricaIds?: string[]; // IDs das rubricas selecionadas para este componente
}

// Template de composição de nota (persistido no Firestore)
export interface TemplateComposicao {
  id: string;
  turmaId: string;
  disciplinaId: string;
  bimestre: 1 | 2 | 3 | 4;
  av: 'av1' | 'av2';
  ano: number;
  componentes: NotaComposicao[];
  createdAt: Date;
  updatedAt: Date;
}

// Notas
export interface Nota {
  id: string;
  alunoId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  bimestre: 1 | 2 | 3 | 4;
  tipo: 'AV1' | 'AV2' | 'AV3' | 'REC' | 'MEDIA';
  valor: number;
  ano: number;
  // Composição da nota (opcional - quando calculada por componentes)
  composicao?: NotaComposicao[];
  createdAt: Date;
  updatedAt: Date;
}

// Conceitos
export interface Conceito {
  id: string;
  alunoId: string;
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  mes: Mes;
  ano: number;
  conceito: 'A' | 'B' | 'C' | 'D' | 'E';
  observacao?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Nivel de Rubrica
export type NivelRubrica = 'A' | 'B' | 'C' | 'D' | 'E';

export interface DescricaoNivel {
  nivel: NivelRubrica;
  descricao: string;
}

// Tipo de Rubrica
export type TipoRubrica = 'geral' | 'professor';

// Rubrica (criterio de avaliacao)
export interface Rubrica {
  id: string;
  nome: string;
  descricao?: string;
  niveis: DescricaoNivel[];
  ativo: boolean;
  ordem: number;
  tipo: TipoRubrica; // 'geral' = Geral/Colegiado, 'professor' = criada por professor
  criadorId?: string; // ID do professor que criou (se tipo = 'professor')
  criadorNome?: string; // Nome do professor para exibição
  createdAt: Date;
  updatedAt: Date;
}

// Avaliacao de Rubrica (avaliacao do aluno em uma rubrica por componente)
export interface AvaliacaoRubrica {
  id: string;
  alunoId: string;
  turmaId: string;
  disciplinaId: string;
  rubricaId: string;
  componenteId: string; // ID do componente da composição (Prova, Trabalho, etc.)
  av: 'av1' | 'av2'; // Qual AV este componente pertence
  professorId: string;
  bimestre: number;
  ano: number;
  nivel: NivelRubrica;
  observacao?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Ocorrência
export interface Ocorrencia {
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
  createdAt: Date;
  updatedAt: Date;
}

// Aniversariantes
export interface Aniversariante {
  id: string;
  nome: string;
  dataNascimento: Date;
  idade: number;
  serie: string;
  turma: string;
  turno: Turno;
}

// Tipo de Evento
export type TipoEvento = 'aula' | 'prova' | 'reuniao' | 'feriado' | 'entrega' | 'excursao' | 'outro';

// Evento da Agenda
export interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  data: Date;
  dataFim?: Date;
  tipo: TipoEvento;
  turmaIds?: string[];
  disciplinaId?: string;
  professorId: string;
  professorNome: string;
  diaInteiro: boolean;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Filtros comuns
export interface FiltroBase {
  ano: number;
  mes?: Mes;
}

export interface FiltroChamada extends FiltroBase {
  serieId?: string;
  disciplinaId?: string;
}

export interface FiltroNotas extends FiltroBase {
  serieId?: string;
  disciplinaId?: string;
  bimestre?: 1 | 2 | 3 | 4;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Auth types
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface LoginCredentials {
  cpf: string;
  senha: string;
}

export interface AlterarSenha {
  cpf: string;
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

// Mapeamento de Sala
export type TipoAssento = 'mesa' | 'vazio' | 'professor';

export interface Assento {
  row: number;
  column: number;
  alunoId: string | null;
  tipo: TipoAssento;
}

export interface LayoutSala {
  rows: number;
  columns: number;
}

export interface MapeamentoSala {
  id: string;
  turmaId: string;
  professorId: string;
  ano: number;
  nome?: string;
  layout: LayoutSala;
  assentos: Assento[];
  createdAt: Date;
  updatedAt: Date;
}

// =====================================
// WhatsApp / Mensagens
// =====================================

// Status de entrega WhatsApp
export type MensagemStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

// Tipo de envio
export type MensagemTipo = 'individual' | 'broadcast' | 'grupo';

// Categoria de template
export type TemplateCategoria = 'aviso' | 'lembrete' | 'comunicado' | 'outro';

// Log de mensagem enviada
export interface MensagemLog {
  id: string;
  // Destinatário
  destinatarioId: string;
  destinatarioNome: string;
  destinatarioNumero: string;
  // Conteúdo
  mensagem: string;
  tipo: MensagemTipo;
  grupoId?: string;
  grupoNome?: string;
  // Status
  status: MensagemStatus;
  messageId?: string;
  erro?: string;
  // Metadata
  enviadoPorId: string;
  enviadoPorNome: string;
  templateId?: string;
  // Timestamps
  enviadoEm: Date;
  entregueEm?: Date;
  lidoEm?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Template de mensagem reutilizável
export interface TemplateMensagem {
  id: string;
  nome: string;
  conteudo: string;
  variaveis: string[];
  categoria: TemplateCategoria;
  criadoPorId: string;
  criadoPorNome: string;
  usageCount: number;
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Configuração da instância WhatsApp
export interface WhatsAppConfig {
  id: string;
  instanceName: string;
  instanceId: string;
  connected: boolean;
  phoneNumber?: string;
  profileName?: string;
  profilePicUrl?: string;
  lastSyncAt?: Date;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Grupo do WhatsApp
export interface GrupoWhatsApp {
  id: string;
  nome: string;
  descricao?: string;
  participantes: number;
  isAdmin: boolean;
  profilePicUrl?: string;
}

// Resposta do serviço de envio
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  status?: MensagemStatus;
  error?: string;
}

// Variáveis disponíveis para templates
export interface TemplateVariables {
  nome: string;
  email?: string;
  celular?: string;
  tipo?: string;
  disciplinas?: string;
  turmas?: string;
}
