/**
 * Constantes para tabela de notas.
 */

/**
 * Media de referencia para aprovacao.
 */
export const MEDIA_REFERENCIA = 6.0;

/**
 * Determina cor baseada na nota.
 */
export const getNotaColor = (nota: number | null | undefined): 'success' | 'error' | 'neutral' => {
  if (nota === null || nota === undefined) return 'neutral';
  return nota >= MEDIA_REFERENCIA ? 'success' : 'error';
};

/**
 * Cores para cada estado de nota.
 */
export const NOTA_COLORS = {
  success: {
    bg: 'rgba(76, 175, 80, 0.15)',
    bgHover: 'rgba(76, 175, 80, 0.25)',
    border: '#4CAF50',
    text: '#2E7D32',
  },
  error: {
    bg: 'rgba(244, 67, 54, 0.15)',
    bgHover: 'rgba(244, 67, 54, 0.25)',
    border: '#F44336',
    text: '#C62828',
  },
  neutral: {
    bg: 'grey.100',
    bgHover: 'grey.200',
    border: 'grey.400',
    text: 'text.secondary',
  },
};
