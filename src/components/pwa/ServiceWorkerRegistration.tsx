'use client';

/**
 * Gerencia registro do Service Worker, prompt de instalacao e atualizacoes.
 * - Dialog nao-dispensavel para atualizacoes (garante que o usuario atualize)
 * - Verificacao periodica de atualizacoes (importante para iOS)
 * - Verifica atualizacoes ao retornar ao app (visibilitychange)
 * - Limpa caches antes de ativar nova versao
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Button, Snackbar, Alert, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Typography,
} from '@mui/material';
import {
  Close as CloseIcon,
  GetApp as InstallIcon,
  SystemUpdateAlt as UpdateIcon,
} from '@mui/icons-material';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const UPDATE_CHECK_MS = 60 * 60 * 1000; // 60 min

export default function ServiceWorkerRegistration() {
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Registrar SW e gerenciar atualizacoes
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    let checkInterval: ReturnType<typeof setInterval>;
    let refreshing = false;

    const promptUpdate = () => setShowUpdateDialog(true);

    const trackInstalling = (worker: ServiceWorker) => {
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) {
          promptUpdate();
        }
      });
    };

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        registrationRef.current = registration;

        // Worker ja aguardando ativacao (ex: update anterior nao aplicado)
        if (registration.waiting) {
          promptUpdate();
        }

        // Novo worker sendo instalado
        if (registration.installing) {
          trackInstalling(registration.installing);
        }

        // Futuras atualizacoes
        registration.addEventListener('updatefound', () => {
          if (registration.installing) {
            trackInstalling(registration.installing);
          }
        });

        // Verificacao periodica (importante para iOS que nao detecta updates em background)
        checkInterval = setInterval(() => {
          registration.update().catch(console.error);
        }, UPDATE_CHECK_MS);

        // Verificar ao voltar ao app (iOS PWA, troca de aba, etc)
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(console.error);
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);
      } catch (error) {
        console.error('Erro ao registrar Service Worker:', error);
      }
    };

    // Quando um novo SW assume o controle, recarregar a pagina
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    registerSW();

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, []);

  // Prompt de instalacao (Android/desktop)
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      const lastPrompt = localStorage.getItem('pwa-install-prompt-dismissed');
      if (lastPrompt) {
        const daysSince = (Date.now() - parseInt(lastPrompt, 10)) / (1000 * 60 * 60 * 24);
        if (daysSince < 7) return;
      }

      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
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
      if (outcome !== 'accepted') {
        localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
      }
    } catch (error) {
      console.error('Erro ao mostrar prompt de instalacao:', error);
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  }, [deferredPrompt]);

  const handleDismissInstall = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-prompt-dismissed', Date.now().toString());
  }, []);

  const handleUpdate = useCallback(async () => {
    setUpdating(true);

    // Limpar todos os caches para garantir assets novos
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }

    const registration = registrationRef.current;
    if (registration?.waiting) {
      // Ativar o worker em espera (worker/index.js escuta esta mensagem)
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      // controllerchange listener vai recarregar a pagina
    } else {
      window.location.reload();
    }

    // Fallback: se controllerchange nao disparar em 3s, forcar reload
    setTimeout(() => window.location.reload(), 3000);
  }, []);

  return (
    <>
      {/* Prompt de Instalacao */}
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
              <Button color="inherit" size="small" onClick={handleInstall} sx={{ fontWeight: 'bold' }}>
                Instalar
              </Button>
              <IconButton size="small" color="inherit" onClick={handleDismissInstall}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          }
          sx={{ width: '100%', maxWidth: 400, '& .MuiAlert-message': { flex: 1 } }}
        >
          Instale o Luminar para acesso rapido!
        </Alert>
      </Snackbar>

      {/* Dialog de Atualizacao - nao dispensavel */}
      <Dialog open={showUpdateDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <UpdateIcon color="primary" />
          Nova versao disponivel
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Uma nova versao do Luminar esta disponivel com melhorias e correcoes. Atualize para continuar usando o sistema.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="contained"
            onClick={handleUpdate}
            disabled={updating}
            startIcon={<UpdateIcon />}
            fullWidth
          >
            {updating ? 'Atualizando...' : 'Atualizar agora'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
