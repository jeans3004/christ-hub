import { UserRole } from '@/types';

/**
 * Tipos de permissao do sistema.
 * Seguem o padrao 'modulo:acao'.
 */
export type Permission =
  // Dashboard
  | 'dashboard:view'
  // Chamada (Attendance)
  | 'chamada:view'
  | 'chamada:create'
  | 'chamada:edit'
  | 'chamada:delete'
  // Notas (Grades)
  | 'notas:view'
  | 'notas:create'
  | 'notas:edit'
  | 'notas:delete'
  // Agenda
  | 'agenda:view'
  | 'agenda:create'
  | 'agenda:edit'
  | 'agenda:delete'
  // Turmas (Classes)
  | 'turmas:view'
  | 'turmas:create'
  | 'turmas:edit'
  | 'turmas:delete'
  // Alunos (Students)
  | 'alunos:view'
  | 'alunos:create'
  | 'alunos:edit'
  | 'alunos:delete'
  // Professores (Teachers)
  | 'professores:view'
  | 'professores:create'
  | 'professores:edit'
  | 'professores:delete'
  // Ocorrencias (Incidents)
  | 'ocorrencias:view'
  | 'ocorrencias:create'
  | 'ocorrencias:edit'
  | 'ocorrencias:approve'
  | 'ocorrencias:delete'
  // Conceitos (Concepts)
  | 'conceitos:view'
  | 'conceitos:create'
  | 'conceitos:edit'
  | 'conceitos:delete'
  // Graficos (Charts/Reports)
  | 'graficos:view'
  // Aniversariantes (Birthdays)
  | 'aniversariantes:view'
  // Comunicados (Announcements)
  | 'comunicados:view'
  | 'comunicados:create'
  | 'comunicados:edit'
  | 'comunicados:delete'
  // Configuracoes (Settings)
  | 'configuracoes:view'
  | 'configuracoes:edit'
  // Usuarios (User Management)
  | 'usuarios:view'
  | 'usuarios:create'
  | 'usuarios:edit'
  | 'usuarios:delete'
  // Sistema (System)
  | 'sistema:configurar'
  // Mensagens WhatsApp
  | 'mensagens:view'
  | 'mensagens:send'
  | 'mensagens:templates'
  // Horarios (Schedules)
  | 'horarios:view'
  | 'horarios:create'
  | 'horarios:edit'
  | 'horarios:delete'
  // Google Classroom
  | 'classroom:view'
  | 'classroom:export'
  | 'classroom:post';

/**
 * Permissoes base que todos os usuarios tem.
 */
const BASE_PERMISSIONS: Permission[] = [
  'dashboard:view',
  'graficos:view',
  'aniversariantes:view',
  'comunicados:view',
];

/**
 * Permissoes de professor (nivel base).
 * Pode gerenciar chamada, notas e conceitos de suas turmas.
 */
const PROFESSOR_PERMISSIONS: Permission[] = [
  ...BASE_PERMISSIONS,
  'chamada:view',
  'chamada:create',
  'chamada:edit',
  'notas:view',
  'notas:create',
  'notas:edit',
  'agenda:view',
  'alunos:view',
  'conceitos:view',
  'conceitos:create',
  'conceitos:edit',
  'ocorrencias:view',
  'ocorrencias:create',
  'horarios:view',
  'classroom:view',
  'classroom:post',
];

/**
 * Permissoes de coordenador.
 * Todas as permissoes de professor + gestao de turmas, alunos, etc.
 */
const COORDENADOR_PERMISSIONS: Permission[] = [
  ...PROFESSOR_PERMISSIONS,
  'chamada:delete',
  'notas:delete',
  'agenda:create',
  'agenda:edit',
  'agenda:delete',
  'turmas:view',
  'turmas:create',
  'turmas:edit',
  'turmas:delete',
  'alunos:view',
  'alunos:create',
  'alunos:edit',
  'alunos:delete',
  'professores:view',
  'professores:create',
  'professores:edit',
  'professores:delete',
  'ocorrencias:edit',
  'ocorrencias:approve',
  'ocorrencias:delete',
  'conceitos:delete',
  'comunicados:create',
  'comunicados:edit',
  'comunicados:delete',
  'usuarios:view',
  'mensagens:view',
  'mensagens:send',
  'mensagens:templates',
  'horarios:create',
  'horarios:edit',
  'horarios:delete',
  'classroom:export',
];

/**
 * Permissoes de administrador.
 * Acesso total ao sistema.
 */
const ADMINISTRADOR_PERMISSIONS: Permission[] = [
  ...COORDENADOR_PERMISSIONS,
  'configuracoes:view',
  'configuracoes:edit',
  'usuarios:create',
  'usuarios:edit',
  'usuarios:delete',
  'sistema:configurar',
];

/**
 * Mapeamento de role para permissoes.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  professor: PROFESSOR_PERMISSIONS,
  coordenador: COORDENADOR_PERMISSIONS,
  administrador: ADMINISTRADOR_PERMISSIONS,
};

/**
 * Emails com acesso de administrador automatico.
 */
export const ADMIN_EMAILS: string[] = [
  'jeanmachado@christmaster.com.br',
];

/**
 * Nomes de exibicao para roles.
 */
export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  professor: 'Professor',
  coordenador: 'Coordenador',
  administrador: 'Administrador',
};

/**
 * Cores de UI para roles.
 */
export const ROLE_COLORS: Record<UserRole, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  professor: 'info',
  coordenador: 'warning',
  administrador: 'error',
};

/**
 * Descricoes de roles.
 */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  professor: 'Acesso a chamada, notas e conceitos de suas turmas',
  coordenador: 'Gestao de turmas, alunos e professores',
  administrador: 'Acesso total ao sistema',
};
