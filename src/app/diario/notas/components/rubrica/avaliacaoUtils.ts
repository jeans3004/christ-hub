/**
 * Utilitarios para avaliacao de rubricas.
 */

import { templateComposicaoService, avaliacaoRubricaService } from '@/services/firestore';
import { NotaComposicao } from '@/types';
import { RubricasSelecionadas, AvaliacaoInterna } from './types';

/**
 * Carregar avaliacoes do Firestore.
 */
export async function loadAvaliacoes(
  turmaId: string,
  bimestre: number,
  ano: number,
  av: 'av1' | 'av2'
): Promise<AvaliacaoInterna[]> {
  if (!turmaId) return [];

  try {
    const data = await avaliacaoRubricaService.getByTurmaBimestreAv(turmaId, bimestre, ano, av);
    return data.map((a) => ({
      id: a.id,
      alunoId: a.alunoId,
      rubricaId: a.rubricaId,
      componenteId: a.componenteId || '',
      nivel: a.nivel,
    }));
  } catch (err) {
    console.error('Error loading avaliacoes:', err);
    return [];
  }
}

/**
 * Carregar template do Firestore.
 */
export async function loadTemplate(
  turmaId: string,
  disciplinaId: string,
  bimestre: number,
  av: 'av1' | 'av2',
  ano: number
): Promise<{ template: NotaComposicao[]; rubricas: RubricasSelecionadas; firstId: string | false }> {
  if (!turmaId || !disciplinaId) {
    return { template: [], rubricas: {}, firstId: false };
  }

  try {
    const templateData = await templateComposicaoService.getByTurmaDisciplinaBimestreAv(
      turmaId, disciplinaId, bimestre, av, ano
    );

    if (templateData?.componentes) {
      const rubricasCarregadas: RubricasSelecionadas = {};
      templateData.componentes.forEach((comp) => {
        if (comp.rubricaIds && comp.rubricaIds.length > 0) {
          rubricasCarregadas[comp.id] = comp.rubricaIds;
        }
      });
      return {
        template: templateData.componentes,
        rubricas: rubricasCarregadas,
        firstId: templateData.componentes.length > 0 ? templateData.componentes[0].id : false,
      };
    }
    return { template: [], rubricas: {}, firstId: false };
  } catch (error) {
    console.error('Error loading template:', error);
    return { template: [], rubricas: {}, firstId: false };
  }
}

/**
 * Salvar selecao de rubricas.
 */
export async function saveRubricaSelection(
  turmaId: string,
  disciplinaId: string,
  bimestre: number,
  av: 'av1' | 'av2',
  ano: number,
  template: NotaComposicao[]
): Promise<void> {
  await templateComposicaoService.save(turmaId, disciplinaId, bimestre, av, ano, template);
}
