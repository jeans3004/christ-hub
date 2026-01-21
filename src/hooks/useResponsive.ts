'use client';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect } from 'react';
import { useUIStore } from '@/store/uiStore';

/**
 * Hook para detecção responsiva de breakpoints.
 * Sincroniza automaticamente o estado isMobile com a store.
 */
export const useResponsive = () => {
  const theme = useTheme();
  const setIsMobile = useUIStore((state) => state.setIsMobile);
  const setSidebarMode = useUIStore((state) => state.setSidebarMode);
  const sidebarMode = useUIStore((state) => state.sidebarMode);

  // Breakpoints
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')); // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600px - 900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md')); // >= 900px
  const isLargeDesktop = useMediaQuery(theme.breakpoints.up('lg')); // >= 1200px

  // Sincroniza com a store
  useEffect(() => {
    setIsMobile(isMobile || isTablet);
  }, [isMobile, isTablet, setIsMobile]);

  // Ajusta sidebar mode baseado no breakpoint
  useEffect(() => {
    if (isMobile) {
      setSidebarMode('hidden');
    } else if (isTablet) {
      setSidebarMode('collapsed');
    }
    // Desktop mantém a preferência do usuário
  }, [isMobile, isTablet, setSidebarMode]);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    // Helpers
    isSmallScreen: isMobile || isTablet,
    currentBreakpoint: isMobile ? 'xs' : isTablet ? 'sm' : isLargeDesktop ? 'lg' : 'md',
  };
};

/**
 * Hook simplificado apenas para detecção de breakpoints (sem side effects).
 */
export const useBreakpoints = () => {
  const theme = useTheme();

  return {
    isMobile: useMediaQuery(theme.breakpoints.down('sm')),
    isTablet: useMediaQuery(theme.breakpoints.between('sm', 'md')),
    isDesktop: useMediaQuery(theme.breakpoints.up('md')),
    isLargeDesktop: useMediaQuery(theme.breakpoints.up('lg')),
  };
};
