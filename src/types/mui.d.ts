/**
 * Declaracoes de tipo para cores customizadas do MUI.
 * Material Design 3 tokens para o Luminar Design System.
 */

import '@mui/material/styles';

interface CustomPaletteColor {
  main: string;
  light?: string;
  dark?: string;
  contrastText?: string;
}

interface HeaderColor {
  background: string;
  text: string;
}

interface SidebarPalette {
  background: string;
  text: string;
  active: string;
  activeText: string;
  hover: string;
  section: string;
}

declare module '@mui/material/styles' {
  interface Palette {
    outline: CustomPaletteColor;
    onSurface: CustomPaletteColor;
    surfaceContainerLow: CustomPaletteColor;
    primaryContainer: CustomPaletteColor;
    onPrimaryContainer: CustomPaletteColor;
    header: HeaderColor;
    sidebar: SidebarPalette;
  }
  interface PaletteOptions {
    outline?: CustomPaletteColor;
    onSurface?: CustomPaletteColor;
    surfaceContainerLow?: CustomPaletteColor;
    primaryContainer?: CustomPaletteColor;
    onPrimaryContainer?: CustomPaletteColor;
    header?: HeaderColor;
    sidebar?: SidebarPalette;
  }
}
