'use client';

/**
 * Conteudo do formulario de disciplina com hierarquia.
 */

import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
  Typography,
  Autocomplete,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material';
import { AccountTree, Folder, Info } from '@mui/icons-material';
import { Turma, Disciplina } from '@/types';
import { DisciplinaForm } from '../types';

interface DisciplinaFormContentProps {
  form: DisciplinaForm;
  setForm: React.Dispatch<React.SetStateAction<DisciplinaForm>>;
  turmas: Turma[];
  availableParents: Disciplina[];
  getFullPath: (id: string) => string;
  editingId?: string;
}

export function DisciplinaFormContent({
  form,
  setForm,
  turmas,
  availableParents,
  getFullPath,
}: DisciplinaFormContentProps) {
  const selectedParent = availableParents.find(d => d.id === form.parentId);

  // Quando muda o parentId, auto-atualiza isGroup
  const handleParentChange = (newParentId: string | null) => {
    setForm(prev => ({
      ...prev,
      parentId: newParentId,
      // Se nao tem pai (raiz), sugere como grupo. Se tem pai, sugere como nao-grupo
      isGroup: newParentId ? false : prev.isGroup,
    }));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Nome */}
      <TextField
        label="Nome da Disciplina"
        value={form.nome}
        onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
        fullWidth
        required
        placeholder={form.isGroup ? 'Ex: Linguagens' : 'Ex: Matematica'}
      />

      {/* Codigo - oculto se for grupo */}
      {!form.isGroup && (
        <TextField
          label="Codigo"
          value={form.codigo}
          onChange={(e) => setForm(prev => ({ ...prev, codigo: e.target.value }))}
          fullWidth
          placeholder="Ex: MAT001"
          helperText="Opcional - codigo interno da disciplina"
        />
      )}

      {/* Disciplina Pai */}
      <Autocomplete
        options={availableParents}
        value={selectedParent || null}
        onChange={(_, newValue) => handleParentChange(newValue?.id || null)}
        getOptionLabel={(option) => option.nome}
        renderOption={(props, option) => {
          const { key, ...restProps } = props;
          return (
            <li key={key} {...restProps}>
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                <Typography>{option.nome}</Typography>
                {option.parentId && (
                  <Typography variant="caption" color="text.secondary">
                    {getFullPath(option.id)}
                  </Typography>
                )}
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Disciplina Pai"
            placeholder="Nenhuma (disciplina raiz)"
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <AccountTree sx={{ color: 'action.active', mr: 1 }} />
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        noOptionsText="Nenhuma disciplina disponivel"
        clearText="Limpar (tornar raiz)"
      />
      <Typography variant="caption" color="text.secondary" sx={{ mt: -1.5 }}>
        Selecione uma disciplina pai para criar uma subdisciplina, ou deixe vazio para criar na raiz
      </Typography>

      {/* Switch: E um grupo? */}
      <Box sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
        <FormControlLabel
          control={
            <Switch
              checked={form.isGroup}
              onChange={(e) => setForm(prev => ({ ...prev, isGroup: e.target.checked }))}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Folder color={form.isGroup ? 'primary' : 'action'} />
              <Typography fontWeight={500}>
                Esta disciplina e apenas um grupo organizacional
              </Typography>
            </Box>
          }
        />
        {form.isGroup && (
          <Alert severity="info" icon={<Info />} sx={{ mt: 1.5 }}>
            Grupos nao aparecem nas opcoes de selecao dos modulos (Chamada, Notas, Conceitos).
            Use para organizar subdisciplinas relacionadas.
          </Alert>
        )}
      </Box>

      {/* Turmas - mostra apenas se nao for grupo */}
      {!form.isGroup && (
        <>
          <FormControl fullWidth required>
            <InputLabel>Turmas Vinculadas</InputLabel>
            <Select
              multiple
              value={form.turmaIds}
              onChange={(e) => setForm(prev => ({ ...prev, turmaIds: e.target.value as string[] }))}
              input={<OutlinedInput label="Turmas Vinculadas" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((id) => {
                    const turma = turmas.find(t => t.id === id);
                    return turma ? <Chip key={id} label={turma.nome} size="small" /> : null;
                  })}
                </Box>
              )}
            >
              {turmas.map((turma) => (
                <MenuItem key={turma.id} value={turma.id}>
                  <Checkbox checked={form.turmaIds.includes(turma.id)} />
                  <ListItemText primary={turma.nome} />
                </MenuItem>
              ))}
            </Select>
            {turmas.length === 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                Cadastre turmas primeiro para vincular a disciplina
              </Typography>
            )}
            {turmas.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                Selecione as turmas onde esta disciplina sera ministrada
              </Typography>
            )}
          </FormControl>

          {/* Botoes de selecao rapida */}
          {turmas.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                onClick={() => setForm(prev => ({ ...prev, turmaIds: turmas.map(t => t.id) }))}
                sx={{ textTransform: 'none' }}
              >
                Selecionar todas
              </Button>
              <Button
                size="small"
                variant="outlined"
                color="inherit"
                onClick={() => setForm(prev => ({ ...prev, turmaIds: [] }))}
                sx={{ textTransform: 'none' }}
              >
                Limpar selecao
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Aviso para grupos sobre turmas */}
      {form.isGroup && (
        <Typography variant="caption" color="text.secondary">
          Grupos nao precisam de turmas vinculadas. As subdisciplinas herdaram as configuracoes de turma individualmente.
        </Typography>
      )}
    </Box>
  );
}
