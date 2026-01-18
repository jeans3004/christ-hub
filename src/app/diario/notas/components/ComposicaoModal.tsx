/**
 * Modal para exibicao de notas por composicao.
 * As notas sao calculadas automaticamente baseadas nas avaliacoes de rubricas.
 */

import {
  Box,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { ComponenteItem, SummaryBoxes, FormulaDisplay } from './composicao';
import type { ComposicaoModalProps } from './composicao';

export function ComposicaoModal({
  open,
  subNotas,
  saving,
  onClose,
  onSave,
  getTotalValoresMax,
  calcularNotaComposicao,
  gerarFormulaDetalhada,
}: ComposicaoModalProps) {
  const notaCalculada = calcularNotaComposicao();
  const formulaDetalhada = gerarFormulaDetalhada();

  // Verificar se todas as rubricas estao configuradas
  const todasRubricasConfiguradas = formulaDetalhada?.componentes.every(
    (c) => c.rubricas.length > 0
  ) ?? false;

  // Verificar se todas as avaliacoes foram preenchidas
  const todasAvaliacoesPreenchidas = formulaDetalhada?.componentes.every(
    (c) => c.todasRubricasAvaliadas
  ) ?? false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          Notas por Composicao (Calculadas por Rubricas)
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          As notas sao calculadas automaticamente baseadas nas avaliacoes de rubricas.
          Avalie os alunos na aba "Avaliacao por Rubricas" para calcular as notas.
        </Typography>

        {/* Lista de Componentes com detalhes das rubricas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {subNotas.map((subNota) => {
            const componenteFormula = formulaDetalhada?.componentes.find(
              (c) => c.nome === subNota.nome
            );
            return (
              <ComponenteItem
                key={subNota.id}
                subNota={subNota}
                componenteFormula={componenteFormula}
              />
            );
          })}
        </Box>

        {/* Formula Detalhada do Calculo */}
        {subNotas.length > 0 && todasRubricasConfiguradas && (
          <FormulaDisplay gerarFormulaDetalhada={gerarFormulaDetalhada} />
        )}

        {/* Maximo Possivel e Nota Calculada */}
        <SummaryBoxes
          subNotasLength={subNotas.length}
          totalMax={getTotalValoresMax()}
          notaCalculada={notaCalculada}
        />

        {/* Aviso se faltam avaliacoes */}
        {!todasAvaliacoesPreenchidas && todasRubricasConfiguradas && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
            <Typography variant="body2" color="warning.dark">
              Algumas rubricas ainda nao foram avaliadas. Avalie os alunos na aba "Avaliacao por Rubricas".
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={saving} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={subNotas.length === 0 || notaCalculada === null || saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ textTransform: 'none' }}
        >
          {saving ? 'Salvando...' : 'Salvar Nota'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
