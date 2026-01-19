'use client';

/**
 * Conteudo do formulario de professor com integracao Google Auth.
 * Utiliza CheckboxSelector para selecao de disciplinas e turmas.
 */

import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  Tooltip,
  Typography,
  InputAdornment,
} from '@mui/material';
import { Info, Google, Key, Phone } from '@mui/icons-material';
import { UserRole } from '@/types';
import { ProfessorFormData } from '../types';
import { DisciplinaCheckboxSelector } from '@/components/common/DisciplinaCheckboxSelector';
import { TurmaCheckboxSelector } from '@/components/common/TurmaCheckboxSelector';

// Formatar telefone celular brasileiro
const formatPhone = (value: string): string => {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
};

interface ProfessorFormContentProps {
  form: ProfessorFormData;
  setForm: React.Dispatch<React.SetStateAction<ProfessorFormData>>;
  isEditing?: boolean;
}

export function ProfessorFormContent({
  form,
  setForm,
  isEditing = false,
}: ProfessorFormContentProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {/* Nome */}
      <TextField
        label="Nome completo"
        value={form.nome}
        onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
        required
        fullWidth
        placeholder="Ex: Maria Silva Santos"
        helperText="Minimo 3 caracteres"
      />

      {/* E-mail Google */}
      <TextField
        label="E-mail Google"
        type="email"
        value={form.googleEmail}
        onChange={(e) => setForm(prev => ({ ...prev, googleEmail: e.target.value }))}
        required
        fullWidth
        placeholder="exemplo@christmaster.com.br"
        InputProps={{
          startAdornment: <Google sx={{ color: 'action.active', mr: 1 }} />,
        }}
        helperText="E-mail que sera usado para login com Google"
      />

      {/* Celular */}
      <TextField
        label="Celular"
        value={formatPhone(form.celular || '')}
        onChange={(e) => setForm(prev => ({
          ...prev,
          celular: e.target.value.replace(/\D/g, '').slice(0, 11)
        }))}
        fullWidth
        placeholder="(92) 99999-9999"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Phone fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
        helperText="Telefone celular (opcional)"
      />

      {/* Toggle: Ja possui acesso */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <FormControlLabel
          control={
            <Switch
              checked={form.hasAccess}
              onChange={(e) => setForm(prev => ({ ...prev, hasAccess: e.target.checked }))}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Key color={form.hasAccess ? 'primary' : 'action'} />
              <Typography fontWeight={500}>
                Ja possui acesso ao sistema
              </Typography>
              <Tooltip title="Marque se o professor ja fez login com Google no sistema. Se nao, o UID sera vinculado automaticamente no primeiro login.">
                <Info fontSize="small" color="action" />
              </Tooltip>
            </Box>
          }
        />

        {!form.hasAccess && (
          <Alert severity="info" sx={{ mt: 1.5 }}>
            O professor recebera acesso automaticamente ao fazer o primeiro login com Google usando este e-mail.
          </Alert>
        )}

        {form.hasAccess && (
          <TextField
            label="UID do Google"
            value={form.googleUid || ''}
            onChange={(e) => setForm(prev => ({ ...prev, googleUid: e.target.value }))}
            required
            fullWidth
            sx={{ mt: 2 }}
            placeholder="Ex: abc123def456..."
            helperText="ID unico do usuario no Firebase Auth"
          />
        )}
      </Box>

      {/* Papel/Tipo */}
      <FormControl fullWidth>
        <InputLabel>Papel</InputLabel>
        <Select
          value={form.tipo}
          label="Papel"
          onChange={(e) => setForm(prev => ({ ...prev, tipo: e.target.value as UserRole }))}
        >
          <MenuItem value="professor">Professor</MenuItem>
          <MenuItem value="coordenador">Coordenador</MenuItem>
        </Select>
      </FormControl>

      {/* Disciplinas */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Disciplinas *
        </Typography>
        <DisciplinaCheckboxSelector
          selected={form.disciplinaIds}
          onChange={(disciplinaIds) => setForm(prev => ({ ...prev, disciplinaIds }))}
          groupByParent
          columns={2}
          minSelection={1}
          helperText="Selecione ao menos uma disciplina"
        />
      </Box>

      {/* Turmas */}
      <Box>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Turmas (opcional)
        </Typography>
        <TurmaCheckboxSelector
          selected={form.turmaIds}
          onChange={(turmaIds) => setForm(prev => ({ ...prev, turmaIds }))}
          groupBy="turno"
          columns={2}
          helperText="Turmas que o professor leciona"
        />
      </Box>
    </Box>
  );
}
