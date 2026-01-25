/**
 * Item de rubrica no accordion.
 */

import { Box, Typography, Button, Chip, Accordion, AccordionSummary, AccordionDetails, CircularProgress } from '@mui/material';
import { Edit, Delete, ExpandMore, DragIndicator } from '@mui/icons-material';
import { NivelRubrica } from '@/types';
import { NIVEL_COLORS } from '../../types';
import { NivelChip } from './NivelChip';
import type { RubricaItemProps } from './types';

export function RubricaItem({ rubrica, canEdit, deleting, onEdit, onDelete }: RubricaItemProps) {
  return (
    <Accordion sx={{ bgcolor: 'background.paper' }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, mr: 2 }}>
          <DragIndicator sx={{ color: 'grey.400', cursor: 'grab' }} />
          <Box sx={{ flex: 1 }}>
            <Typography fontWeight={600}>{rubrica.nome}</Typography>
            {rubrica.descricao && (
              <Typography variant="body2" color="text.secondary">
                {rubrica.descricao}
              </Typography>
            )}
          </Box>
          <Chip
            label={rubrica.ativo ? 'Ativa' : 'Inativa'}
            size="small"
            color={rubrica.ativo ? 'success' : 'default'}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {/* Niveis */}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Niveis de avaliacao:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
          {rubrica.niveis.map((nivel) => (
            <Box
              key={nivel.nivel}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 2,
                p: 1.5,
                bgcolor: NIVEL_COLORS[nivel.nivel as NivelRubrica].bg,
                borderRadius: 1,
                border: '1px solid',
                borderColor: NIVEL_COLORS[nivel.nivel as NivelRubrica].border,
              }}
            >
              <NivelChip nivel={nivel.nivel as NivelRubrica} showLabel />
              <Typography variant="body2" sx={{ flex: 1 }}>
                {nivel.descricao}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Acoes */}
        {canEdit && (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" startIcon={<Edit />} onClick={onEdit}>
              Editar
            </Button>
            <Button
              size="small"
              color="error"
              startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
              onClick={onDelete}
              disabled={deleting}
            >
              Excluir
            </Button>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
