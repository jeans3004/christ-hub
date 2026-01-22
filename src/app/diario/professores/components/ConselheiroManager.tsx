'use client';

/**
 * Componente para gerenciar professores conselheiros por turma.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { Save, Clear } from '@mui/icons-material';
import { Turma, Usuario } from '@/types';
import { turmaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';

interface ConselheiroManagerProps {
  professores: Usuario[];
  turmas: Turma[];
  loading: boolean;
  onReload: () => void;
}

export function ConselheiroManager({ professores, turmas, loading, onReload }: ConselheiroManagerProps) {
  const { addToast } = useUIStore();
  const [saving, setSaving] = useState<string | null>(null);
  const [ano, setAno] = useState(new Date().getFullYear());

  // Filtrar turmas ativas do ano selecionado
  const turmasFiltradas = useMemo(() => {
    return turmas
      .filter(t => t.ativo && t.ano === ano)
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [turmas, ano]);

  // Professores ativos
  const professoresAtivos = useMemo(() => {
    return professores.filter(p => p.ativo).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [professores]);

  // Map de professor por ID
  const professoresMap = useMemo(() => {
    const map = new Map<string, Usuario>();
    professores.forEach(p => map.set(p.id, p));
    return map;
  }, [professores]);

  const handleSetConselheiro = async (turmaId: string, professorId: string | null) => {
    setSaving(turmaId);
    try {
      await turmaService.update(turmaId, {
        professorConselheiroId: professorId || undefined,
      });
      addToast('Conselheiro atualizado com sucesso!', 'success');
      onReload();
    } catch (error) {
      console.error('Error updating conselheiro:', error);
      addToast('Erro ao atualizar conselheiro', 'error');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          Professores Conselheiros
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Ano</InputLabel>
          <Select
            value={ano}
            label="Ano"
            onChange={(e) => setAno(Number(e.target.value))}
          >
            {[2024, 2025, 2026, 2027].map(a => (
              <MenuItem key={a} value={a}>{a}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {turmasFiltradas.length === 0 ? (
        <Alert severity="info">Nenhuma turma encontrada para o ano {ano}.</Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ fontWeight: 600 }}>Turma</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Ensino</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Turno</TableCell>
                <TableCell sx={{ fontWeight: 600, minWidth: 250 }}>Professor Conselheiro</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 60 }}>Ação</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {turmasFiltradas.map((turma) => {
                const conselheiro = turma.professorConselheiroId
                  ? professoresMap.get(turma.professorConselheiroId)
                  : null;

                return (
                  <TableRow key={turma.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {turma.nome}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={turma.ensino === 'Ensino Médio' ? 'EM' : 'EF'}
                        size="small"
                        color={turma.ensino === 'Ensino Médio' ? 'primary' : 'secondary'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {turma.turno}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small" disabled={saving === turma.id}>
                        <Select
                          value={turma.professorConselheiroId || ''}
                          displayEmpty
                          onChange={(e) => handleSetConselheiro(turma.id, e.target.value || null)}
                        >
                          <MenuItem value="">
                            <em>Nenhum conselheiro</em>
                          </MenuItem>
                          {professoresAtivos.map(p => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.nome}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {saving === turma.id ? (
                        <CircularProgress size={20} />
                      ) : turma.professorConselheiroId ? (
                        <Tooltip title="Remover conselheiro">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleSetConselheiro(turma.id, null)}
                          >
                            <Clear fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
