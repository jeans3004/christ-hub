'use client';

/**
 * Componente para exibir turmas vinculadas como chips.
 */

import { Box, Chip } from '@mui/material';
import { Turma } from '@/types';

interface TurmasChipsProps {
  turmaIds: string[] | undefined;
  turmas: Turma[];
}

export function TurmasChips({ turmaIds, turmas }: TurmasChipsProps) {
  if (!turmaIds || turmaIds.length === 0) {
    return <Chip label="Sem turmas" size="small" color="warning" />;
  }

  if (turmaIds.length <= 2) {
    return (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {turmaIds.map(id => {
          const turma = turmas.find(t => t.id === id);
          return turma ? (
            <Chip key={id} label={turma.nome} size="small" />
          ) : null;
        })}
      </Box>
    );
  }

  return <Chip label={`${turmaIds.length} turmas`} size="small" color="primary" />;
}
