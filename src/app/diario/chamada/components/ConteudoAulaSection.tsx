/**
 * Secao de conteudo de aula com sync SGE.
 * Mostra conteudos registrados por tempo e permite criar/editar.
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Save as SaveIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';
import { ConteudoAula, EAlunoConfig } from '@/types';
import { conteudoAulaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';

interface ConteudoAulaSectionProps {
  turmaId: string;
  disciplinaId: string;
  professorId: string;
  data: string; // YYYY-MM-DD
  ano: number;
  eAlunoConfig: EAlunoConfig | null;
}

export function ConteudoAulaSection({
  turmaId,
  disciplinaId,
  professorId,
  data,
  ano,
  eAlunoConfig,
}: ConteudoAulaSectionProps) {
  const { addToast } = useUIStore();
  const [conteudos, setConteudos] = useState<ConteudoAula[]>([]);
  const [loading, setLoading] = useState(false);
  const [newConteudo, setNewConteudo] = useState('');
  const [newTempo, setNewTempo] = useState(1);
  const [saving, setSaving] = useState(false);

  const loadConteudos = useCallback(async () => {
    if (!turmaId || !disciplinaId || !data) return;
    setLoading(true);
    try {
      const dataObj = new Date(data + 'T12:00:00');
      const result = await conteudoAulaService.getByTurmaAndDate(turmaId, disciplinaId, dataObj, ano);
      setConteudos(result);
    } catch (error) {
      console.error('Erro ao carregar conteudos:', error);
    } finally {
      setLoading(false);
    }
  }, [turmaId, disciplinaId, data, ano]);

  useEffect(() => {
    loadConteudos();
  }, [loadConteudos]);

  const handleSave = async () => {
    if (!newConteudo.trim()) return;
    setSaving(true);
    try {
      const dataObj = new Date(data + 'T12:00:00');
      const id = await conteudoAulaService.create({
        turmaId,
        disciplinaId,
        professorId,
        data: dataObj,
        tempo: newTempo,
        conteudo: newConteudo.trim(),
        ano,
      });

      setNewConteudo('');
      await loadConteudos();
      addToast('Conteudo salvo', 'success');

      // Fire-and-forget SGE sync
      if (eAlunoConfig?.credentials?.user) {
        const turmaMap = eAlunoConfig.turmaMap?.[turmaId];
        const discMap = eAlunoConfig.disciplinaMap?.[disciplinaId];
        if (turmaMap && discMap) {
          fetch('/api/sge/conteudo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user: eAlunoConfig.credentials.user,
              password: eAlunoConfig.credentials.password,
              encrypted: true,
              action: 'create',
              data,
              aula: newTempo,
              serie: turmaMap.serie,
              turma: turmaMap.turma,
              turno: turmaMap.turno,
              disciplina: discMap,
              ano,
              conteudo: newConteudo.trim(),
            }),
          })
            .then(async (res) => {
              const json = await res.json();
              if (json.success) {
                await conteudoAulaService.update(id, { sgeSyncedAt: new Date() });
                loadConteudos();
              } else {
                await conteudoAulaService.update(id, { sgeSyncError: json.error || 'Erro SGE' });
              }
            })
            .catch((err) => {
              console.error('[SGE] Conteudo sync failed:', err);
            });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar conteudo:', error);
      addToast('Erro ao salvar conteudo', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await conteudoAulaService.delete(id);
      setConteudos(prev => prev.filter(c => c.id !== id));
      addToast('Conteudo removido', 'success');
    } catch (error) {
      console.error('Erro ao deletar conteudo:', error);
      addToast('Erro ao remover conteudo', 'error');
    }
  };

  // Auto-increment tempo based on existing conteudos
  useEffect(() => {
    if (conteudos.length > 0) {
      const maxTempo = Math.max(...conteudos.map(c => c.tempo));
      setNewTempo(Math.min(maxTempo + 1, 7));
    } else {
      setNewTempo(1);
    }
  }, [conteudos]);

  return (
    <Paper sx={{ p: 2, mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Conteudo de Aula
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : (
        <>
          {/* Existing conteudos */}
          {conteudos.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
              {conteudos.map((c) => (
                <Box
                  key={c.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    p: 1,
                    borderRadius: 1,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Chip label={`${c.tempo}o`} size="small" variant="outlined" />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {c.conteudo}
                  </Typography>
                  {c.sgeSyncedAt && (
                    <Tooltip title="Sincronizado com SGE">
                      <SyncIcon sx={{ fontSize: 16, color: 'success.main' }} />
                    </Tooltip>
                  )}
                  {c.sgeSyncError && (
                    <Tooltip title={c.sgeSyncError}>
                      <SyncIcon sx={{ fontSize: 16, color: 'error.main' }} />
                    </Tooltip>
                  )}
                  <IconButton size="small" onClick={() => handleDelete(c.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          {/* New conteudo form */}
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
            <Chip
              label={`${newTempo}o`}
              size="small"
              color="primary"
              variant="outlined"
              onClick={() => setNewTempo(prev => (prev % 7) + 1)}
              sx={{ mt: 1, cursor: 'pointer' }}
            />
            <TextField
              value={newConteudo}
              onChange={(e) => setNewConteudo(e.target.value)}
              placeholder="Conteudo ministrado..."
              size="small"
              multiline
              maxRows={3}
              sx={{ flex: 1 }}
            />
            <Button
              variant="contained"
              size="small"
              onClick={handleSave}
              disabled={saving || !newConteudo.trim()}
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              sx={{ mt: 0.5 }}
            >
              Salvar
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}
