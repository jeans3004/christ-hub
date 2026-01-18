/**
 * Input para descricao de nivel de rubrica.
 */

import { Box, Typography, TextField } from '@mui/material';
import { NivelRubrica, DescricaoNivel } from '@/types';
import { NIVEL_COLORS, NIVEL_LABELS } from '../../types';

interface NivelInputProps {
  nivel: NivelRubrica;
  niveis: DescricaoNivel[];
  onChange: (nivel: NivelRubrica, value: string) => void;
}

export function NivelInput({ nivel, niveis, onChange }: NivelInputProps) {
  const colors = NIVEL_COLORS[nivel];
  const descricao = niveis.find((n) => n.nivel === nivel)?.descricao || '';

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: colors.bg,
        borderRadius: 1,
        border: '1px solid',
        borderColor: colors.border,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.text, minWidth: 24 }}>
          {nivel}
        </Typography>
        <Typography variant="body2" sx={{ color: colors.text, fontWeight: 500 }}>
          {NIVEL_LABELS[nivel]}
        </Typography>
      </Box>
      <TextField
        value={descricao}
        onChange={(e) => onChange(nivel, e.target.value)}
        fullWidth
        size="small"
        placeholder={`Descreva o que significa ter nivel ${nivel}...`}
        multiline
        rows={2}
        sx={{ '& .MuiOutlinedInput-root': { bgcolor: 'background.paper' } }}
      />
    </Box>
  );
}
