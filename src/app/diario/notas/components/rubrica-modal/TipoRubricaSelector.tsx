/**
 * Seletor de tipo de rubrica (Geral ou Professor).
 */

import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import { School, Person } from '@mui/icons-material';
import { TipoRubrica } from '@/types';

interface TipoRubricaSelectorProps {
  tipo: TipoRubrica;
  usuarioNome: string | undefined;
  onChange: (tipo: TipoRubrica) => void;
}

export function TipoRubricaSelector({ tipo, usuarioNome, onChange }: TipoRubricaSelectorProps) {
  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Tipo de Rubrica
      </Typography>
      <ToggleButtonGroup
        value={tipo}
        exclusive
        onChange={(_, newTipo) => newTipo && onChange(newTipo)}
        fullWidth
      >
        <ToggleButton value="geral" sx={{ py: 1.5 }}>
          <School sx={{ mr: 1 }} />
          Geral/Colegiado
        </ToggleButton>
        <ToggleButton value="professor" sx={{ py: 1.5 }}>
          <Person sx={{ mr: 1 }} />
          Minha Rubrica
        </ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {tipo === 'geral'
          ? 'Rubricas Gerais sao visiveis para todos os usuarios do sistema'
          : `Esta rubrica sera exibida no grupo "${usuarioNome || 'Professor'}"`}
      </Typography>
    </Box>
  );
}
