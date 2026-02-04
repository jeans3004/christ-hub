'use client';

/**
 * Pagina de Controle de Atestados
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Stack,
  Tabs,
  Tab,
  LinearProgress,
  Link,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AttachFile as AttachIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useFilterStore } from '@/store/filterStore';
import { useUIStore } from '@/store/uiStore';
import { useAuth } from '@/hooks/useAuth';
import { useTurmas, useAlunosByTurma } from '@/hooks';
import { useDriveUpload } from '@/hooks/useDriveUpload';
import { atestadoService } from '@/services/firestore/atestadoService';
import { Atestado, TipoAtestado, Aluno } from '@/types';

const tiposAtestado: { value: TipoAtestado; label: string }[] = [
  { value: 'medico', label: 'Medico' },
  { value: 'judicial', label: 'Judicial' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'outro', label: 'Outro' },
];

export default function AtestadosPage() {
  const { ano } = useFilterStore();
  const { addToast } = useUIStore();
  const { usuario } = useAuth();
  const { turmas } = useTurmas(ano);

  // Hook para upload no Google Drive
  const { upload: uploadToDrive, uploadState, isConnected: isDriveConnected } = useDriveUpload();

  // Verificar se usuario pode aprovar (admin ou coordenador)
  const podeAprovar = usuario?.tipo === 'administrador' || usuario?.tipo === 'coordenador';

  // Tab atual
  const [tabValue, setTabValue] = useState(0);

  // Dados
  const [pendentes, setPendentes] = useState<Atestado[]>([]);
  const [aprovados, setAprovados] = useState<Atestado[]>([]);
  const [rejeitados, setRejeitados] = useState<Atestado[]>([]);
  const [loading, setLoading] = useState(false);

  // Modal de novo atestado
  const [modalOpen, setModalOpen] = useState(false);
  const [turmaId, setTurmaId] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [tipo, setTipo] = useState<TipoAtestado>('medico');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
  const [descricao, setDescricao] = useState('');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Alunos da turma selecionada no modal
  const { alunos } = useAlunosByTurma(turmaId || null);

  // Confirmacao
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Modal de rejeicao
  const [rejeicaoModal, setRejeicaoModal] = useState({
    open: false,
    atestadoId: '',
    motivo: '',
  });

  // Carregar atestados
  const loadAtestados = useCallback(async () => {
    setLoading(true);
    try {
      const [pend, aprov, rej] = await Promise.all([
        atestadoService.getByStatus('pendente'),
        atestadoService.getByStatus('aprovado'),
        atestadoService.getByStatus('rejeitado'),
      ]);
      setPendentes(pend);
      setAprovados(aprov);
      setRejeitados(rej);
    } catch (error) {
      console.error('Erro ao carregar atestados:', error);
      addToast('Erro ao carregar atestados', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadAtestados();
  }, [loadAtestados]);

  // Salvar novo atestado
  const handleSave = async () => {
    if (!turmaId || !alunoSelecionado || !descricao || !usuario) {
      addToast('Preencha todos os campos obrigatorios', 'error');
      return;
    }

    setSaving(true);

    try {
      const turma = turmas.find(t => t.id === turmaId);

      // Criar o atestado primeiro
      const atestadoId = await atestadoService.create({
        alunoId: alunoSelecionado.id,
        alunoNome: alunoSelecionado.nome,
        turmaId,
        turmaNome: turma?.nome || '',
        tipo,
        dataInicio: new Date(dataInicio + 'T00:00:00'),
        dataFim: new Date(dataFim + 'T23:59:59'),
        descricao,
        status: 'pendente',
        registradoPorId: usuario.id,
        registradoPorNome: usuario.nome,
      });

      // Se tem arquivo, fazer upload para o Google Drive
      if (arquivo) {
        try {
          // Renomear arquivo para incluir nome do aluno e data
          const dataFormatada = dataInicio.replace(/-/g, '');
          const nomeArquivo = `${alunoSelecionado.nome}_${dataFormatada}_${arquivo.name}`;
          const arquivoRenomeado = new File([arquivo], nomeArquivo, { type: arquivo.type });

          const driveFile = await uploadToDrive(arquivoRenomeado, 'ATESTADOS');

          if (driveFile) {
            // Atualizar atestado com URL do arquivo no Drive
            await atestadoService.update(atestadoId, {
              arquivoUrl: driveFile.webViewLink,
              arquivoNome: nomeArquivo,
            });
          } else {
            addToast('Atestado salvo, mas erro ao anexar arquivo', 'warning');
          }
        } catch (uploadError) {
          console.error('Erro no upload do arquivo:', uploadError);
          addToast('Atestado salvo, mas erro ao anexar arquivo', 'warning');
        }
      }

      addToast('Atestado registrado com sucesso!', 'success');
      setModalOpen(false);
      resetForm();
      loadAtestados();
    } catch (error) {
      console.error('Erro ao salvar atestado:', error);
      addToast('Erro ao registrar atestado', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Aprovar atestado
  const handleAprovar = async (atestadoId: string) => {
    if (!usuario) return;

    try {
      await atestadoService.aprovar(atestadoId, usuario.id, usuario.nome);
      addToast('Atestado aprovado!', 'success');
      loadAtestados();
    } catch (error) {
      console.error('Erro ao aprovar atestado:', error);
      addToast('Erro ao aprovar atestado', 'error');
    }
  };

  // Rejeitar atestado
  const handleRejeitar = async () => {
    if (!usuario || !rejeicaoModal.motivo) {
      addToast('Informe o motivo da rejeicao', 'error');
      return;
    }

    try {
      await atestadoService.rejeitar(
        rejeicaoModal.atestadoId,
        usuario.id,
        usuario.nome,
        rejeicaoModal.motivo
      );
      addToast('Atestado rejeitado', 'info');
      setRejeicaoModal({ open: false, atestadoId: '', motivo: '' });
      loadAtestados();
    } catch (error) {
      console.error('Erro ao rejeitar atestado:', error);
      addToast('Erro ao rejeitar atestado', 'error');
    }
  };

  // Deletar atestado
  const handleDelete = async (atestadoId: string) => {
    try {
      // Nota: Arquivo no Drive nao e deletado automaticamente
      // Pode ser removido manualmente se necessario
      await atestadoService.delete(atestadoId);
      addToast('Atestado removido!', 'success');
      loadAtestados();
    } catch (error) {
      console.error('Erro ao deletar atestado:', error);
      addToast('Erro ao remover atestado', 'error');
    }
  };

  const resetForm = () => {
    setTurmaId('');
    setAlunoSelecionado(null);
    setTipo('medico');
    setDataInicio(new Date().toISOString().split('T')[0]);
    setDataFim(new Date().toISOString().split('T')[0]);
    setDescricao('');
    setArquivo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho maximo (25MB para Drive)
      const maxSize = 25 * 1024 * 1024;
      if (file.size > maxSize) {
        addToast('Arquivo muito grande. Tamanho maximo: 25MB', 'error');
        return;
      }
      setArquivo(file);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'success';
      case 'rejeitado': return 'error';
      default: return 'warning';
    }
  };

  const getTipoLabel = (tipo: TipoAtestado) => {
    return tiposAtestado.find(t => t.value === tipo)?.label || tipo;
  };

  const renderTable = (atestados: Atestado[], showActions: boolean) => (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Aluno</TableCell>
            <TableCell>Turma</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Periodo</TableCell>
            <TableCell>Descricao</TableCell>
            <TableCell>Arquivo</TableCell>
            <TableCell>Registrado por</TableCell>
            {showActions && podeAprovar && <TableCell width={120}>Acoes</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {atestados.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography color="text.secondary">Nenhum atestado encontrado</Typography>
              </TableCell>
            </TableRow>
          ) : (
            atestados.map((atestado) => (
              <TableRow key={atestado.id} hover>
                <TableCell>{atestado.alunoNome}</TableCell>
                <TableCell>{atestado.turmaNome}</TableCell>
                <TableCell>
                  <Chip label={getTipoLabel(atestado.tipo)} size="small" />
                </TableCell>
                <TableCell>
                  {formatDate(atestado.dataInicio)} - {formatDate(atestado.dataFim)}
                </TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography noWrap title={atestado.descricao}>
                    {atestado.descricao}
                  </Typography>
                </TableCell>
                <TableCell>
                  {atestado.arquivoUrl ? (
                    <Link href={atestado.arquivoUrl} target="_blank" rel="noopener">
                      <IconButton size="small" color="primary">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{atestado.registradoPorNome}</TableCell>
                {showActions && podeAprovar && (
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <IconButton
                        size="small"
                        color="success"
                        title="Aprovar"
                        onClick={() => handleAprovar(atestado.id)}
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        title="Rejeitar"
                        onClick={() => setRejeicaoModal({ open: true, atestadoId: atestado.id, motivo: '' })}
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="default"
                        title="Excluir"
                        onClick={() => setConfirmDialog({
                          open: true,
                          title: 'Excluir Atestado',
                          message: 'Tem certeza que deseja excluir este atestado?',
                          action: () => {
                            handleDelete(atestado.id);
                            setConfirmDialog(prev => ({ ...prev, open: false }));
                          },
                        })}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <MainLayout title="Controle de Atestados">
      <Box sx={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
        {/* Header com botao */}
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Atestados e Justificativas</Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setModalOpen(true)}
            >
              Novo Atestado
            </Button>
          </Stack>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ p: 2 }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
            <Tab label={`Pendentes (${pendentes.length})`} />
            <Tab label={`Aprovados (${aprovados.length})`} />
            <Tab label={`Rejeitados (${rejeitados.length})`} />
          </Tabs>

          {loading ? (
            <Typography color="text.secondary">Carregando...</Typography>
          ) : (
            <>
              {tabValue === 0 && renderTable(pendentes, true)}
              {tabValue === 1 && renderTable(aprovados, false)}
              {tabValue === 2 && renderTable(rejeitados, false)}
            </>
          )}
        </Paper>
      </Box>

      {/* Modal de novo atestado */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Atestado</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Turma</InputLabel>
              <Select
                value={turmaId}
                label="Turma"
                onChange={(e) => {
                  setTurmaId(e.target.value);
                  setAlunoSelecionado(null);
                }}
              >
                {turmas.map((turma) => (
                  <MenuItem key={turma.id} value={turma.id}>
                    {turma.nome}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Autocomplete
              options={alunos}
              getOptionLabel={(aluno) => aluno.nome}
              value={alunoSelecionado}
              onChange={(_, newValue) => setAlunoSelecionado(newValue)}
              disabled={!turmaId}
              renderInput={(params) => (
                <TextField {...params} label="Aluno" placeholder="Selecione o aluno" />
              )}
            />

            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={tipo}
                label="Tipo"
                onChange={(e) => setTipo(e.target.value as TipoAtestado)}
              >
                {tiposAtestado.map((t) => (
                  <MenuItem key={t.value} value={t.value}>
                    {t.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack direction="row" spacing={2}>
              <TextField
                label="Data Inicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="Data Fim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <TextField
              label="Descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              multiline
              rows={3}
              fullWidth
              required
            />

            <Box>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
                id="arquivo-atestado"
              />
              <label htmlFor="arquivo-atestado">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AttachIcon />}
                >
                  {arquivo ? arquivo.name : 'Anexar Arquivo'}
                </Button>
              </label>
              {arquivo && (
                <IconButton size="small" onClick={() => setArquivo(null)} sx={{ ml: 1 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              )}
            </Box>

            {uploadState.isUploading && (
              <LinearProgress variant="determinate" value={uploadState.progress} />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de rejeicao */}
      <Dialog
        open={rejeicaoModal.open}
        onClose={() => setRejeicaoModal({ open: false, atestadoId: '', motivo: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Rejeitar Atestado</DialogTitle>
        <DialogContent>
          <TextField
            label="Motivo da Rejeicao"
            value={rejeicaoModal.motivo}
            onChange={(e) => setRejeicaoModal(prev => ({ ...prev, motivo: e.target.value }))}
            multiline
            rows={3}
            fullWidth
            required
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejeicaoModal({ open: false, atestadoId: '', motivo: '' })}>
            Cancelar
          </Button>
          <Button variant="contained" color="error" onClick={handleRejeitar}>
            Rejeitar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmacao */}
      <ConfirmDialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog(prev => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </MainLayout>
  );
}
