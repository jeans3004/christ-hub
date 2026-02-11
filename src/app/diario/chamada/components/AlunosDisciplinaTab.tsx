/**
 * Aba de configuracao de alunos por disciplina.
 * Permite definir quais alunos participam de disciplinas eletivas/especificas.
 */

'use client';

import {
  Box, Paper, Typography, Alert, Button, Checkbox,
  FormControl, InputLabel, Select, MenuItem,
  List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, CircularProgress, Divider,
} from '@mui/material';
import { SelectAll, Deselect, Save, DeleteOutline } from '@mui/icons-material';
import { DisciplinaSelect } from '@/components/common/DisciplinaSelect';
import { useAlunosDisciplinaConfig } from '../hooks';

export function AlunosDisciplinaTab() {
  const {
    turmaId, setTurmaId,
    disciplinaId, setDisciplinaId,
    turmas, disciplinas, alunos,
    loadingTurmas, loadingDisciplinas, loadingAlunos,
    checkedIds, toggleAluno, selectAll, deselectAll,
    hasChanges, hasWhitelist, saving,
    save, clearWhitelist,
  } = useAlunosDisciplinaConfig();

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Alunos por Disciplina
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure quais alunos participam de disciplinas eletivas ou especificas.
      </Typography>

      {/* Selectors */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl sx={{ minWidth: 200, flex: 1 }} size="small">
          <InputLabel>Turma</InputLabel>
          <Select
            value={turmaId}
            onChange={(e) => setTurmaId(e.target.value)}
            label="Turma"
          >
            <MenuItem value=""><em>Selecione</em></MenuItem>
            {turmas.map(t => (
              <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ minWidth: 200, flex: 1 }}>
          <DisciplinaSelect
            value={disciplinaId || null}
            onChange={(v) => setDisciplinaId(v || '')}
            disciplinas={disciplinas}
            label="Disciplina"
            disabled={!turmaId}
            size="small"
          />
        </Box>
      </Box>

      {/* Status alert */}
      {turmaId && disciplinaId && !loadingAlunos && (
        hasWhitelist ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {checkedIds.size} de {alunos.length} alunos selecionados para esta disciplina.
          </Alert>
        ) : (
          <Alert severity="info" sx={{ mb: 2 }}>
            Todos os alunos participam desta disciplina (sem filtro configurado).
          </Alert>
        )
      )}

      {/* Content */}
      {!turmaId || !disciplinaId ? (
        <Alert severity="info">
          Selecione uma turma e disciplina para configurar os alunos.
        </Alert>
      ) : loadingAlunos ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : alunos.length === 0 ? (
        <Alert severity="info">Nenhum aluno encontrado nesta turma.</Alert>
      ) : (
        <>
          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <Button size="small" startIcon={<SelectAll />} onClick={selectAll}>
              Selecionar Todos
            </Button>
            <Button size="small" startIcon={<Deselect />} onClick={deselectAll}>
              Desmarcar Todos
            </Button>
          </Box>

          {/* Student checklist */}
          <List dense sx={{ maxHeight: 400, overflow: 'auto', border: 1, borderColor: 'divider', borderRadius: 1, mb: 2 }}>
            {alunos.map((aluno, index) => (
              <ListItem key={aluno.id} disablePadding>
                <ListItemButton onClick={() => toggleAluno(aluno.id)} dense>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Checkbox
                      edge="start"
                      checked={checkedIds.has(aluno.id)}
                      tabIndex={-1}
                      disableRipple
                    />
                  </ListItemIcon>
                  <ListItemText primary={`${index + 1}. ${aluno.nome}`} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ mb: 2 }} />

          {/* Save / Clear */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={clearWhitelist}
              disabled={!hasWhitelist || saving}
            >
              Limpar Configuracao
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={18} /> : <Save />}
              onClick={save}
              disabled={!hasChanges || saving || checkedIds.size === 0}
            >
              Salvar
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}
