/**
 * Funcoes utilitarias para o dossie.
 */

import { Chamada, Rubrica, Disciplina, AvaliacaoRubrica } from '@/types';
import { FrequenciaResumo, AvaliacaoRubricaComDetalhes } from '../types';

export function calcularFrequencia(alunoId: string, chamadas: Chamada[]): FrequenciaResumo {
  let totalAulas = 0;
  let presencas = 0;

  chamadas.forEach((chamada) => {
    const presencaAluno = chamada.presencas.find((p) => p.alunoId === alunoId);
    if (presencaAluno) {
      totalAulas += chamada.tempo;
      if (presencaAluno.presente) {
        presencas += chamada.tempo;
      }
    }
  });

  const faltas = totalAulas - presencas;
  const percentualPresenca = totalAulas > 0 ? (presencas / totalAulas) * 100 : 0;

  return {
    totalAulas,
    presencas,
    faltas,
    percentualPresenca: Math.round(percentualPresenca * 10) / 10,
  };
}

export function enriquecerAvaliacoes(
  avaliacoes: AvaliacaoRubrica[],
  rubricas: Rubrica[],
  disciplinas: Disciplina[]
): AvaliacaoRubricaComDetalhes[] {
  return avaliacoes.map((av) => {
    const rubrica = rubricas.find((r) => r.id === av.rubricaId);
    const disciplina = disciplinas.find((d) => d.id === av.disciplinaId);

    return {
      ...av,
      rubricaNome: rubrica?.nome || 'Rubrica desconhecida',
      disciplinaNome: disciplina?.nome || 'Disciplina desconhecida',
      componenteNome: av.componenteId,
    };
  });
}
