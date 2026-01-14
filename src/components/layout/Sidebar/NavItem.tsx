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
            py: 1,
            borderRadius: 1,
            mx: 1,
            my: 0.25,
            color: isActive ? 'sidebar.activeText' : 'sidebar.text',
            bgcolor: isActive ? 'sidebar.active' : 'transparent',
            '&:hover': {
              bgcolor: isActive ? 'sidebar.active' : 'sidebar.hover',
            },
            '&.Mui-selected': {
              bgcolor: 'sidebar.active',
              '&:hover': {
                bgcolor: 'sidebar.active',
              },
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 36,
              color: isActive ? 'sidebar.activeText' : 'sidebar.text',
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
