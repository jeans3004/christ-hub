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
  observacoes: Record<string, string>;
  conteudo: string;
  setConteudo: React.Dispatch<React.SetStateAction<string>>;
  loading: boolean;
  saving: boolean;
  totalPresentes: number;
  totalAusentes: number;
  handlePresencaChange: (alunoId: string) => void;
  handleObservacaoChange: (alunoId: string, observacao: string) => void;
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
  const [observacoes, setObservacoes] = useState<Record<string, string>>({});
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
        const chamadas = await chamadaService.getByTurmaData(serieId, new Date(dataChamada + 'T12:00:00'));
        const chamada = chamadas.find(c => c.disciplinaId === disciplinaId);

        if (chamada) {
          const loadedPresencas: Record<string, boolean> = {};
          const loadedObservacoes: Record<string, string> = {};
          chamada.presencas.forEach(p => {
            loadedPresencas[p.alunoId] = p.presente;
            if (p.justificativa) {
              loadedObservacoes[p.alunoId] = p.justificativa;
            }
          });
          setPresencas(loadedPresencas);
          setObservacoes(loadedObservacoes);
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

  const handleObservacaoChange = useCallback((alunoId: string, observacao: string) => {
    setObservacoes(prev => {
      if (observacao.trim() === '') {
        const updated = { ...prev };
        delete updated[alunoId];
        return updated;
      }
      return { ...prev, [alunoId]: observacao };
    });
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
      const presencasList: PresencaAluno[] = alunos.map(aluno => {
        const presenca: PresencaAluno = {
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          presente: presencas[aluno.id] ?? true,
        };
        // Só adiciona justificativa se existir (Firestore não aceita undefined)
        if (observacoes[aluno.id]) {
          presenca.justificativa = observacoes[aluno.id];
        }
        return presenca;
      });

      // Check if chamada already exists
      const chamadas = await chamadaService.getByTurmaData(serieId, new Date(dataChamada));
      const existingChamada = chamadas.find(c => c.disciplinaId === disciplinaId);

      // Dados base da chamada (sem campos undefined)
      const chamadaData: {
        presencas: PresencaAluno[];
        conteudo?: string;
        turmaId?: string;
        disciplinaId?: string;
        professorId?: string;
        data?: Date;
        tempo?: 1 | 2;
      } = {
        presencas: presencasList,
      };

      // Só adiciona conteudo se existir
      if (conteudo && conteudo.trim()) {
        chamadaData.conteudo = conteudo;
      }

      if (existingChamada) {
        await chamadaService.update(existingChamada.id, chamadaData);
      } else {
        // Usar T12:00:00 para evitar problemas de timezone
        await chamadaService.create({
          turmaId: serieId,
          disciplinaId,
          professorId: usuario.id,
          data: new Date(dataChamada + 'T12:00:00'),
          tempo: 1,
          ...chamadaData,
        });
      }

      addToast('Chamada salva com sucesso!', 'success');
    } catch (error) {
      console.error('Error saving chamada:', error);
      addToast('Erro ao salvar chamada', 'error');
    } finally {
      setSaving(false);
    }
  }, [serieId, disciplinaId, usuario, alunos, presencas, observacoes, dataChamada, conteudo, addToast]);

  const totalPresentes = Object.values(presencas).filter(Boolean).length;
  const totalAusentes = alunos.length - totalPresentes;

  return {
    presencas,
    setPresencas,
    observacoes,
    conteudo,
    setConteudo,
    loading,
    saving,
    totalPresentes,
    totalAusentes,
    handlePresencaChange,
    handleObservacaoChange,
    handleMarcarTodos,
    handleSaveChamada,
  };
}
