/**
 * Modal de detalhes do aluno com abas.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, useTheme, useMediaQuery } from '@mui/material';
import { Usuario, RelatorioAluno } from '@/types';
import { AlunoDossie } from '../types';
import { TabPanelInfo } from './TabPanelInfo';
import { TabPanelAvaliacoes } from './TabPanelAvaliacoes';
import { TabPanelOcorrencias } from './TabPanelOcorrencias';
import { TabPanelFrequencia } from './TabPanelFrequencia';
import { TabPanelRelatorios } from './TabPanelRelatorios';
import { exportDossiePdf } from '../utils';
import { TabPanel, ModalHeader, ModalLoading, ModalEmpty, ModalTabs } from './modal';
import { relatorioService } from '@/services/firestore';

interface AlunoDetailModalProps {
  open: boolean;
  loading: boolean;
  dossie: AlunoDossie | null;
  canEdit: boolean;
  usuario: Usuario | null;
  ano: number;
  onClose: () => void;
  onPhotoChange: (newUrl: string | null) => void;
}

export function AlunoDetailModal({
  open,
  loading,
  dossie,
  canEdit,
  usuario,
  ano,
  onClose,
  onPhotoChange,
}: AlunoDetailModalProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [tabValue, setTabValue] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [relatoriosCount, setRelatoriosCount] = useState(0);

  // Carregar contagem de relatórios quando o dossie muda
  useEffect(() => {
    if (dossie) {
      relatorioService.getByAluno(dossie.id, ano).then(relatorios => {
        setRelatoriosCount(relatorios.length);
      }).catch(() => setRelatoriosCount(0));
    }
  }, [dossie, ano]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleClose = () => {
    setTabValue(0);
    onClose();
  };

  const handleExportPdf = () => {
    if (!dossie || !usuario) return;
    setExporting(true);
    try {
      exportDossiePdf({ dossie, usuario, ano });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { minHeight: fullScreen ? '100%' : '80vh' },
      }}
    >
      <ModalHeader
        showExport={!!dossie && !!usuario}
        exporting={exporting}
        onExport={handleExportPdf}
        onClose={handleClose}
      />

      <DialogContent sx={{ p: 0 }}>
        {loading ? (
          <ModalLoading />
        ) : !dossie ? (
          <ModalEmpty />
        ) : (
          <>
            <ModalTabs value={tabValue} dossie={dossie} relatoriosCount={relatoriosCount} onChange={handleTabChange} />

            <TabPanel value={tabValue} index={0}>
              <TabPanelInfo dossie={dossie} canEdit={canEdit} userRole={usuario?.tipo} onPhotoChange={onPhotoChange} />
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <TabPanelAvaliacoes avaliacoes={dossie.avaliacoes} />
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <TabPanelOcorrencias ocorrencias={dossie.ocorrencias} />
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <TabPanelFrequencia frequencia={dossie.frequencia} />
            </TabPanel>

            <TabPanel value={tabValue} index={4}>
              <TabPanelRelatorios
                alunoId={dossie.id}
                alunoNome={dossie.nome}
                turmaId={dossie.turmaId}
                usuario={usuario}
                ano={ano}
              />
            </TabPanel>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
