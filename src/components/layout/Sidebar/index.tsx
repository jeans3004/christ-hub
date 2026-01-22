'use client';

/**
 * Sidebar de navegacao do sistema com suporte a 3 modos:
 * - expanded: largura completa (260px), icones + texto
 * - collapsed: largura reduzida (72px), apenas icones com tooltips
 * - hidden: oculto totalmente
 */

import { useState, useMemo } from 'react';
import { Box, Drawer, Toolbar, Tooltip, useTheme, useMediaQuery } from '@mui/material';
import { useRouter, usePathname } from 'next/navigation';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import {
  NAVIGATION,
  DRAWER_WIDTH,
  DRAWER_WIDTH_COLLAPSED,
  NavItem,
  NavSection as NavSectionType,
} from '@/constants/navigation';
import { RoleBadge } from './RoleBadge';
import { NavSection } from './NavSection';
import { NavItemCollapsed } from './NavItemCollapsed';

export default function Sidebar() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, sidebarMode } = useUIStore();
  const { can, hasMinRole } = usePermissions();
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const isCollapsed = sidebarMode === 'collapsed' && !isMobile;
  const currentWidth = isCollapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;

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

  // Flatten items for collapsed mode
  const flattenedItems = useMemo(() => {
    const items: NavItem[] = [];
    NAVIGATION.forEach((section) => {
      if (!canSeeSection(section)) return;
      const filteredItems = filterItems(section.items);
      filteredItems.forEach((item) => {
        items.push(item);
        if (item.children) {
          item.children.forEach((child) => items.push(child));
        }
      });
    });
    return items;
  }, [pathname]);

  const drawerContent = (
    <Box sx={{ overflow: 'auto', bgcolor: 'sidebar.background', height: '100%' }}>
      <Toolbar />
      {!isCollapsed && <RoleBadge />}
      {isCollapsed ? (
        // Modo collapsed: apenas icones com tooltips
        <Box sx={{ pt: 0 }}>
          {flattenedItems.map((item, index) => (
            <NavItemCollapsed
              key={`${item.label}-${index}`}
              item={item}
              isActive={isActive(item.href)}
              onNavigate={handleNavigate}
            />
          ))}
        </Box>
      ) : (
        // Modo expanded: layout completo
        NAVIGATION.map((section, index) => {
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
        })
      )}
    </Box>
  );

  // Mobile: sempre usa drawer temporario
  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            bgcolor: 'sidebar.background',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  // Desktop: hidden mode
  if (sidebarMode === 'hidden') {
    return null;
  }

  // Desktop: expanded ou collapsed
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: currentWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          bgcolor: 'sidebar.background',
          borderRight: 1,
          borderColor: 'divider',
          overflowX: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { RoleBadge } from './RoleBadge';
export { NavItem } from './NavItem';
export { NavSection } from './NavSection';
export { NavItemCollapsed } from './NavItemCollapsed';
