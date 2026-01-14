/**
 * Hook para gerenciamento de dados de chamada.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { chamadaService } from '@/services/firestore';
import { Aluno, PresencaAluno } from '@/types';

interface UseChamadaDataParams {
  serieId: string;
  disciplinaId: string;
  dataChamada: string;
  alunos: Aluno[];
}

interface UseChamadaDataReturn {
  presencas: Record<string, boolean>;
  setPresencas: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  conteudo: string;
  setConteudo: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  saving: boolean;
  totalPresentes: number;
  totalAusentes: number;
  handlePresencaChange: (alunoId: string) => void;
  handleMarcarTodos: (presente: boolean) => void;
  handleSaveChamada: () => Promise<void>;
}

export function useChamadaData({
  serieId,
  disciplinaId,
  dataChamada,
  alunos,
}: UseChamadaDataParams): UseChamadaDataReturn {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();

  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [conteudo, setConteudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initialize presencas when alunos change
  useEffect(() => {
    if (alunos.length > 0) {
      const initialPresencas: Record<string, boolean> = {};
      alunos.forEach(a => { initialPresencas[a.id] = true; });
      setPresencas(initialPresencas);
    } else {
      setPresencas({});
    }
  }, [alunos]);

  // Load existing chamada when filters change
  useEffect(() => {
    const loadChamada = async () => {
      if (!serieId || !disciplinaId || !dataChamada) return;

      setLoading(true);
      try {
        const chamadas = await chamadaService.getByTurmaData(serieId, new Date(dataChamada));
        const chamada = chamadas.find(c => c.disciplinaId === disciplinaId);

        if (chamada) {
          const loadedPresencas: Record<string, boolean> = {};
          chamada.presencas.forEach(p => {
            loadedPresencas[p.alunoId] = p.presente;
          });
          setPresencas(loadedPresencas);
          setConteudo(chamada.conteudo || '');
        }
      } catch (error) {
        console.error('Error loading chamada:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChamada();
  }, [serieId, disciplinaId, dataChamada]);

  const handlePresencaChange = useCallback((alunoId: string) => {
    setPresencas(prev => ({ ...prev, [alunoId]: !prev[alunoId] }));
  }, []);

  const handleMarcarTodos = useCallback((presente: boolean) => {
    const novasPresencas: Record<string, boolean> = {};
    alunos.forEach(a => { novasPresencas[a.id] = presente; });
    setPresencas(novasPresencas);
  }, [alunos]);

  const handleSaveChamada = useCallback(async () => {
    if (!serieId || !disciplinaId || !usuario) {
      addToast('Selecione turma e disciplina', 'error');
      return;
    }

    setSaving(true);
    try {
      const presencasList: PresencaAluno[] = alunos.map(aluno => ({
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        presente: presencas[aluno.id] ?? true,
      }));

      // Check if chamada already exists
      const chamadas = await chamadaService.getByTurmaData(serieId, new Date(dataChamada));
      const existingChamada = chamadas.find(c => c.disciplinaId === disciplinaId);

      if (existingChamada) {
        await chamadaService.update(existingChamada.id, {
          presencas: presencasList,
          conteudo,
        });
      } else {
        await chamadaService.create({
          turmaId: serieId,
          disciplinaId,
          professorId: usuario.id,
          data: new Date(dataChamada),
          tempo: 1,
          presencas: presencasList,
          conteudo,
        });
      }

      addToast('Chamada salva com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving chamada:', error);
      addToast('Erro ao salvar chamada', 'error');
    } finally {
      setSaving(false);
    }
  }, [serieId, disciplinaId, usuario, alunos, presencas, dataChamada, conteudo, addToast]);

  const totalPresentes = Object.values(presencas).filter(Boolean).length;
  const totalAusentes = alunos.length - totalPresentes;

  return {
    presencas,
    setPresencas,
    conteudo,
    setConteudo,
    loading,
    saving,
    totalPresentes,
    totalAusentes,
    handlePresencaChange,
    handleMarcarTodos,
    handleSaveChamada,
  };
}
