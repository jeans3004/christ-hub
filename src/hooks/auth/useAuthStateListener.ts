'use client';

/**
 * Hook para gerenciar o listener de estado de autenticacao.
 */

import { useEffect } from 'react';
import { onAuthStateChanged, signOut, getRedirectResult } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Usuario, UserRole } from '@/types';
import { getRoleForEmail, isAllowedDomain, ALLOWED_DOMAIN } from '@/lib/permissions';
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
          addToast(`Bem-vindo, ${result.user.displayName}!`, 'success');
        }
      })
      .catch((error) => {
        if (error.code !== 'auth/popup-closed-by-user') {
          console.error('Redirect result error:', error);
        }
      });

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

        try {
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as Usuario;
            setUsuario(userData);
          } else {
            const userRole: UserRole = getRoleForEmail(firebaseUser.email, 'professor');
            const newUser: Usuario = {
              id: firebaseUser.uid,
              nome: firebaseUser.displayName || 'Usuario',
              cpf: '',
              email: firebaseUser.email || '',
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
