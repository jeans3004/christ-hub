/**
 * Secao de navegacao do sidebar.
 */

import { Box, List, Typography } from '@mui/material';
import { NavSection as NavSectionType, NavItem as NavItemType } from '@/constants/navigation';
import { NavItem } from './NavItem';

interface NavSectionProps {
  section: NavSectionType;
  items: NavItemType[];
  index: number;
  isLast: boolean;
  openItems: Record<string, boolean>;
  onToggleItem: (label: string) => void;
  onNavigate: (href: string) => void;
  isItemActive: (href?: string) => boolean;
}

export function NavSection({
  section,
  items,
  index,
  isLast,
  openItems,
  onToggleItem,
  onNavigate,
  isItemActive,
}: NavSectionProps) {
  if (items.length === 0) return null;

  return (
    <Box sx={{ mb: 0.5 }}>
      {section.title && (
        <Typography
          variant="overline"
          sx={{
            px: 2,
            pt: index === 0 ? 1.5 : 2,
            pb: 0.75,
            display: 'block',
            color: 'text.disabled',
            fontSize: '0.625rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
          }}
        >
          {section.title}
        </Typography>
      )}
      <List disablePadding sx={{ px: 1 }}>
        {items.map((item) => (
          <NavItem
            key={item.label}
            item={item}
            isActive={isItemActive(item.href)}
            isOpen={openItems[item.label] || false}
            onToggle={() => onToggleItem(item.label)}
            onNavigate={onNavigate}
            openItems={openItems}
            isItemActive={isItemActive}
          />
        ))}
      </List>
    </Box>
  );
}
