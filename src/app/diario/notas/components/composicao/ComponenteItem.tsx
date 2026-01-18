/**
 * Item de componente no modal de composicao.
 */

import { Box, Typography, Chip } from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import { RubricaDetalheItem } from './RubricaDetalheItem';
import type { ComponenteItemProps } from './types';

export function ComponenteItem({ subNota, componenteFormula }: ComponenteItemProps) {
  const rubricas = componenteFormula?.rubricas || [];
  const temRubricas = rubricas.length > 0;
  const todasAvaliadas = componenteFormula?.todasRubricasAvaliadas ?? false;

  return (
    <Box
      sx={{
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: 2,
        border: '1px solid',
        borderColor: todasAvaliadas ? 'success.main' : temRubricas ? 'warning.main' : 'grey.300',
      }}
    >
      {/* Cabecalho do componente */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: temRubricas ? 2 : 0 }}>
        <Typography sx={{ flex: 1, fontWeight: 600 }}>{subNota.nome}</Typography>
        <Chip label={`max: ${subNota.porcentagem}`} size="small" color="primary" variant="outlined" />
        {todasAvaliadas ? (
          <Chip icon={<CheckCircle />} label={subNota.valor ?? '-'} size="small" color="success" />
        ) : (
          <Chip icon={<Warning />} label="Pendente" size="small" color="warning" />
        )}
      </Box>

      {/* Detalhes das rubricas */}
      {temRubricas ? (
        <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {rubricas.map((rubrica) => (
            <RubricaDetalheItem key={rubrica.rubricaId} rubrica={rubrica} />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="warning.main" sx={{ pl: 2, fontStyle: 'italic' }}>
          Nenhuma rubrica configurada. Configure na aba "Avaliacao por Rubricas".
        </Typography>
      )}
    </Box>
  );
}
