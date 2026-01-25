'use client';

/**
 * Pagina de login - sempre em modo claro.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NextLink from 'next/link';
import { Box, Paper, Typography, Link, Collapse, ThemeProvider } from '@mui/material';
import { LoginFormData } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Logo, GoogleLoginButton, CredentialsForm } from './components';
import { lightTheme } from '@/lib/theme';

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    const email = `${data.cpf.replace(/\D/g, '')}@luminar.local`;
    const result = await login(email, data.senha);
    if (result.success) {
      router.push('/diario/menu');
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        router.push('/diario/menu');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#F5F7FA',
          p: 2,
        }}
      >
        <Logo />

        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid', borderColor: '#E2E8F0', bgcolor: '#FFFFFF' }}>
            <Typography variant="h6" textAlign="center" fontWeight={600} sx={{ mb: 1, color: '#1A202C' }}>
              Bem-vindo
            </Typography>
            <Typography variant="body2" textAlign="center" sx={{ mb: 3, color: '#4A5568' }}>
              Faca login para acessar a plataforma
            </Typography>

            <GoogleLoginButton
              onClick={handleGoogleLogin}
              loading={googleLoading}
              disabled={googleLoading || isLoading}
            />

            <Box sx={{ textAlign: 'center', mt: 3 }}>
              <Link
                component="button"
                type="button"
                underline="hover"
                onClick={() => setShowEmailLogin(!showEmailLogin)}
                sx={{ color: '#2A3F5F', fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' }}
              >
                {showEmailLogin ? 'Ocultar login com credenciais' : 'Entrar com usuario e senha'}
              </Link>
            </Box>

            <Collapse in={showEmailLogin}>
              <CredentialsForm onSubmit={onSubmit} isLoading={isLoading} />
            </Collapse>
          </Paper>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ color: '#4A5568' }}>
              Ao fazer login, voce concorda com nossos
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mt: 0.5 }}>
              <Link
                component={NextLink}
                href="/termos-servico"
                variant="caption"
                sx={{
                  color: '#2A3F5F',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  '&:hover': { color: '#E5A53A' },
                }}
              >
                Termos de Servico
              </Link>
              <Typography variant="caption" sx={{ color: '#4A5568' }}>e</Typography>
              <Link
                component={NextLink}
                href="/politica-privacidade"
                variant="caption"
                sx={{
                  color: '#2A3F5F',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  '&:hover': { color: '#E5A53A' },
                }}
              >
                Politica de Privacidade
              </Link>
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
