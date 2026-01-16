/**
 * Componente de filtros para a pagina de notas.
 * Layout horizontal igual à página de Conceitos (Avaliar Alunos).
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

interface NotasFiltersProps {
  ano: number;
  setAno: (ano: number) => void;
  serieId: string;
  setSerieId: (id: string) => void;
  disciplinaId: string;
  setDisciplinaId: (id: string) => void;
  bimestre: number;
  setBimestre: (bimestre: number) => void;
  turmas: Turma[];
  disciplinas: Disciplina[];
  loadingTurmas: boolean;
  loadingDisciplinas: boolean;
}

export function NotasFilters({
  ano,
  setAno,
  serieId,
  setSerieId,
  disciplinaId,
  setDisciplinaId,
  bimestre,
  setBimestre,
  turmas,
  disciplinas,
  loadingTurmas,
  loadingDisciplinas,
}: NotasFiltersProps) {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Ano</InputLabel>
          <Select value={ano} label="Ano" onChange={(e) => setAno(Number(e.target.value))}>
            <MenuItem value={2026}>2026</MenuItem>
            <MenuItem value={2025}>2025</MenuItem>
            <MenuItem value={2024}>2024</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Turma</InputLabel>
          <Select
            value={serieId}
            label="Turma"
            onChange={(e) => setSerieId(e.target.value)}
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
            onChange={(e) => setDisciplinaId(e.target.value)}
            disabled={loadingDisciplinas || !serieId}
          >
            <MenuItem value="">
              {!serieId ? 'Selecione uma turma' : 'Selecione...'}
            </MenuItem>
            {disciplinas.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel>Bimestre</InputLabel>
          <Select
            value={bimestre}
            label="Bimestre"
            onChange={(e) => setBimestre(Number(e.target.value))}
          >
            <MenuItem value={1}>1º Bimestre</MenuItem>
            <MenuItem value={2}>2º Bimestre</MenuItem>
            <MenuItem value={3}>3º Bimestre</MenuItem>
            <MenuItem value={4}>4º Bimestre</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
