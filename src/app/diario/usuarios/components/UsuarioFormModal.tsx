'use client';

/**
 * Modal para criação/edição de usuário.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  FormControlLabel,
  Switch,
  Autocomplete,
  Chip,
  Typography,
  Divider,
  Alert,
} from '@mui/material';
import { Usuario, UserRole, Turma, Disciplina } from '@/types';
import { UsuarioFormData, TIPO_OPTIONS } from '../types';
import { ROLE_DESCRIPTIONS } from '@/constants/permissions';

interface UsuarioFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: UsuarioFormData) => Promise<boolean>;
  usuario?: Usuario | null;
  turmas: Turma[];
  disciplinas: Disciplina[];
  saving: boolean;
}

const initialFormData: UsuarioFormData = {
  nome: '',
  cpf: '',
  email: '',
  googleEmail: '',
  telefone: '',
  celular: '',
  tipo: 'professor',
  turmaIds: [],
  disciplinaIds: [],
  ativo: true,
};

export default function UsuarioFormModal({
  open,
  onClose,
  onSubmit,
  usuario,
  turmas,
  disciplinas,
  saving,
}: UsuarioFormModalProps) {
  const [formData, setFormData] = useState<UsuarioFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = Boolean(usuario);

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome || '',
        cpf: usuario.cpf || '',
        email: usuario.email || '',
        googleEmail: usuario.googleEmail || '',
        telefone: usuario.telefone || '',
        celular: usuario.celular || '',
        tipo: usuario.tipo,
        turmaIds: usuario.turmaIds || [],
        disciplinaIds: usuario.disciplinaIds || [],
        ativo: usuario.ativo,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [usuario, open]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }

    if (!formData.googleEmail.trim()) {
      newErrors.googleEmail = 'E-mail Google é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.googleEmail)) {
      newErrors.googleEmail = 'E-mail inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const handleChange = (field: keyof UsuarioFormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Filtrar apenas turmas ativas
  const turmasAtivas = turmas.filter((t) => t.ativo);

  // Filtrar disciplinas selecionáveis (não grupos)
  const disciplinasSelectable = disciplinas.filter((d) => !d.isGroup);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          {/* Informações Básicas */}
          <Typography variant="subtitle2" color="text.secondary">
            Informações Básicas
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Nome Completo"
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              error={Boolean(errors.nome)}
              helperText={errors.nome}
              fullWidth
              required
            />
            <TextField
              label="CPF"
              value={formData.cpf}
              onChange={(e) => handleChange('cpf', e.target.value)}
              sx={{ minWidth: 180 }}
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="E-mail Google"
              type="email"
              value={formData.googleEmail}
              onChange={(e) => handleChange('googleEmail', e.target.value)}
              error={Boolean(errors.googleEmail)}
              helperText={errors.googleEmail || 'E-mail usado para login com Google'}
              fullWidth
              required
            />
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => handleChange('telefone', e.target.value)}
              fullWidth
            />
            <TextField
              label="Celular (WhatsApp)"
              value={formData.celular}
              onChange={(e) => handleChange('celular', e.target.value)}
              fullWidth
            />
          </Box>

          <Divider sx={{ my: 1 }} />

          {/* Tipo e Permissões */}
          <Typography variant="subtitle2" color="text.secondary">
            Tipo e Permissões
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Tipo de Usuário</InputLabel>
            <Select
              value={formData.tipo}
              label="Tipo de Usuário"
              onChange={(e) => handleChange('tipo', e.target.value as UserRole)}
            >
              {TIPO_OPTIONS.filter((o) => o.value !== 'todos').map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Alert severity="info" variant="outlined">
            {ROLE_DESCRIPTIONS[formData.tipo]}
          </Alert>

          <Divider sx={{ my: 1 }} />

          {/* Turmas e Disciplinas */}
          <Typography variant="subtitle2" color="text.secondary">
            Turmas e Disciplinas
          </Typography>

          <Autocomplete
            multiple
            options={turmasAtivas}
            getOptionLabel={(option) => `${option.nome} - ${option.serie}`}
            value={turmasAtivas.filter((t) => formData.turmaIds.includes(t.id))}
            onChange={(_, newValue) => handleChange('turmaIds', newValue.map((t) => t.id))}
            renderInput={(params) => (
              <TextField {...params} label="Turmas" placeholder="Selecione as turmas" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.nome}
                  size="small"
                />
              ))
            }
          />

          <Autocomplete
            multiple
            options={disciplinasSelectable}
            getOptionLabel={(option) => option.nome}
            value={disciplinasSelectable.filter((d) => formData.disciplinaIds.includes(d.id))}
            onChange={(_, newValue) => handleChange('disciplinaIds', newValue.map((d) => d.id))}
            renderInput={(params) => (
              <TextField {...params} label="Disciplinas" placeholder="Selecione as disciplinas" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  label={option.nome}
                  size="small"
                />
              ))
            }
          />

          <Divider sx={{ my: 1 }} />

          {/* Status */}
          <FormControlLabel
            control={
              <Switch
                checked={formData.ativo}
                onChange={(e) => handleChange('ativo', e.target.checked)}
              />
            }
            label="Usuário ativo"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSubmit} disabled={saving}>
          {saving ? 'Salvando...' : isEditing ? 'Salvar' : 'Criar Usuário'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
