'use client';

import { useAuthStore } from '@/store/authStore';
import {
  Permission,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinimumRole,
  isAdmin,
  isCoordinatorOrAbove,
  isProfessor,
  canAccessDiscipline,
  canAccessTurma,
  getRoleDisplayName,
  getRoleColor,
} from '@/lib/permissions';
import { UserRole } from '@/types';

export function usePermissions() {
  const { usuario } = useAuthStore();

  return {
    // User info
    usuario,
    role: usuario?.tipo || null,
    roleDisplayName: usuario ? getRoleDisplayName(usuario.tipo) : null,
    roleColor: usuario ? getRoleColor(usuario.tipo) : 'default',

    // Permission checks
    can: (permission: Permission) => hasPermission(usuario, permission),
    canAny: (permissions: Permission[]) => hasAnyPermission(usuario, permissions),
    canAll: (permissions: Permission[]) => hasAllPermissions(usuario, permissions),

    // Role checks
    hasMinRole: (minRole: UserRole) => hasMinimumRole(usuario, minRole),
    isAdmin: () => isAdmin(usuario),
    isCoordinatorOrAbove: () => isCoordinatorOrAbove(usuario),
    isProfessor: () => isProfessor(usuario),

    // Resource access
    canAccessDiscipline: (disciplinaId: string) => canAccessDiscipline(usuario, disciplinaId),
    canAccessTurma: (turmaId: string) => canAccessTurma(usuario, turmaId),

    // Discipline and class info for professors
    disciplinaIds: usuario?.disciplinaIds || [],
    turmaIds: usuario?.turmaIds || [],
  };
}

export default usePermissions;
