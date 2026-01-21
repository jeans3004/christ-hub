/**
 * Hook para gerenciar o estado do compositor de mensagens.
 */

'use client';
import { useState, useCallback, useMemo } from 'react';
import { replaceVariables, extractVariables, getManualVariables } from '../utils/variableReplacer';
import { MensagemPayload, TemplateMensagemCompleto, VariavelTemplate, TipoMensagemMedia } from '../types';

interface MediaData {
  url: string;
  type: TipoMensagemMedia;
  filename?: string;
  mimetype?: string;
}

interface UseComposerReturn {
  payload: MensagemPayload;
  setTexto: (texto: string) => void;
  setMedia: (media: MediaData) => void;
  clearMedia: () => void;
  setTemplate: (template: TemplateMensagemCompleto) => void;
  clearTemplate: () => void;
  setVariableValue: (key: string, value: string) => void;
  setLocation: (lat: number, lng: number, name?: string, address?: string) => void;
  setContact: (name: string, phone: string) => void;
  variables: VariavelTemplate[];
  manualVariables: string[];
  isValid: boolean;
  finalText: string;
  reset: () => void;
  hasMedia: boolean;
  hasTemplate: boolean;
}

const INITIAL_PAYLOAD: MensagemPayload = {
  tipo: 'text',
  texto: '',
  linkPreview: true,
};

export function useComposer(): UseComposerReturn {
  const [payload, setPayload] = useState<MensagemPayload>(INITIAL_PAYLOAD);
  const [template, setTemplateState] = useState<TemplateMensagemCompleto | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  // Variáveis extraídas do template atual
  const variables = useMemo(() => {
    if (!template) return [];
    return template.variaveis || [];
  }, [template]);

  // Variáveis que precisam de input manual (não são do sistema)
  const manualVariables = useMemo(() => {
    const extracted = extractVariables(payload.texto || '');
    return getManualVariables(extracted);
  }, [payload.texto]);

  // Texto final com variáveis substituídas
  const finalText = useMemo(() => {
    const baseText = payload.texto || '';
    return replaceVariables(baseText, {}, variableValues);
  }, [payload.texto, variableValues]);

  // Verifica se tem mídia anexada
  const hasMedia = useMemo(() => {
    return !!(payload.mediaUrl || payload.mediaBase64);
  }, [payload.mediaUrl, payload.mediaBase64]);

  // Verifica se está usando template
  const hasTemplate = useMemo(() => {
    return template !== null;
  }, [template]);

  // Validação
  const isValid = useMemo(() => {
    // Localização precisa de coordenadas
    if (payload.tipo === 'location') {
      return !!(payload.latitude && payload.longitude);
    }

    // Contato precisa de nome e telefone
    if (payload.tipo === 'contact') {
      return !!(payload.contactName && payload.contactPhone);
    }

    // Mídia precisa de URL ou base64
    if (['image', 'document', 'audio', 'video', 'sticker'].includes(payload.tipo)) {
      return !!(payload.mediaUrl || payload.mediaBase64);
    }

    // Texto precisa ter conteúdo
    if (!payload.texto?.trim()) return false;

    // Se tem template, verificar variáveis obrigatórias
    if (template) {
      const required = variables.filter(v => v.obrigatoria);
      const missing = required.filter(v => !variableValues[v.chave]?.trim());
      if (missing.length > 0) return false;
    }

    return true;
  }, [payload, template, variables, variableValues]);

  const setTexto = useCallback((texto: string) => {
    setPayload(prev => ({ ...prev, texto }));
  }, []);

  const setMedia = useCallback((media: MediaData) => {
    setPayload(prev => ({
      ...prev,
      tipo: media.type,
      mediaUrl: media.url,
      filename: media.filename,
      mimetype: media.mimetype,
      mediaBase64: undefined, // Limpa base64 se tinha
    }));
  }, []);

  const clearMedia = useCallback(() => {
    setPayload(prev => ({
      ...prev,
      tipo: 'text',
      mediaUrl: undefined,
      mediaBase64: undefined,
      filename: undefined,
      mimetype: undefined,
      caption: undefined,
    }));
  }, []);

  const setTemplate = useCallback((tmpl: TemplateMensagemCompleto) => {
    setTemplateState(tmpl);
    setPayload(prev => ({
      ...prev,
      tipo: tmpl.tipo || 'text',
      texto: tmpl.conteudo,
      mediaUrl: tmpl.mediaUrl,
    }));
    // Limpa valores de variáveis anteriores
    setVariableValues({});
  }, []);

  const clearTemplate = useCallback(() => {
    setTemplateState(null);
    setVariableValues({});
  }, []);

  const setVariableValue = useCallback((key: string, value: string) => {
    setVariableValues(prev => ({ ...prev, [key]: value }));
  }, []);

  const setLocation = useCallback((lat: number, lng: number, name?: string, address?: string) => {
    setPayload(prev => ({
      ...prev,
      tipo: 'location',
      latitude: lat,
      longitude: lng,
      locationName: name,
      address: address,
    }));
  }, []);

  const setContact = useCallback((name: string, phone: string) => {
    setPayload(prev => ({
      ...prev,
      tipo: 'contact',
      contactName: name,
      contactPhone: phone,
    }));
  }, []);

  const reset = useCallback(() => {
    setPayload(INITIAL_PAYLOAD);
    setTemplateState(null);
    setVariableValues({});
  }, []);

  return {
    payload: { ...payload, texto: finalText, variaveis: variableValues },
    setTexto,
    setMedia,
    clearMedia,
    setTemplate,
    clearTemplate,
    setVariableValue,
    setLocation,
    setContact,
    variables,
    manualVariables,
    isValid,
    finalText,
    reset,
    hasMedia,
    hasTemplate,
  };
}
