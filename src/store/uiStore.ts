import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';
type SidebarMode = 'expanded' | 'collapsed' | 'hidden';

interface Toast {
  id: string;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface UIState {
  // Sidebar states
  sidebarOpen: boolean;
  sidebarMode: SidebarMode;
  isMobile: boolean;

  // Other states
  toasts: Toast[];
  isLoading: boolean;
  themeMode: ThemeMode;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setIsMobile: (value: boolean) => void;
  toggleSidebarMode: () => void;

  // Toast actions
  addToast: (message: string, severity?: Toast['severity']) => void;
  removeToast: (id: string) => void;

  // Other actions
  setLoading: (loading: boolean) => void;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Sidebar initial states
      sidebarOpen: false,
      sidebarMode: 'expanded' as SidebarMode,
      isMobile: false,

      // Other initial states
      toasts: [],
      isLoading: false,
      themeMode: 'light',

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarMode: (sidebarMode) => set({ sidebarMode }),
      setIsMobile: (isMobile) => set({ isMobile }),
      toggleSidebarMode: () =>
        set((state) => ({
          sidebarMode: state.sidebarMode === 'expanded' ? 'collapsed' : 'expanded',
        })),

      // Toast actions
      addToast: (message, severity = 'info') => {
        // Use crypto.randomUUID for unique IDs, with fallback to Date.now + random
        const id = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        // Use setTimeout to defer the state update and avoid setState during render
        setTimeout(() => {
          set((state) => ({
            toasts: [...state.toasts, { id, message, severity }],
          }));
          setTimeout(() => {
            set((state) => ({
              toasts: state.toasts.filter((t) => t.id !== id),
            }));
          }, 5000);
        }, 0);
      },
      removeToast: (id) =>
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        })),

      // Other actions
      setLoading: (isLoading) => set({ isLoading }),
      setThemeMode: (themeMode) => set({ themeMode }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'sge-ui-storage',
      partialize: (state) => ({
        themeMode: state.themeMode,
        sidebarMode: state.sidebarMode,
      }),
    }
  )
);
