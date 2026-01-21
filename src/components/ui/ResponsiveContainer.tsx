'use client';

/**
 * Container responsivo que aplica padding e largura maxima baseados no breakpoint.
 * Usado para envolver conteudo de paginas mantendo consistencia de espacamento.
 */

import { Box, Container, ContainerProps, useTheme, useMediaQuery } from '@mui/material';
import { ReactNode } from 'react';

interface ResponsiveContainerProps extends Omit<ContainerProps, 'maxWidth'> {
  children: ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  disablePadding?: boolean;
  fullHeight?: boolean;
}

export default function ResponsiveContainer({
  children,
  maxWidth = 'lg',
  disablePadding = false,
  fullHeight = false,
  sx,
  ...props
}: ResponsiveContainerProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const getPadding = () => {
    if (disablePadding) return 0;
    if (isMobile) return 2;
    if (isTablet) return 3;
    return 4;
  };

  return (
    <Container
      maxWidth={maxWidth}
      {...props}
      sx={{
        py: getPadding(),
        px: disablePadding ? 0 : { xs: 2, sm: 3, md: 4 },
        minHeight: fullHeight ? 'calc(100vh - 64px)' : undefined,
        ...sx,
      }}
    >
      {children}
    </Container>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  minItemWidth?: number;
  gap?: number;
}

export function ResponsiveGrid({
  children,
  minItemWidth = 280,
  gap = 2,
}: ResponsiveGridProps) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: `repeat(auto-fill, minmax(${minItemWidth}px, 1fr))`,
        },
        gap,
      }}
    >
      {children}
    </Box>
  );
}

interface ResponsiveStackProps {
  children: ReactNode;
  direction?: 'row' | 'column';
  spacing?: number;
  reverseOnMobile?: boolean;
}

export function ResponsiveStack({
  children,
  direction = 'row',
  spacing = 2,
  reverseOnMobile = false,
}: ResponsiveStackProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const mobileDirection = reverseOnMobile ? 'column-reverse' : 'column';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isMobile ? mobileDirection : direction,
        gap: spacing,
        flexWrap: 'wrap',
      }}
    >
      {children}
    </Box>
  );
}
