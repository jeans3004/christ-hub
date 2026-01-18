'use client';

/**
 * Barra de filtros para professores.
 */

import {
  Box,
  Paper,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { ProfessorFiltro } from '../types';

interface FilterBarProps {
  filtro: ProfessorFiltro;
  onFiltroChange: (filtro: ProfessorFiltro) => void;
  onAddClick: () => void;
}

export function FilterBar({ filtro, onFiltroChange, onAddClick }: FilterBarProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Buscar por nome"
          size="small"
          value={filtro.nome}
          onChange={(e) => onFiltroChange({ ...filtro, nome: e.target.value })}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 250 }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={filtro.status}
            label="Status"
            onChange={(e) => onFiltroChange({ ...filtro, status: e.target.value as ProfessorFiltro['status'] })}
          >
            <MenuItem value="todos">Todos</MenuItem>
            <MenuItem value="ativos">Ativos</MenuItem>
            <MenuItem value="pendentes">Aguardando acesso</MenuItem>
            <MenuItem value="inativos">Inativos</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ flex: 1 }} />

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAddClick}
          sx={{ textTransform: 'none' }}
        >
          Novo Professor
        </Button>
      </Box>
    </Paper>
  );
}
