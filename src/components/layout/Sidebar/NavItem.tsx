/**
 * Item de navegacao do sidebar.
 */

import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { NavItem as NavItemType } from '@/constants/navigation';

interface NavItemProps {
  item: NavItemType;
  depth?: number;
  isActive: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (href: string) => void;
  openItems: Record<string, boolean>;
  isItemActive: (href?: string) => boolean;
}

export function NavItem({
  item,
  depth = 0,
  isActive,
  isOpen,
  onToggle,
  onNavigate,
  openItems,
  isItemActive,
}: NavItemProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = () => {
    if (hasChildren) {
      onToggle();
    } else if (item.href) {
      onNavigate(item.href);
    }
  };

  return (
    <Box>
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleClick}
          selected={isActive}
          sx={{
            pl: 1.5 + depth * 2,
            py: 0.625,
            borderRadius: '8px',
            my: 0.25,
            color: isActive
              ? 'text.primary'
              : 'text.secondary',
            bgcolor: isActive
              ? (isDark ? alpha('#3B82F6', 0.12) : alpha('#3B82F6', 0.08))
              : 'transparent',
            '&:hover': {
              bgcolor: isActive
                ? (isDark ? alpha('#3B82F6', 0.15) : alpha('#3B82F6', 0.12))
                : (isDark ? alpha('#FFFFFF', 0.05) : alpha('#0D1117', 0.07)),
              color: 'text.primary',
            },
            '&.Mui-selected': {
              bgcolor: isDark ? alpha('#3B82F6', 0.12) : alpha('#3B82F6', 0.08),
              color: 'text.primary',
              '&:hover': {
                bgcolor: isDark ? alpha('#3B82F6', 0.15) : alpha('#3B82F6', 0.12),
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 32,
              color: isActive ? '#3B82F6' : 'text.disabled',
              '& .MuiSvgIcon-root': { fontSize: '1.2rem' },
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.8125rem',
              fontWeight: isActive ? 600 : 450,
              letterSpacing: '-0.01em',
            }}
          />
          {hasChildren && (
            isOpen
              ? <ExpandLess sx={{ fontSize: 18, color: 'text.disabled' }} />
              : <ExpandMore sx={{ fontSize: 18, color: 'text.disabled' }} />
          )}
        </ListItemButton>
      </ListItem>

      {hasChildren && (
        <Collapse in={isOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {item.children?.map((child) => (
              <NavItem
                key={child.label}
                item={child}
                depth={depth + 1}
                isActive={isItemActive(child.href)}
                isOpen={openItems[child.label] || false}
                onToggle={() => {}}
                onNavigate={onNavigate}
                openItems={openItems}
                isItemActive={isItemActive}
              />
            ))}
          </List>
        </Collapse>
      )}
    </Box>
  );
}
