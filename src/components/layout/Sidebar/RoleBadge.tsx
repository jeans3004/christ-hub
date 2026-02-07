/**
 * Badge de role do usuario.
 */

import { Box, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { usePermissions } from '@/hooks/usePermissions';

const roleStyles: Record<string, { color: string }> = {
  administrador: { color: '#EF4444' },
  professor: { color: '#3B82F6' },
  coordenador: { color: '#22C55E' },
};

export function RoleBadge() {
  const { roleDisplayName, role } = usePermissions();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  if (!roleDisplayName || !role) return null;

  const style = roleStyles[role] || roleStyles.professor;

  return (
    <Box sx={{ px: 2, py: 1.5 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1,
          borderRadius: '10px',
          bgcolor: alpha(style.color, isDark ? 0.1 : 0.05),
        }}
      >
        <Box
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: style.color,
            flexShrink: 0,
          }}
        />
        <Typography
          sx={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: isDark ? alpha(style.color, 0.9) : style.color,
            letterSpacing: '0.02em',
          }}
        >
          {roleDisplayName}
        </Typography>
      </Box>
    </Box>
  );
}
