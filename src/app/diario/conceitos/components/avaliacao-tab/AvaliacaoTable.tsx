/**
 * Tabela de avaliacao de alunos.
 */

import { Box, Paper, Typography, Tooltip } from '@mui/material';
import { Aluno, Rubrica, NivelRubrica } from '@/types';
import { NivelButton } from './NivelButton';
import { NIVEIS } from '../../types';

interface AvaliacaoTableProps {
  alunos: Aluno[];
  rubricas: Rubrica[];
  getAvaliacao: (alunoId: string, rubricaId: string) => NivelRubrica | null;
  onNivelClick: (alunoId: string, rubricaId: string, nivel: NivelRubrica) => void;
}

export function AvaliacaoTable({ alunos, rubricas, getAvaliacao, onNivelClick }: AvaliacaoTableProps) {
  return (
    <Paper sx={{ overflow: 'auto' }}>
      <Box sx={{ minWidth: 600 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `200px repeat(${rubricas.length}, 1fr)`,
            gap: 1,
            p: 2,
            bgcolor: 'grey.100',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography fontWeight={600}>Aluno</Typography>
          {rubricas.map((rubrica) => (
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
              gridTemplateColumns: `200px repeat(${rubricas.length}, 1fr)`,
              gap: 1,
              p: 2,
              borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <Typography fontWeight={500} noWrap>
              {aluno.nome}
            </Typography>
            {rubricas.map((rubrica) => {
              const currentNivel = getAvaliacao(aluno.id, rubrica.id);

              return (
                <Box key={rubrica.id} sx={{ display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {NIVEIS.map((nivel) => {
                    const isSelected = currentNivel === nivel;
                    const desc = rubrica.niveis.find((n) => n.nivel === nivel)?.descricao || '';

                    return (
                      <NivelButton
                        key={nivel}
                        nivel={nivel}
                        isSelected={isSelected}
                        description={desc}
                        onClick={() => onNivelClick(aluno.id, rubrica.id, nivel)}
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
