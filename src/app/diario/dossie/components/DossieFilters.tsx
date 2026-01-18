/**
 * Componente de filtros para a pagina de dossie do aluno.
 * Layout horizontal igual a pagina de Notas.
 */

import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Turma } from '@/types';

interface DossieFiltersProps {
  ano: number;
  setAno: (ano: number) => void;
  turmaId: string;
  setTurmaId: (id: string) => void;
  turmas: Turma[];
  loadingTurmas: boolean;
}

export function DossieFilters({
  ano,
  setAno,
  turmaId,
  setTurmaId,
  turmas,
  loadingTurmas,
}: DossieFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Ano</InputLabel>
          <Select
            value={ano}
            label="Ano"
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {years.map((y) => (
              <MenuItem key={y} value={y}>
                {y}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Turma</InputLabel>
          <Select
            value={turmaId}
            label="Turma"
            onChange={(e) => setTurmaId(e.target.value)}
            disabled={loadingTurmas}
          >
            <MenuItem value="">
              {loadingTurmas ? 'Carregando...' : 'Selecione uma turma'}
            </MenuItem>
            {turmas.map((t) => (
              <MenuItem key={t.id} value={t.id}>
                {t.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
