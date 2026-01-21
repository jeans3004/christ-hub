'use client';

/**
 * Hook para detectar status de conexao offline/online.
 * Usa navigator.onLine e eventos de rede para monitorar mudancas.
 */

import { useState, useEffect, useCallback } from 'react';

interface UseOfflineReturn {
  isOffline: boolean;
  isOnline: boolean;
  lastOnlineAt: Date | null;
  wasOffline: boolean;
}

export function useOffline(): UseOfflineReturn {
  const [isOffline, setIsOffline] = useState(false);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOffline(false);
    setLastOnlineAt(new Date());
    if (wasOffline) {
      // Foi offline e voltou
    }
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOffline(true);
    setWasOffline(true);
  }, []);

  useEffect(() => {
    // Verificar estado inicial
    if (typeof navigator !== 'undefined') {
      setIsOffline(!navigator.onLine);
      if (navigator.onLine) {
        setLastOnlineAt(new Date());
      }
    }

    // Adicionar listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOffline,
    isOnline: !isOffline,
    lastOnlineAt,
    wasOffline,
  };
}
