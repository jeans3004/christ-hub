/**
 * Celula de nota (AV1/AV2) com suporte a composicao.
 */

import { Box, Typography, TextField, IconButton, Tooltip } from '@mui/material';
import { Lock, Calculate, Settings } from '@mui/icons-material';
import { getNotaColor, NOTA_COLORS } from './constants';
import { NotaCellProps } from './types';

export function NotaCell({
  nota,
  modoCell,
  onNotaChange,
  onOpenMenu,
  onOpenComposition,
}: NotaCellProps) {
  const isBloqueado = modoCell.modo === 'bloqueado';
  const temNotaSalva = nota !== null && nota !== undefined;
  const colorKey = getNotaColor(nota);
  const colors = NOTA_COLORS[colorKey];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {isBloqueado && !temNotaSalva ? (
        <BloqueadoVazio />
      ) : isBloqueado && temNotaSalva ? (
        <BloqueadoComNota nota={nota} colors={colors} />
      ) : modoCell.modo === 'composicao' ? (
        <ComposicaoCell nota={nota} colors={colors} temNotaSalva={temNotaSalva} onClick={onOpenComposition} />
      ) : (
        <DiretaCell nota={nota} colors={colors} temNotaSalva={temNotaSalva} onChange={onNotaChange} />
      )}
      <IconButton
        size="small"
        onClick={onOpenMenu}
        sx={{ p: 0.25, color: isBloqueado ? 'grey.500' : 'primary.main' }}
      >
        <Settings sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

function BloqueadoVazio() {
  return (
    <Tooltip title="Clique na engrenagem para habilitar">
      <Box
        sx={{
          flex: 1, bgcolor: 'grey.200', borderRadius: 1, py: 0.75, px: 1,
          textAlign: 'center', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 0.5, cursor: 'not-allowed',
          minHeight: 32, border: '2px solid', borderColor: 'grey.400',
        }}
      >
        <Lock sx={{ fontSize: 14, color: 'grey.500' }} />
        <Typography sx={{ fontSize: '0.75rem', color: 'grey.500' }}>-</Typography>
      </Box>
    </Tooltip>
  );
}

function BloqueadoComNota({ nota, colors }: { nota: number; colors: typeof NOTA_COLORS.success }) {
  return (
    <Tooltip title="Nota salva - clique na engrenagem para editar">
      <Box
        sx={{
          flex: 1, bgcolor: colors.bg, borderRadius: 1, py: 0.75, px: 1,
          textAlign: 'center', display: 'flex', alignItems: 'center',
          justifyContent: 'center', minHeight: 32, border: '2px solid',
          borderColor: colors.border,
        }}
      >
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: colors.text }}>
          {nota}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function ComposicaoCell({
  nota, colors, temNotaSalva, onClick,
}: {
  nota: number | null | undefined;
  colors: typeof NOTA_COLORS.success;
  temNotaSalva: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip title="Clique para editar valores">
      <Box
        onClick={onClick}
        sx={{
          flex: 1, bgcolor: temNotaSalva ? colors.bg : 'grey.100', borderRadius: 1,
          py: 0.75, px: 1, textAlign: 'center', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 0.5, minHeight: 32,
          border: '2px solid', borderColor: temNotaSalva ? colors.border : 'grey.400',
          '&:hover': { bgcolor: temNotaSalva ? colors.bgHover : 'grey.200' },
        }}
      >
        <Calculate sx={{ fontSize: 14, color: temNotaSalva ? colors.text : 'grey.600' }} />
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: temNotaSalva ? colors.text : 'grey.600' }}>
          {nota ?? '-'}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function DiretaCell({
  nota, colors, temNotaSalva, onChange,
}: {
  nota: number | null | undefined;
  colors: typeof NOTA_COLORS.success;
  temNotaSalva: boolean;
  onChange: (valor: string) => void;
}) {
  return (
    <TextField
      size="small"
      value={nota ?? ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0-10"
      inputProps={{
        style: {
          textAlign: 'center', padding: '6px 4px', fontSize: '0.875rem',
          fontWeight: 600, color: temNotaSalva ? colors.text : undefined,
        },
      }}
      sx={{
        flex: 1,
        '& .MuiOutlinedInput-root': {
          borderRadius: 1, bgcolor: temNotaSalva ? colors.bg : 'background.paper',
          '& fieldset': { borderWidth: 2, borderColor: temNotaSalva ? colors.border : 'grey.400' },
          '&:hover fieldset': { borderColor: temNotaSalva ? colors.border : 'grey.500' },
          '&.Mui-focused fieldset': { borderColor: temNotaSalva ? colors.border : 'primary.main' },
        },
      }}
    />
  );
}
