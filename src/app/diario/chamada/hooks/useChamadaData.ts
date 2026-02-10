/**
 * Hook para gerenciamento de dados de chamada.
 */

import { useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { chamadaService } from '@/services/firestore';
import { Aluno, PresencaAluno, Turno } from '@/types';

/**
 * Calcula o tempo (período) da aula baseado no horário atual e turno.
 *
 * Manhã: 1º 7:00, 2º 7:45, 3º 8:30, 4º 9:15, 5º 10:00, 6º 10:45, 7º 11:30 (45 min)
 * Tarde: 1º 13:00, 2º 13:45, 3º 14:30, 4º 15:15, 5º 16:00, 6º 16:45, 7º 17:30 (45 min)
 * Sexta tarde: 1º 13:00, 2º 13:35, 3º 14:10, 4º 14:45, 5º 15:20, 6º 15:55, 7º 16:30 (35 min)
 */
function calcularTempo(turno?: Turno): number {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const dayOfWeek = now.getDay(); // 0 = domingo, 5 = sexta

  if (turno === 'Matutino') {
    // Manhã: aulas de 45 minutos começando às 7:00
    const horarios = [
      7 * 60,        // 1º tempo: 7:00
      7 * 60 + 45,   // 2º tempo: 7:45
      8 * 60 + 30,   // 3º tempo: 8:30
      9 * 60 + 15,   // 4º tempo: 9:15
      10 * 60,       // 5º tempo: 10:00
      10 * 60 + 45,  // 6º tempo: 10:45
      11 * 60 + 30,  // 7º tempo: 11:30
    ];

    for (let i = horarios.length - 1; i >= 0; i--) {
      if (totalMinutes >= horarios[i]) {
        return i + 1;
      }
    }
    return 1;
  } else if (turno === 'Vespertino') {
    // Sexta-feira: aulas de 35 minutos
    if (dayOfWeek === 5) {
      const horarios = [
        13 * 60,       // 1º tempo: 13:00
        13 * 60 + 35,  // 2º tempo: 13:35
        14 * 60 + 10,  // 3º tempo: 14:10
        14 * 60 + 45,  // 4º tempo: 14:45
        15 * 60 + 20,  // 5º tempo: 15:20
        15 * 60 + 55,  // 6º tempo: 15:55
        16 * 60 + 30,  // 7º tempo: 16:30
      ];

      for (let i = horarios.length - 1; i >= 0; i--) {
        if (totalMinutes >= horarios[i]) {
          return i + 1;
        }
      }
      return 1;
    } else {
      // Outros dias: aulas de 45 minutos
      const horarios = [
        13 * 60,       // 1º tempo: 13:00
        13 * 60 + 45,  // 2º tempo: 13:45
        14 * 60 + 30,  // 3º tempo: 14:30
        15 * 60 + 15,  // 4º tempo: 15:15
        16 * 60,       // 5º tempo: 16:00
        16 * 60 + 45,  // 6º tempo: 16:45
        17 * 60 + 30,  // 7º tempo: 17:30
      ];

      for (let i = horarios.length - 1; i >= 0; i--) {
        if (totalMinutes >= horarios[i]) {
          return i + 1;
        }
      }
      return 1;
    }
  }

  // Fallback: detectar pelo horário atual
  if (totalMinutes >= 13 * 60) {
    return Math.min(7, Math.floor((totalMinutes - 13 * 60) / 45) + 1);
  } else if (totalMinutes >= 7 * 60) {
    return Math.min(7, Math.floor((totalMinutes - 7 * 60) / 45) + 1);
  }

  return 1;
}

interface UseChamadaDataParams {
  serieId: string;
  disciplinaId: string;
  dataChamada: string;
  alunos: Aluno[];
  turno?: Turno;
  atrasadosIds?: string[]; // IDs dos alunos atrasados (bloqueados como ausente no 1o tempo)
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
  turno,
  atrasadosIds = [],
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
        const tempoAtual = calcularTempo(turno);
        const chamada = chamadas.find(c => c.disciplinaId === disciplinaId && c.tempo === tempoAtual);

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
  }, [serieId, disciplinaId, dataChamada, turno]);

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
      const atrasadosSet = new Set(atrasadosIds);
      const presencasList: PresencaAluno[] = alunos.map(aluno => {
        // Atrasados sao salvos como ausentes
        const estaAtrasado = atrasadosSet.has(aluno.id);
        const presenca: PresencaAluno = {
          alunoId: aluno.id,
          alunoNome: aluno.nome,
          presente: estaAtrasado ? false : (presencas[aluno.id] ?? true),
        };
        // Justificativa automatica para atrasados
        if (estaAtrasado && !observacoes[aluno.id]) {
          presenca.justificativa = 'Chegada atrasada';
        }
        // Só adiciona justificativa se existir (Firestore não aceita undefined)
        if (observacoes[aluno.id]) {
          presenca.justificativa = observacoes[aluno.id];
        }
        return presenca;
      });

      // Calcular tempo baseado no horario atual e turno da turma
      const tempoCalculado = calcularTempo(turno) as 1 | 2 | 3 | 4 | 5 | 6 | 7;

      // Check if chamada already exists (usar T12:00:00 para evitar problemas de timezone)
      const chamadas = await chamadaService.getByTurmaData(serieId, new Date(dataChamada + 'T12:00:00'));
      const existingChamada = chamadas.find(c => c.disciplinaId === disciplinaId && c.tempo === tempoCalculado);

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
          tempo: tempoCalculado,
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
  }, [serieId, disciplinaId, usuario, alunos, presencas, observacoes, dataChamada, conteudo, turno, atrasadosIds, addToast]);

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
