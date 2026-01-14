'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, Badge, Lock } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MainLayout from '@/components/layout/MainLayout';
import { alterarSenhaSchema, AlterarSenhaFormData } from '@/lib/validations';
import { useUIStore } from '@/store/uiStore';

export default function SenhaPage() {
  const { addToast } = useUIStore();
  const [showPasswords, setShowPasswords] = useState({
    atual: false,
    nova: false,
    confirmar: false,
  });
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AlterarSenhaFormData>({
    resolver: zodResolver(alterarSenhaSchema),
    defaultValues: {
      cpf: '',
      senhaAtual: '',
      novaSenha: '',
      confirmarSenha: '',
    },
  });

  const onSubmit = async (data: AlterarSenhaFormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      addToast('Senha alterada com sucesso!', 'success');
      reset();
    } catch (error) {
      addToast('Erro ao alterar senha', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
    if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
    return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`;
  };

  const togglePasswordVisibility = (field: 'atual' | 'nova' | 'confirmar') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <MainLayout title="Senha">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          pt: 4,
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 450, width: '100%' }}>
          <Typography variant="h5" gutterBottom textAlign="center" color="primary">
            Alterar Senha
          </Typography>

          <Alert severity="info" sx={{ mb: 3 }}>
            A nova senha deve ter no mínimo 6 caracteres.
          </Alert>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                {...register('cpf')}
                label="CPF"
                placeholder="000.000.000-00"
                error={!!errors.cpf}
                helperText={errors.cpf?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Badge color="action" />
                    </InputAdornment>
                  ),
                }}
                onChange={(e) => {
                  e.target.value = formatCPF(e.target.value);
                }}
                inputProps={{ maxLength: 14 }}
              />

              <TextField
                {...register('senhaAtual')}
                label="Senha Atual"
                type={showPasswords.atual ? 'text' : 'password'}
                error={!!errors.senhaAtual}
                helperText={errors.senhaAtual?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('atual')}
                        edge="end"
                      >
                        {showPasswords.atual ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                {...register('novaSenha')}
                label="Nova Senha"
                type={showPasswords.nova ? 'text' : 'password'}
                error={!!errors.novaSenha}
                helperText={errors.novaSenha?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('nova')}
                        edge="end"
                      >
                        {showPasswords.nova ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                {...register('confirmarSenha')}
                label="Confirmar Nova Senha"
                type={showPasswords.confirmar ? 'text' : 'password'}
                error={!!errors.confirmarSenha}
                helperText={errors.confirmarSenha?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => togglePasswordVisibility('confirmar')}
                        edge="end"
                      >
                        {showPasswords.confirmar ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 1 }}
              >
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </MainLayout>
  );
}
