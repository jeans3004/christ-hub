/**
 * Componente de filtros para a pagina de notas.
 */

import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Collapse,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { FilterList, ExpandMore, ExpandLess } from '@mui/icons-material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [filtersOpen, setFiltersOpen] = useState(!isMobile);

  useEffect(() => {
    setFiltersOpen(!isMobile);
  }, [isMobile]);

  return (
    <Box sx={{ width: { xs: '100%', md: 180 }, flexShrink: 0 }}>
      {isMobile && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<FilterList />}
          endIcon={filtersOpen ? <ExpandLess /> : <ExpandMore />}
          onClick={() => setFiltersOpen(!filtersOpen)}
          sx={{ mb: 2, justifyContent: 'space-between', textTransform: 'none' }}
        >
          Filtros
        </Button>
      )}

      <Collapse in={filtersOpen || !isMobile}>
        <Box sx={{ mb: { xs: 2, md: 0 } }}>
          {!isMobile && (
            <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>
              Filtros
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Ano</InputLabel>
              <Select value={ano} label="Ano" onChange={(e) => setAno(Number(e.target.value))}>
                <MenuItem value={2026}>2026</MenuItem>
                <MenuItem value={2025}>2025</MenuItem>
                <MenuItem value={2024}>2024</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
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

            <FormControl fullWidth size="small">
              <InputLabel>Disciplina</InputLabel>
              <Select
                value={disciplinaId}
                label="Disciplina"
                onChange={(e) => setDisciplinaId(e.target.value)}
                disabled={loadingDisciplinas || !serieId}
              >
                <MenuItem value="">
                  {!serieId
                    ? 'Selecione uma turma primeiro'
                    : disciplinas.length === 0
                      ? 'Nenhuma disciplina vinculada'
                      : 'Selecione...'}
                </MenuItem>
                {disciplinas.map((d) => (
                  <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Bimestre</InputLabel>
              <Select value={bimestre} label="Bimestre" onChange={(e) => setBimestre(Number(e.target.value))}>
                <MenuItem value={1}>1o Bimestre</MenuItem>
                <MenuItem value={2}>2o Bimestre</MenuItem>
                <MenuItem value={3}>3o Bimestre</MenuItem>
                <MenuItem value={4}>4o Bimestre</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
