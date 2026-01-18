'use client';

/**
 * Barra de ferramentas para modos de edicao do mapeamento.
 */

import { Box, Button, ButtonGroup, Tooltip, CircularProgress } from '@mui/material';
import { Save, Add, Edit, Delete, Visibility, Refresh } from '@mui/icons-material';
import { ModoEdicao } from '../types';

interface ModoToolbarProps {
  modoEdicao: ModoEdicao;
  setModoEdicao: (modo: ModoEdicao) => void;
  saving: boolean;
  onSave: () => void;
  onResetar: () => void;
}

export function ModoToolbar({ modoEdicao, setModoEdicao, saving, onSave, onResetar }: ModoToolbarProps) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
      <ButtonGroup size="small" variant="outlined">
        <Tooltip title="Visualizar">
          <Button
            onClick={() => setModoEdicao('visualizar')}
            variant={modoEdicao === 'visualizar' ? 'contained' : 'outlined'}
          >
            <Visibility />
          </Button>
        </Tooltip>
        <Tooltip title="Atribuir alunos (arraste da lista)">
          <Button
            onClick={() => setModoEdicao('selecionar')}
            variant={modoEdicao === 'selecionar' ? 'contained' : 'outlined'}
          >
            <Add />
          </Button>
        </Tooltip>
        <Tooltip title="Editar tipo de celula">
          <Button
            onClick={() => setModoEdicao('editar_tipo')}
            variant={modoEdicao === 'editar_tipo' ? 'contained' : 'outlined'}
          >
            <Edit />
          </Button>
        </Tooltip>
        <Tooltip title="Remover aluno">
          <Button
            onClick={() => setModoEdicao('remover')}
            variant={modoEdicao === 'remover' ? 'contained' : 'outlined'}
          >
            <Delete />
          </Button>
        </Tooltip>
      </ButtonGroup>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Tooltip title="Resetar mapeamento">
          <Button variant="outlined" onClick={onResetar} startIcon={<Refresh />}>
            Resetar
          </Button>
        </Tooltip>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
          onClick={onSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </Box>
    </Box>
  );
}
