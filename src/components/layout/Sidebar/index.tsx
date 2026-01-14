'use client';

/**
 * Sidebar de navegacao do sistema.
 */

import { useState } from 'react';
import { Box, Drawer, Toolbar, useTheme, useMediaQuery } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { NAVIGATION, DRAWER_WIDTH, NavItem, NavSection as NavSectionType } from '@/constants/navigation';
import { RoleBadge } from './RoleBadge';
import { NavSection } from './NavSection';

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen } = useUIStore();
  const { can, hasMinRole } = usePermissions();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const handleToggleItem = (label: string) => {
    setOpenItems((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname === href;
  };

  const canSeeItem = (item: NavItem): boolean => {
    if (item.permission && !can(item.permission)) return false;
    if (item.minRole && !hasMinRole(item.minRole)) return false;
    return true;
  };

  const canSeeSection = (section: NavSectionType): boolean => {
    if (section.minRole && !hasMinRole(section.minRole)) return false;
    return section.items.some((item) => {
      if (!canSeeItem(item)) return false;
      if (item.children) return item.children.some(canSeeItem);
      return true;
    });
  };

  const filterItems = (items: NavItem[]): NavItem[] => {
    return items
      .filter(canSeeItem)
      .map((item) => ({
        ...item,
        children: item.children?.filter(canSeeItem),
      }))
      .filter((item) => !item.children || item.children.length > 0);
  };

  const drawerContent = (
    <Box sx={{ overflow: 'auto', bgcolor: 'sidebar.background', height: '100%' }}>
      <Toolbar />
      <RoleBadge />
      {NAVIGATION.map((section, index) => {
        if (!canSeeSection(section)) return null;
        const filteredItems = filterItems(section.items);
        return (
          <NavSection
            key={index}
            section={section}
            items={filteredItems}
            index={index}
            isLast={index === NAVIGATION.length - 1}
            openItems={openItems}
            onToggleItem={handleToggleItem}
            onNavigate={handleNavigate}
            isItemActive={isActive}
          />
        );
      })}
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            bgcolor: 'sidebar.background',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'sidebar.background',
            borderRight: 1,
            borderColor: 'divider',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
}

export { RoleBadge } from './RoleBadge';
export { NavItem } from './NavItem';
export { NavSection } from './NavSection';
