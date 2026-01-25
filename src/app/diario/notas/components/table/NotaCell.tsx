/**
 * Celula de nota (AV1/AV2) com suporte a composicao.
 */

import { Box, Typography, TextField, IconButton, Tooltip, useMediaQuery, useTheme } from '@mui/material';
import { Calculate, Settings, Warning, Grading } from '@mui/icons-material';
import { getNotaColor, NOTA_COLORS } from './constants';
import { NotaCellProps } from './types';

export function NotaCell({
  nota,
  modoCell,
  composicaoStatus,
  onNotaChange,
  onOpenMenu,
  onOpenComposition,
  onOpenTemplateModal,
}: NotaCellProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const temNotaSalva = nota !== null && nota !== undefined;
  const colorKey = getNotaColor(nota);
  const colors = NOTA_COLORS[colorKey];

  // Modo composicao com status
  if (modoCell.modo === 'composicao') {
    if (composicaoStatus === 'sem-template') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <SemTemplateCell isMobile={isMobile} onClick={onOpenTemplateModal} />
          <IconButton size="small" onClick={onOpenMenu} sx={{ p: 0.25, color: 'warning.main' }}>
            <Settings sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      );
    }

    if (composicaoStatus === 'falta-avaliar') {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
          <FaltaAvaliarCell isMobile={isMobile} onClick={onOpenComposition} />
          <IconButton size="small" onClick={onOpenMenu} sx={{ p: 0.25, color: 'info.main' }}>
            <Settings sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      );
    }

    // Status pronto - mostra nota
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <ComposicaoCell nota={nota} colors={colors} temNotaSalva={temNotaSalva} onClick={onOpenComposition} />
        <IconButton size="small" onClick={onOpenMenu} sx={{ p: 0.25, color: 'primary.main' }}>
          <Settings sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  }

  // Modo direto
  if (modoCell.modo === 'direto') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <DiretaCell nota={nota} colors={colors} temNotaSalva={temNotaSalva} onChange={onNotaChange} />
        <IconButton size="small" onClick={onOpenMenu} sx={{ p: 0.25, color: 'primary.main' }}>
          <Settings sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>
    );
  }

  // Modo bloqueado (fallback)
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
      {temNotaSalva ? (
        <BloqueadoComNota nota={nota!} colors={colors} />
      ) : (
        <BloqueadoVazio />
      )}
      <IconButton size="small" onClick={onOpenMenu} sx={{ p: 0.25, color: 'grey.500' }}>
        <Settings sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
}

function SemTemplateCell({ isMobile, onClick }: { isMobile: boolean; onClick: () => void }) {
  return (
    <Tooltip title="Clique para configurar a composicao da nota">
      <Box
        onClick={onClick}
        sx={{
          flex: 1,
          bgcolor: 'warning.light',
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
          borderColor: 'warning.main',
          '&:hover': { bgcolor: 'warning.200' },
        }}
      >
        <Warning sx={{ fontSize: 14, color: 'warning.dark' }} />
        {!isMobile && (
          <Typography sx={{ fontSize: '0.65rem', color: 'warning.dark', fontWeight: 500 }}>
            Configurar
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

function FaltaAvaliarCell({ isMobile, onClick }: { isMobile: boolean; onClick: () => void }) {
  return (
    <Tooltip title="Falta avaliar rubricas - clique para ver detalhes">
      <Box
        onClick={onClick}
        sx={{
          flex: 1,
          bgcolor: 'info.light',
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
          borderColor: 'info.main',
          '&:hover': { bgcolor: 'info.200' },
        }}
      >
        <Grading sx={{ fontSize: 14, color: 'info.dark' }} />
        {!isMobile && (
          <Typography sx={{ fontSize: '0.65rem', color: 'info.dark', fontWeight: 500 }}>
            Avaliar
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
}

function BloqueadoVazio() {
  return (
    <Tooltip title="Clique na engrenagem para habilitar">
      <Box
        sx={{
          flex: 1, bgcolor: 'action.disabledBackground', borderRadius: 1, py: 0.75, px: 1,
          textAlign: 'center', display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 0.5, cursor: 'not-allowed',
          minHeight: 32, border: '2px solid', borderColor: 'divider',
        }}
      >
        <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>-</Typography>
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
    <Tooltip title="Clique para ver detalhes da composicao">
      <Box
        onClick={onClick}
        sx={{
          flex: 1, bgcolor: temNotaSalva ? colors.bg : 'action.hover', borderRadius: 1,
          py: 0.75, px: 1, textAlign: 'center', cursor: 'pointer', display: 'flex',
          alignItems: 'center', justifyContent: 'center', gap: 0.5, minHeight: 32,
          border: '2px solid', borderColor: temNotaSalva ? colors.border : 'divider',
          '&:hover': { bgcolor: temNotaSalva ? colors.bgHover : 'action.selected' },
        }}
      >
        <Calculate sx={{ fontSize: 14, color: temNotaSalva ? colors.text : 'text.secondary' }} />
        <Typography sx={{ fontSize: '0.875rem', fontWeight: 600, color: temNotaSalva ? colors.text : 'text.secondary' }}>
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
          '& fieldset': { borderWidth: 2, borderColor: temNotaSalva ? colors.border : 'divider' },
          '&:hover fieldset': { borderColor: temNotaSalva ? colors.border : 'text.disabled' },
          '&.Mui-focused fieldset': { borderColor: temNotaSalva ? colors.border : 'primary.main' },
        },
      }}
    />
  );
}
