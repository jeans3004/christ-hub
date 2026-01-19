'use client';

/**
 * Pagina de mensagens WhatsApp.
 * Permite enviar mensagens para professores e visualizar historico.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import { Send, History, WhatsApp } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useMensagensLoader, useMensagensActions } from './hooks';
import {
  DestinatarioSelector,
  MensagemComposer,
  HistoricoTable,
  StatusIndicator,
} from './components';
import { TabValue, Destinatario } from './types';

export default function MensagensPage() {
  const { can } = usePermissions();
  const canView = can('mensagens:view');
  const canSend = can('mensagens:send');

  // Tab ativa
  const [activeTab, setActiveTab] = useState<TabValue>('enviar');

  // Carregar dados
  const {
    destinatarios,
    historico,
    templates,
    whatsappStatus,
    loading,
    loadingHistorico,
    refreshHistorico,
    refreshStatus,
  } = useMensagensLoader();

  // Acoes
  const {
    form,
    setForm,
    sending,
    sendResult,
    sendMessage,
    resetForm,
    clearResult,
    applyTemplate,
  } = useMensagensActions(() => {
    refreshHistorico();
  });

  // IDs selecionados
  const selectedIds = useMemo(
    () => form.destinatarios.map((d) => d.id),
    [form.destinatarios]
  );

  // Handler para selecao de destinatarios
  const handleDestinatariosChange = useCallback(
    (ids: string[]) => {
      const selected = destinatarios.filter((d) => ids.includes(d.id));
      setForm((prev) => ({ ...prev, destinatarios: selected }));
    },
    [destinatarios, setForm]
  );

  // Handler para mensagem
  const handleMensagemChange = useCallback(
    (mensagem: string) => {
      setForm((prev) => ({ ...prev, mensagem }));
    },
    [setForm]
  );

  // Handler para envio
  const handleSend = useCallback(async () => {
    const success = await sendMessage();
    if (success) {
      resetForm();
    }
  }, [sendMessage, resetForm]);

  // Permissao negada
  if (!canView) {
    return (
      <MainLayout title="Mensagens WhatsApp" showSidebar>
        <Alert severity="error">
          Voce nao tem permissao para acessar esta pagina.
        </Alert>
      </MainLayout>
    );
  }

  // Loading inicial
  if (loading) {
    return (
      <MainLayout title="Mensagens WhatsApp" showSidebar>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Mensagens WhatsApp" showSidebar>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WhatsApp sx={{ fontSize: 32, color: '#25D366' }} />
            <Typography variant="h5" fontWeight={600}>
              Mensagens WhatsApp
            </Typography>
          </Box>
          <StatusIndicator status={whatsappStatus} onRefresh={refreshStatus} compact />
        </Box>

        {/* Status do WhatsApp (expandido) */}
        <StatusIndicator status={whatsappStatus} onRefresh={refreshStatus} />

        {/* Alerta se desconectado */}
        {!whatsappStatus.loading && !whatsappStatus.connected && (
          <Alert severity="warning">
            O WhatsApp esta desconectado. Conecte escaneando o QR Code para enviar mensagens.
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<Send />}
              iconPosition="start"
              label="Enviar Mensagem"
              value="enviar"
              disabled={!canSend}
            />
            <Tab
              icon={<History />}
              iconPosition="start"
              label="Historico"
              value="historico"
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* Tab: Enviar */}
            {activeTab === 'enviar' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Resultado do envio */}
                {sendResult && (
                  <Alert
                    severity={sendResult.falhas === 0 ? 'success' : sendResult.enviadas > 0 ? 'warning' : 'error'}
                    onClose={clearResult}
                  >
                    {sendResult.falhas === 0
                      ? `${sendResult.enviadas} mensagem(ns) enviada(s) com sucesso!`
                      : `${sendResult.enviadas} de ${sendResult.total} mensagens enviadas. ${sendResult.falhas} falha(s).`}
                  </Alert>
                )}

                {/* Grid: Destinatarios e Mensagem */}
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                  }}
                >
                  {/* Selecao de destinatarios */}
                  <Card variant="outlined">
                    <CardContent>
                      <DestinatarioSelector
                        destinatarios={destinatarios}
                        selected={selectedIds}
                        onChange={handleDestinatariosChange}
                        disabled={sending || !whatsappStatus.connected}
                      />
                    </CardContent>
                  </Card>

                  {/* Composer */}
                  <Card variant="outlined">
                    <CardContent>
                      <MensagemComposer
                        value={form.mensagem}
                        onChange={handleMensagemChange}
                        templates={templates}
                        onApplyTemplate={applyTemplate}
                        disabled={sending || !whatsappStatus.connected}
                        sending={sending}
                      />
                    </CardContent>
                  </Card>
                </Box>

                {/* Botao de envio */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    disabled={sending || (!form.mensagem && form.destinatarios.length === 0)}
                  >
                    Limpar
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={sending ? <CircularProgress size={20} color="inherit" /> : <Send />}
                    onClick={handleSend}
                    disabled={
                      sending ||
                      !whatsappStatus.connected ||
                      !form.mensagem.trim() ||
                      form.destinatarios.length === 0
                    }
                  >
                    {sending
                      ? 'Enviando...'
                      : form.destinatarios.length > 1
                        ? `Enviar para ${form.destinatarios.length} pessoas`
                        : 'Enviar Mensagem'}
                  </Button>
                </Box>
              </Box>
            )}

            {/* Tab: Historico */}
            {activeTab === 'historico' && (
              <HistoricoTable
                data={historico}
                loading={loadingHistorico}
                onRefresh={refreshHistorico}
              />
            )}
          </Box>
        </Paper>
      </Box>
    </MainLayout>
  );
}
