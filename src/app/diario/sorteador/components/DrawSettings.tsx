'use client';

import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  FormLabel,
  Checkbox,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Typography,
  Divider,
} from '@mui/material';
import { Casino } from '@mui/icons-material';
import { Turma, Aluno } from '@/types';

export type ModoSorteio = 'individual' | 'multiplo' | 'equipes' | 'sequencia';

interface DrawSettingsProps {
  turmas: Turma[];
  turmaId: string;
  onTurmaChange: (turmaId: string) => void;
  alunos: Aluno[];
  loadingAlunos: boolean;
  modo: ModoSorteio;
  onModoChange: (modo: ModoSorteio) => void;
  quantidade: number;
  onQuantidadeChange: (quantidade: number) => void;
  excluidos: string[];
  onExcluidosChange: (excluidos: string[]) => void;
  onSortear: () => void;
  disabled?: boolean;
}

const MODOS = [
  { value: 'individual', label: 'Sortear 1 aluno' },
  { value: 'multiplo', label: 'Sortear N alunos' },
  { value: 'equipes', label: 'Formar equipes' },
  { value: 'sequencia', label: 'Sequencia aleatoria' },
] as const;

export function DrawSettings({
  turmas,
  turmaId,
  onTurmaChange,
  alunos,
  loadingAlunos,
  modo,
  onModoChange,
  quantidade,
  onQuantidadeChange,
  excluidos,
  onExcluidosChange,
  onSortear,
  disabled,
}: DrawSettingsProps) {
  const toggleExcluido = (alunoId: string) => {
    onExcluidosChange(
      excluidos.includes(alunoId)
        ? excluidos.filter((id) => id !== alunoId)
        : [...excluidos, alunoId]
    );
  };

  const alunosDisponiveis = alunos.filter((a) => !excluidos.includes(a.id));
  const showQuantidade = modo === 'multiplo' || modo === 'equipes';
  const maxQuantidade = modo === 'equipes' ? Math.floor(alunosDisponiveis.length / 2) : alunosDisponiveis.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Turma</InputLabel>
        <Select
          value={turmaId}
          label="Turma"
          onChange={(e) => onTurmaChange(e.target.value)}
        >
          {turmas.map((t) => (
            <MenuItem key={t.id} value={t.id}>
              {t.nome}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider />

      <FormControl>
        <FormLabel>Modo de sorteio</FormLabel>
        <RadioGroup
          value={modo}
          onChange={(e) => onModoChange(e.target.value as ModoSorteio)}
        >
          {MODOS.map((m) => (
            <FormControlLabel
              key={m.value}
              value={m.value}
              control={<Radio size="small" />}
              label={m.label}
            />
          ))}
        </RadioGroup>
      </FormControl>

      {showQuantidade && (
        <TextField
          label={modo === 'equipes' ? 'Numero de equipes' : 'Quantidade de alunos'}
          inputMode="numeric"
          size="small"
          value={quantidade}
          onChange={(e) => {
            const raw = e.target.value.replace(/\D/g, '');
            if (raw === '') { onQuantidadeChange(1); return; }
            onQuantidadeChange(Number(raw));
          }}
          onBlur={() => onQuantidadeChange(Math.max(1, Math.min(maxQuantidade, quantidade)))}
          helperText={`Min: 1 — Max: ${maxQuantidade}`}
          fullWidth
        />
      )}

      <Divider />

      {turmaId && (
        <>
          <Typography variant="caption" color="text.secondary">
            Excluir do sorteio ({excluidos.length} excluido{excluidos.length !== 1 ? 's' : ''})
          </Typography>
          <List dense sx={{ maxHeight: 240, overflow: 'auto' }}>
            {loadingAlunos ? (
              <ListItem>
                <ListItemText primary="Carregando alunos..." />
              </ListItem>
            ) : alunos.length === 0 ? (
              <ListItem>
                <ListItemText primary="Nenhum aluno na turma" />
              </ListItem>
            ) : (
              alunos.map((aluno) => (
                <ListItem
                  key={aluno.id}
                  dense
                  component="label"
                  sx={{ cursor: 'pointer', py: 0 }}
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <Checkbox
                      edge="start"
                      size="small"
                      checked={excluidos.includes(aluno.id)}
                      onChange={() => toggleExcluido(aluno.id)}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={aluno.nome}
                    sx={{
                      textDecoration: excluidos.includes(aluno.id) ? 'line-through' : 'none',
                      opacity: excluidos.includes(aluno.id) ? 0.5 : 1,
                    }}
                  />
                </ListItem>
              ))
            )}
          </List>
        </>
      )}

      <Button
        variant="contained"
        startIcon={<Casino />}
        onClick={onSortear}
        disabled={disabled || !turmaId || alunosDisponiveis.length === 0}
        fullWidth
        size="large"
      >
        Sortear
      </Button>
    </Box>
  );
}
