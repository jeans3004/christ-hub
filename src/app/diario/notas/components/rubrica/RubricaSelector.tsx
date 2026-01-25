/**
 * Seletor de rubricas para um componente da composicao.
 */

import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { RubricaSelectorProps } from './types';

export function RubricaSelector({
  componenteId,
  qtdNecessarias,
  rubricas,
  rubricasSelecionadas,
  onToggle,
}: RubricaSelectorProps) {
  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
      <Typography variant="subtitle2" gutterBottom>
        Selecione {qtdNecessarias} rubrica(s) para avaliar este componente:
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {rubricas.map((rubrica) => {
          const isSelected = rubricasSelecionadas.includes(rubrica.id);
          return (
            <FormControlLabel
              key={rubrica.id}
              control={
                <Checkbox
                  checked={isSelected}
                  onChange={() => onToggle(componenteId, rubrica.id, qtdNecessarias)}
                  size="small"
                />
              }
              label={rubrica.nome}
              sx={{
                bgcolor: isSelected ? 'primary.light' : 'transparent',
                borderRadius: 1,
                px: 1,
                mr: 1,
              }}
            />
          );
        })}
      </Box>
    </Paper>
  );
}
