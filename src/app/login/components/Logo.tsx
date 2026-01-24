'use client';

/**
 * Logo Luminar para a pagina de login.
 */

import { Box } from '@mui/material';
import Image from 'next/image';

export function Logo() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', mb: 4, pl: 4 }}>
      <Image
        src="/logos/Logo2.svg"
        alt="Luminar"
        width={650}
        height={220}
        priority
        style={{ objectFit: 'contain' }}
      />
    </Box>
  );
}
