/**
 * Modal para exibição de notas por composição.
 * As notas são calculadas automaticamente baseadas nas avaliações de rubricas.
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
  Chip,
} from '@mui/material';
import { Close, CheckCircle, Warning } from '@mui/icons-material';
import { NotaComposicao, NivelRubrica } from '@/types';

// Constante da media de referencia
const MEDIA_REFERENCIA = 6.0;

// Cores para cada estado baseado na media
const NOTA_COLORS = {
  success: {
    bg: 'rgba(76, 175, 80, 0.2)',
    border: '#4CAF50',
    text: '#2E7D32',
  },
  error: {
    bg: 'rgba(244, 67, 54, 0.2)',
    border: '#F44336',
    text: '#C62828',
  },
  neutral: {
    bg: 'grey.200',
    border: 'grey.400',
    text: 'grey.600',
  },
};

// Cores para cada nivel de rubrica
const NIVEL_COLORS: Record<NivelRubrica, { bg: string; text: string; border: string }> = {
  A: { bg: 'rgba(76, 175, 80, 0.15)', text: '#2E7D32', border: '#4CAF50' },
  B: { bg: 'rgba(33, 150, 243, 0.15)', text: '#1565C0', border: '#2196F3' },
  C: { bg: 'rgba(255, 193, 7, 0.15)', text: '#F57F17', border: '#FFC107' },
  D: { bg: 'rgba(255, 152, 0, 0.15)', text: '#E65100', border: '#FF9800' },
  E: { bg: 'rgba(244, 67, 54, 0.15)', text: '#C62828', border: '#F44336' },
};

// Porcentagens para exibição
const NIVEL_PERCENTUAL: Record<NivelRubrica, number> = {
  A: 100,
  B: 80,
  C: 60,
  D: 40,
  E: 20,
};

// Helper para determinar cor
const getNotaColorKey = (nota: number | null): 'success' | 'error' | 'neutral' => {
  if (nota === null) return 'neutral';
  return nota >= MEDIA_REFERENCIA ? 'success' : 'error';
};

interface RubricaDetalhe {
  rubricaId: string;
  rubricaNome: string;
  nivel: NivelRubrica | null;
  valorMaximo: number;
  valorCalculado: number | null;
}

interface ComponenteFormula {
  nome: string;
  notaMaxima: number;
  nota: number | null;
  rubricas: RubricaDetalhe[];
  todasRubricasAvaliadas: boolean;
}

interface FormulaDetalhada {
  componentes: ComponenteFormula[];
  todasPreenchidas: boolean;
  somaMaximas: number;
  somaNotas: number | null;
}

interface ComposicaoModalProps {
  open: boolean;
  subNotas: NotaComposicao[];
  saving: boolean;
  onClose: () => void;
  onSave: () => Promise<void>;
  onValorChange: (id: string, value: string) => void;
  getTotalValoresMax: () => number;
  calcularNotaComposicao: () => number | null;
  gerarFormulaDetalhada: () => FormulaDetalhada | null;
}

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

  // Verificar se todas as rubricas estão configuradas
  const todasRubricasConfiguradas = formulaDetalhada?.componentes.every(
    c => c.rubricas.length > 0
  ) ?? false;

  // Verificar se todas as avaliações foram preenchidas
  const todasAvaliacoesPreenchidas = formulaDetalhada?.componentes.every(
    c => c.todasRubricasAvaliadas
  ) ?? false;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          Notas por Composição (Calculadas por Rubricas)
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          As notas são calculadas automaticamente baseadas nas avaliações de rubricas.
          Avalie os alunos na aba "Avaliação por Rubricas" para calcular as notas.
        </Typography>

        {/* Lista de Componentes com detalhes das rubricas */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {subNotas.map((subNota) => {
            const componenteFormula = formulaDetalhada?.componentes.find(
              c => c.nome === subNota.nome
            );
            const rubricas = componenteFormula?.rubricas || [];
            const temRubricas = rubricas.length > 0;
            const todasAvaliadas = componenteFormula?.todasRubricasAvaliadas ?? false;

            return (
              <Box
                key={subNota.id}
                sx={{
                  p: 2,
                  bgcolor: 'grey.50',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: todasAvaliadas ? 'success.main' : temRubricas ? 'warning.main' : 'grey.300',
                }}
              >
                {/* Cabeçalho do componente */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: temRubricas ? 2 : 0 }}>
                  <Typography sx={{ flex: 1, fontWeight: 600 }}>
                    {subNota.nome}
                  </Typography>
                  <Chip
                    label={`máx: ${subNota.porcentagem}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {todasAvaliadas ? (
                    <Chip
                      icon={<CheckCircle />}
                      label={subNota.valor ?? '-'}
                      size="small"
                      color="success"
                    />
                  ) : (
                    <Chip
                      icon={<Warning />}
                      label="Pendente"
                      size="small"
                      color="warning"
                    />
                  )}
                </Box>

                {/* Detalhes das rubricas */}
                {temRubricas ? (
                  <Box sx={{ pl: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {rubricas.map((rubrica) => {
                      const nivelColors = rubrica.nivel ? NIVEL_COLORS[rubrica.nivel] : null;
                      return (
                        <Box
                          key={rubrica.rubricaId}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 1,
                            bgcolor: 'white',
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'grey.200',
                          }}
                        >
                          <Typography variant="body2" sx={{ flex: 1 }}>
                            {rubrica.rubricaNome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            máx: {rubrica.valorMaximo.toFixed(2)}
                          </Typography>
                          {rubrica.nivel ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: nivelColors?.bg,
                                border: '1px solid',
                                borderColor: nivelColors?.border,
                              }}
                            >
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{ color: nivelColors?.text }}
                              >
                                {rubrica.nivel}
                              </Typography>
                              <Typography variant="caption" sx={{ color: nivelColors?.text }}>
                                ({NIVEL_PERCENTUAL[rubrica.nivel]}%)
                              </Typography>
                              <Typography variant="body2" fontWeight={600}>
                                = {rubrica.valorCalculado?.toFixed(2)}
                              </Typography>
                            </Box>
                          ) : (
                            <Chip
                              label="Não avaliada"
                              size="small"
                              variant="outlined"
                              color="warning"
                            />
                          )}
                        </Box>
                      );
                    })}
                  </Box>
                ) : (
                  <Typography variant="body2" color="warning.main" sx={{ pl: 2, fontStyle: 'italic' }}>
                    Nenhuma rubrica configurada. Configure na aba "Avaliação por Rubricas".
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>

        {/* Fórmula Detalhada do Cálculo */}
        {subNotas.length > 0 && todasRubricasConfiguradas && (
          <FormulaDisplay gerarFormulaDetalhada={gerarFormulaDetalhada} />
        )}

        {/* Máximo Possível e Nota Calculada */}
        {(() => {
          const colorKey = getNotaColorKey(notaCalculada);
          const colors = NOTA_COLORS[colorKey];
          return (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  bgcolor: subNotas.length > 0 ? 'primary.light' : 'grey.200',
                  borderRadius: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography fontWeight={600} color={subNotas.length > 0 ? 'primary.dark' : 'grey.600'}>
                  Máximo:
                </Typography>
                <Typography variant="h6" fontWeight={700} color={subNotas.length > 0 ? 'primary.dark' : 'grey.600'}>
                  {getTotalValoresMax()}
                </Typography>
              </Box>
              <Box
                sx={{
                  flex: 1,
                  p: 2,
                  bgcolor: colors.bg,
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: colors.border,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography fontWeight={600} sx={{ color: colors.text }}>
                  Nota Final:
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: colors.text }}>
                  {notaCalculada ?? '-'}
                </Typography>
              </Box>
            </Box>
          );
        })()}

        {/* Aviso se faltam avaliações */}
        {!todasAvaliacoesPreenchidas && todasRubricasConfiguradas && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'warning.light', borderRadius: 2 }}>
            <Typography variant="body2" color="warning.dark">
              Algumas rubricas ainda não foram avaliadas. Avalie os alunos na aba "Avaliação por Rubricas".
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

/**
 * Componente interno para exibir a formula detalhada.
 */
function FormulaDisplay({
  gerarFormulaDetalhada,
}: {
  gerarFormulaDetalhada: () => FormulaDetalhada | null;
}) {
  const dados = gerarFormulaDetalhada();
  if (!dados) return null;

  const { componentes, todasPreenchidas, somaMaximas, somaNotas } = dados;

  return (
    <Box
      sx={{
        p: 2,
        mb: 2,
        bgcolor: '#fafafa',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'grey.300',
      }}
    >
      {/* Título */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
        Demonstração do Cálculo
      </Typography>

      {/* Explicação da fórmula geral */}
      <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          Fórmula (soma das notas):
        </Typography>
        <Typography sx={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.1rem', textAlign: 'center' }}>
          Nota Final = N₁ + N₂ + ... + Nₙ
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
          A nota final é a soma das notas de cada componente (máximo possível: {somaMaximas})
        </Typography>
      </Box>

      {/* Notas de cada componente */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          1. Nota de cada componente:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {componentes.map((c, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                bgcolor: 'white',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
                fontFamily: 'monospace',
                fontSize: '0.8rem',
              }}
            >
              <span style={{ color: '#666', flex: 1 }}>{c.nome}</span>
              <span style={{ color: '#999', fontSize: '0.75rem' }}>máx: {c.notaMaxima}</span>
              <span style={{ marginLeft: 8 }}>→</span>
              <strong style={{
                color: c.nota !== null ? '#1976d2' : '#999',
                minWidth: 30,
                textAlign: 'right'
              }}>
                {c.nota !== null ? c.nota : '?'}
              </strong>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Soma final */}
      {(() => {
        const colorKey = getNotaColorKey(somaNotas);
        const colors = NOTA_COLORS[colorKey];
        return (
          <Box sx={{ mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              2. Nota Final (soma):
            </Typography>
            <Box
              sx={{
                p: 1.5,
                bgcolor: colors.bg,
                borderRadius: 1,
                border: '2px solid',
                borderColor: colors.border,
              }}
            >
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.9rem', textAlign: 'center' }}>
                {componentes.map((c, i) => (
                  <span key={i}>
                    {i > 0 && ' + '}
                    {c.nota !== null ? c.nota : '?'}
                  </span>
                ))}
                {' = '}
                <strong style={{
                  fontSize: '1.1rem',
                  color: typeof colors.text === 'string' && colors.text.startsWith('#') ? colors.text : undefined,
                }}>
                  {somaNotas !== null ? somaNotas : '?'}
                </strong>
              </Typography>
            </Box>
          </Box>
        );
      })()}

      {/* Legenda */}
      {!todasPreenchidas && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
          * Preencha todas as notas para ver o resultado
        </Typography>
      )}
    </Box>
  );
}
