/**
 * Modal para criar/editar rubricas.
 * Permite definir se a rubrica é Geral/Colegiado ou do Professor.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Switch,
  FormControlLabel,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import { Close, School, Person } from '@mui/icons-material';
import { Rubrica, NivelRubrica, DescricaoNivel, TipoRubrica } from '@/types';
import { rubricaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { NIVEIS, NIVEL_COLORS, NIVEL_LABELS } from '../types';

interface RubricaModalProps {
  open: boolean;
  rubrica: Rubrica | null;
  existingOrder: number;
  onClose: () => void;
  onSave: () => void;
}

const createEmptyNiveis = (): DescricaoNivel[] =>
  NIVEIS.map((nivel) => ({ nivel, descricao: '' }));

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
      setTipo('professor'); // Default para professor ao criar nova
      setNiveis(createEmptyNiveis());
    }
  }, [rubrica, open]);

  const handleNivelChange = (nivel: NivelRubrica, value: string) => {
    setNiveis((prev) =>
      prev.map((n) => (n.nivel === nivel ? { ...n, descricao: value } : n))
    );
  };

  const handleSubmit = async () => {
    if (!nome.trim()) {
      addToast('Informe o nome da rubrica', 'error');
      return;
    }

    const niveisPreenchidos = niveis.filter((n) => n.descricao.trim());
    if (niveisPreenchidos.length === 0) {
      addToast('Informe a descrição de pelo menos um nível', 'error');
      return;
    }

    setSaving(true);
    try {
      const data: Partial<Rubrica> = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        niveis: niveis.filter((n) => n.descricao.trim()),
        ativo,
        ordem: rubrica?.ordem ?? existingOrder + 1,
        tipo,
      };

      // Se for rubrica de professor, adicionar criador
      if (tipo === 'professor' && usuario) {
        data.criadorId = usuario.id;
        data.criadorNome = usuario.nome;
      } else {
        // Se for geral, limpar dados do criador
        data.criadorId = undefined;
        data.criadorNome = undefined;
      }

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
        <Typography fontWeight={600}>
          {rubrica ? 'Editar Rubrica' : 'Nova Rubrica'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Tipo de Rubrica */}
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Tipo de Rubrica
            </Typography>
            <ToggleButtonGroup
              value={tipo}
              exclusive
              onChange={(_, newTipo) => newTipo && setTipo(newTipo)}
              fullWidth
            >
              <ToggleButton value="geral" sx={{ py: 1.5 }}>
                <School sx={{ mr: 1 }} />
                Geral/Colegiado
              </ToggleButton>
              <ToggleButton value="professor" sx={{ py: 1.5 }}>
                <Person sx={{ mr: 1 }} />
                Minha Rubrica
              </ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {tipo === 'geral'
                ? 'Rubricas Gerais são visíveis para todos os usuários do sistema'
                : `Esta rubrica será exibida no grupo "${usuario?.nome || 'Professor'}"`}
            </Typography>
          </Box>

          {/* Dados básicos */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Nome da Rubrica"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              fullWidth
              required
              placeholder="Ex: Participação, Comportamento"
            />
            <FormControlLabel
              control={<Switch checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />}
              label="Ativa"
              sx={{ minWidth: 100 }}
            />
          </Box>

          <TextField
            label="Descrição (opcional)"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder="Descreva o que esta rubrica avalia"
          />

          {/* Níveis */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Descrição dos Níveis
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NIVEIS.map((nivel) => {
                const colors = NIVEL_COLORS[nivel];
                return (
                  <Box
                    key={nivel}
                    sx={{
                      p: 2,
                      bgcolor: colors.bg,
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: colors.border,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: colors.text,
                          minWidth: 24,
                        }}
                      >
                        {nivel}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: colors.text, fontWeight: 500 }}
                      >
                        {NIVEL_LABELS[nivel]}
                      </Typography>
                    </Box>
                    <TextField
                      value={niveis.find((n) => n.nivel === nivel)?.descricao || ''}
                      onChange={(e) => handleNivelChange(nivel, e.target.value)}
                      fullWidth
                      size="small"
                      placeholder={`Descreva o que significa ter nível ${nivel}...`}
                      multiline
                      rows={2}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'background.paper',
                        },
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Salvando...' : rubrica ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
