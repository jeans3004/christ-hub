/**
 * Componente de filtros para ocorrencias.
 */

import { Paper, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface OcorrenciaFiltersProps {
  ano: number;
  onAnoChange: (ano: number) => void;
}

export function OcorrenciaFilters({ ano, onAnoChange }: OcorrenciaFiltersProps) {
  return (
    <Paper sx={{ p: 2, width: { xs: '100%', md: 200 }, flexShrink: 0 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Ano</InputLabel>
        <Select
          value={ano}
          label="Ano"
          onChange={(e) => onAnoChange(Number(e.target.value))}
        >
          <MenuItem value={2026}>2026</MenuItem>
          <MenuItem value={2025}>2025</MenuItem>
          <MenuItem value={2024}>2024</MenuItem>
        </Select>
      </FormControl>
    </Paper>
  );
}
