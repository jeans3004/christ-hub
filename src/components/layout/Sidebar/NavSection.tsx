/**
 * Secao de navegacao do sidebar.
 */

import { Box, List, Typography, Divider } from '@mui/material';
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
    <Box>
      {section.title && (
        <Typography
          variant="overline"
          sx={{
            px: 3,
            py: 1.5,
            display: 'block',
            color: 'sidebar.section',
            fontSize: '0.6875rem',
            fontWeight: 600,
            letterSpacing: '0.08em',
          }}
        >
          {section.title}
        </Typography>
      )}
      <List disablePadding>
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
      {!isLast && section.title && <Divider sx={{ my: 1, mx: 2 }} />}
    </Box>
  );
}
