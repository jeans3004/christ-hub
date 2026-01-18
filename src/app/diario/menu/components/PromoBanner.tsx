/**
 * Banner promocional do menu.
 */

import { Box, Typography, Paper, Button } from '@mui/material';

export function PromoBanner() {
  return (
    <Paper
      sx={{
        p: 3,
        height: '100%',
        minHeight: 200,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 50%, #06B6D4 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.2, mb: 1.5 }}>
          Voce conhece a rotina da escola como ninguem
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
          Participe da pesquisa e compartilhe como sua escola organiza processos e ferramentas administrativas.
        </Typography>
        <Button
          variant="contained"
          sx={{
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.9)',
            },
          }}
        >
          Quero participar
        </Button>
      </Box>

      {/* Decorative elements */}
      <Box
        sx={{
          position: 'absolute',
          right: -20,
          bottom: -20,
          width: 200,
          height: 200,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.1)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          right: 60,
          top: 20,
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'rgba(255,255,255,0.1)',
        }}
      />
    </Paper>
  );
}
