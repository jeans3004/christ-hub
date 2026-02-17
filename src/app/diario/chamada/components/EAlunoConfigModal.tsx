/**
 * Modal para configurar integracao com e-aluno (SGE externo).
 * Permite salvar credenciais e mapear turmas/disciplinas/alunos.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
  Chip,
} from '@mui/material';
import { Visibility, VisibilityOff, CheckCircle, Sync } from '@mui/icons-material';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { eAlunoConfigService } from '@/services/firestore/eAlunoConfigService';
import { EAlunoConfig } from '@/types';

interface EAlunoConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfigSaved?: (config: EAlunoConfig) => void;
}

export function SgeConfigModal({ open, onClose, onConfigSaved }: EAlunoConfigModalProps) {
  const { usuario } = useAuth();
  const { addToast } = useUIStore();

  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [existingConfig, setExistingConfig] = useState<EAlunoConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Load existing config
  useEffect(() => {
    if (!open || !usuario?.id) return;

    const loadConfig = async () => {
      setLoading(true);
      try {
        const config = await eAlunoConfigService.getByUser(usuario.id);
        if (config) {
          setExistingConfig(config);
          setUser(config.credentials.user);
          // Don't show saved password, just show placeholder
          setPassword('');
        }
      } catch (error) {
        console.error('Erro ao carregar config e-aluno:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [open, usuario?.id]);

  const handleTestConnection = async () => {
    if (!user) {
      addToast('Informe o usuario (CPF)', 'warning');
      return;
    }
    if (!password && !existingConfig) {
      addToast('Informe a senha', 'warning');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/sge/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user,
          password: password || '___USE_SAVED___', // placeholder
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestResult('success');
        setTestMessage(`Conectado! ${data.data.options?.length || 0} turmas encontradas.`);
      } else {
        setTestResult('error');
        setTestMessage(data.error || 'Falha na conexao');
      }
    } catch (error) {
      setTestResult('error');
      setTestMessage('Erro de conexao com o servidor');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!usuario?.id) return;
    if (!user) {
      addToast('Informe o usuario (CPF)', 'warning');
      return;
    }

    setSaving(true);
    try {
      // Encrypt password via API
      const credData: { user: string; password: string } = {
        user: user.replace(/[^0-9]/g, ''),
        password: password || existingConfig?.credentials.password || '',
      };

      if (!credData.password) {
        addToast('Informe a senha', 'warning');
        setSaving(false);
        return;
      }

      await eAlunoConfigService.saveForUser(usuario.id, {
        credentials: credData,
      });

      const config = await eAlunoConfigService.getByUser(usuario.id);
      addToast('Configuracao salva com sucesso!', 'success');

      if (config && onConfigSaved) {
        onConfigSaved(config);
      }

      onClose();
    } catch (error) {
      console.error('Erro ao salvar config:', error);
      addToast('Erro ao salvar configuracao', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalMappings = existingConfig
    ? Object.keys(existingConfig.turmaMap || {}).length +
      Object.keys(existingConfig.disciplinaMap || {}).length +
      Object.keys(existingConfig.alunoMap || {}).length
    : 0;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Sync color="primary" />
          Configurar SGE
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ fontSize: '0.85rem' }}>
              Configure suas credenciais do e-aluno para sincronizar chamadas automaticamente.
              Suas credenciais sao armazenadas de forma segura.
            </Alert>

            <TextField
              label="Usuario (CPF)"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="000.000.000-00"
              fullWidth
              size="small"
            />

            <TextField
              label="Senha"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={existingConfig ? '(senha salva)' : 'Sua senha do e-aluno'}
              fullWidth
              size="small"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Button
              variant="outlined"
              onClick={handleTestConnection}
              disabled={testing}
              startIcon={testing ? <CircularProgress size={16} /> : undefined}
              sx={{ textTransform: 'none' }}
            >
              {testing ? 'Testando...' : 'Testar Conexao'}
            </Button>

            {testResult && (
              <Alert severity={testResult === 'success' ? 'success' : 'error'}>
                {testMessage}
              </Alert>
            )}

            {existingConfig && (
              <>
                <Divider />
                <Typography variant="body2" color="text.secondary">
                  Mapeamentos salvos:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip
                    size="small"
                    icon={<CheckCircle />}
                    label={`${Object.keys(existingConfig.turmaMap || {}).length} turmas`}
                    color={Object.keys(existingConfig.turmaMap || {}).length > 0 ? 'success' : 'default'}
                  />
                  <Chip
                    size="small"
                    icon={<CheckCircle />}
                    label={`${Object.keys(existingConfig.disciplinaMap || {}).length} disciplinas`}
                    color={Object.keys(existingConfig.disciplinaMap || {}).length > 0 ? 'success' : 'default'}
                  />
                  <Chip
                    size="small"
                    icon={<CheckCircle />}
                    label={`${Object.keys(existingConfig.alunoMap || {}).length} alunos`}
                    color={Object.keys(existingConfig.alunoMap || {}).length > 0 ? 'success' : 'default'}
                  />
                </Box>
                <Typography variant="caption" color="text.secondary">
                  Os mapeamentos sao criados automaticamente ao enviar a primeira chamada.
                </Typography>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !user}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ textTransform: 'none' }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
