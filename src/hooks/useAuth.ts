'use client';

/**
 * Hook principal de autenticacao.
 */

import { useAuthStore } from '@/store/authStore';
import { useAuthStateListener, useAuthActions, DEMO_MODE } from './auth';

export function useAuth() {
  const { user, usuario, isLoading, isAuthenticated } = useAuthStore();
  const { login, loginWithGoogle, handleLogout } = useAuthActions();

  // Setup auth state listener
  useAuthStateListener();

  return {
    user,
    usuario,
    isLoading,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout: handleLogout,
    isDemoMode: DEMO_MODE,
  };
}
