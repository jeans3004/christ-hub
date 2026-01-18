/**
 * Modal para criar/editar rubricas.
 */

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, TextField, Button,
  Typography, IconButton, Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { Rubrica, NivelRubrica, DescricaoNivel, TipoRubrica } from '@/types';
import { rubricaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { NIVEIS } from '../types';
import { NivelInput, TipoRubricaSelector } from './rubrica-modal';

interface RubricaModalProps {
  open: boolean;
  rubrica: Rubrica | null;
  existingOrder: number;
  onClose: () => void;
  onSave: () => void;
}

const createEmptyNiveis = (): DescricaoNivel[] => NIVEIS.map((nivel) => ({ nivel, descricao: '' }));

export function RubricaModal({ open, rubrica, existingOrder, onClose, onSave }: RubricaModalProps) {
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [tipo, setTipo] = useState<TipoRubrica>('professor');
  const [niveis, setNiveis] = useState<DescricaoNivel[]>(createEmptyNiveis());

  useEffect(() => {
    if (rubrica) {
      setNome(rubrica.nome);
      setDescricao(rubrica.descricao || '');
      setAtivo(rubrica.ativo);
      setTipo(rubrica.tipo || 'geral');
      setNiveis(rubrica.niveis.length > 0 ? rubrica.niveis : createEmptyNiveis());
    } else {
      setNome('');
      setDescricao('');
      setAtivo(true);
      setTipo('professor');
      setNiveis(createEmptyNiveis());
    }
  }, [rubrica, open]);

  const handleNivelChange = (nivel: NivelRubrica, value: string) => {
    setNiveis((prev) => prev.map((n) => (n.nivel === nivel ? { ...n, descricao: value } : n)));
  };

  const handleSubmit = async () => {
    if (!nome.trim()) { addToast('Informe o nome da rubrica', 'error'); return; }
    const niveisPreenchidos = niveis.filter((n) => n.descricao.trim());
    if (niveisPreenchidos.length === 0) { addToast('Informe a descricao de pelo menos um nivel', 'error'); return; }

    setSaving(true);
    try {
      const data: Partial<Rubrica> = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        niveis: niveis.filter((n) => n.descricao.trim()),
        ativo,
        ordem: rubrica?.ordem ?? existingOrder + 1,
        tipo,
        criadorId: tipo === 'professor' && usuario ? usuario.id : undefined,
        criadorNome: tipo === 'professor' && usuario ? usuario.nome : undefined,
      };

      if (rubrica) {
        await rubricaService.update(rubrica.id, data);
        addToast('Rubrica atualizada com sucesso!', 'success');
      } else {
        await rubricaService.create(data as Parameters<typeof rubricaService.create>[0]);
        addToast('Rubrica criada com sucesso!', 'success');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving rubrica:', error);
      addToast('Erro ao salvar rubrica', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography fontWeight={600}>{rubrica ? 'Editar Rubrica' : 'Nova Rubrica'}</Typography>
        <IconButton onClick={onClose} size="small"><Close /></IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <TipoRubricaSelector tipo={tipo} usuarioNome={usuario?.nome} onChange={setTipo} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Nome da Rubrica" value={nome} onChange={(e) => setNome(e.target.value)}
              fullWidth required placeholder="Ex: Participacao, Comportamento"
            />
            <FormControlLabel
              control={<Switch checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />}
              label="Ativa" sx={{ minWidth: 100 }}
            />
          </Box>

          <TextField
            label="Descricao (opcional)" value={descricao} onChange={(e) => setDescricao(e.target.value)}
            fullWidth multiline rows={2} placeholder="Descreva o que esta rubrica avalia"
          />

          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Descricao dos Niveis
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NIVEIS.map((nivel) => (
                <NivelInput key={nivel} nivel={nivel} niveis={niveis} onChange={handleNivelChange} />
              ))}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained" onClick={handleSubmit} disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Salvando...' : rubrica ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
