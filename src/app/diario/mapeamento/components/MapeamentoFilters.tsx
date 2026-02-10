/**
 * Componente de filtros para a pagina de mapeamento de sala.
 * Redesign com melhor visual.
 */

import {
  Paper,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
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
    <Paper
      elevation={0}
      sx={{
        p: 2,
        mb: 2,
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <FilterList sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography variant="subtitle2" color="text.secondary" fontWeight={500}>
          Filtros
        </Typography>
      </Box>

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

        <FormControl size="small" sx={{ minWidth: 200, flex: { xs: 1, sm: 'none' } }}>
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
