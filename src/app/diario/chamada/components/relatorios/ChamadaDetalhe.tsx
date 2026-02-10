/**
 * Componente de detalhe da chamada - permite visualizar e editar presencas.
 */

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Button,
  IconButton,
  Checkbox,
  TextField,
  CircularProgress,
  Tooltip,
  Avatar,
} from '@mui/material';
import {
  ArrowBack,
  Print as PrintIcon,
  Save,
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
} from '@mui/icons-material';
import { Chamada, Turma, Disciplina, Usuario, PresencaAluno } from '@/types';
import { chamadaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';
import { formatDateFull, formatTime, printReport } from './utils';

interface ChamadaDetalheProps {
  chamada: Chamada;
  turma: Turma | undefined;
  disciplina: Disciplina | undefined;
  professor: Usuario | null;
  data: string;
  onBack: () => void;
  onUpdate: (updatedChamada: Chamada) => void;
}

const avatarColors = [
  '#1976d2', '#388e3c', '#d32f2f', '#7b1fa2', '#1565c0',
  '#2e7d32', '#c62828', '#6a1b9a', '#0d47a1', '#1b5e20',
];

export function ChamadaDetalhe({
  chamada,
  turma,
  disciplina,
  professor,
  data,
  onBack,
  onUpdate,
}: ChamadaDetalheProps) {
  const { addToast } = useUIStore();
  const [presencas, setPresencas] = useState<PresencaAluno[]>(chamada.presencas);
  const [conteudo, setConteudo] = useState(chamada.conteudo || '');
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const presentes = presencas.filter(p => p.presente);
  const ausentes = presencas.filter(p => !p.presente);

  const handleTogglePresenca = (alunoId: string) => {
    setPresencas(prev => prev.map(p =>
      p.alunoId === alunoId ? { ...p, presente: !p.presente } : p
    ));
  };

  const handleJustificativaChange = (alunoId: string, justificativa: string) => {
    setPresencas(prev => prev.map(p =>
      p.alunoId === alunoId ? { ...p, justificativa } : p
    ));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await chamadaService.update(chamada.id, {
        presencas,
        conteudo: conteudo || undefined,
      });
      onUpdate({ ...chamada, presencas, conteudo });
      addToast('Chamada atualizada com sucesso', 'success');
      setEditMode(false);
    } catch (error) {
      console.error('Erro ao salvar chamada:', error);
      addToast('Erro ao salvar chamada', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const tableRows = presencas.map((p, idx) => `
      <tr class="${p.presente ? '' : 'ausente-row'}">
        <td>${String(idx + 1).padStart(2, '0')}</td>
        <td>${p.alunoNome}</td>
        <td class="${p.presente ? 'presente' : 'ausente'}">${p.presente ? 'P' : 'F'}</td>
        <td>${p.justificativa || '-'}</td>
      </tr>
    `).join('');

    const content = `
      <div class="chamada-section">
        <div class="section-header">
          <p class="section-title">${turma?.nome || 'Turma N/A'}</p>
          <p class="section-subtitle">${disciplina?.nome || 'Disciplina N/A'} - ${formatTime(chamada.createdAt) ? 'Registrado as ' + formatTime(chamada.createdAt) : chamada.tempo + 'o Tempo'}</p>
        </div>
        <div class="stats">
          <span class="stat-item"><strong>${presentes.length}</strong> Presentes</span>
          <span class="stat-item"><strong>${ausentes.length}</strong> Ausentes</span>
          <span class="stat-item"><strong>${presencas.length}</strong> Total</span>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 50px">#</th>
              <th>Aluno</th>
              <th style="width: 80px">Status</th>
              <th>Observacao</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
        ${conteudo ? `
          <div class="conteudo">
            <strong>Conteudo Ministrado:</strong><br>
            ${conteudo}
          </div>
        ` : ''}
      </div>
    `;

    printReport({
      title: 'Detalhe da Chamada',
      subtitle: formatDateFull(data),
      professor: professor?.nome || 'N/A',
      content,
    });
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={onBack} size="small">
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {turma?.nome || 'Turma N/A'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {disciplina?.nome || 'Disciplina N/A'} - {chamada.createdAt ? `Registrado as ${formatTime(chamada.createdAt)}` : `${chamada.tempo}o Tempo`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {editMode ? (
            <>
              <Button
                variant="outlined"
                onClick={() => {
                  setPresencas(chamada.presencas);
                  setConteudo(chamada.conteudo || '');
                  setEditMode(false);
                }}
                size="small"
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                onClick={handleSave}
                disabled={saving}
                size="small"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={handlePrint}
                size="small"
              >
                Imprimir
              </Button>
              <Button
                variant="contained"
                onClick={() => setEditMode(true)}
                size="small"
              >
                Editar
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Estatisticas */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.50' }}>
        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h4" color="success.main" fontWeight={600}>
              {presentes.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Presentes
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="error.main" fontWeight={600}>
              {ausentes.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Ausentes
            </Typography>
          </Box>
          <Box>
            <Typography variant="h4" color="text.secondary" fontWeight={600}>
              {presencas.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Lista de Alunos */}
      <Paper sx={{ overflow: 'hidden', mb: 3 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell sx={{ width: 50 }}>#</TableCell>
                <TableCell>Aluno</TableCell>
                <TableCell sx={{ width: 120 }} align="center">Status</TableCell>
                <TableCell>Observacao</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {presencas.map((presenca, idx) => (
                <TableRow
                  key={presenca.alunoId}
                  sx={{
                    bgcolor: presenca.presente ? 'inherit' : 'error.50',
                    '&:hover': { bgcolor: presenca.presente ? 'action.hover' : 'error.100' },
                  }}
                >
                  <TableCell>{String(idx + 1).padStart(2, '0')}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          fontSize: '0.8rem',
                          bgcolor: avatarColors[idx % avatarColors.length],
                        }}
                      >
                        {presenca.alunoNome.charAt(0)}
                      </Avatar>
                      <Typography variant="body2">{presenca.alunoNome}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {editMode ? (
                      <Checkbox
                        checked={presenca.presente}
                        onChange={() => handleTogglePresenca(presenca.alunoId)}
                        sx={{
                          color: presenca.presente ? 'success.main' : 'error.main',
                          '&.Mui-checked': { color: 'success.main' },
                        }}
                      />
                    ) : (
                      <Chip
                        icon={presenca.presente ? <PresentIcon /> : <AbsentIcon />}
                        label={presenca.presente ? 'Presente' : 'Ausente'}
                        size="small"
                        color={presenca.presente ? 'success' : 'error'}
                        sx={{ minWidth: 90 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {editMode ? (
                      <TextField
                        size="small"
                        placeholder="Observacao"
                        value={presenca.justificativa || ''}
                        onChange={(e) => handleJustificativaChange(presenca.alunoId, e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{ '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' } }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {presenca.justificativa || '-'}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Conteudo Ministrado */}
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Conteudo Ministrado
        </Typography>
        {editMode ? (
          <TextField
            multiline
            rows={3}
            fullWidth
            placeholder="Descreva o conteudo ministrado nesta aula"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
          />
        ) : (
          <Typography variant="body2">
            {conteudo || 'Nenhum conteudo registrado'}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
