'use client';

/**
 * Conteudo do formulario de turma.
 */

import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Turno } from '@/types';
import { TurmaForm, turnos, series } from '../types';

interface TurmaFormContentProps {
  form: TurmaForm;
  setForm: React.Dispatch<React.SetStateAction<TurmaForm>>;
}

export function TurmaFormContent({ form, setForm }: TurmaFormContentProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Serie</InputLabel>
        <Select
          value={form.serie}
          label="Serie"
          onChange={(e) => setForm(prev => ({ ...prev, serie: e.target.value }))}
        >
          {series.map((serie) => (
            <MenuItem key={serie} value={serie}>{serie}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Turno</InputLabel>
        <Select
          value={form.turno}
          label="Turno"
          onChange={(e) => setForm(prev => ({ ...prev, turno: e.target.value as Turno }))}
        >
          {turnos.map((turno) => (
            <MenuItem key={turno} value={turno}>{turno}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Ano"
        type="number"
        value={form.ano}
        onChange={(e) => setForm(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
        fullWidth
      />

      <TextField
        label="Nome da Turma"
        value={form.nome}
        onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
        fullWidth
        helperText="Gerado automaticamente, mas pode ser editado"
      />
    </Box>
  );
}
