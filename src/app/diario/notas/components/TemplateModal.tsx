/**
 * Modal para edicao de template de composicao.
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Add, Delete, Close } from '@mui/icons-material';
import { NotaComposicao } from '@/types';

interface TemplateModalProps {
  open: boolean;
  editingAv: 'av1' | 'av2' | null;
  templateSubNotas: NotaComposicao[];
  novaSubNota: { nome: string; porcentagem: number; quantidadeRubricas: 1 | 2 | 3 };
  setNovaSubNota: React.Dispatch<React.SetStateAction<{ nome: string; porcentagem: number; quantidadeRubricas: 1 | 2 | 3 }>>;
  onClose: () => void;
  onSave: () => void;
  onAddSubNota: () => void;
  onRemoveSubNota: (id: string) => void;
  onPorcentagemChange: (id: string, value: string) => void;
  onRubricasChange: (id: string, value: 1 | 2 | 3) => void;
}

export function TemplateModal({
  open,
  editingAv,
  templateSubNotas,
  novaSubNota,
  setNovaSubNota,
  onClose,
  onSave,
  onAddSubNota,
  onRemoveSubNota,
  onPorcentagemChange,
  onRubricasChange,
}: TemplateModalProps) {
  const soma = templateSubNotas.reduce((acc, s) => acc + s.porcentagem, 0);
  const somaCorreta = soma === 10;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          Composição da {editingAv?.toUpperCase()}
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure os componentes que formam a nota. O valor representa a nota máxima de cada componente. A soma deve ser igual a 10.
        </Typography>

        {/* Lista de Componentes do Template */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          {templateSubNotas.map((subNota) => (
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
              <TextField
                size="small"
                label="Valor Máx."
                type="number"
                value={subNota.porcentagem}
                onChange={(e) => onPorcentagemChange(subNota.id, e.target.value)}
                inputProps={{ min: 0.5, max: 10, step: 0.5, style: { textAlign: 'center' } }}
                sx={{ width: 100 }}
              />
              <FormControl size="small" sx={{ width: 100 }}>
                <InputLabel>Rubricas</InputLabel>
                <Select
                  value={subNota.quantidadeRubricas}
                  label="Rubricas"
                  onChange={(e) => onRubricasChange(subNota.id, e.target.value as 1 | 2 | 3)}
                >
                  <MenuItem value={1}>1</MenuItem>
                  <MenuItem value={2}>2</MenuItem>
                  <MenuItem value={3}>3</MenuItem>
                </Select>
              </FormControl>
              <IconButton size="small" color="error" onClick={() => onRemoveSubNota(subNota.id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Box>

        {/* Adicionar Novo Componente */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
          <TextField
            size="small"
            label="Nome do componente"
            placeholder="Ex: Seminario"
            value={novaSubNota.nome}
            onChange={(e) => setNovaSubNota(prev => ({ ...prev, nome: e.target.value }))}
            sx={{ flex: 1, minWidth: 150 }}
          />
          <TextField
            size="small"
            label="Valor Máx."
            type="number"
            value={novaSubNota.porcentagem || ''}
            onChange={(e) => setNovaSubNota(prev => ({ ...prev, porcentagem: parseFloat(e.target.value) || 0 }))}
            inputProps={{ min: 0.5, max: 10, step: 0.5, style: { textAlign: 'center' } }}
            sx={{ width: 100 }}
          />
          <FormControl size="small" sx={{ width: 100 }}>
            <InputLabel>Rubricas</InputLabel>
            <Select
              value={novaSubNota.quantidadeRubricas}
              label="Rubricas"
              onChange={(e) => setNovaSubNota(prev => ({ ...prev, quantidadeRubricas: e.target.value as 1 | 2 | 3 }))}
            >
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Add />}
            onClick={onAddSubNota}
            sx={{ textTransform: 'none' }}
          >
            Adicionar
          </Button>
        </Box>

        {/* Soma dos Valores */}
        <Box
          sx={{
            p: 2,
            bgcolor: somaCorreta ? 'success.light' : 'warning.light',
            borderRadius: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Typography fontWeight={600} color={somaCorreta ? 'success.dark' : 'warning.dark'}>
            Soma dos Valores:
          </Typography>
          <Typography variant="h6" fontWeight={700} color={somaCorreta ? 'success.dark' : 'warning.dark'}>
            {soma} / 10
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={onSave}
          disabled={templateSubNotas.length === 0 || !somaCorreta}
          sx={{ textTransform: 'none' }}
        >
          Salvar Composição
        </Button>
      </DialogActions>
    </Dialog>
  );
}
