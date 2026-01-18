/**
 * Constantes de autenticacao.
 */

import { GoogleAuthProvider } from 'firebase/auth';

export const googleProvider = new GoogleAuthProvider();

// Demo mode - set to true to bypass Firebase auth
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
