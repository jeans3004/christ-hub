'use client';

/**
 * Conteudo do formulario de aluno.
 */

import { Box, TextField, FormControl, InputLabel, Select, MenuItem, Typography, Alert } from '@mui/material';
import { Turma, TipoEnsino, Turno } from '@/types';
import { AlunoForm, tiposEnsino, turmasLetras, turnos, seriesPorEnsino, generateTurmaNome } from '../types';
import { useMemo, useEffect } from 'react';

interface AlunoFormContentProps {
  form: AlunoForm;
  setForm: React.Dispatch<React.SetStateAction<AlunoForm>>;
  turmas: Turma[];
}

export function AlunoFormContent({ form, setForm, turmas }: AlunoFormContentProps) {
  const seriesDisponiveis = seriesPorEnsino[form.ensino] || [];

  // Gerar nome da turma e buscar turmaId correspondente
  const turmaNomeGerado = useMemo(() => {
    return generateTurmaNome(form.serie, form.turmaLetra, form.turno);
  }, [form.serie, form.turmaLetra, form.turno]);

  const turmaEncontrada = useMemo(() => {
    return turmas.find(t => t.nome === turmaNomeGerado);
  }, [turmas, turmaNomeGerado]);

  const handleEnsinoChange = (ensino: TipoEnsino) => {
    const seriesDoEnsino = seriesPorEnsino[ensino];
    setForm(prev => ({
      ...prev,
      ensino,
      serie: seriesDoEnsino[0] || '',
    }));
  };

  // Atualizar turmaId quando turma é encontrada
  useEffect(() => {
    if (turmaEncontrada && form.turmaId !== turmaEncontrada.id) {
      setForm(prev => ({ ...prev, turmaId: turmaEncontrada.id }));
    } else if (!turmaEncontrada && form.turmaId !== '') {
      setForm(prev => ({ ...prev, turmaId: '' }));
    }
  }, [turmaEncontrada, form.turmaId, setForm]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Nome Completo"
        value={form.nome}
        onChange={(e) => setForm(prev => ({ ...prev, nome: e.target.value }))}
        fullWidth
        required
      />

      <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
        Selecione a Turma
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <FormControl fullWidth required>
          <InputLabel>Ensino</InputLabel>
          <Select
            value={form.ensino}
            label="Ensino"
            onChange={(e) => handleEnsinoChange(e.target.value as TipoEnsino)}
          >
            {tiposEnsino.map((ensino) => (
              <MenuItem key={ensino} value={ensino}>{ensino}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Série</InputLabel>
          <Select
            value={form.serie}
            label="Série"
            onChange={(e) => setForm(prev => ({ ...prev, serie: e.target.value }))}
          >
            {seriesDisponiveis.map((serie) => (
              <MenuItem key={serie} value={serie}>{serie}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Turma</InputLabel>
          <Select
            value={form.turmaLetra}
            label="Turma"
            onChange={(e) => setForm(prev => ({ ...prev, turmaLetra: e.target.value }))}
          >
            {turmasLetras.map((turma) => (
              <MenuItem key={turma} value={turma}>{turma}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth required>
          <InputLabel>Turno</InputLabel>
          <Select
            value={form.turno}
            label="Turno"
            onChange={(e) => setForm(prev => ({ ...prev, turno: e.target.value as Turno }))}
          >
            {turnos.map((turno) => (
              <MenuItem key={turno} value={turno}>{turno}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {turmaNomeGerado && (
        <Alert severity={turmaEncontrada ? 'success' : 'warning'} sx={{ py: 0.5 }}>
          {turmaEncontrada
            ? `Turma selecionada: ${turmaNomeGerado}`
            : `Turma "${turmaNomeGerado}" não encontrada no sistema`
          }
        </Alert>
      )}

      <TextField
        label="Matrícula"
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
