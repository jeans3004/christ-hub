/**
 * Seletor de rubricas para um componente da composicao.
 * Agrupa rubricas por: Minhas Rubricas, Colegiado, Outros Professores.
 * Por padrao mostra apenas rubricas do usuario atual e do colegiado.
 */

import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  Chip,
  Collapse,
  Button,
} from '@mui/material';
import { ExpandMore, ExpandLess, Person, Groups, PersonOutline } from '@mui/icons-material';
import { Rubrica } from '@/types';
import { RubricaSelectorProps } from './types';

interface GrupoRubricas {
  titulo: string;
  icone: React.ReactNode;
  rubricas: Rubrica[];
  cor: string;
}

export function RubricaSelector({
  componenteId,
  qtdNecessarias,
  rubricas,
  rubricasSelecionadas,
  onToggle,
  usuarioId,
}: RubricaSelectorProps) {
  const [mostrarOutras, setMostrarOutras] = useState(false);

  // Agrupar rubricas por categoria
  const grupos = useMemo((): GrupoRubricas[] => {
    const minhas: Rubrica[] = [];
    const colegiado: Rubrica[] = [];
    const outras: Rubrica[] = [];

    rubricas.forEach((r) => {
      if (r.tipo === 'geral' || !r.tipo) {
        colegiado.push(r);
      } else if (r.criadorId === usuarioId) {
        minhas.push(r);
      } else {
        outras.push(r);
      }
    });

    const resultado: GrupoRubricas[] = [];

    if (minhas.length > 0) {
      resultado.push({
        titulo: 'Minhas Rubricas',
        icone: <Person fontSize="small" />,
        rubricas: minhas,
        cor: 'primary.main',
      });
    }

    if (colegiado.length > 0) {
      resultado.push({
        titulo: 'Colegiado',
        icone: <Groups fontSize="small" />,
        rubricas: colegiado,
        cor: 'success.main',
      });
    }

    if (outras.length > 0) {
      resultado.push({
        titulo: 'Outros Professores',
        icone: <PersonOutline fontSize="small" />,
        rubricas: outras,
        cor: 'warning.main',
      });
    }

    return resultado;
  }, [rubricas, usuarioId]);

  // Rubricas visiveis (sem "Outros Professores" se nao estiver expandido)
  const gruposVisiveis = mostrarOutras
    ? grupos
    : grupos.filter((g) => g.titulo !== 'Outros Professores');

  const outrosGrupo = grupos.find((g) => g.titulo === 'Outros Professores');
  const temOutras = outrosGrupo && outrosGrupo.rubricas.length > 0;

  return (
    <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
      <Typography variant="subtitle2" gutterBottom>
        Selecione {qtdNecessarias} rubrica(s) para avaliar este componente:
      </Typography>

      {gruposVisiveis.map((grupo) => (
        <Box key={grupo.titulo} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Box sx={{ color: grupo.cor, display: 'flex' }}>{grupo.icone}</Box>
            <Typography variant="caption" fontWeight={600} color={grupo.cor}>
              {grupo.titulo}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {grupo.rubricas.map((rubrica) => {
              const isSelected = rubricasSelecionadas.includes(rubrica.id);
              const isOutroProfessor = grupo.titulo === 'Outros Professores';
              return (
                <FormControlLabel
                  key={rubrica.id}
                  control={
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggle(componenteId, rubrica.id, qtdNecessarias)}
                      size="small"
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{rubrica.nome}</span>
                      {isOutroProfessor && rubrica.criadorNome && (
                        <Chip
                          label={rubrica.criadorNome}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 18, ml: 0.5 }}
                        />
                      )}
                    </Box>
                  }
                  sx={{
                    bgcolor: isSelected ? 'primary.light' : 'background.paper',
                    borderRadius: 1,
                    px: 1,
                    mr: 1,
                    border: '1px solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                  }}
                />
              );
            })}
          </Box>
        </Box>
      ))}

      {temOutras && (
        <Button
          size="small"
          onClick={() => setMostrarOutras(!mostrarOutras)}
          startIcon={mostrarOutras ? <ExpandLess /> : <ExpandMore />}
          sx={{ mt: 1, textTransform: 'none' }}
        >
          {mostrarOutras
            ? 'Ocultar rubricas de outros professores'
            : `Mostrar rubricas de outros professores (${outrosGrupo.rubricas.length})`}
        </Button>
      )}
    </Paper>
  );
}
