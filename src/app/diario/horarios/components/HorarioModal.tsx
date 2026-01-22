/**
 * Modal para criar/editar horario.
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  IconButton,
  Chip,
  OutlinedInput,
  Checkbox,
  ListItemText,
} from '@mui/material';
import { Close as CloseIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { HorarioAula, Turma, Disciplina, Usuario, DiaSemana, DiasSemanaNomes, HorarioSlot } from '@/types';

interface HorarioModalProps {
  open: boolean;
  horario: HorarioAula | null;
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Usuario[];
  turmaId: string;
  professorId: string;
  ano: number;
  selectedSlot: { dia: DiaSemana; slot: HorarioSlot } | null;
  saving: boolean;
  onClose: () => void;
  onCreate: (data: Omit<HorarioAula, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  onUpdate: (id: string, data: Partial<HorarioAula>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const DIAS_SEMANA: DiaSemana[] = [1, 2, 3, 4, 5]; // Segunda a Sexta

// Disciplinas que permitem múltiplos professores
const DISCIPLINAS_MULTIPLOS_PROFESSORES = ['trilhas', 'trilha'];

export function HorarioModal({
  open,
  horario,
  turmas,
  disciplinas,
  professores,
  turmaId: initialTurmaId,
  professorId: initialProfessorId,
  ano,
  selectedSlot,
  saving,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: HorarioModalProps) {
  const isEditing = !!horario;

  // Form state
  const [professorId, setProfessorId] = useState('');
  const [professorIds, setProfessorIds] = useState<string[]>([]);
  const [turmaId, setTurmaId] = useState('');
  const [disciplinaId, setDisciplinaId] = useState('');
  const [diaSemana, setDiaSemana] = useState<DiaSemana>(1);
  const [horaInicio, setHoraInicio] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [sala, setSala] = useState('');

  // Verificar se a disciplina selecionada permite múltiplos professores
  const selectedDisciplina = useMemo(() => {
    return disciplinas.find(d => d.id === disciplinaId);
  }, [disciplinas, disciplinaId]);

  const allowsMultipleProfessors = useMemo(() => {
    if (!selectedDisciplina) return false;
    const nome = selectedDisciplina.nome?.toLowerCase() || '';
    return DISCIPLINAS_MULTIPLOS_PROFESSORES.some(d => nome.includes(d));
  }, [selectedDisciplina]);

  // Inicializar form
  useEffect(() => {
    if (open) {
      if (horario) {
        // Modo edicao
        setProfessorId(horario.professorId);
        setProfessorIds(horario.professorIds || [horario.professorId]);
        setTurmaId(horario.turmaId);
        setDisciplinaId(horario.disciplinaId);
        setDiaSemana(horario.diaSemana);
        setHoraInicio(horario.horaInicio);
        setHoraFim(horario.horaFim);
        setSala(horario.sala || '');
      } else {
        // Modo criacao
        setProfessorId(initialProfessorId);
        setProfessorIds(initialProfessorId ? [initialProfessorId] : []);
        setTurmaId(initialTurmaId);
        setDisciplinaId('');
        setSala('');
        if (selectedSlot) {
          setDiaSemana(selectedSlot.dia);
          setHoraInicio(selectedSlot.slot.horaInicio);
          setHoraFim(selectedSlot.slot.horaFim);
        } else {
          setDiaSemana(1);
          setHoraInicio('');
          setHoraFim('');
        }
      }
    }
  }, [open, horario, initialTurmaId, initialProfessorId, selectedSlot]);

  // Quando mudar de disciplina normal para Trilhas ou vice-versa, sincronizar professores
  useEffect(() => {
    if (allowsMultipleProfessors) {
      // Se mudou para Trilhas e só tem um professor, inicializar array
      if (professorId && professorIds.length === 0) {
        setProfessorIds([professorId]);
      }
    } else {
      // Se mudou de Trilhas para outra, usar primeiro professor do array
      if (professorIds.length > 0 && !professorId) {
        setProfessorId(professorIds[0]);
      }
    }
  }, [allowsMultipleProfessors, professorId, professorIds]);

  const handleSubmit = async () => {
    const hasValidProfessor = allowsMultipleProfessors
      ? professorIds.length > 0
      : !!professorId;

    if (!hasValidProfessor || !turmaId || !disciplinaId || !horaInicio || !horaFim) {
      return;
    }

    const data: Omit<HorarioAula, 'id' | 'createdAt' | 'updatedAt'> = {
      professorId: allowsMultipleProfessors ? professorIds[0] : professorId,
      turmaId,
      disciplinaId,
      diaSemana,
      horaInicio,
      horaFim,
      ano,
      ativo: true,
    };

    // Adicionar professorIds para disciplinas com múltiplos professores
    if (allowsMultipleProfessors && professorIds.length > 0) {
      data.professorIds = professorIds;
    }

    // Adicionar sala apenas se preenchida (Firebase nao aceita undefined)
    if (sala.trim()) {
      data.sala = sala.trim();
    }

    let success: boolean | string | null;
    if (isEditing && horario) {
      success = await onUpdate(horario.id, data);
    } else {
      success = await onCreate(data);
    }

    if (success) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (horario && window.confirm('Tem certeza que deseja remover este horario?')) {
      const success = await onDelete(horario.id);
      if (success) {
        onClose();
      }
    }
  };

  const isValid = (allowsMultipleProfessors ? professorIds.length > 0 : professorId)
    && turmaId && disciplinaId && horaInicio && horaFim;

  // Filtrar disciplinas por turma selecionada
  const disciplinasFiltradas = turmaId
    ? disciplinas.filter(d => !d.turmaIds || d.turmaIds.length === 0 || d.turmaIds.includes(turmaId))
    : disciplinas;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{isEditing ? 'Editar Horario' : 'Novo Horario'}</span>
        <Box>
          {isEditing && (
            <IconButton onClick={handleDelete} color="error" size="small" sx={{ mr: 1 }}>
              <DeleteIcon />
            </IconButton>
          )}
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Turma */}
          <FormControl fullWidth size="small">
            <InputLabel>Turma *</InputLabel>
            <Select
              value={turmaId}
              label="Turma *"
              onChange={(e) => {
                setTurmaId(e.target.value);
                setDisciplinaId(''); // Reset disciplina ao trocar turma
              }}
            >
              {turmas.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Disciplina */}
          <FormControl fullWidth size="small">
            <InputLabel>Disciplina *</InputLabel>
            <Select
              value={disciplinaId}
              label="Disciplina *"
              onChange={(e) => setDisciplinaId(e.target.value)}
              disabled={!turmaId}
            >
              {disciplinasFiltradas.map((d) => (
                <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Professor(es) */}
          {allowsMultipleProfessors ? (
            <FormControl fullWidth size="small">
              <InputLabel>Professores *</InputLabel>
              <Select
                multiple
                value={professorIds}
                label="Professores *"
                onChange={(e) => {
                  const value = e.target.value;
                  setProfessorIds(typeof value === 'string' ? value.split(',') : value);
                }}
                input={<OutlinedInput label="Professores *" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const prof = professores.find(p => p.id === id);
                      return (
                        <Chip
                          key={id}
                          label={prof?.nome?.split(' ')[0] || id}
                          size="small"
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {professores.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    <Checkbox checked={professorIds.includes(p.id)} />
                    <ListItemText primary={p.nome} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <FormControl fullWidth size="small">
              <InputLabel>Professor *</InputLabel>
              <Select
                value={professorId}
                label="Professor *"
                onChange={(e) => setProfessorId(e.target.value)}
              >
                {professores.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Dia da Semana */}
          <FormControl fullWidth size="small">
            <InputLabel>Dia da Semana *</InputLabel>
            <Select
              value={diaSemana}
              label="Dia da Semana *"
              onChange={(e) => setDiaSemana(Number(e.target.value) as DiaSemana)}
            >
              {DIAS_SEMANA.map((dia) => (
                <MenuItem key={dia} value={dia}>{DiasSemanaNomes[dia]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Horarios */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Hora Inicio *"
              type="time"
              size="small"
              fullWidth
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Hora Fim *"
              type="time"
              size="small"
              fullWidth
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Sala */}
          <TextField
            label="Sala (opcional)"
            size="small"
            fullWidth
            value={sala}
            onChange={(e) => setSala(e.target.value)}
            placeholder="Ex: 101, Lab 1, Quadra"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!isValid || saving}
          startIcon={saving && <CircularProgress size={16} color="inherit" />}
        >
          {saving ? 'Salvando...' : isEditing ? 'Atualizar' : 'Criar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
