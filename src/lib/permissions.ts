/**
 * Sistema de permissoes RBAC (Role-Based Access Control).
 * Funcoes para verificacao de permissoes de usuario.
 */

import { UserRole, RoleHierarchy, Usuario } from '@/types';
import {
  Permission,
  ROLE_PERMISSIONS,
  ADMIN_EMAILS,
  ROLE_DISPLAY_NAMES,
  ROLE_COLORS,
} from '@/constants/permissions';

// Re-exports para conveniencia
export type { Permission } from '@/constants/permissions';
export type { UserRole } from '@/types';
export { ADMIN_EMAILS } from '@/constants/permissions';

/**
 * Verifica se um usuario tem uma permissao especifica.
 */
export function hasPermission(usuario: Usuario | null, permission: Permission): boolean {
  if (!usuario) return false;
  const permissions = ROLE_PERMISSIONS[usuario.tipo] || [];
  return permissions.includes(permission);
}

/**
 * Verifica se um usuario tem alguma das permissoes especificadas.
 */
export function hasAnyPermission(usuario: Usuario | null, permissions: Permission[]): boolean {
  if (!usuario) return false;
  return permissions.some(p => hasPermission(usuario, p));
}

/**
 * Verifica se um usuario tem todas as permissoes especificadas.
 */
export function hasAllPermissions(usuario: Usuario | null, permissions: Permission[]): boolean {
  if (!usuario) return false;
  return permissions.every(p => hasPermission(usuario, p));
}

/**
 * Retorna todas as permissoes de uma role.
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Verifica se a role do usuario e pelo menos do nivel especificado.
 */
export function hasMinimumRole(usuario: Usuario | null, minRole: UserRole): boolean {
  if (!usuario) return false;
  return RoleHierarchy[usuario.tipo] >= RoleHierarchy[minRole];
}

/**
 * Verifica se o usuario e administrador.
 */
export function isAdmin(usuario: Usuario | null): boolean {
  return usuario?.tipo === 'administrador';
}

/**
 * Verifica se o usuario e coordenador ou superior.
 */
export function isCoordinatorOrAbove(usuario: Usuario | null): boolean {
  return hasMinimumRole(usuario, 'coordenador');
}

/**
 * Verifica se o usuario e professor (nivel mais baixo).
 */
export function isProfessor(usuario: Usuario | null): boolean {
  return usuario?.tipo === 'professor';
}

/**
 * Domínio permitido para login com Google.
 */
export const ALLOWED_DOMAIN = 'christmaster.com.br';

/**
 * Verifica se o email pertence ao domínio permitido.
 */
export function isAllowedDomain(email: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${ALLOWED_DOMAIN}`);
}

/**
 * Verifica se o email e de um administrador.
 */
export function isAdminEmail(email: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Retorna a role apropriada para um email.
 */
export function getRoleForEmail(email: string | null, defaultRole: UserRole = 'professor'): UserRole {
  if (isAdminEmail(email)) return 'administrador';
  return defaultRole;
}

/**
 * Verifica se o professor pode acessar uma disciplina especifica.
 */
export function canAccessDiscipline(usuario: Usuario | null, disciplinaId: string): boolean {
  if (!usuario) return false;
  // Admins e coordenadores podem acessar todas as disciplinas
  if (hasMinimumRole(usuario, 'coordenador')) return true;
  // Professores so podem acessar suas disciplinas atribuidas
  return usuario.disciplinaIds?.includes(disciplinaId) ?? false;
}

/**
 * Verifica se o professor pode acessar uma turma especifica.
 */
export function canAccessTurma(usuario: Usuario | null, turmaId: string): boolean {
  if (!usuario) return false;
  // Admins e coordenadores podem acessar todas as turmas
  if (hasMinimumRole(usuario, 'coordenador')) return true;
  // Professores so podem acessar suas turmas atribuidas
  return usuario.turmaIds?.includes(turmaId) ?? false;
}

/**
 * Retorna o nome de exibicao da role em portugues.
 */
export function getRoleDisplayName(role: UserRole): string {
  return ROLE_DISPLAY_NAMES[role] || role;
}

/**
 * Retorna a cor de UI para a role.
 */
export function getRoleColor(role: UserRole): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' {
  return ROLE_COLORS[role] || 'default';
}
