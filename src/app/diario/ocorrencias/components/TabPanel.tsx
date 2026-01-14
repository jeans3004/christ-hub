/**
 * Componente TabPanel generico.
 */

import { Box } from '@mui/material';
import { TabPanelProps } from '../types';

export function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}
