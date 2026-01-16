/**
 * Componente de tabela de notas.
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Save,
  Lock,
  Edit as EditIcon,
  Calculate,
  Settings,
} from '@mui/icons-material';
import { Aluno } from '@/types';
import { NotasAluno, ModoCell, ModoEntrada, getCellKey } from '../types';

// Constante da media de referencia
const MEDIA_REFERENCIA = 6.0;

// Funcao helper para determinar cor baseada na nota
const getNotaColor = (nota: number | null | undefined): 'success' | 'error' | 'neutral' => {
  if (nota === null || nota === undefined) return 'neutral';
  return nota >= MEDIA_REFERENCIA ? 'success' : 'error';
};

// Cores para cada estado
const NOTA_COLORS = {
  success: {
    bg: 'rgba(76, 175, 80, 0.15)',
    bgHover: 'rgba(76, 175, 80, 0.25)',
    border: '#4CAF50',
    text: '#2E7D32',
  },
  error: {
    bg: 'rgba(244, 67, 54, 0.15)',
    bgHover: 'rgba(244, 67, 54, 0.25)',
    border: '#F44336',
    text: '#C62828',
  },
  neutral: {
    bg: 'grey.100',
    bgHover: 'grey.200',
    border: 'grey.400',
    text: 'text.secondary',
  },
};

interface NotasTableProps {
  alunos: Aluno[];
  notas: Record<string, NotasAluno>;
  modosCells: Record<string, ModoCell>;
  saving: boolean;
  getModoCell: (alunoId: string, av: 'av1' | 'av2') => ModoCell;
  handleNotaChange: (alunoId: string, tipo: 'av1' | 'av2' | 'rp1' | 'rp2', valor: string) => void;
  calcularMedia: (alunoId: string) => string;
  handleSaveNotas: () => Promise<void>;
  handleOpenTemplateModal: (av: 'av1' | 'av2') => void;
  handleSelectModo: (modo: ModoEntrada, cellKey: string) => void;
  openCompositionModal: (cellKey: string) => void;
}

export function NotasTable({
  alunos,
  notas,
  modosCells,
  saving,
  getModoCell,
  handleNotaChange,
  calcularMedia,
  handleSaveNotas,
  handleOpenTemplateModal,
  handleSelectModo,
  openCompositionModal,
}: NotasTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuCellKey, setMenuCellKey] = useState<string | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, alunoId: string, av: 'av1' | 'av2') => {
    setMenuAnchor(event.currentTarget);
    setMenuCellKey(getCellKey(alunoId, av));
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuCellKey(null);
  };

  const onSelectModo = (modo: ModoEntrada) => {
    if (menuCellKey) {
      handleSelectModo(modo, menuCellKey);
    }
    handleCloseMenu();
  };

  const renderNotaCell = (alunoId: string, av: 'av1' | 'av2') => {
    const modoCell = getModoCell(alunoId, av);
    const nota = notas[alunoId]?.[av];
    const isBloqueado = modoCell.modo === 'bloqueado';
    const temNotaSalva = nota !== null && nota !== undefined;
    const colorKey = getNotaColor(nota);
    const colors = NOTA_COLORS[colorKey];

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        {isBloqueado && !temNotaSalva ? (
          <Tooltip title="Clique na engrenagem para habilitar">
            <Box
              sx={{
                flex: 1,
                bgcolor: 'grey.200',
                borderRadius: 1,
                py: 0.75,
                px: 1,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                cursor: 'not-allowed',
                minHeight: 32,
                border: '2px solid',
                borderColor: 'grey.400',
              }}
            >
              <Lock sx={{ fontSize: 14, color: 'grey.500' }} />
              <Typography sx={{ fontSize: '0.75rem', color: 'grey.500' }}>
                -
              </Typography>
            </Box>
          </Tooltip>
        ) : isBloqueado && temNotaSalva ? (
          <Tooltip title="Nota salva - clique na engrenagem para editar">
            <Box
              sx={{
                flex: 1,
                bgcolor: colors.bg,
                borderRadius: 1,
                py: 0.75,
                px: 1,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 32,
                border: '2px solid',
                borderColor: colors.border,
              }}
            >
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>
                {nota}
              </Typography>
            </Box>
          </Tooltip>
        ) : modoCell.modo === 'composicao' ? (
          <Tooltip title="Clique para editar valores">
            <Box
              onClick={() => openCompositionModal(getCellKey(alunoId, av))}
              sx={{
                flex: 1,
                bgcolor: temNotaSalva ? colors.bg : 'grey.100',
                borderRadius: 1,
                py: 0.75,
                px: 1,
                textAlign: 'center',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.5,
                minHeight: 32,
                border: '2px solid',
                borderColor: temNotaSalva ? colors.border : 'grey.400',
                '&:hover': {
                  bgcolor: temNotaSalva ? colors.bgHover : 'grey.200',
                },
              }}
            >
              <Calculate sx={{ fontSize: 14, color: temNotaSalva ? colors.text : 'grey.600' }} />
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: temNotaSalva ? colors.text : 'grey.600' }}>
                {nota ?? '-'}
              </Typography>
            </Box>
          </Tooltip>
        ) : (
          <TextField
            size="small"
            value={nota ?? ''}
            onChange={(e) => handleNotaChange(alunoId, av, e.target.value)}
            placeholder="0-10"
            inputProps={{
              style: {
                textAlign: 'center',
                padding: '6px 4px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: temNotaSalva ? colors.text : undefined,
              },
            }}
            sx={{
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
                bgcolor: temNotaSalva ? colors.bg : 'background.paper',
                '& fieldset': {
                  borderWidth: 2,
                  borderColor: temNotaSalva ? colors.border : 'grey.400',
                },
                '&:hover fieldset': {
                  borderColor: temNotaSalva ? colors.border : 'grey.500',
                },
                '&.Mui-focused fieldset': {
                  borderColor: temNotaSalva ? colors.border : 'primary.main',
                },
              },
            }}
          />
        )}
        <IconButton
          size="small"
          onClick={(e) => handleOpenMenu(e, alunoId, av)}
          sx={{
            p: 0.25,
            color: isBloqueado ? 'grey.500' : 'primary.main',
          }}
        >
          <Settings sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  };

  return (
    <>
      {/* Table Header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '35px 1fr repeat(4, 70px) 50px', sm: '40px 1fr repeat(4, 90px) 60px' },
          gap: { xs: 0.5, sm: 1 },
          px: { xs: 1, sm: 2 },
          py: 1.5,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          borderRadius: '8px 8px 0 0',
          alignItems: 'center',
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
          Nº
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          Nome
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            AV1
          </Typography>
          <Tooltip title="Editar composição da AV1">
            <IconButton size="small" onClick={() => handleOpenTemplateModal('av1')} sx={{ p: 0.25 }}>
              <EditIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
          RP1
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            AV2
          </Typography>
          <Tooltip title="Editar composição da AV2">
            <IconButton size="small" onClick={() => handleOpenTemplateModal('av2')} sx={{ p: 0.25 }}>
              <EditIcon sx={{ fontSize: 14, color: 'primary.main' }} />
            </IconButton>
          </Tooltip>
        </Box>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
          RP2
        </Typography>
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary" textAlign="center">
          Media
        </Typography>
      </Box>

      {/* Table Body */}
      <Box sx={{ bgcolor: 'background.paper', borderRadius: '0 0 8px 8px' }}>
        {alunos.map((aluno, index) => (
          <Box
            key={aluno.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '35px 1fr repeat(4, 70px) 50px', sm: '40px 1fr repeat(4, 90px) 60px' },
              gap: { xs: 0.5, sm: 1 },
              alignItems: 'center',
              px: { xs: 1, sm: 2 },
              py: 1.5,
              borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', sm: '0.95rem' }, textAlign: 'center', color: 'text.secondary' }}>
              {index + 1}
            </Typography>
            <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
              {aluno.nome}
            </Typography>

            {/* AV1 */}
            {renderNotaCell(aluno.id, 'av1')}

            {/* RP1 */}
            {(() => {
              const rp1 = notas[aluno.id]?.rp1;
              const temNota = rp1 !== null && rp1 !== undefined;
              const colorKey = getNotaColor(rp1);
              const colors = NOTA_COLORS[colorKey];
              return (
                <TextField
                  size="small"
                  value={rp1 ?? ''}
                  onChange={(e) => handleNotaChange(aluno.id, 'rp1', e.target.value)}
                  placeholder="0-10"
                  inputProps={{
                    style: {
                      textAlign: 'center',
                      padding: '6px 4px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: temNota ? colors.text : undefined,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      bgcolor: temNota ? colors.bg : 'background.paper',
                      '& fieldset': {
                        borderWidth: 2,
                        borderColor: temNota ? colors.border : 'grey.400',
                      },
                      '&:hover fieldset': {
                        borderColor: temNota ? colors.border : 'grey.500',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: temNota ? colors.border : 'primary.main',
                      },
                    },
                  }}
                />
              );
            })()}

            {/* AV2 */}
            {renderNotaCell(aluno.id, 'av2')}

            {/* RP2 */}
            {(() => {
              const rp2 = notas[aluno.id]?.rp2;
              const temNota = rp2 !== null && rp2 !== undefined;
              const colorKey = getNotaColor(rp2);
              const colors = NOTA_COLORS[colorKey];
              return (
                <TextField
                  size="small"
                  value={rp2 ?? ''}
                  onChange={(e) => handleNotaChange(aluno.id, 'rp2', e.target.value)}
                  placeholder="0-10"
                  inputProps={{
                    style: {
                      textAlign: 'center',
                      padding: '6px 4px',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: temNota ? colors.text : undefined,
                    },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1,
                      bgcolor: temNota ? colors.bg : 'background.paper',
                      '& fieldset': {
                        borderWidth: 2,
                        borderColor: temNota ? colors.border : 'grey.400',
                      },
                      '&:hover fieldset': {
                        borderColor: temNota ? colors.border : 'grey.500',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: temNota ? colors.border : 'primary.main',
                      },
                    },
                  }}
                />
              );
            })()}

            {/* Media */}
            {(() => {
              const mediaStr = calcularMedia(aluno.id);
              const mediaNum = parseFloat(mediaStr);
              const temMedia = !isNaN(mediaNum);
              const colorKey = getNotaColor(temMedia ? mediaNum : null);
              const colors = NOTA_COLORS[colorKey];
              return (
                <Box
                  sx={{
                    bgcolor: temMedia ? colors.bg : 'transparent',
                    border: temMedia ? '2px solid' : 'none',
                    borderColor: temMedia ? colors.border : 'transparent',
                    borderRadius: 1,
                    py: 0.5,
                    px: 0.5,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      textAlign: 'center',
                      color: temMedia ? colors.text : 'text.secondary',
                    }}
                  >
                    {mediaStr}
                  </Typography>
                </Box>
              );
            })()}
          </Box>
        ))}
      </Box>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={handleSaveNotas}
          disabled={saving}
          sx={{ textTransform: 'none', borderRadius: 2, px: 4, py: 1 }}
        >
          {saving ? 'Salvando...' : 'Salvar Notas'}
        </Button>
      </Box>

      {/* Menu para selecionar modo de entrada */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={() => onSelectModo('direto')} sx={{ gap: 1.5 }}>
          <EditIcon fontSize="small" color="success" />
          <Box>
            <Typography variant="body2" fontWeight={500}>Nota Direta</Typography>
            <Typography variant="caption" color="text.secondary">
              Digitar a nota manualmente
            </Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={() => onSelectModo('composicao')} sx={{ gap: 1.5 }}>
          <Calculate fontSize="small" color="primary" />
          <Box>
            <Typography variant="body2" fontWeight={500}>Composicao</Typography>
            <Typography variant="caption" color="text.secondary">
              Calcular nota por componentes
            </Typography>
          </Box>
        </MenuItem>
      </Menu>
    </>
  );
}
