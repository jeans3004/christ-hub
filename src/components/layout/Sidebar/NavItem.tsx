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
            pl: 2 + depth * 2,
            py: 0.5,
            borderRadius: 0,
            ml: 0,
            mr: 0,
            my: 0,
            color: isActive ? '#F0F6FC' : 'sidebar.text',
            bgcolor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
            '&:hover': {
              bgcolor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
            },
            '&.Mui-selected': {
              bgcolor: 'rgba(59, 130, 246, 0.15)',
              borderLeft: '3px solid #3B82F6',
              color: '#F0F6FC',
              '&:hover': {
                bgcolor: 'rgba(59, 130, 246, 0.15)',
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 36,
              color: isActive ? '#F0F6FC' : 'sidebar.text',
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              fontSize: '0.875rem',
              fontWeight: isActive ? 500 : 400,
            }}
          />
          {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
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
