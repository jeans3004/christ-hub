/**
 * Hook para gerenciar acoes rapidas de mensagens.
 */

import { useCallback, useMemo } from 'react';
import { QUICK_ACTIONS, TEMPLATE_PRESETS, getVariaveisSistema } from '../constants';
import { QuickAction, QuickActionType, TemplatePreset } from '../types';

interface UseQuickActionsReturn {
  quickActions: QuickAction[];
  getActionTemplate: (actionId: QuickActionType) => TemplatePreset | null;
  prepareMessage: (actionId: QuickActionType, extraVariables?: Record<string, string>) => string;
  isEnqueteAction: (actionId: QuickActionType) => boolean;
}

export function useQuickActions(): UseQuickActionsReturn {
  const quickActions = useMemo(() => QUICK_ACTIONS, []);

  const getActionTemplate = useCallback((actionId: QuickActionType): TemplatePreset | null => {
    const action = QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!action?.templateId) return null;

    return TEMPLATE_PRESETS.find((t) => t.id === action.templateId) || null;
  }, []);

  const prepareMessage = useCallback((actionId: QuickActionType, extraVariables?: Record<string, string>): string => {
    const template = getActionTemplate(actionId);
    if (!template) return '';

    let content = template.conteudo;
    const systemVars = getVariaveisSistema();
    const allVars = { ...systemVars, ...extraVariables };

    // Substituir variaveis
    Object.entries(allVars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value);
    });

    return content;
  }, [getActionTemplate]);

  const isEnqueteAction = useCallback((actionId: QuickActionType): boolean => {
    return actionId === 'enquete_rapida';
  }, []);

  return {
    quickActions,
    getActionTemplate,
    prepareMessage,
    isEnqueteAction,
  };
}
