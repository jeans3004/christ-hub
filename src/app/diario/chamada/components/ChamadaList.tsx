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
import { CheckCircle, Cancel, Save, NoteAlt, MedicalServices, OpenInNew } from '@mui/icons-material';
import { Aluno, Atestado } from '@/types';
import { getAvatarColor } from '../types';
import { ObservacaoPopover } from './ObservacaoPopover';

interface ChamadaListProps {
  alunos: Aluno[];
  presencas: Record<string, boolean>;
  observacoes: Record<string, string>;
  atestadosVigentes?: Record<string, Atestado>; // alunoId -> atestado vigente
  totalPresentes: number;
  totalAusentes: number;
  saving: boolean;
  onPresencaChange: (alunoId: string) => void;
  onObservacaoChange: (alunoId: string, observacao: string) => void;
  onMarcarTodos: (presente: boolean) => void;
  onSave: () => Promise<void>;
  onOpenConteudo: () => void;
}

export function ChamadaList({
  alunos,
  presencas,
  observacoes,
  atestadosVigentes = {},
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

          // Determinar cor de fundo baseado no estado
          const getRowBgColor = () => {
            if (atestado) return 'info.50'; // Azul claro para atestado
            if (!isPresente) return 'error.50'; // Vermelho claro para ausente
            return 'transparent';
          };

          const getRowHoverColor = () => {
            if (atestado) return 'info.100';
            if (!isPresente) return 'error.100';
            return 'action.hover';
          };

          const getRowBorderColor = () => {
            if (atestado) return 'info.main'; // Azul para atestado
            if (!isPresente) return 'error.main';
            return 'transparent';
          };

          return (
            <Box
              key={aluno.id}
              onClick={() => onPresencaChange(aluno.id)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1, sm: 2 },
                py: { xs: 1.5, sm: 2 },
                px: { xs: 1, sm: 2 },
                cursor: 'pointer',
                borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
                borderColor: 'divider',
                transition: 'all 0.2s ease',
                bgcolor: getRowBgColor(),
                borderLeft: '4px solid',
                borderLeftColor: getRowBorderColor(),
                '&:hover': {
                  bgcolor: getRowHoverColor(),
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
                checked={isPresente}
                sx={{
                  p: { xs: 0.5, sm: 1 },
                  color: isPresente ? 'success.main' : 'error.main',
                  '&.Mui-checked': {
                    color: 'success.main',
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
                  border: isPresente ? '2px solid transparent' : '2px solid',
                  borderColor: isPresente ? 'transparent' : 'error.main',
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
                    <>
                      {/* Icone de atestado com descricao */}
                      <Tooltip
                        title={
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              Atestado {atestado.tipo}
                            </Typography>
                            <Typography variant="caption">
                              {atestado.descricao}
                            </Typography>
                            <Typography variant="caption" display="block" color="warning.light">
                              {atestado.status === 'pendente' ? '(Pendente aprovacao)' : '(Aprovado)'}
                            </Typography>
                            <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                              Presenca justificada
                            </Typography>
                          </Box>
                        }
                        arrow
                      >
                        <MedicalServices
                          sx={{
                            fontSize: 18,
                            color: atestado.status === 'aprovado' ? 'info.main' : 'warning.main',
                            flexShrink: 0,
                          }}
                        />
                      </Tooltip>

                      {/* Icone para abrir arquivo (se existir) */}
                      {atestado.arquivoUrl && (
                        <Tooltip title="Ver arquivo do atestado" arrow>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(atestado.arquivoUrl, '_blank');
                            }}
                            sx={{
                              p: 0.25,
                              color: 'info.main',
                              '&:hover': { color: 'info.dark' },
                            }}
                          >
                            <OpenInNew sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </>
                  )}
                </Box>
                {aluno.matricula && (
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
                sx={{
                  minWidth: { xs: 75, sm: 95 },
                  fontSize: { xs: '0.75rem', sm: '0.85rem' },
                  textTransform: 'none',
                  borderRadius: 2,
                  px: { xs: 1.5, sm: 2 },
                  py: 0.75,
                  fontWeight: 600,
                  bgcolor: atestado ? 'info.main' : (isPresente ? 'success.main' : 'error.main'),
                  boxShadow: atestado ? 'none' : (isPresente ? 'none' : '0 2px 4px rgba(211,47,47,0.3)'),
                  '&:hover': {
                    bgcolor: atestado ? 'info.dark' : (isPresente ? 'success.dark' : 'error.dark'),
                  },
                }}
              >
                {atestado ? 'Justificado' : (isPresente ? 'Presente' : 'Ausente')}
              </Button>
            </Box>
          );
        })}
      </Box>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
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
