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

// Dias da semana (0 = Domingo, 6 = Sabado)
export type DiaSemana = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DiasSemanaNomes = [
  'Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'
] as const;

export const DiasSemanaNomesAbrev = [
  'DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'
] as const;

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

  // Integracao Google Drive
  driveConnected?: boolean;          // Drive esta conectado
  driveRootFolderId?: string;        // ID da pasta raiz no Drive

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

// Tipos de Ensino
export type TipoEnsino = 'Ensino Fundamental II' | 'Ensino Médio';

// Turma
export interface Turma {
  id: string;
  nome: string;                         // Ex: "6º Ano A - Matutino"
  serie: string;                        // Ex: "6º Ano", "1ª Série"
  ensino: TipoEnsino;                   // Ex: "Ensino Fundamental II"
  turma: string;                        // Ex: "A", "B", "C"
  turno: Turno;                         // Ex: "Matutino", "Vespertino"
  ano: number;                          // Ano letivo (2026)
  professorConselheiroId?: string;      // ID do professor conselheiro da turma
  layoutPadrao?: LayoutSala;            // Layout padrao do mapeamento de sala
  layoutConfigurado?: boolean;          // Se true, layout ja foi definido (oculta config para profs)
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Aluno
export interface Aluno {
  id: string;
  nome: string;
  matricula?: string;
  inep?: string;                      // Código INEP
  cpf?: string;
  rg?: string;
  sexo?: 'M' | 'F';
  dataNascimento?: Date;
  naturalidade?: string;              // Cidade natal
  uf?: string;                        // Estado natal

  // Turma (desnormalizado)
  turmaId: string;
  turma?: string;
  serie?: string;
  ensino?: string;                    // Fundamental, Médio, etc.
  turno?: Turno;

  // Responsável principal
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelCpf?: string;
  responsavelEmail?: string;

  // Pai
  paiNome?: string;
  paiTelefone?: string;
  paiEmail?: string;

  // Mãe
  maeNome?: string;
  maeTelefone?: string;
  maeEmail?: string;

  // Endereço
  logradouro?: string;
  cep?: string;
  bairro?: string;

  // Outros
  indicador?: string;
  fotoUrl?: string;
  fotoFileId?: string;                // ID do arquivo no Google Drive

  // Trilhas (Novo Ensino Medio)
  areaConhecimentoId?: string;        // Area do conhecimento para Trilhas

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
  alunosPorTurma?: Record<string, string[]>; // turmaId -> alunoIds whitelist
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
  tempo: 1 | 2 | 3 | 4 | 5 | 6 | 7;
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

// Controle de Atrasos
export interface Atraso {
  id: string;
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  turmaNome: string;
  data: Date;
  horarioChegada: string; // HH:MM
  tempoAtraso: number; // minutos de atraso
  justificativa?: string;
  registradoPorId: string;
  registradoPorNome: string;
  createdAt: Date;
  updatedAt: Date;
}

// Controle de Atestados
export type TipoAtestado = 'medico' | 'judicial' | 'familiar' | 'outro';
export type StatusAtestado = 'pendente' | 'aprovado' | 'rejeitado';

export interface Atestado {
  id: string;
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  turmaNome: string;
  tipo: TipoAtestado;
  dataInicio: Date;
  dataFim: Date;
  descricao: string;
  arquivoUrl?: string;
  arquivoNome?: string;
  status: StatusAtestado;
  registradoPorId: string;
  registradoPorNome: string;
  aprovadoPorId?: string;
  aprovadoPorNome?: string;
  motivoRejeicao?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chamada de Trilhas (Novo Ensino Medio)
export type SerieEnsinoMedioTrilha = '1ª Série' | '2ª Série' | '3ª Série';

export interface ChamadaTrilha {
  id: string;
  data: Date;
  ano: number;
  areaConhecimentoId: string;
  serie: SerieEnsinoMedioTrilha;
  professorId: string;
  professorNome: string;
  presencas: PresencaAlunoTrilha[];
  conteudo?: string;
  realizada: boolean;
  observacao?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PresencaAlunoTrilha {
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  turmaNome: string;
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
  av: TipoAv;
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

// Tipo de avaliacao (AV1, AV2, RP1, RP2)
export type TipoAv = 'av1' | 'av2' | 'rp1' | 'rp2';

// Avaliacao de Rubrica (avaliacao do aluno em uma rubrica por componente)
export interface AvaliacaoRubrica {
  id: string;
  alunoId: string;
  turmaId: string;
  disciplinaId: string;
  rubricaId: string;
  componenteId: string; // ID do componente da composição (Prova, Trabalho, etc.)
  av: TipoAv; // Qual AV este componente pertence (av1, av2, rp1, rp2)
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
  // Anexos do Google Drive
  anexos?: OcorrenciaAnexoRef[];
  createdAt: Date;
  updatedAt: Date;
}

// Referencia de anexo (armazenado no Firestore)
export interface OcorrenciaAnexoRef {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  thumbnailLink?: string;
  uploadedAt: Date;
  uploadedBy: string;
}

// Relatório do Professor sobre o Aluno
export interface RelatorioAluno {
  id: string;
  alunoId: string;
  alunoNome: string;
  turmaId: string;
  professorId: string;
  professorNome: string;
  disciplinaId?: string;
  disciplinaNome?: string;
  titulo: string;
  conteudo: string;
  ano: number;
  bimestre?: 1 | 2 | 3 | 4;
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
  disciplinaId?: string;  // Permite mapeamentos diferentes por disciplina
  ano: number;
  nome?: string;
  layout: LayoutSala;
  assentos: Assento[];
  createdAt: Date;
  updatedAt: Date;
}

// =====================================
// Horarios de Aula
// =====================================

export interface HorarioAula {
  id: string;
  professorId: string;
  professorIds?: string[];  // Para disciplinas com múltiplos professores (ex: Trilhas)
  turmaId: string;
  disciplinaId: string;
  diaSemana: DiaSemana;
  horaInicio: string;    // "07:30"
  horaFim: string;       // "08:20"
  sala?: string;
  ano: number;
  ativo: boolean;
  // Conflitos (para Trilhas que podem ter duplicidade)
  temConflito?: boolean;       // true = professor tem outro horario no mesmo slot
  // Horarios pessoais (nao oficiais)
  pessoal?: boolean;           // true = horario pessoal do professor
  descricaoPessoal?: string;   // Descricao livre para horarios pessoais
  createdBy?: string;          // ID do usuario que criou (para horarios pessoais)
  createdAt: Date;
  updatedAt: Date;
}

export interface HorarioSlot {
  horaInicio: string;
  horaFim: string;
  label: string;
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

// =====================================
// Importacao de Areas do Conhecimento
// =====================================

export interface ImportacaoAreaConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  colunaIdentificador: 'email' | 'matricula' | 'nome';
  colunaNome: number;
  colunaSerie: number;
  colunaArea: number;
  colunaAreaSecundaria?: number;
}

export interface ImportacaoAreaPreview {
  linhasValidas: PreviewLinha[];
  linhasInvalidas: PreviewLinhaErro[];
  resumoPorArea: Record<string, number>;
  resumoPorSerie: Record<string, number>;
}

export interface PreviewLinha {
  linha: number;
  identificador: string;
  nome: string;
  serie: string;
  area: string;
  areaId: string | null;
  alunoExistente?: {
    id: string;
    nome: string;
    turma: string;
    areaAtual?: string;
  };
}

export interface PreviewLinhaErro {
  linha: number;
  dados: string[];
  erros: string[];
}

export type ImportacaoStatus = 'idle' | 'loading' | 'preview' | 'importing' | 'success' | 'error';

// ========== E-Aluno (SGE Externo) ==========

export interface EAlunoCredentials {
  user: string;       // CPF sem pontos
  password: string;   // Encrypted
}

export interface EAlunoTurmaMap {
  serie: number;
  turma: number;
  turno: string;
}

export interface EAlunoConfig {
  id: string;
  userId: string;
  credentials: EAlunoCredentials;
  turmaMap: Record<string, EAlunoTurmaMap>;        // luminarTurmaId -> e-aluno serie+turma+turno
  disciplinaMap: Record<string, number>;             // luminarDisciplinaId -> e-aluno disciplina ID
  alunoMap: Record<string, number>;                  // luminarAlunoId -> e-aluno aluno ID
  lastSync?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Opcao combinada do dropdown cmbSerie do e-aluno.
 * Cada opcao contem serie + turma + turno.
 * Ex: value="11" data-name="Matutino" data-code="7" -> "6º Ano - Ensino Fundamental II [ Matutino A ]"
 */
export interface EAlunoSerieOption {
  serie: number;      // value attribute (ex: 11)
  turma: number;      // data-code attribute (ex: 7)
  turno: string;      // data-name attribute (ex: "Matutino")
  label: string;      // display text (ex: "6º Ano - Ensino Fundamental II [ Matutino A ]")
}

export interface EAlunoDisciplinaOption {
  id: number;
  nome: string;
}

export interface EAlunoStudent {
  id: number;
  nome: string;
}

export interface EAlunoPageData {
  options: EAlunoSerieOption[];
  ano: number;
}
