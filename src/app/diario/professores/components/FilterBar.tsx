'use client';

/**
 * Barra de filtros para professores.
 */

import { Box, Paper, Button, TextField, InputAdornment } from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import { ProfessorFiltro } from '../types';

interface FilterBarProps {
  filtro: ProfessorFiltro;
  onFiltroChange: (field: keyof ProfessorFiltro, value: string) => void;
  onAddClick: () => void;
}

export function FilterBar({ filtro, onFiltroChange, onAddClick }: FilterBarProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          label="Nome"
          size="small"
          value={filtro.nome}
          onChange={(e) => onFiltroChange('nome', e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="CPF"
          size="small"
          value={filtro.cpf}
          onChange={(e) => onFiltroChange('cpf', e.target.value)}
          sx={{ minWidth: 150 }}
        />
        <TextField
          label="Telefone"
          size="small"
          placeholder="(99) 9999-9999"
          value={filtro.telefone}
          onChange={(e) => onFiltroChange('telefone', e.target.value)}
          sx={{ minWidth: 150 }}
        />
        <Button variant="contained" startIcon={<Add />} onClick={onAddClick}>
          Novo Professor
        </Button>
      </Box>
    </Paper>
  );
}
