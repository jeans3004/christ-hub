'use client';

/**
 * Formulario de login com credenciais.
 */

import { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  Divider,
  Typography,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '@/lib/validations';

interface CredentialsFormProps {
  onSubmit: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
}

export function CredentialsForm({ onSubmit, isLoading }: CredentialsFormProps) {
  const [showPassword, setShowPassword] = useState(false);

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

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 3 }}>
        <Typography variant="caption" color="text.secondary">ou</Typography>
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
              <Link href="#" underline="hover" sx={{ color: 'primary.main', fontSize: '0.8rem' }}>
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
            sx={{ py: 1.5, fontSize: '1rem', textTransform: 'none' }}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Entrar'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
