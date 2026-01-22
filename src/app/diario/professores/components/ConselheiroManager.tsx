'use client';

/**
 * Componente para gerenciar professores conselheiros por turma.
 */

import { useState, useMemo, useEffect } from 'react';
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
  Button,
  Divider,
} from '@mui/material';
import { Clear, MergeType } from '@mui/icons-material';
import { deleteField } from 'firebase/firestore';
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
  const [merging, setMerging] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState<number | null>(null);

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
      if (professorId) {
        await turmaService.update(turmaId, {
          professorConselheiroId: professorId,
        });
      } else {
        // Use deleteField() to remove the field from Firestore
        await turmaService.update(turmaId, {
          professorConselheiroId: deleteField() as any,
        });
      }
      addToast('Conselheiro atualizado com sucesso!', 'success');
      onReload();
    } catch (error) {
      console.error('Error updating conselheiro:', error);
      addToast('Erro ao atualizar conselheiro', 'error');
    } finally {
      setSaving(null);
    }
  };

  const checkDuplicates = async () => {
    try {
      const response = await fetch('/api/usuarios/duplicates');
      const data = await response.json();
      if (data.success) {
        // Count unique duplicates by name only
        const byName = data.duplicates.filter((d: any) => d.field === 'nome');
        setDuplicateCount(byName.length);
      }
    } catch (error) {
      console.error('Error checking duplicates:', error);
    }
  };

  const handleMerge = async () => {
    setMerging(true);
    try {
      const response = await fetch('/api/usuarios/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoMergeAll: true }),
      });
      const data = await response.json();
      if (data.success) {
        addToast(`Merge concluído! ${data.totalDeleted} duplicados removidos.`, 'success');
        setDuplicateCount(0);
        onReload();
      } else {
        addToast(data.error || 'Erro ao fazer merge', 'error');
      }
    } catch (error) {
      console.error('Error merging:', error);
      addToast('Erro ao fazer merge', 'error');
    } finally {
      setMerging(false);
    }
  };

  // Check for duplicates on mount
  useEffect(() => {
    checkDuplicates();
  }, []);

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

      {/* Seção de Merge de Duplicados */}
      <Divider sx={{ my: 3 }} />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Gerenciar Duplicados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {duplicateCount === null
              ? 'Verificando duplicados...'
              : duplicateCount === 0
              ? 'Nenhum usuário duplicado encontrado.'
              : `${duplicateCount} usuário(s) duplicado(s) encontrado(s).`}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={checkDuplicates}
            disabled={merging}
          >
            Verificar
          </Button>
          {duplicateCount !== null && duplicateCount > 0 && (
            <Button
              variant="contained"
              color="warning"
              size="small"
              startIcon={merging ? <CircularProgress size={16} color="inherit" /> : <MergeType />}
              onClick={handleMerge}
              disabled={merging}
            >
              {merging ? 'Mesclando...' : 'Mesclar Duplicados'}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
