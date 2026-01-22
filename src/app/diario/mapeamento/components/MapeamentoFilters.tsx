/**
 * Componente de filtros para a pagina de mapeamento de sala.
 */

import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Turma, Disciplina } from '@/types';

interface MapeamentoFiltersProps {
  ano: number;
  setAno: (ano: number) => void;
  turmaId: string;
  setTurmaId: (id: string) => void;
  turmas: Turma[];
  loadingTurmas: boolean;
  disciplinaId: string;
  setDisciplinaId: (id: string) => void;
  disciplinas: Disciplina[];
  loadingDisciplinas: boolean;
}

export function MapeamentoFilters({
  ano,
  setAno,
  turmaId,
  setTurmaId,
  turmas,
  loadingTurmas,
  disciplinaId,
  setDisciplinaId,
  disciplinas,
  loadingDisciplinas,
}: MapeamentoFiltersProps) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <Paper sx={{ p: 1.5, mb: 2 }}>
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

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Disciplina</InputLabel>
          <Select
            value={disciplinaId}
            label="Disciplina"
            onChange={(e) => setDisciplinaId(e.target.value)}
            disabled={loadingDisciplinas || !turmaId}
          >
            <MenuItem value="">
              {loadingDisciplinas ? 'Carregando...' : 'Todas (geral)'}
            </MenuItem>
            {disciplinas.map((d) => (
              <MenuItem key={d.id} value={d.id}>
                {d.nome}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
