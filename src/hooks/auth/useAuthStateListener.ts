'use client';

/**
 * Hook para gerenciar o listener de estado de autenticacao.
 * Inclui logica de linking automatico de UID para pre-cadastros.
 * Tambem gerencia persistencia do token OAuth do Google.
 */

import { useEffect } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useDriveStore } from '@/store/driveStore';
import { Usuario, UserRole } from '@/types';
import { getRoleForEmail, isAllowedDomain, isAdminEmail, ALLOWED_DOMAIN } from '@/lib/permissions';
import { usuarioService } from '@/services/firestore';
import { DEMO_MODE } from './authConstants';

export function useAuthStateListener() {
  const { setUser, setUsuario, setLoading } = useAuthStore();
  const { addToast } = useUIStore();

  useEffect(() => {
    // Demo mode - auto login
    if (DEMO_MODE) {
      setUser({
        uid: 'demo-user',
        email: 'demo@diario.local',
        displayName: 'Usuário Demo',
        photoURL: null,
      });
      setUsuario({
        id: 'demo-user',
        nome: 'Usuário Demonstração',
        cpf: '000.000.000-00',
        email: 'demo@diario.local',
        tipo: 'coordenador',
        ativo: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      setLoading(false);
      return;
    }

    // Handle redirect result (for Google Sign-In via redirect)
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          if (!isAllowedDomain(result.user.email)) {
            await signOut(auth);
            addToast(`Acesso negado. Apenas emails @${ALLOWED_DOMAIN} são permitidos.`, 'error');
            return;
          }

          // Capturar token do Google OAuth do resultado do redirect
          const credential = GoogleAuthProvider.credentialFromResult(result);
          if (credential?.accessToken) {
            const driveStore = useDriveStore.getState();
            driveStore.setAccessToken(credential.accessToken, 3600);
            initializeDriveFolders(credential.accessToken);
          }

          addToast(`Bem-vindo, ${result.user.displayName}!`, 'success');
        }
      })
      .catch((error) => {
        if (error.code !== 'auth/popup-closed-by-user') {
          console.error('Redirect result error:', error);
        }
      });

    // Funcao helper para inicializar pastas do Drive
    const initializeDriveFolders = (accessToken: string) => {
      const driveStore = useDriveStore.getState();
      driveStore.setInitializing(true);
      fetch('/api/drive/init-folders', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (!isAllowedDomain(firebaseUser.email)) {
          console.warn(`Acesso negado para email: ${firebaseUser.email}`);
          await signOut(auth);
          setUser(null);
          setUsuario(null);
          setLoading(false);
          addToast(`Acesso negado. Apenas emails @${ALLOWED_DOMAIN} são permitidos.`, 'error');
          return;
        }

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });

        // Tentar carregar token do sessionStorage ao recarregar a pagina
        const driveStore = useDriveStore.getState();
        if (!driveStore.accessToken) {
          const hasStoredToken = driveStore.loadStoredToken();
          if (hasStoredToken && driveStore.accessToken) {
            // Token recuperado do storage - inicializar Drive se necessario
            if (!driveStore.isInitialized && !driveStore.isInitializing) {
              initializeDriveFolders(driveStore.accessToken);
            }
          }
        }

        try {
          // Primeiro, verifica se existe um usuario com este UID
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as Usuario;

            // Promover para administrador se email esta em ADMIN_EMAILS
            if (isAdminEmail(firebaseUser.email) && userData.tipo !== 'administrador') {
              await usuarioService.update(userData.id, { tipo: 'administrador' });
              userData.tipo = 'administrador';
            }

            setUsuario(userData);
          } else {
            // Usuario nao existe pelo UID - verificar se existe pelo e-mail
            const email = firebaseUser.email;
            if (email) {
              const existingUser = await usuarioService.getByGoogleEmail(email);

              if (existingUser) {
                // Usuario encontrado pelo email - verificar se precisa atualizar UID
                if (existingUser.authStatus === 'pending' || existingUser.googleUid !== firebaseUser.uid) {
                  // Atualizar UID e status
                  await usuarioService.update(existingUser.id, {
                    googleUid: firebaseUser.uid,
                    authStatus: 'linked',
                    firstLoginAt: existingUser.firstLoginAt || new Date(),
                  });
                  console.log('UID vinculado/atualizado para usuario:', email);

                  if (existingUser.authStatus === 'pending') {
                    addToast('Bem-vindo! Seu acesso foi ativado automaticamente.', 'success');
                  }
                }

                // Usar o usuario existente (com dados atualizados)
                const updatedUser = await usuarioService.getByGoogleEmail(email);
                if (updatedUser) {
                  // Promover para administrador se email esta em ADMIN_EMAILS
                  if (isAdminEmail(email) && updatedUser.tipo !== 'administrador') {
                    await usuarioService.update(updatedUser.id, { tipo: 'administrador' });
                    updatedUser.tipo = 'administrador';
                  }
                  setUsuario(updatedUser);
                  setLoading(false);
                  return;
                }
              }
            }

            // Nenhum usuario existente - criar novo
            const userRole: UserRole = getRoleForEmail(firebaseUser.email, 'professor');
            const newUser: Usuario = {
              id: firebaseUser.uid,
              nome: firebaseUser.displayName || 'Usuario',
              cpf: '',
              email: firebaseUser.email || '',
              googleEmail: firebaseUser.email || '',
              googleUid: firebaseUser.uid,
              authStatus: 'linked',
              tipo: userRole,
              ativo: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
            await setDoc(doc(db, 'usuarios', firebaseUser.uid), newUser);
            setUsuario(newUser);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          const userRole: UserRole = getRoleForEmail(firebaseUser.email, 'professor');
          setUsuario({
            id: firebaseUser.uid,
            nome: firebaseUser.displayName || 'Usuario',
            cpf: '',
            email: firebaseUser.email || '',
            googleEmail: firebaseUser.email || '',
            googleUid: firebaseUser.uid,
            authStatus: 'linked',
            tipo: userRole,
            ativo: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      } else {
        setUser(null);
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setUsuario, setLoading, addToast]);
}
