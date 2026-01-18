/**
 * Exibicao da formula detalhada de calculo.
 */

import { Box, Typography } from '@mui/material';
import { getNotaColor, NOTA_COLORS } from '../table/constants';
import type { FormulaDisplayProps } from './types';

export function FormulaDisplay({ gerarFormulaDetalhada }: FormulaDisplayProps) {
  const dados = gerarFormulaDetalhada();
  if (!dados) return null;

  const { componentes, todasPreenchidas, somaMaximas, somaNotas } = dados;
  const colorKey = getNotaColor(somaNotas);
  const colors = NOTA_COLORS[colorKey];

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
      {/* Titulo */}
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
        Demonstracao do Calculo
      </Typography>

      {/* Explicacao da formula geral */}
      <FormulaExplanation somaMaximas={somaMaximas} />

      {/* Notas de cada componente */}
      <ComponentesNotas componentes={componentes} />

      {/* Soma final */}
      <SomaFinal componentes={componentes} somaNotas={somaNotas} colors={colors} />

      {/* Legenda */}
      {!todasPreenchidas && (
        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
          * Preencha todas as notas para ver o resultado
        </Typography>
      )}
    </Box>
  );
}

function FormulaExplanation({ somaMaximas }: { somaMaximas: number }) {
  return (
    <Box sx={{ mb: 2, p: 1.5, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Formula (soma das notas):
      </Typography>
      <Typography sx={{ fontFamily: 'serif', fontStyle: 'italic', fontSize: '1.1rem', textAlign: 'center' }}>
        Nota Final = N1 + N2 + ... + Nn
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
        A nota final e a soma das notas de cada componente (maximo possivel: {somaMaximas})
      </Typography>
    </Box>
  );
}

function ComponentesNotas({ componentes }: { componentes: { nome: string; notaMaxima: number; nota: number | null }[] }) {
  return (
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
            <span style={{ color: '#999', fontSize: '0.75rem' }}>max: {c.notaMaxima}</span>
            <span style={{ marginLeft: 8 }}>→</span>
            <strong style={{ color: c.nota !== null ? '#1976d2' : '#999', minWidth: 30, textAlign: 'right' }}>
              {c.nota !== null ? c.nota : '?'}
            </strong>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function SomaFinal({
  componentes,
  somaNotas,
  colors,
}: {
  componentes: { nota: number | null }[];
  somaNotas: number | null;
  colors: { bg: string; border: string; text: string };
}) {
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
          <strong
            style={{
              fontSize: '1.1rem',
              color: typeof colors.text === 'string' && colors.text.startsWith('#') ? colors.text : undefined,
            }}
          >
            {somaNotas !== null ? somaNotas : '?'}
          </strong>
        </Typography>
      </Box>
    </Box>
  );
}
