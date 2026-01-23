/**
 * View principal de chamada de Trilhas.
 */

'use client';

import { useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Save as SaveIcon, Warning as ChangesIcon } from '@mui/icons-material';
import { Usuario } from '@/types';
import { useTrilhasLoader, useTrilhasActions } from '../../hooks';
import { AreaCard } from './AreaCard';

interface TrilhasViewProps {
  ano: number;
  dataChamada: string;
  setDataChamada: (data: string) => void;
  professor: Usuario | null;
}

export function TrilhasView({ ano, dataChamada, setDataChamada, professor }: TrilhasViewProps) {
  const { areasDados, loading, error, reload } = useTrilhasLoader({ ano, dataChamada });

  const {
    trilhasState,
    isSaving,
    hasAnyChanges,
    initializeState,
    atualizarPresenca,
    marcarTodosPresentes,
    atualizarConteudo,
    marcarNaoRealizada,
    marcarRealizada,
    salvarTudo,
  } = useTrilhasActions({
    areasDados,
    ano,
    dataChamada,
    professorId: professor?.id || '',
    professorNome: professor?.nome || '',
  });

  // Inicializar estado quando dados carregarem
  useEffect(() => {
    if (areasDados.length > 0) {
      initializeState();
    }
  }, [areasDados, initializeState]);

  // Calcular totais gerais
  const totalAlunos = areasDados.reduce(
    (acc, area) => acc + area.series.reduce((s, serie) => s + serie.alunos.length, 0),
    0
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (totalAlunos === 0) {
    return (
      <Alert severity="info" sx={{ m: 2 }}>
        Nenhum aluno do Ensino Médio encontrado para o ano {ano}.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Chamada de Trilhas
          </Typography>

          <TextField
            type="date"
            size="small"
            value={dataChamada}
            onChange={(e) => setDataChamada(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 160 }}
          />

          <Chip
            label={`${totalAlunos} alunos`}
            size="small"
            color="primary"
            variant="outlined"
          />

          <Box sx={{ flex: 1 }} />

          {hasAnyChanges && (
            <Chip
              icon={<ChangesIcon />}
              label="Alterações não salvas"
              color="warning"
              size="small"
            />
          )}

          <Button
            variant="contained"
            color="primary"
            startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            onClick={salvarTudo}
            disabled={isSaving || !hasAnyChanges}
          >
            Salvar Chamadas
          </Button>
        </Box>
      </Paper>

      {/* Areas */}
      <Box>
        {areasDados.map((area, index) => (
          <AreaCard
            key={area.id}
            area={area}
            state={trilhasState[area.id]}
            defaultExpanded={index === 0}
            onPresencaChange={(serie, alunoId, presente) =>
              atualizarPresenca(area.id, serie, alunoId, presente)
            }
            onMarcarTodos={(serie, presente) =>
              marcarTodosPresentes(area.id, serie, presente)
            }
            onConteudoChange={(serie, conteudo) =>
              atualizarConteudo(area.id, serie, conteudo)
            }
            onNaoRealizada={(serie, observacao) =>
              marcarNaoRealizada(area.id, serie, observacao)
            }
            onRealizada={(serie) =>
              marcarRealizada(area.id, serie)
            }
          />
        ))}
      </Box>
    </Box>
  );
}
