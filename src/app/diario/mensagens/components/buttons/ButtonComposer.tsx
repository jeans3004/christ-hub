/**
 * Compositor de mensagens com botoes interativos para WhatsApp.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Alert,
  Card,
  CardContent,
  Divider,
  Tooltip,
  Chip,
} from '@mui/material';
import { Add, Delete, Send, SmartButton } from '@mui/icons-material';
import { useButtonSender, useGrupos } from '../../hooks';
import { Destinatario } from '../../types';
import { GrupoWhatsApp } from '@/types';
import { DestinatarioSelector } from '../DestinatarioSelector';

interface ButtonComposerProps {
  destinatarios: Destinatario[];
  grupos: GrupoWhatsApp[];
  disabled?: boolean;
}

type EnvioTarget = 'individual' | 'grupo';

export function ButtonComposer({ destinatarios, grupos, disabled }: ButtonComposerProps) {
  const {
    form,
    sending,
    result,
    clearResult,
    sendButtons,
    sendButtonsToGroup,
    addBotao,
    removeBotao,
    updateBotao,
    updateTitulo,
    updateDescricao,
    updateRodape,
    resetForm,
  } = useButtonSender();

  const [envioTarget, setEnvioTarget] = useState<EnvioTarget>('individual');
  const [selectedDestinatarios, setSelectedDestinatarios] = useState<string[]>([]);
  const [selectedGrupo, setSelectedGrupo] = useState<string>('');

  const validBotoes = form.botoes.filter((b) => b.texto.trim() !== '');
  const canSend = form.titulo.trim() && validBotoes.length >= 1;
  const hasTarget = envioTarget === 'individual' ? selectedDestinatarios.length > 0 : !!selectedGrupo;

  const handleSend = useCallback(async () => {
    if (!canSend || !hasTarget) return;

    let success: boolean;
    if (envioTarget === 'individual') {
      const numeros = destinatarios
        .filter((d) => selectedDestinatarios.includes(d.id))
        .map((d) => d.numero);
      success = await sendButtons(numeros);
    } else {
      success = await sendButtonsToGroup(selectedGrupo);
    }

    if (success) {
      setSelectedDestinatarios([]);
      setSelectedGrupo('');
    }
  }, [canSend, hasTarget, envioTarget, destinatarios, selectedDestinatarios, selectedGrupo, sendButtons, sendButtonsToGroup]);

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
            ? `Mensagem com botoes enviada com sucesso! ${result.enviadas} de ${result.total}`
            : result.error || `Falha ao enviar. ${result.falhas} falha(s)`}
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
              <SmartButton color="primary" />
              <Typography variant="h6">Criar Mensagem com Botoes</Typography>
            </Box>

            {/* Titulo */}
            <TextField
              label="Titulo"
              fullWidth
              value={form.titulo}
              onChange={(e) => updateTitulo(e.target.value)}
              placeholder="Ex: Confirmacao de Presenca"
              sx={{ mb: 2 }}
              disabled={sending || disabled}
              inputProps={{ maxLength: 60 }}
              helperText={`${form.titulo.length}/60`}
            />

            {/* Descricao */}
            <TextField
              label="Descricao"
              fullWidth
              multiline
              rows={3}
              value={form.descricao}
              onChange={(e) => updateDescricao(e.target.value)}
              placeholder="Ex: Voce podera comparecer a reuniao de pais na proxima sexta-feira?"
              sx={{ mb: 2 }}
              disabled={sending || disabled}
              inputProps={{ maxLength: 1024 }}
            />

            {/* Rodape */}
            <TextField
              label="Rodape (opcional)"
              fullWidth
              value={form.rodape}
              onChange={(e) => updateRodape(e.target.value)}
              placeholder="Ex: Escola Municipal..."
              sx={{ mb: 3 }}
              disabled={sending || disabled}
              inputProps={{ maxLength: 60 }}
              size="small"
            />

            <Divider sx={{ mb: 2 }} />

            {/* Botoes */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="subtitle2">
                Botoes ({validBotoes.length}/3)
              </Typography>
              <Chip label="max 3" size="small" variant="outlined" />
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
              {form.botoes.map((botao, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    value={botao.texto}
                    onChange={(e) => updateBotao(index, e.target.value)}
                    placeholder={`Botao ${index + 1}`}
                    disabled={sending || disabled}
                    inputProps={{ maxLength: 20 }}
                  />
                  {form.botoes.length > 1 && (
                    <Tooltip title="Remover botao">
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => removeBotao(index)}
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

            {form.botoes.length < 3 && (
              <Button
                size="small"
                startIcon={<Add />}
                onClick={addBotao}
                disabled={sending || disabled}
              >
                Adicionar Botao
              </Button>
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

      {/* Preview */}
      {canSend && (
        <Card variant="outlined" sx={{ bgcolor: '#dcf8c6' }}>
          <CardContent>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Preview da Mensagem
            </Typography>
            <Box
              sx={{
                bgcolor: 'white',
                borderRadius: 2,
                p: 2,
                boxShadow: 1,
                maxWidth: 360,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {form.titulo}
              </Typography>
              {form.descricao && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {form.descricao}
                </Typography>
              )}
              {form.rodape && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  {form.rodape}
                </Typography>
              )}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {validBotoes.map((botao, i) => (
                  <Box
                    key={i}
                    sx={{
                      p: 1,
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 1,
                      textAlign: 'center',
                      color: 'primary.main',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    }}
                  >
                    {botao.texto}
                  </Box>
                ))}
              </Box>
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
          {sending ? 'Enviando...' : 'Enviar Mensagem'}
        </Button>
      </Box>
    </Box>
  );
}
