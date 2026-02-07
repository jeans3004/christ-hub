/**
 * Item de navegacao colapsado (apenas icone com tooltip).
 * Usado quando o sidebar esta no modo collapsed.
 */

import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { NavItem as NavItemType } from '@/constants/navigation';

interface NavItemCollapsedProps {
  item: NavItemType;
  isActive: boolean;
  onNavigate: (href: string) => void;
}

export function NavItemCollapsed({ item, isActive, onNavigate }: NavItemCollapsedProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  // Nao mostrar items sem icone ou sem href no modo colapsado
  if (!item.icon || !item.href) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.25 }}>
      <Tooltip title={item.label} placement="right" arrow>
        <IconButton
          onClick={() => onNavigate(item.href!)}
          sx={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            color: isActive ? '#3B82F6' : 'text.secondary',
            bgcolor: isActive
              ? (isDark ? alpha('#3B82F6', 0.12) : alpha('#3B82F6', 0.08))
              : 'transparent',
            '&:hover': {
              bgcolor: isActive
                ? (isDark ? alpha('#3B82F6', 0.15) : alpha('#3B82F6', 0.12))
                : (isDark ? alpha('#FFFFFF', 0.05) : alpha('#0D1117', 0.07)),
              color: isActive ? '#3B82F6' : 'text.primary',
            },
            '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
          }}
        >
          {item.icon}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
