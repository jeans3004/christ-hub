/**
 * Filtros para avaliacao por rubricas.
 */

import {
  Box,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { AvaliacaoFiltersProps } from './types';

export function AvaliacaoFilters({
  ano,
  turmaId,
  disciplinaId,
  bimestre,
  av,
  turmas,
  disciplinasFiltradas,
  loadingTurmas,
  loadingDisciplinas,
  onAnoChange,
  onTurmaChange,
  onDisciplinaChange,
  onBimestreChange,
  onAvChange,
}: AvaliacaoFiltersProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Ano</InputLabel>
          <Select value={ano} label="Ano" onChange={(e) => onAnoChange(Number(e.target.value))}>
            <MenuItem value={2026}>2026</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
            <MenuItem value={2024}>2024</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Turma</InputLabel>
          <Select
            value={turmaId}
            label="Turma"
            onChange={(e) => onTurmaChange(e.target.value)}
            disabled={loadingTurmas}
          >
            <MenuItem value="">Selecione...</MenuItem>
            {turmas.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Disciplina</InputLabel>
          <Select
            value={disciplinaId}
            label="Disciplina"
            onChange={(e) => onDisciplinaChange(e.target.value)}
            disabled={loadingDisciplinas || !turmaId}
          >
            <MenuItem value="">
              {!turmaId ? 'Selecione uma turma' : 'Selecione...'}
            </MenuItem>
            {disciplinasFiltradas.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Bimestre</InputLabel>
          <Select
            value={bimestre}
            label="Bimestre"
            onChange={(e) => onBimestreChange(Number(e.target.value))}
          >
            <MenuItem value={1}>1º Bimestre</MenuItem>
            <MenuItem value={2}>2º Bimestre</MenuItem>
            <MenuItem value={3}>3º Bimestre</MenuItem>
            <MenuItem value={4}>4º Bimestre</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>AV</InputLabel>
          <Select
            value={av}
            label="AV"
            onChange={(e) => onAvChange(e.target.value as 'av1' | 'av2')}
          >
            <MenuItem value="av1">AV1</MenuItem>
            <MenuItem value="av2">AV2</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
