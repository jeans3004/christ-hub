/**
 * Grid visual do mapa de sala.
 */

import { Box, Paper, Typography, IconButton, Tooltip } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';
import { LayoutSala } from '@/types';
import { CelulaMapa, ModoEdicao } from '../types';
import { SeatCell } from './SeatCell';

interface ClassroomGridProps {
  layout: LayoutSala;
  celulas: CelulaMapa[];
  modoEdicao: ModoEdicao;
  selectedCell: { row: number; col: number } | null;
  onCelulaClick: (row: number, col: number) => void;
  onDrop: (row: number, col: number, alunoId: string) => void;
  onLayoutChange: (layout: LayoutSala) => void;
}

export function ClassroomGrid({
  layout,
  celulas,
  modoEdicao,
  selectedCell,
  onCelulaClick,
  onDrop,
  onLayoutChange,
}: ClassroomGridProps) {
  const handleAddRow = () => {
    if (layout.rows < 10) {
      onLayoutChange({ ...layout, rows: layout.rows + 1 });
    }
  };

  const handleRemoveRow = () => {
    if (layout.rows > 2) {
      onLayoutChange({ ...layout, rows: layout.rows - 1 });
    }
  };

  const handleAddColumn = () => {
    if (layout.columns < 10) {
      onLayoutChange({ ...layout, columns: layout.columns + 1 });
    }
  };

  const handleRemoveColumn = () => {
    if (layout.columns > 2) {
      onLayoutChange({ ...layout, columns: layout.columns - 1 });
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

  return (
    <Paper sx={{ p: 3, overflow: 'auto' }}>
      {/* Controles de colunas */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, gap: 1 }}>
        <Tooltip title="Remover coluna">
          <span>
            <IconButton
              size="small"
              onClick={handleRemoveColumn}
              disabled={layout.columns <= 2}
            >
              <Remove fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Typography variant="body2" sx={{ mx: 1, alignSelf: 'center' }}>
          {layout.columns} colunas
        </Typography>
        <Tooltip title="Adicionar coluna">
          <span>
            <IconButton
              size="small"
              onClick={handleAddColumn}
              disabled={layout.columns >= 10}
            >
              <Add fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>

      {/* Grid principal */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Controles de linhas */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 1,
          }}
        >
          <Tooltip title="Remover linha">
            <span>
              <IconButton
                size="small"
                onClick={handleRemoveRow}
                disabled={layout.rows <= 2}
              >
                <Remove fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Typography
            variant="body2"
            sx={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              transform: 'rotate(180deg)',
            }}
          >
            {layout.rows} linhas
          </Typography>
          <Tooltip title="Adicionar linha">
            <span>
              <IconButton
                size="small"
                onClick={handleAddRow}
                disabled={layout.rows >= 10}
              >
                <Add fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Grid de celulas */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {/* Quadro/Lousa */}
          <Box
            sx={{
              height: 30,
              bgcolor: 'grey.800',
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              width: layout.columns * 88 - 8,
            }}
          >
            <Typography variant="caption" color="white">
              QUADRO
            </Typography>
          </Box>

          {/* Linhas de celulas */}
          {Array.from({ length: layout.rows }).map((_, rowIndex) => (
            <Box
              key={rowIndex}
              sx={{
                display: 'flex',
                gap: 1,
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
                  />
                );
              })}
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
}
