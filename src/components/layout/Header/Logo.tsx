/**
 * Logo Luminar para o header.
 */

import { Box } from '@mui/material';
import Image from 'next/image';

export function Logo() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Image
        src="/logos/LogoBranca.svg"
        alt="Luminar"
        width={120}
        height={40}
        priority
        style={{ objectFit: 'contain' }}
      />
    </Box>
  );
}
