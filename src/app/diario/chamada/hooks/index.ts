/**
 * Hooks do modulo de chamada.
 */

export { useChamadaData } from './useChamadaData';
export { useAlunosDisciplinaConfig } from './useAlunosDisciplinaConfig';
export { usePreparatorioLoader } from './usePreparatorioLoader';

// Trilhas
export { useTrilhasLoader } from './useTrilhasLoader';
export type { AreaData, SerieData, AlunoTrilha } from './useTrilhasLoader';
export { useTrilhasActions } from './useTrilhasActions';
export type { SerieState, TrilhasState } from './useTrilhasActions';

// Importacao de Areas
export { useImportAreas } from './useImportAreas';
