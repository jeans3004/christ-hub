'use client';

/**
 * Conteudo do formulario de professor.
 */

import { Box, TextField, Checkbox, FormControlLabel } from '@mui/material';
import { ProfessorFormData, mockDisciplinas } from '../types';

interface ProfessorFormContentProps {
  formData: ProfessorFormData;
  onFormChange: (field: keyof ProfessorFormData, value: string | boolean) => void;
  onDisciplinaToggle: (disciplina: string) => void;
}

export function ProfessorFormContent({
  formData,
  onFormChange,
  onDisciplinaToggle,
}: ProfessorFormContentProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Nome"
        value={formData.nome}
        onChange={(e) => onFormChange('nome', e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="CPF"
        value={formData.cpf}
        onChange={(e) => onFormChange('cpf', e.target.value)}
        inputProps={{ maxLength: 14 }}
        required
        fullWidth
      />
      <TextField
        label="Telefone"
        value={formData.telefone}
        onChange={(e) => onFormChange('telefone', e.target.value)}
        placeholder="(99) 99999-9999"
        inputProps={{ maxLength: 15 }}
        fullWidth
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={formData.coordenador}
            onChange={(e) => onFormChange('coordenador', e.target.checked)}
          />
        }
        label="Coordenador"
      />

      <Box>
        <Box sx={{ fontWeight: 500, mb: 1 }}>Disciplinas:</Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {mockDisciplinas.map((d) => (
            <FormControlLabel
              key={d}
              control={
                <Checkbox
                  checked={formData.disciplinas.includes(d)}
                  onChange={() => onDisciplinaToggle(d)}
                  size="small"
                />
              }
              label={d}
              sx={{ width: 'calc(50% - 8px)' }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
