'use client';

/**
 * Conteudo do formulario de aluno.
 */

import { Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Turma } from '@/types';
import { AlunoForm } from '../types';

interface AlunoFormContentProps {
  form: AlunoForm;
  setForm: React.Dispatch<React.SetStateAction<AlunoForm>>;
  turmas: Turma[];
}

export function AlunoFormContent({ form, setForm, turmas }: AlunoFormContentProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Nome Completo"
        value={form.nome}
        onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
        fullWidth
        required
      />

      <FormControl fullWidth required>
        <InputLabel>Turma</InputLabel>
        <Select
          value={form.turmaId}
          label="Turma"
          onChange={(e) => setForm(prev => ({ ...prev, turmaId: e.target.value }))}
        >
          {turmas.map((turma) => (
            <MenuItem key={turma.id} value={turma.id}>{turma.nome}</MenuItem>
          ))}
        </Select>
      </FormControl>

      <TextField
        label="Matricula"
        value={form.matricula}
        onChange={(e) => setForm(prev => ({ ...prev, matricula: e.target.value }))}
        fullWidth
      />

      <TextField
        label="CPF"
        value={form.cpf}
        onChange={(e) => setForm(prev => ({ ...prev, cpf: e.target.value }))}
        fullWidth
        placeholder="000.000.000-00"
      />

      <TextField
        label="Data de Nascimento"
        type="date"
        value={form.dataNascimento}
        onChange={(e) => setForm(prev => ({ ...prev, dataNascimento: e.target.value }))}
        InputLabelProps={{ shrink: true }}
        fullWidth
      />
    </Box>
  );
}
