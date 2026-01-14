/**
 * Tipos locais para o modulo de chamada.
 */

/**
 * Cores para avatares dos alunos.
 */
export const AVATAR_COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#9C27B0', // Purple
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#00BCD4', // Cyan
  '#FF5722', // Deep Orange
  '#3F51B5', // Indigo
];

/**
 * Retorna uma cor de avatar baseada no indice.
 */
export function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}
