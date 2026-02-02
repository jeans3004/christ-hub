/**
 * Item de navegacao colapsado (apenas icone com tooltip).
 * Usado quando o sidebar esta no modo collapsed.
 */

import { Box, IconButton, Tooltip } from '@mui/material';
import { NavItem as NavItemType } from '@/constants/navigation';

interface NavItemCollapsedProps {
  item: NavItemType;
  isActive: boolean;
  onNavigate: (href: string) => void;
}

export function NavItemCollapsed({ item, isActive, onNavigate }: NavItemCollapsedProps) {
  // Nao mostrar items sem icone ou sem href no modo colapsado
  if (!item.icon || !item.href) return null;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 0 }}>
      <Tooltip title={item.label} placement="right" arrow>
        <IconButton
          onClick={() => onNavigate(item.href!)}
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1,
            color: isActive ? '#F0F6FC' : 'sidebar.text',
            bgcolor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            '&:hover': {
              bgcolor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          {item.icon}
        </IconButton>
      </Tooltip>
    </Box>
  );
}
