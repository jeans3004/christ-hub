/**
 * Tipos para o componente CheckboxSelector.
 */

import { ReactNode } from 'react';

export interface CheckboxOption<T = unknown> {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  group?: string;
  icon?: ReactNode;
  data?: T;
}

export interface CheckboxSelectorProps<T = unknown> {
  options: CheckboxOption<T>[];
  selected: string[];
  onChange: (selected: string[]) => void;

  // Layout
  columns?: 1 | 2 | 3 | 4;
  maxHeight?: number | string;

  // Recursos
  searchable?: boolean;
  searchPlaceholder?: string;
  showSelectAll?: boolean;
  showCounter?: boolean;
  groupBy?: boolean;

  // Estados
  loading?: boolean;
  error?: string;
  disabled?: boolean;

  // Aparencia
  variant?: 'outlined' | 'filled';
  size?: 'small' | 'medium';

  // Validacao
  minSelection?: number;
  maxSelection?: number;
  helperText?: string;
}

export interface CheckboxSelectorItemProps {
  option: CheckboxOption;
  checked: boolean;
  onChange: (id: string, checked: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
}

export interface CheckboxSelectorGroupProps {
  title: string;
  options: CheckboxOption[];
  selected: string[];
  onChange: (id: string, checked: boolean) => void;
  columns: number;
  disabled?: boolean;
  size?: 'small' | 'medium';
}
