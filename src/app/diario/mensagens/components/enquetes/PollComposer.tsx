/**
 * Compositor de enquetes/polls para WhatsApp.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Switch,
  FormControlLabel,
  Alert,
  Card,
  CardContent,
  Slider,
  Divider,
  Tooltip,
} from '@mui/material';
import { Add, Delete, Send, Poll } from '@mui/icons-material';
import { usePollSender, useGrupos } from '../../hooks';
import { Destinatario } from '../../types';
import { GrupoWhatsApp } from '@/types';
import { DestinatarioSelector } from '../DestinatarioSelector';

interface PollComposerProps {
  destinatarios: Destinatario[];
  grupos: GrupoWhatsApp[];
  disabled?: boolean;
}

type EnvioTarget = 'individual' | 'grupo';

export function PollComposer({ destinatarios, grupos, disabled }: PollComposerProps) {
  const {
    form,
    sending,
    result,
    clearResult,
    sendPoll,
    sendPollToGroup,
    addOpcao,
    removeOpcao,
    updateOpcao,
    updatePergunta,
    setMultiplaEscolha,
    setMaxSelecoes,
    resetForm,
  } = usePollSender();

  const [envioTarget, setEnvioTarget] = useState<EnvioTarget>('individual');
  const [selectedDestinatarios, setSelectedDestinatarios] = useState<string[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');

  const validOpcoes = form.opcoes.filter((o) => o.trim() !== '');
  const canSend = form.pergunta.trim() && validOpcoes.length >= 2;
  const hasTarget = envioTarget === 'individual' ? selectedDestinatarios.length > 0 : !!selectedGrupo;

  const handleSend = useCallback(async () => {
    if (!canSend || !hasTarget) return;

    let success: boolean;
    if (envioTarget === 'individual') {
      const numeros = destinatarios
        .filter((d) => selectedDestinatarios.includes(d.id))
        .map((d) => d.numero);
      success = await sendPoll(numeros);
    } else {
      success = await sendPollToGroup(selectedGrupo);
    }

    if (success) {
      setSelectedDestinatarios([]);
      setSelectedGrupo('');
    }
  }, [canSend, hasTarget, envioTarget, destinatarios, selectedDestinatarios, selectedGrupo, sendPoll, sendPollToGroup]);

  const handleReset = useCallback(() => {
    resetForm();
    setSelectedDestinatarios([]);
    setSelectedGrupo('');
  }, [resetForm]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Resultado */}
      {result && (
        <Alert
          severity={result.success ? 'success' : 'error'}
          onClose={clearResult}
        >
          {result.success
            ? `Enquete enviada com sucesso! ${result.enviadas} de ${result.total}`
            : result.error || `Falha ao enviar enquete. ${result.falhas} falha(s)`}
        </Alert>
      )}

      {/* Formulario e Preview lado a lado */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Formulario */}
        <Card variant="outlined">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Poll color="primary" />
              <Typography variant="h6">Criar Enquete</Typography>
            </Box>

            {/* Pergunta */}
            <TextField
              label="Pergunta"
              fullWidth
              value={form.pergunta}
              onChange={(e) => updatePergunta(e.target.value)}
              placeholder="Ex: Qual o melhor horario para a reuniao?"
              sx={{ mb: 3 }}
              disabled={sending || disabled}
            />

            {/* Opcoes */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Opcoes ({validOpcoes.length}/12)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {form.opcoes.map((opcao, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={opcao}
                    onChange={(e) => updateOpcao(index, e.target.value)}
                    placeholder={`Opcao ${index + 1}`}
                    disabled={sending || disabled}
                  />
                  {form.opcoes.length > 2 && (
                    <Tooltip title="Remover opcao">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeOpcao(index)}
                          disabled={sending || disabled}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              ))}
            </Box>

            {form.opcoes.length < 12 && (
              <Button
                size="small"
                startIcon={<Add />}
                onClick={addOpcao}
                disabled={sending || disabled}
                sx={{ mb: 2 }}
              >
                Adicionar Opcao
              </Button>
            )}

            <Divider sx={{ my: 2 }} />

            {/* Multipla escolha */}
            <FormControlLabel
              control={
                <Switch
                  checked={form.multiplaEscolha}
                  onChange={(e) => setMultiplaEscolha(e.target.checked)}
                  disabled={sending || disabled}
                />
              }
              label="Permitir multipla escolha"
            />

            {form.multiplaEscolha && (
              <Box sx={{ px: 2, mt: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Maximo de selecoes: {form.maxSelecoes}
                </Typography>
                <Slider
                  value={form.maxSelecoes}
                  onChange={(_, v) => {
                    if (typeof v === 'number') {
                      setMaxSelecoes(v);
                    }
                  }}
                  min={2}
                  max={validOpcoes.length || 2}
                  disabled={sending || disabled}
                  marks
                  valueLabelDisplay="auto"
                />
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Selecao de destinatarios */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Destinatarios
            </Typography>

            {/* Toggle individual/grupo */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                variant={envioTarget === 'individual' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setEnvioTarget('individual')}
              >
                Individual
              </Button>
              <Button
                variant={envioTarget === 'grupo' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setEnvioTarget('grupo')}
              >
                Grupo
              </Button>
            </Box>

            {envioTarget === 'individual' ? (
              <DestinatarioSelector
                destinatarios={destinatarios}
                selected={selectedDestinatarios}
                onChange={setSelectedDestinatarios}
                disabled={sending || disabled}
              />
            ) : (
              <TextField
                select
                label="Selecione um grupo"
                fullWidth
                value={selectedGrupo}
                onChange={(e) => setSelectedGrupo(e.target.value)}
                disabled={sending || disabled}
                SelectProps={{ native: true }}
              >
                <option value="">Selecione...</option>
                {grupos.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nome} ({g.participantes} participantes)
                  </option>
                ))}
              </TextField>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Preview da enquete */}
      {canSend && (
        <Card variant="outlined" sx={{ bgcolor: '#dcf8c6' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Preview da Enquete
            </Typography>
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                p: 2,
                boxShadow: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {form.pergunta}
              </Typography>
              <Box sx={{ mt: 1 }}>
                {validOpcoes.map((opcao, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1,
                      mb: 0.5,
                    }}
                  >
                    {opcao}
                  </Box>
                ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {form.multiplaEscolha
                  ? `Selecione ate ${form.maxSelecoes} opcoes`
                  : 'Selecione uma opcao'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Botoes de acao */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button variant="outlined" onClick={handleReset} disabled={sending}>
          Limpar
        </Button>
        <Button
          variant="contained"
          startIcon={<Send />}
          onClick={handleSend}
          disabled={!canSend || !hasTarget || sending || disabled}
        >
          {sending ? 'Enviando...' : 'Enviar Enquete'}
        </Button>
      </Box>
    </Box>
  );
}
