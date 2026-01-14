/**
 * Badge de role do usuario.
 */

import { Box, Chip } from '@mui/material';
import { AdminPanelSettings } from '@mui/icons-material';
import { usePermissions } from '@/hooks/usePermissions';

export function RoleBadge() {
  const { roleDisplayName, roleColor } = usePermissions();

  if (!roleDisplayName) return null;

  return (
    <Box sx={{ px: 2, py: 1 }}>
      <Chip
        icon={<AdminPanelSettings sx={{ fontSize: 16 }} />}
        label={roleDisplayName}
        size="small"
        color={roleColor}
        sx={{
          width: '100%',
          justifyContent: 'flex-start',
          '& .MuiChip-label': { flex: 1 },
        }}
      />
    </Box>
  );
}
