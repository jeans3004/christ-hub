'use client';

/**
 * Conteudo do formulario de turma.
 */

import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Turno, TipoEnsino } from '@/types';
import { TurmaForm, turnos, turmasLetras, tiposEnsino, seriesPorEnsino } from '../types';

interface TurmaFormContentProps {
  form: TurmaForm;
  setForm: React.Dispatch<React.SetStateAction<TurmaForm>>;
}

export function TurmaFormContent({ form, setForm }: TurmaFormContentProps) {
  const seriesDisponiveis = seriesPorEnsino[form.ensino] || [];

  const handleEnsinoChange = (ensino: TipoEnsino) => {
    const seriesDoEnsino = seriesPorEnsino[ensino];
    setForm(prev => ({
      ...prev,
      ensino,
      serie: seriesDoEnsino[0] || '',
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Ensino</InputLabel>
        <Select
          value={form.ensino}
          label="Ensino"
          onChange={(e) => handleEnsinoChange(e.target.value as TipoEnsino)}
        >
          {tiposEnsino.map((ensino) => (
            <MenuItem key={ensino} value={ensino}>{ensino}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Série</InputLabel>
        <Select
          value={form.serie}
          label="Série"
          onChange={(e) => setForm(prev => ({ ...prev, serie: e.target.value }))}
        >
          {seriesDisponiveis.map((serie) => (
            <MenuItem key={serie} value={serie}>{serie}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel>Turma</InputLabel>
        <Select
          value={form.turma}
          label="Turma"
          onChange={(e) => setForm(prev => ({ ...prev, turma: e.target.value }))}
        >
          {turmasLetras.map((turma) => (
            <MenuItem key={turma} value={turma}>{turma}</MenuItem>
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
        label="Ano Letivo"
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
