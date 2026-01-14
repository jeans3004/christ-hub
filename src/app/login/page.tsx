'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Collapse,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Google } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';

// Logo Component - Smiley face
function Logo() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
        {/* Eyes */}
        <circle cx="18" cy="22" r="5" fill="#7C3AED" />
        <circle cx="42" cy="22" r="5" fill="#7C3AED" />
        {/* Smile */}
        <path
          d="M12 38 Q30 55 48 38"
          stroke="#7C3AED"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <Typography
        variant="h5"
        sx={{
          mt: 2,
          fontWeight: 700,
          color: 'primary.main',
          letterSpacing: '-0.02em',
        }}
      >
        diario
      </Typography>
    </Box>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login, loginWithGoogle, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      cpf: '',
      senha: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    const email = `${data.cpf.replace(/\D/g, '')}@diario.local`;
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
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Logo />

        <Paper
          elevation={0}
          sx={{
            p: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography
            variant="h6"
            textAlign="center"
            fontWeight={600}
            sx={{ mb: 1 }}
          >
            Bem-vindo
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mb: 3 }}
          >
            Faca login para acessar o sistema
          </Typography>

          {/* Google Login Button */}
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleGoogleLogin}
            disabled={googleLoading || isLoading}
            startIcon={
              googleLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Google />
              )
            }
            sx={{
              py: 1.5,
              fontSize: '1rem',
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.primary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
          >
            {googleLoading ? 'Entrando...' : 'Entrar com Google'}
          </Button>

          {/* Link to show email/password login */}
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Link
              component="button"
              type="button"
              underline="hover"
              onClick={() => setShowEmailLogin(!showEmailLogin)}
              sx={{
                color: 'primary.main',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {showEmailLogin ? 'Ocultar login com credenciais' : 'Entrar com usuario e senha'}
            </Link>
          </Box>

          {/* Collapsible Email/Password Form */}
          <Collapse in={showEmailLogin}>
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  ou
                </Typography>
              </Divider>

              <form onSubmit={handleSubmit(onSubmit)}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    {...register('cpf')}
                    label="Usuario ou e-mail"
                    placeholder="Digite seu usuario"
                    error={!!errors.cpf}
                    helperText={errors.cpf?.message}
                    fullWidth
                    size="medium"
                  />

                  <Box>
                    <TextField
                      {...register('senha')}
                      label="Senha"
                      type={showPassword ? 'text' : 'password'}
                      error={!!errors.senha}
                      helperText={errors.senha?.message}
                      fullWidth
                      size="medium"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                              aria-label={showPassword ? 'ocultar senha' : 'mostrar senha'}
                              size="small"
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Link
                        href="#"
                        underline="hover"
                        sx={{
                          color: 'primary.main',
                          fontSize: '0.8rem',
                        }}
                      >
                        Esqueci minha senha
                      </Link>
                    </Box>
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    fullWidth
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      textTransform: 'none',
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
                  </Button>
                </Box>
              </form>
            </Box>
          </Collapse>
        </Paper>

        {/* Footer */}
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          display="block"
          sx={{ mt: 3 }}
        >
          Ao continuar, voce concorda com nossos Termos de Uso e Politica de Privacidade
        </Typography>
      </Box>
    </Box>
  );
}
