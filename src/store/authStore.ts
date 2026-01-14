import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      usuario: null,
      isLoading: true,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setUsuario: (usuario) => set({ usuario }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ user: null, usuario: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        usuario: state.usuario,
      }),
    }
  )
);
