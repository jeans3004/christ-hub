'use client';

/**
 * Item individual do CheckboxSelector.
 */

import { Box, Checkbox, Typography, Tooltip } from '@mui/material';
import { CheckboxSelectorItemProps } from './types';

export function CheckboxSelectorItem({
  option,
  checked,
  onChange,
  disabled = false,
  size = 'medium',
}: CheckboxSelectorItemProps) {
  const isDisabled = disabled || option.disabled;

  const handleClick = () => {
    if (!isDisabled) {
      onChange(option.id, !checked);
    }
  };

  const content = (
    <Box
      onClick={handleClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        p: size === 'small' ? 0.75 : 1,
        borderRadius: 1,
        border: '1px solid',
        borderColor: checked ? 'primary.main' : 'transparent',
        bgcolor: checked ? 'primary.50' : 'transparent',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.15s ease-in-out',
        '&:hover': {
          bgcolor: isDisabled ? undefined : checked ? 'primary.100' : 'action.hover',
        },
      }}
    >
      <Checkbox
        checked={checked}
        disabled={isDisabled}
        size={size}
        sx={{ p: 0.5 }}
        tabIndex={-1}
      />

      {option.icon && (
        <Box sx={{ display: 'flex', color: 'action.active', ml: 0.5 }}>
          {option.icon}
        </Box>
      )}

      <Typography
        variant={size === 'small' ? 'body2' : 'body1'}
        sx={{
          flex: 1,
          fontWeight: checked ? 500 : 400,
          color: isDisabled ? 'text.disabled' : 'text.primary',
        }}
      >
        {option.label}
      </Typography>
    </Box>
  );

  if (option.description) {
    return (
      <Tooltip title={option.description} placement="top" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
}
