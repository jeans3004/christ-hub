/**
 * Modal para insercao de notas por composicao.
 */

import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { NotaComposicao } from '@/types';

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

// Helper para determinar cor
const getNotaColorKey = (nota: number | null): 'success' | 'error' | 'neutral' => {
  if (nota === null) return 'neutral';
  return nota >= MEDIA_REFERENCIA ? 'success' : 'error';
};

interface ComponenteFormula {
  nome: string;
  notaMaxima: number;
  nota: number | null;
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
  onValorChange,
  getTotalValoresMax,
  calcularNotaComposicao,
  gerarFormulaDetalhada,
}: ComposicaoModalProps) {
  const notaCalculada = calcularNotaComposicao();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          Inserir Notas por Composição
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Insira a nota de cada componente. A nota final será a soma de todas as notas.
        </Typography>

        {/* Lista de Componentes com campos de nota */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {subNotas.map((subNota) => (
            <Box
              key={subNota.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 2,
              }}
            >
              <Typography sx={{ flex: 1, fontWeight: 500 }}>
                {subNota.nome}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80, textAlign: 'center' }}>
                máx: {subNota.porcentagem}
              </Typography>
              <TextField
                size="small"
                label="Nota"
                value={subNota.valor ?? ''}
                onChange={(e) => onValorChange(subNota.id, e.target.value)}
                inputProps={{
                  style: { textAlign: 'center' },
                  min: 0,
                  max: subNota.porcentagem,
                  step: 0.1,
                }}
                placeholder={`0-${subNota.porcentagem}`}
                sx={{ width: 80 }}
              />
            </Box>
          ))}
        </Box>

        {/* Fórmula Detalhada do Cálculo */}
        {subNotas.length > 0 && (
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
