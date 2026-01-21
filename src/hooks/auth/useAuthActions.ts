'use client';

/**
 * Hook para acoes de autenticacao (login/logout).
 */

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useDriveStore } from '@/store/driveStore';
import { Usuario } from '@/types';
import { isAllowedDomain, ALLOWED_DOMAIN } from '@/lib/permissions';
import { googleProvider, DEMO_MODE } from './authConstants';

export function useAuthActions() {
  const router = useRouter();
  const { setUsuario, setLoading, logout } = useAuthStore();
  const { addToast } = useUIStore();

  const login = useCallback(async (email: string, password: string) => {
    if (DEMO_MODE) {
      addToast('Login realizado com sucesso! (Modo Demo)', 'success');
      return { success: true };
    }

    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);

      const userDoc = await getDoc(doc(db, 'usuarios', result.user.uid));
      if (userDoc.exists()) {
        const userData = { id: userDoc.id, ...userDoc.data() } as Usuario;
        setUsuario(userData);
      }

      addToast('Login realizado com sucesso!', 'success');
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      let message = 'Erro ao fazer login';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'CPF ou senha inválidos';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Muitas tentativas. Tente novamente mais tarde.';
      } else if (error.code === 'auth/invalid-credential') {
        message = 'Credenciais inválidas';
      }
      addToast(message, 'error');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, setUsuario, addToast]);

  const loginWithGoogle = useCallback(async (useRedirect = false) => {
    if (DEMO_MODE) {
      addToast('Login realizado com sucesso! (Modo Demo)', 'success');
      return { success: true };
    }

    try {
      setLoading(true);

      if (useRedirect) {
        await signInWithRedirect(auth, googleProvider);
        return { success: true };
      }

      const result = await signInWithPopup(auth, googleProvider);

      if (!isAllowedDomain(result.user.email)) {
        await signOut(auth);
        const message = `Acesso negado. Apenas emails @${ALLOWED_DOMAIN} são permitidos.`;
        addToast(message, 'error');
        return { success: false, error: message };
      }

      // Capturar token do Google Drive e inicializar pastas
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        const driveStore = useDriveStore.getState();
        // Token expira em 1 hora (3600 segundos)
        driveStore.setAccessToken(credential.accessToken, 3600);

        // Inicializar estrutura de pastas no Drive (em background)
        driveStore.setInitializing(true);
        fetch('/api/drive/init-folders', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${credential.accessToken}`,
            'Content-Type': 'application/json',
          },
        })
          .then(response => response.json())
          .then(data => {
            if (data.success && data.folderIds) {
              driveStore.setFolderIds(data.folderIds);
              driveStore.setInitialized(true);
              console.log('Drive folders initialized:', data.folderIds);
            } else {
              console.error('Failed to initialize Drive folders:', data.error);
              driveStore.setInitialized(false);
            }
          })
          .catch(error => {
            console.error('Error initializing Drive folders:', error);
            driveStore.setInitialized(false);
          })
          .finally(() => {
            driveStore.setInitializing(false);
          });
      }

      addToast(`Bem-vindo, ${result.user.displayName}!`, 'success');
      return { success: true };
    } catch (error: any) {
      console.error('Google login error:', error);
      let message = 'Erro ao fazer login com Google';

      if (error.code === 'auth/popup-blocked' ||
          error.code === 'auth/network-request-failed' ||
          error.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { success: true };
        } catch (redirectError: any) {
          console.error('Redirect also failed:', redirectError);
        }
      }

      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Login cancelado';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup bloqueado, tentando redirect...';
      } else if (error.code === 'auth/network-request-failed') {
        message = 'Erro de rede. Verifique sua conexão.';
      }
      addToast(message, 'error');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [setLoading, addToast]);

  const handleLogout = useCallback(async () => {
    if (DEMO_MODE) {
      logout();
      useDriveStore.getState().reset();
      addToast('Logout realizado com sucesso!', 'success');
      router.push('/login');
      return;
    }

    try {
      await signOut(auth);
      logout();
      useDriveStore.getState().reset();
      addToast('Logout realizado com sucesso!', 'success');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      addToast('Erro ao fazer logout', 'error');
    }
  }, [logout, addToast, router]);

  return { login, loginWithGoogle, handleLogout };
}
