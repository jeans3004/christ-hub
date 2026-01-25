/**
 * Grid de avaliacao de alunos por rubricas.
 */

import { Box, Paper, Typography, Tooltip, Alert } from '@mui/material';
import { NivelButton } from './NivelButton';
import { NIVEIS } from './constants';
import { AvaliacaoGridProps } from './types';

export function AvaliacaoGrid({
  alunos,
  rubricasComponente,
  componenteId,
  getAvaliacao,
  onNivelClick,
}: AvaliacaoGridProps) {
  if (rubricasComponente.length === 0) {
    return (
      <Alert severity="info">
        Selecione as rubricas acima para avaliar os alunos neste componente.
      </Alert>
    );
  }

  return (
    <Paper sx={{ overflow: 'auto' }}>
      <Box sx={{ minWidth: 400 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `40px 200px repeat(${rubricasComponente.length}, 1fr)`,
            gap: 1,
            p: 2,
            bgcolor: 'action.selected',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography fontWeight={600} textAlign="center">Nº</Typography>
          <Typography fontWeight={600}>Aluno</Typography>
          {rubricasComponente.map((rubrica) => (
            <Tooltip key={rubrica.id} title={rubrica.descricao || ''}>
              <Typography fontWeight={600} textAlign="center" noWrap>
                {rubrica.nome}
              </Typography>
            </Tooltip>
          ))}
        </Box>

        {/* Body */}
        {alunos.map((aluno, index) => (
          <Box
            key={aluno.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: `40px 200px repeat(${rubricasComponente.length}, 1fr)`,
              gap: 1,
              p: 2,
              borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography fontWeight={500} textAlign="center" color="text.secondary">
              {index + 1}
            </Typography>
            <Typography fontWeight={500} noWrap>
              {aluno.nome}
            </Typography>
            {rubricasComponente.map((rubrica) => {
              const currentNivel = getAvaliacao(aluno.id, rubrica.id, componenteId);

              return (
                <Box
                  key={rubrica.id}
                  sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}
                >
                  {NIVEIS.map((nivel) => {
                    const desc = rubrica.niveis.find((n) => n.nivel === nivel)?.descricao;

                    return (
                      <NivelButton
                        key={nivel}
                        nivel={nivel}
                        isSelected={currentNivel === nivel}
                        description={desc}
                        onClick={() => onNivelClick(aluno.id, rubrica.id, componenteId, nivel)}
                      />
                    );
                  })}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Paper>
  );
}
