'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Usuario, UserRole } from '@/types';
import { isAdminEmail, getRoleForEmail } from '@/lib/permissions';

const googleProvider = new GoogleAuthProvider();

// Demo mode - set to true to bypass Firebase auth
const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function useAuth() {
  const router = useRouter();
  const { user, usuario, isLoading, isAuthenticated, setUser, setUsuario, setLoading, logout } = useAuthStore();
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
        });

        // Fetch user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = { id: userDoc.id, ...userDoc.data() } as Usuario;
            setUsuario(userData);
          } else {
            // Create user profile if it doesn't exist (for Google login)
            // Check if user is an admin based on email
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
          // Set basic user info even if Firestore fails
          // Check if user is an admin based on email
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
  }, [setUser, setUsuario, setLoading]);

  // Login with CPF/Password
  const login = async (email: string, password: string) => {
    if (DEMO_MODE) {
      addToast('Login realizado com sucesso! (Modo Demo)', 'success');
      return { success: true };
    }

    try {
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);

      // Fetch user data
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
  };

  // Login with Google
  const loginWithGoogle = async () => {
    if (DEMO_MODE) {
      addToast('Login realizado com sucesso! (Modo Demo)', 'success');
      return { success: true };
    }

    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);

      // User profile will be created/fetched in onAuthStateChanged
      addToast(`Bem-vindo, ${result.user.displayName}!`, 'success');
      return { success: true };
    } catch (error: any) {
      console.error('Google login error:', error);
      let message = 'Erro ao fazer login com Google';
      if (error.code === 'auth/popup-closed-by-user') {
        message = 'Login cancelado';
      } else if (error.code === 'auth/popup-blocked') {
        message = 'Popup bloqueado pelo navegador';
      }
      addToast(message, 'error');
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (DEMO_MODE) {
      logout();
      addToast('Logout realizado com sucesso!', 'success');
      router.push('/login');
      return;
    }

    try {
      await signOut(auth);
      logout();
      addToast('Logout realizado com sucesso!', 'success');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      addToast('Erro ao fazer logout', 'error');
    }
  };

  return {
    user,
    usuario,
    isLoading,
    isAuthenticated,
    login,
    loginWithGoogle,
    logout: handleLogout,
    isDemoMode: DEMO_MODE,
  };
}
