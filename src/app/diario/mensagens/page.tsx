'use client';

/**
 * Pagina de mensagens WhatsApp.
 * Permite enviar mensagens, gerenciar grupos, usar templates, criar enquetes e visualizar historico.
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
  Card,
  CardContent,
} from '@mui/material';
import { Send, History, WhatsApp, Group, Description, Poll } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useMensagensLoader, useMensagensActions, useGrupos, useQuickActions } from './hooks';
import {
  DestinatarioSelector,
  MensagemComposer,
  HistoricoTable,
  StatusIndicator,
  QuickActionsBar,
} from './components';
import { GruposTab } from './components/grupos';
import { TemplatesTab } from './components/templates';
import { PollComposer } from './components/enquetes';
import { TabValue, QuickActionType, TemplatePreset } from './types';
import { getVariaveisSistema, TEMPLATE_PRESETS } from './constants';

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

  // Grupos
  const { grupos } = useGrupos();

  // Quick actions
  const { getActionTemplate, isEnqueteAction } = useQuickActions();

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

  // Handler para quick actions
  const handleQuickAction = useCallback(
    (actionId: QuickActionType) => {
      if (isEnqueteAction(actionId)) {
        setActiveTab('enquetes');
        return;
      }

      const template = getActionTemplate(actionId);
      if (template) {
        const systemVars = getVariaveisSistema();
        let content = template.conteudo;

        // Substituir variaveis do sistema
        Object.entries(systemVars).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          content = content.replace(regex, value);
        });

        setForm((prev) => ({ ...prev, mensagem: content }));
        setActiveTab('enviar');
      }
    },
    [getActionTemplate, isEnqueteAction, setForm]
  );

  // Handler para usar template da aba Templates
  const handleUseTemplate = useCallback(
    (template: TemplatePreset) => {
      const systemVars = getVariaveisSistema();
      let content = template.conteudo;

      // Substituir variaveis do sistema
      Object.entries(systemVars).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        content = content.replace(regex, value);
      });

      setForm((prev) => ({ ...prev, mensagem: content }));
      setActiveTab('enviar');
    },
    [setForm]
  );

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

        {/* Quick Actions Bar */}
        {canSend && whatsappStatus.connected && (
          <QuickActionsBar
            onActionClick={handleQuickAction}
            disabled={!whatsappStatus.connected}
          />
        )}

        {/* Tabs */}
        <Paper sx={{ borderRadius: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              icon={<Send />}
              iconPosition="start"
              label="Enviar"
              value="enviar"
              disabled={!canSend}
            />
            <Tab
              icon={<Group />}
              iconPosition="start"
              label="Grupos"
              value="grupos"
              disabled={!canSend}
            />
            <Tab
              icon={<Description />}
              iconPosition="start"
              label="Templates"
              value="templates"
            />
            <Tab
              icon={<Poll />}
              iconPosition="start"
              label="Enquetes"
              value="enquetes"
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

            {/* Tab: Grupos */}
            {activeTab === 'grupos' && (
              <GruposTab disabled={!whatsappStatus.connected} />
            )}

            {/* Tab: Templates */}
            {activeTab === 'templates' && (
              <TemplatesTab
                onUseTemplate={handleUseTemplate}
                disabled={!whatsappStatus.connected}
              />
            )}

            {/* Tab: Enquetes */}
            {activeTab === 'enquetes' && (
              <PollComposer
                destinatarios={destinatarios}
                grupos={grupos}
                disabled={!whatsappStatus.connected}
              />
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
