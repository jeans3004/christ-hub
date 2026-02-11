/**
 * Componente de lista de alunos para chamada.
 */

import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Checkbox,
  Avatar,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import { CheckCircle, Cancel, Save, NoteAlt, MedicalServices, OpenInNew, AccessTime, Schedule } from '@mui/icons-material';
import { Aluno, Atestado, Atraso } from '@/types';
import { getAvatarColor } from '../types';
import { ObservacaoPopover } from './ObservacaoPopover';

interface ChamadaListProps {
  alunos: Aluno[];
  presencas: Record<string, boolean>;
  observacoes: Record<string, string>;
  atestadosVigentes?: Record<string, Atestado>; // alunoId -> atestado vigente
  atrasosHoje?: Record<string, Atraso>; // alunoId -> atraso do dia
  isPrimeiroTempo?: boolean; // se estamos no 1o tempo
  showTurma?: boolean; // exibir serie/turma do aluno (usado no preparatorio)
  totalPresentes: number;
  totalAusentes: number;
  saving: boolean;
  onPresencaChange: (alunoId: string) => void;
  onObservacaoChange: (alunoId: string, observacao: string) => void;
  onMarcarTodos: (presente: boolean) => void;
  onSave: () => void | Promise<void>;
  onOpenConteudo: () => void;
}

export function ChamadaList({
  alunos,
  presencas,
  observacoes,
  atestadosVigentes = {},
  atrasosHoje = {},
  isPrimeiroTempo = false,
  showTurma = false,
  totalPresentes,
  totalAusentes,
  saving,
  onPresencaChange,
  onObservacaoChange,
  onMarcarTodos,
  onSave,
  onOpenConteudo,
}: ChamadaListProps) {
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [selectedAluno, setSelectedAluno] = useState<Aluno | null>(null);

  const handleOpenObservacao = (event: React.MouseEvent<HTMLElement>, aluno: Aluno) => {
    event.stopPropagation();
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
    <>
      {/* Header with stats and actions */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Chip
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            label={`${totalPresentes} presentes`}
            size="small"
            sx={{
              bgcolor: 'transparent',
              color: 'success.main',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'success.main' },
            }}
          />
          <Chip
            icon={<Cancel sx={{ fontSize: 16 }} />}
            label={`${totalAusentes} ausentes`}
            size="small"
            sx={{
              bgcolor: 'transparent',
              color: 'error.main',
              fontWeight: 600,
              '& .MuiChip-icon': { color: 'error.main' },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => onMarcarTodos(true)}
            sx={{ textTransform: 'none', borderRadius: 5, fontSize: '0.8rem' }}
          >
            Todos presentes
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            onClick={() => onMarcarTodos(false)}
            sx={{ textTransform: 'none', borderRadius: 5, fontSize: '0.8rem' }}
          >
            Todos ausentes
          </Button>
        </Box>
      </Box>

      {/* Student List */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, overflow: 'hidden' }}>
        {alunos.map((aluno, index) => {
          const isPresente = presencas[aluno.id] ?? true;
          const avatarColor = getAvatarColor(index);
          const numero = String(index + 1).padStart(2, '0');
          const hasObservacao = Boolean(observacoes[aluno.id]);
          const atestado = atestadosVigentes[aluno.id];
          const atraso = atrasosHoje[aluno.id];

          // Atraso so aplica no 1o tempo
          const atrasoAtivo = atraso && isPrimeiroTempo;

          // Determinar cor de fundo baseado no estado
          const getRowBgColor = () => {
            if (atestado) return '#e3f2fd'; // Azul claro - atestado
            if (atrasoAtivo) return '#fff8e1'; // Amarelo claro - atraso
            if (!isPresente) return '#ffebee'; // Vermelho claro para ausente
            return 'transparent';
          };

          const getRowHoverColor = () => {
            if (atestado) return '#bbdefb';
            if (atrasoAtivo) return '#ffecb3';
            if (!isPresente) return '#ffcdd2';
            return 'action.hover';
          };

          const getRowBorderColor = () => {
            if (atestado) return '#1976d2'; // Azul - atestado
            if (atrasoAtivo) return '#f57c00'; // Laranja - atraso
            if (!isPresente) return '#d32f2f';
            return 'transparent';
          };

          // Estudante com atestado tem presenca bloqueada (justificada como presente)
          // Estudante com atraso no 1o tempo tem presenca bloqueada (como ausente)
          const isBloqueado = Boolean(atestado) || Boolean(atrasoAtivo);

          return (
            <Box
              key={aluno.id}
              onClick={() => !isBloqueado && onPresencaChange(aluno.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
                cursor: isBloqueado ? 'default' : 'pointer',
                borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                bgcolor: getRowBgColor(),
                borderLeft: '4px solid',
                borderLeftColor: getRowBorderColor(),
                '&:hover': {
                  bgcolor: isBloqueado ? getRowBgColor() : getRowHoverColor(),
                },
              }}
            >
              {/* Numero do aluno */}
              <Typography
                sx={{
                  minWidth: 28,
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  color: 'text.secondary',
                  textAlign: 'center',
                }}
              >
                {numero}
              </Typography>

              <Checkbox
                checked={atrasoAtivo ? false : (atestado ? true : isPresente)}
                disabled={isBloqueado}
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  color: atrasoAtivo ? 'warning.main' : (atestado ? 'info.main' : (isPresente ? 'success.main' : 'error.main')),
                  '&.Mui-checked': {
                    color: atestado ? 'info.main' : 'success.main',
                  },
                  '&.Mui-disabled': {
                    color: atrasoAtivo ? 'warning.main !important' : 'info.main !important',
                  },
                }}
              />

              <Avatar
                src={aluno.fotoUrl}
                sx={{
                  width: { xs: 36, sm: 42 },
                  height: { xs: 36, sm: 42 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  bgcolor: avatarColor,
                  border: '2px solid',
                  borderColor: atrasoAtivo ? '#f57c00' : (atestado ? '#1976d2' : (isPresente ? 'transparent' : 'error.main')),
                }}
              >
                {aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      color: 'text.primary',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {aluno.nome}
                  </Typography>
                  {atestado && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      {/* Chip de atestado com descricao */}
                      <Tooltip
                        title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} color="white">
                              {atestado.descricao}
                            </Typography>
                            {atestado.status === 'pendente' && (
                              <Typography variant="caption" sx={{ color: '#ffeb3b', fontWeight: 600 }}>
                                Aguardando aprovacao
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                        enterTouchDelay={0}
                        leaveTouchDelay={3000}
                      >
                        <Chip
                          icon={<MedicalServices sx={{ fontSize: '16px !important' }} />}
                          label={atestado.status === 'pendente' ? 'Pendente' : 'Atestado'}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: atestado.status === 'aprovado' ? 'info.main' : 'warning.main',
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' },
                            cursor: 'pointer',
                          }}
                        />
                      </Tooltip>

                      {/* Icone para abrir arquivo (se existir) */}
                      {atestado.arquivoUrl && (
                        <Tooltip
                          title="Ver arquivo"
                          arrow
                          enterTouchDelay={0}
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(atestado.arquivoUrl, '_blank');
                            }}
                            sx={{
                              p: 0.5,
                              bgcolor: 'info.main',
                              color: 'white',
                              '&:hover': { bgcolor: 'info.dark' },
                            }}
                          >
                            <OpenInNew sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}
                  {atrasoAtivo && !atestado && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexShrink: 0 }}>
                      <Tooltip
                        title={
                          <Box sx={{ p: 0.5 }}>
                            <Typography variant="body2" fontWeight={700} color="white">
                              Chegada atrasada: {atraso.horarioChegada}
                            </Typography>
                            <Typography variant="caption" color="white">
                              Atraso de {atraso.tempoAtraso} min
                            </Typography>
                            {atraso.justificativa && (
                              <Typography variant="caption" display="block" color="white" sx={{ mt: 0.5 }}>
                                {atraso.justificativa}
                              </Typography>
                            )}
                          </Box>
                        }
                        arrow
                        enterTouchDelay={0}
                        leaveTouchDelay={3000}
                      >
                        <Chip
                          icon={<Schedule sx={{ fontSize: '16px !important' }} />}
                          label={`Atraso ${atraso.horarioChegada}`}
                          size="small"
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            bgcolor: '#f57c00',
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' },
                            cursor: 'pointer',
                          }}
                        />
                      </Tooltip>
                      <Tooltip title={`${atraso.tempoAtraso} min de atraso`} arrow>
                        <Chip
                          icon={<AccessTime sx={{ fontSize: '14px !important' }} />}
                          label={`${atraso.tempoAtraso}min`}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            fontWeight: 600,
                            bgcolor: atraso.tempoAtraso > 15 ? '#d32f2f' : '#ff9800',
                            color: 'white',
                            '& .MuiChip-icon': { color: 'white' },
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}
                </Box>
                {(showTurma && aluno.serie) && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', fontWeight: 500, fontSize: '0.7rem' }}
                  >
                    {aluno.serie}
                  </Typography>
                )}
                {!showTurma && aluno.matricula && (
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', display: { xs: 'none', sm: 'block' } }}
                  >
                    Mat: {aluno.matricula}
                  </Typography>
                )}
              </Box>

              {/* Botao de observacao */}
              <Tooltip title={hasObservacao ? observacoes[aluno.id] : 'Adicionar observação'} arrow>
                <IconButton
                  size="small"
                  onClick={(e) => handleOpenObservacao(e, aluno)}
                  sx={{
                    color: hasObservacao ? 'warning.main' : 'text.disabled',
                    '&:hover': { color: 'warning.dark' },
                  }}
                >
                  <Badge variant="dot" color="warning" invisible={!hasObservacao}>
                    <NoteAlt fontSize="small" />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Button
                size="small"
                variant="contained"
                disableElevation
                disabled={isBloqueado}
                onClick={(e) => {
                  if (isBloqueado) {
                    e.stopPropagation();
                  }
                }}
                sx={{
                  minWidth: { xs: 75, sm: 95 },
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: { xs: 1.5, sm: 2 },
                  py: 0.75,
                  fontWeight: 600,
                  bgcolor: atrasoAtivo ? '#f57c00' : (atestado ? 'info.main' : (isPresente ? 'success.main' : 'error.main')),
                  boxShadow: isBloqueado ? 'none' : (isPresente ? 'none' : '0 2px 4px rgba(211,47,47,0.3)'),
                  '&:hover': {
                    bgcolor: atrasoAtivo ? '#e65100' : (atestado ? 'info.main' : (isPresente ? 'success.dark' : 'error.dark')),
                  },
                  '&.Mui-disabled': {
                    bgcolor: atrasoAtivo ? '#f57c00' : 'info.main',
                    color: 'white',
                  },
                }}
              >
                {atrasoAtivo ? 'Atrasado' : (atestado ? 'Justificado' : (isPresente ? 'Presente' : 'Ausente'))}
              </Button>
            </Box>
          );
        })}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end', flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
        <Button
          variant="outlined"
          onClick={onOpenConteudo}
          sx={{ textTransform: 'none', borderRadius: 1, px: 3 }}
        >
          Registrar Conteudo
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={onSave}
          disabled={saving}
          sx={{ textTransform: 'none', borderRadius: 1, px: 3 }}
        >
          {saving ? 'Salvando...' : 'Salvar Chamada'}
        </Button>
      </Box>

      {/* Popover para observacoes */}
      <ObservacaoPopover
        anchorEl={popoverAnchor}
        alunoNome={selectedAluno?.nome || ''}
        observacao={selectedAluno ? (observacoes[selectedAluno.id] || '') : ''}
        onClose={handleCloseObservacao}
        onSave={handleSaveObservacao}
      />
    </>
  );
}
