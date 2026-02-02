/**
 * Badge de role do usuario.
 */

import { Box, Chip } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';

const roleStyles: Record<string, { bg: string; color: string; border: string }> = {
  administrador: {
    bg: 'rgba(236, 72, 153, 0.15)',
    color: '#EC4899',
    border: '#EC4899',
  },
  professor: {
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#3B82F6',
    border: '#3B82F6',
  },
  coordenador: {
    bg: 'rgba(34, 197, 94, 0.15)',
    color: '#22C55E',
    border: '#22C55E',
  },
};

export function RoleBadge() {
  const { roleDisplayName, role } = usePermissions();

  if (!roleDisplayName || !role) return null;

  const style = roleStyles[role] || roleStyles.professor;

  return (
    <Box sx={{ px: 1, py: 0.5 }}>
      <Chip
        icon={<AdminPanelSettings sx={{ fontSize: 16, color: `${style.color} !important` }} />}
        label={roleDisplayName}
        size="small"
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          borderRadius: '9999px',
          backgroundColor: style.bg,
          color: style.color,
          border: `1px solid ${style.border}`,
          fontWeight: 500,
          fontSize: '0.75rem',
          '& .MuiChip-label': { flex: 1 },
        }}
      />
    </Box>
  );
}
