import { create } from 'zustand';
import { AuthUser, Usuario } from '@/types';

interface AuthState {
  user: AuthUser | null;
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  setUsuario: (usuario: Usuario | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

// Limpar cache antigo do localStorage (migracao)
if (typeof window !== 'undefined') {
  localStorage.removeItem('auth-storage');
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  usuario: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setUsuario: (usuario) => set({ usuario }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, usuario: null, isAuthenticated: false }),
}));
