/**
 * Grid visual do mapa de sala - Redesign com melhor UX.
 */

import { Box, Paper, Typography, IconButton, Tooltip, Slider, Chip, useTheme } from '@mui/material';
import { Add, Remove, GridView, Settings } from '@mui/icons-material';
import { LayoutSala } from '@/types';
import { CelulaMapa, ModoEdicao, LAYOUT_LIMITS, TIPO_COLORS } from '../types';
import { SeatCell } from './SeatCell';

interface ClassroomGridProps {
  layout: LayoutSala;
  celulas: CelulaMapa[];
  modoEdicao: ModoEdicao;
  selectedCell: { row: number; col: number } | null;
  onCelulaClick: (row: number, col: number) => void;
  onDrop: (row: number, col: number, alunoId: string) => void;
  onLayoutChange: (layout: LayoutSala) => void;
  showLayoutControls?: boolean;
  compact?: boolean;
}

export function ClassroomGrid({
  layout,
  celulas,
  modoEdicao,
  selectedCell,
  onCelulaClick,
  onDrop,
  onLayoutChange,
  showLayoutControls = true,
  compact = false,
}: ClassroomGridProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const handleRowChange = (_: Event, value: number | number[]) => {
    const newRows = value as number;
    if (newRows >= LAYOUT_LIMITS.minRows && newRows <= LAYOUT_LIMITS.maxRows) {
      onLayoutChange({ ...layout, rows: newRows });
    }
  };

  const handleColumnChange = (_: Event, value: number | number[]) => {
    const newCols = value as number;
    if (newCols >= LAYOUT_LIMITS.minColumns && newCols <= LAYOUT_LIMITS.maxColumns) {
      onLayoutChange({ ...layout, columns: newCols });
    }
  };

  const getCelula = (row: number, col: number): CelulaMapa => {
    return (
      celulas.find((c) => c.row === row && c.column === col) || {
        row,
        column: col,
        alunoId: null,
        tipo: 'mesa',
      }
    );
  };

  // Calcular tamanho das celulas baseado no layout
  const cellSize = compact ? 52 : Math.max(52, Math.min(72, 400 / layout.columns));
  const gap = compact ? 4 : 6;

  // Estatisticas
  const totalMesas = celulas.filter(c => c.tipo === 'mesa').length;
  const mesasOcupadas = celulas.filter(c => c.tipo === 'mesa' && c.alunoId).length;

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 2 },
        overflow: 'auto',
        width: '100%',
        bgcolor: isDark ? 'grey.900' : 'grey.50',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      {/* Header com estatisticas */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GridView sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
            Sala de Aula
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Chip
            size="small"
            label={`${mesasOcupadas}/${totalMesas} mesas`}
            color={mesasOcupadas === totalMesas ? 'success' : 'default'}
            variant="outlined"
            sx={{ fontWeight: 500 }}
          />
          <Chip
            size="small"
            label={`${layout.rows}x${layout.columns}`}
            variant="outlined"
            icon={<Settings sx={{ fontSize: '14px !important' }} />}
            sx={{ fontWeight: 500 }}
          />
        </Box>
      </Box>

      {/* Controles de layout */}
      {showLayoutControls && modoEdicao !== 'visualizar' && (
        <Box sx={{
          display: 'flex',
          gap: 3,
          mb: 2,
          p: 1.5,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          flexWrap: 'wrap',
        }}>
          {/* Controle de colunas */}
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Colunas: {layout.columns}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Slider
                value={layout.columns}
                onChange={handleColumnChange}
                min={LAYOUT_LIMITS.minColumns}
                max={LAYOUT_LIMITS.maxColumns}
                step={1}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>

          {/* Controle de linhas */}
          <Box sx={{ flex: 1, minWidth: 120 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={500}>
              Linhas: {layout.rows}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Slider
                value={layout.rows}
                onChange={handleRowChange}
                min={LAYOUT_LIMITS.minRows}
                max={LAYOUT_LIMITS.maxRows}
                step={1}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          </Box>
        </Box>
      )}

      {/* Grid de celulas */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: `${gap}px`,
        }}
      >
        {/* Quadro/Lousa */}
        <Box
          sx={{
            width: layout.columns * (cellSize + gap) - gap,
            maxWidth: '100%',
            height: 36,
            bgcolor: 'grey.800',
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 1,
            boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.4)' : '0 2px 8px rgba(0,0,0,0.15)',
          }}
        >
          <Typography variant="caption" color="white" fontWeight={600} letterSpacing={1}>
            QUADRO
          </Typography>
        </Box>

        {/* Linhas de celulas */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: `${gap}px`,
            overflowX: 'auto',
            maxWidth: '100%',
            pb: 1,
          }}
        >
          {Array.from({ length: layout.rows }).map((_, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: 'flex',
                gap: `${gap}px`,
              }}
            >
              {Array.from({ length: layout.columns }).map((_, colIndex) => {
                const celula = getCelula(rowIndex, colIndex);
                const isSelected =
                  selectedCell?.row === rowIndex && selectedCell?.col === colIndex;

                return (
                  <SeatCell
                    key={`${rowIndex}-${colIndex}`}
                    celula={celula}
                    modoEdicao={modoEdicao}
                    selected={isSelected}
                    onCelulaClick={() => onCelulaClick(rowIndex, colIndex)}
                    onDrop={(alunoId) => onDrop(rowIndex, colIndex, alunoId)}
                    onTouchDrop={(targetRow, targetCol, alunoId) => onDrop(targetRow, targetCol, alunoId)}
                    row={rowIndex}
                    col={colIndex}
                    size={cellSize}
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Legenda */}
      <Box sx={{
        display: 'flex',
        gap: 2,
        mt: 2,
        pt: 2,
        borderTop: '1px solid',
        borderColor: 'divider',
        flexWrap: 'wrap',
        justifyContent: 'center',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{
            width: 16,
            height: 16,
            bgcolor: isDark ? TIPO_COLORS.mesa.bgDark : TIPO_COLORS.mesa.bg,
            border: '1px solid',
            borderColor: isDark ? TIPO_COLORS.mesa.borderDark : TIPO_COLORS.mesa.border,
            borderRadius: 0.5,
          }} />
          <Typography variant="caption" color="text.secondary">Mesa vazia</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{
            width: 16,
            height: 16,
            bgcolor: isDark ? '#1a3a5c' : '#bbdefb',
            border: '2px solid',
            borderColor: isDark ? '#42a5f5' : '#1976d2',
            borderRadius: 0.5,
          }} />
          <Typography variant="caption" color="text.secondary">Mesa ocupada</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{
            width: 16,
            height: 16,
            bgcolor: isDark ? TIPO_COLORS.vazio.bgDark : TIPO_COLORS.vazio.bg,
            border: '1px solid',
            borderColor: isDark ? TIPO_COLORS.vazio.borderDark : TIPO_COLORS.vazio.border,
            borderRadius: 0.5,
          }} />
          <Typography variant="caption" color="text.secondary">Vazio</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{
            width: 16,
            height: 16,
            bgcolor: isDark ? TIPO_COLORS.professor.bgDark : TIPO_COLORS.professor.bg,
            border: '1px solid',
            borderColor: isDark ? TIPO_COLORS.professor.borderDark : TIPO_COLORS.professor.border,
            borderRadius: 0.5,
          }} />
          <Typography variant="caption" color="text.secondary">Professor</Typography>
        </Box>
      </Box>
    </Paper>
  );
}
