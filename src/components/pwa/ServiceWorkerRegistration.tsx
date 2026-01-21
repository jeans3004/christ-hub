'use client';

/**
 * Componente para registrar o Service Worker e gerenciar instalação PWA.
 * Deve ser incluído no layout principal.
 */

import { useEffect, useState, useCallback } from 'react';
import { Box, Button, Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon, GetApp as InstallIcon } from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function ServiceWorkerRegistration() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Registrar Service Worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        console.log('Service Worker registrado:', registration.scope);

        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Nova versão disponível
                setShowUpdatePrompt(true);
              }
            });
          }
        });
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    };

    registerSW();
  }, []);

  // Capturar evento de instalação
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Verificar se já foi instalado ou se o usuário já recusou recentemente
      const lastPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
      if (lastPrompt) {
        const lastTime = parseInt(lastPrompt, 10);
        const daysSince = (Date.now() - lastTime) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) {
          return; // Não mostrar por 7 dias após recusar
        }
      }

      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar se já foi instalado
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA instalado com sucesso!');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('Usuário aceitou a instalação');
      } else {
        console.log('Usuário recusou a instalação');
        localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
      }
    } catch (error) {
      console.error('Erro ao mostrar prompt de instalação:', error);
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  }, [deferredPrompt]);

  const handleDismissInstall = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
  }, []);

  const handleUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <>
      {/* Prompt de Instalação */}
      <Snackbar
        open={showInstallPrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ mb: { xs: 2, sm: 0 } }}
      >
        <Alert
          severity="info"
          icon={<InstallIcon />}
          action={
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleInstall}
                sx={{ fontWeight: 'bold' }}
              >
                Instalar
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={handleDismissInstall}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{
            width: '100%',
            maxWidth: 400,
            '& .MuiAlert-message': { flex: 1 }
          }}
        >
          Instale o SGE Diário para acesso rápido!
        </Alert>
      </Snackbar>

      {/* Prompt de Atualização */}
      <Snackbar
        open={showUpdatePrompt}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="success"
          action={
            <Button color="inherit" size="small" onClick={handleUpdate}>
              Atualizar
            </Button>
          }
        >
          Nova versão disponível!
        </Alert>
      </Snackbar>
    </>
  );
}
