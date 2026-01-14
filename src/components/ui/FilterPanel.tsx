'use client';

import { Box, Paper, FormControl, InputLabel, Select, MenuItem, SelectChangeEvent } from '@mui/material';

interface FilterOption {
  value: string | number;
  label: string;
}

interface FilterField {
  id: string;
  label: string;
  value: string | number;
  options: FilterOption[];
  onChange: (value: string) => void;
  fullWidth?: boolean;
}

interface FilterPanelProps {
  filters: FilterField[];
  direction?: 'row' | 'column';
}

export default function FilterPanel({ filters, direction = 'column' }: FilterPanelProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: direction,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        {filters.map((filter) => (
          <FormControl
            key={filter.id}
            size="small"
            sx={{ minWidth: filter.fullWidth ? '100%' : 200 }}
          >
            <InputLabel id={`${filter.id}-label`}>{filter.label}</InputLabel>
            <Select
              labelId={`${filter.id}-label`}
              id={filter.id}
              value={String(filter.value)}
              label={filter.label}
              onChange={(e: SelectChangeEvent) => filter.onChange(e.target.value)}
            >
              {filter.options.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ))}
      </Box>
    </Paper>
  );
}
