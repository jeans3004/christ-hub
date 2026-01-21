/**
 * Tabela de avaliacao de alunos.
 * Ordenado alfabeticamente com resumo de avaliacoes.
 */

import { useMemo, useState } from 'react';
import { Box, Paper, Typography, Tooltip, Chip, IconButton, Badge } from '@mui/material';
import { NoteAlt, StickyNote2 } from '@mui/icons-material';
import { Aluno, Rubrica, NivelRubrica } from '@/types';
import { NivelButton } from './NivelButton';
import { ObservacaoPopover } from './ObservacaoPopover';
import { NIVEIS, NIVEL_COLORS } from '../../types';

interface AvaliacaoTableProps {
  alunos: Aluno[];
  rubricas: Rubrica[];
  getAvaliacao: (alunoId: string, rubricaId: string) => NivelRubrica | null;
  onNivelClick: (alunoId: string, rubricaId: string, nivel: NivelRubrica) => void;
  observacoes: Record<string, string>;
  onObservacaoChange: (alunoId: string, observacao: string) => void;
}

interface ResumoAvaliacao {
  contagem: Record<NivelRubrica, number>;
  total: number;
  rubricas: number;
  predominante: NivelRubrica | null;
}

// Calcula resumo das avaliacoes de um aluno
function calcularResumo(alunoId: string, rubricas: Rubrica[], getAvaliacao: (aId: string, rId: string) => NivelRubrica | null): ResumoAvaliacao {
  const contagem: Record<NivelRubrica, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  let total = 0;

  rubricas.forEach((rubrica) => {
    const nivel = getAvaliacao(alunoId, rubrica.id);
    if (nivel) {
      contagem[nivel]++;
      total++;
    }
  });

  // Calcula nivel predominante
  let predominante: NivelRubrica | null = null;
  let maxCount = 0;
  (Object.entries(contagem) as [NivelRubrica, number][]).forEach(([nivel, count]) => {
    if (count > maxCount) {
      maxCount = count;
      predominante = nivel;
    }
  });

  return { contagem, total, rubricas: rubricas.length, predominante };
}

export function AvaliacaoTable({ alunos, rubricas, getAvaliacao, onNivelClick, observacoes, onObservacaoChange }: AvaliacaoTableProps) {
  // State para o popover de observacao
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);

  // Ordena alunos alfabeticamente
  const alunosOrdenados = useMemo(() => {
    return [...alunos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [alunos]);

  const handleOpenObservacao = (event: React.MouseEvent<HTMLElement>, aluno: Aluno) => {
    setPopoverAnchor(event.currentTarget);
    setSelectedAluno(aluno);
  };

  const handleCloseObservacao = () => {
    setPopoverAnchor(null);
    setSelectedAluno(null);
  };

  const handleSaveObservacao = (texto: string) => {
    if (selectedAluno) {
      onObservacaoChange(selectedAluno.id, texto);
    }
  };

  return (
    <Paper sx={{ overflow: 'auto' }}>
      <Box sx={{ minWidth: 600 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: `40px 180px 80px 50px repeat(${rubricas.length}, 1fr)`,
            gap: 1,
            p: 2,
            bgcolor: 'grey.100',
            borderBottom: '2px solid',
            borderColor: 'divider',
          }}
        >
          <Typography fontWeight={600} textAlign="center" color="text.secondary">Nº</Typography>
          <Typography fontWeight={600}>Aluno</Typography>
          <Typography fontWeight={600} textAlign="center">Resumo</Typography>
          <Tooltip title="Observações" arrow>
            <Typography fontWeight={600} textAlign="center" sx={{ cursor: 'help' }}>
              <StickyNote2 sx={{ fontSize: 18, color: 'text.secondary' }} />
            </Typography>
          </Tooltip>
          {rubricas.map((rubrica) => (
            <Tooltip key={rubrica.id} title={rubrica.descricao || ''} arrow>
              <Typography fontWeight={600} textAlign="center" noWrap sx={{ cursor: 'help' }}>
                {rubrica.nome}
              </Typography>
            </Tooltip>
          ))}
        </Box>

        {/* Body */}
        {alunosOrdenados.map((aluno, index) => {
          const resumo = calcularResumo(aluno.id, rubricas, getAvaliacao);
          const tooltipText = resumo.total > 0
            ? `Avaliado: ${resumo.total}/${resumo.rubricas} | A:${resumo.contagem.A} B:${resumo.contagem.B} C:${resumo.contagem.C} D:${resumo.contagem.D} E:${resumo.contagem.E}`
            : 'Nenhuma avaliação';
          const hasObservacao = Boolean(observacoes[aluno.id]);

          return (
            <Box
              key={aluno.id}
              sx={{
                display: 'grid',
                gridTemplateColumns: `40px 180px 80px 50px repeat(${rubricas.length}, 1fr)`,
                gap: 1,
                p: 2,
                borderBottom: index < alunosOrdenados.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              {/* Numero */}
              <Typography color="text.secondary" fontWeight={600} textAlign="center">
                {String(index + 1).padStart(2, '0')}
              </Typography>

              {/* Nome */}
              <Typography fontWeight={500} noWrap>
                {aluno.nome}
              </Typography>

              {/* Resumo com tooltip */}
              <Tooltip title={tooltipText} arrow placement="top">
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  {(() => {
                    const nivel = resumo.predominante;
                    if (nivel) {
                      return (
                        <Chip
                          label={`${resumo.total}/${resumo.rubricas}`}
                          size="small"
                          sx={{
                            bgcolor: NIVEL_COLORS[nivel].bg,
                            color: NIVEL_COLORS[nivel].text,
                            fontWeight: 600,
                            minWidth: 50,
                            cursor: 'help',
                          }}
                        />
                      );
                    }
                    return (
                      <Chip
                        label="--"
                        size="small"
                        variant="outlined"
                        sx={{ minWidth: 50, cursor: 'help' }}
                      />
                    );
                  })()}
                </Box>
              </Tooltip>

              {/* Botao de observacao */}
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Tooltip title={hasObservacao ? observacoes[aluno.id] : 'Adicionar observação'} arrow>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenObservacao(e, aluno)}
                    sx={{
                      color: hasObservacao ? 'warning.main' : 'text.disabled',
                      '&:hover': { color: 'warning.dark' },
                    }}
                  >
                    <Badge
                      variant="dot"
                      color="warning"
                      invisible={!hasObservacao}
                    >
                      <NoteAlt fontSize="small" />
                    </Badge>
                  </IconButton>
                </Tooltip>
              </Box>

              {/* Rubricas */}
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
          );
        })}
      </Box>

      {/* Popover para observacoes */}
      <ObservacaoPopover
        anchorEl={popoverAnchor}
        alunoNome={selectedAluno?.nome || ''}
        observacao={selectedAluno ? (observacoes[selectedAluno.id] || '') : ''}
        onClose={handleCloseObservacao}
        onSave={handleSaveObservacao}
      />
    </Paper>
  );
}
