import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FilterState {
  ano: number;
  serieId: string;
  turmaId: string;
  disciplinaId: string;
  mes: string;
  bimestre: number;
  setAno: (ano: number) => void;
  setSerieId: (serieId: string) => void;
  setTurmaId: (turmaId: string) => void;
  setDisciplinaId: (disciplinaId: string) => void;
  setMes: (mes: string) => void;
  setBimestre: (bimestre: number) => void;
  resetFilters: () => void;
}

const currentYear = new Date().getFullYear();

export const useFilterStore = create<FilterState>()(
  persist(
    (set) => ({
      ano: currentYear,
      serieId: '',
      turmaId: '',
      disciplinaId: '',
      mes: '',
      bimestre: 1,
      setAno: (ano) => set({ ano }),
      setSerieId: (serieId) => set({ serieId, turmaId: '', disciplinaId: '' }),
      setTurmaId: (turmaId) => set({ turmaId }),
      setDisciplinaId: (disciplinaId) => set({ disciplinaId }),
      setMes: (mes) => set({ mes }),
      setBimestre: (bimestre) => set({ bimestre }),
      resetFilters: () => set({
        ano: currentYear,
        serieId: '',
        turmaId: '',
        disciplinaId: '',
        mes: '',
        bimestre: 1,
      }),
    }),
    {
      name: 'filter-storage',
    }
  )
);
