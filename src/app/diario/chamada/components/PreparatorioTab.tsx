/**
 * Aba Preparatorio - chamada de alunos de reforco.
 * Agrega alunos de multiplas turmas via whitelist, sem filtro de turma.
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { usePreparatorioLoader } from '../hooks/usePreparatorioLoader';
import { useChamadaData } from '../hooks/useChamadaData';
import { ChamadaList } from './ChamadaList';
import { SalvarChamadaModal } from './SalvarChamadaModal';
import { ConteudoModal } from './ConteudoModal';
import { chamadaService } from '@/services/firestore';
import { useUIStore } from '@/store/uiStore';

export function PreparatorioTab() {
  const { addToast } = useUIStore();
  const {
    disciplinaId,
    setDisciplinaId,
    dataChamada,
    setDataChamada,
    disciplinasPrep,
    alunos,
    loading,
    ano,
  } = usePreparatorioLoader();

  // TurmaId virtual para gravacao no Firestore
  const virtualTurmaId = `_prep_${ano}`;

  const {
    presencas,
    observacoes,
    conteudo,
    setConteudo,
    loading: loadingChamada,
    saving,
    totalPresentes,
    totalAusentes,
    handlePresencaChange,
    handleObservacaoChange,
    handleMarcarTodos,
    handleSaveChamada,
  } = useChamadaData({
    serieId: virtualTurmaId,
    disciplinaId,
    dataChamada,
    alunos,
    turno: 'Vespertino',
  });

  const [showSaveModal, setShowSaveModal] = useState(false);
  const [conteudoModalOpen, setConteudoModalOpen] = useState(false);
  const [dataConteudo, setDataConteudo] = useState(new Date().toISOString().split('T')[0]);

  const handleSaveConteudo = async (tempoInicial: number, quantidade: number) => {
    if (!disciplinaId) {
      addToast('Selecione a disciplina', 'error');
      return;
    }

    try {
      const chamadas = await chamadaService.getByTurmaData(virtualTurmaId, new Date(dataChamada + 'T12:00:00'));
      const tempos = [tempoInicial];
      if (quantidade === 2 && tempoInicial < 7) tempos.push(tempoInicial + 1);

      let salvou = false;
      for (const tempo of tempos) {
        const chamadaExistente = chamadas.find(c => c.disciplinaId === disciplinaId && c.tempo === tempo);
        if (chamadaExistente) {
          await chamadaService.update(chamadaExistente.id, { conteudo: conteudo || undefined });
          salvou = true;
        }
      }

      if (salvou) {
        addToast(quantidade === 2 ? 'Conteudo salvo em 2 tempos!' : 'Conteudo salvo com sucesso!', 'success');
      } else {
        addToast('Conteudo sera salvo junto com a chamada', 'info');
      }
    } catch (error) {
      console.error('Erro ao salvar conteudo:', error);
      addToast('Erro ao salvar conteudo', 'error');
    }

    setConteudoModalOpen(false);
  };

  const isLoading = loading || loadingChamada;

  return (
    <Box>
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Disciplina</InputLabel>
            <Select
              value={disciplinaId}
              label="Disciplina"
              onChange={(e) => setDisciplinaId(e.target.value)}
            >
              {disciplinasPrep.map(d => (
                <MenuItem key={d.id} value={d.id}>{d.nome}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            type="date"
            label="Data"
            size="small"
            value={dataChamada}
            onChange={(e) => setDataChamada(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
        </Box>
      </Paper>

      {/* Conteudo */}
      {!disciplinaId ? (
        <Box
          sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <Person sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Selecione a disciplina do preparatorio para iniciar a chamada
          </Typography>
        </Box>
      ) : isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress />
        </Box>
      ) : alunos.length === 0 ? (
        <Alert severity="info">
          Nenhum aluno configurado para esta disciplina. Configure os alunos na aba &quot;Alunos por Disciplina&quot;.
        </Alert>
      ) : (
        <ChamadaList
          alunos={alunos}
          presencas={presencas}
          observacoes={observacoes}
          totalPresentes={totalPresentes}
          totalAusentes={totalAusentes}
          saving={saving}
          onPresencaChange={handlePresencaChange}
          onObservacaoChange={handleObservacaoChange}
          onMarcarTodos={handleMarcarTodos}
          onSave={() => setShowSaveModal(true)}
          onOpenConteudo={() => setConteudoModalOpen(true)}
        />
      )}

      {/* Salvar Chamada Modal */}
      <SalvarChamadaModal
        open={showSaveModal}
        turno="Vespertino"
        saving={saving}
        onClose={() => setShowSaveModal(false)}
        onConfirm={async (quantidade, tempoInicial) => {
          await handleSaveChamada(quantidade, tempoInicial);
          setShowSaveModal(false);
        }}
      />

      {/* Conteudo Modal */}
      <ConteudoModal
        open={conteudoModalOpen}
        dataConteudo={dataConteudo}
        conteudo={conteudo}
        turno="Vespertino"
        onClose={() => setConteudoModalOpen(false)}
        onDataChange={setDataConteudo}
        onConteudoChange={setConteudo}
        onSave={handleSaveConteudo}
      />
    </Box>
  );
}
