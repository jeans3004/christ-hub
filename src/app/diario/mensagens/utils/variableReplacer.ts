/**
 * Utilitário para substituição de variáveis em templates de mensagem.
 */

interface VariableContext {
  usuario?: { nome: string; celular?: string };
  turma?: { nome: string; serie: string };
  aluno?: { nome: string; matricula?: string };
  sistema?: Record<string, string>;
}

// Retorna saudação baseada na hora atual
const getSaudacao = (): string => {
  const hora = new Date().getHours();
  if (hora < 12) return 'Bom dia';
  if (hora < 18) return 'Boa tarde';
  return 'Boa noite';
};

// Valores dinâmicos das variáveis do sistema
const VARIAVEIS_SISTEMA_VALORES: Record<string, () => string> = {
  data_atual: () => new Date().toLocaleDateString('pt-BR'),
  dia_semana: () => new Date().toLocaleDateString('pt-BR', { weekday: 'long' }),
  saudacao: getSaudacao,
  escola: () => 'Centro de Educação Integral Christ', // TODO: Configurável via settings
  ano_letivo: () => new Date().getFullYear().toString(),
  hora_atual: () => new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  mes_atual: () => new Date().toLocaleDateString('pt-BR', { month: 'long' }),
};

/**
 * Substitui variáveis no template pelo valor correspondente.
 * Variáveis são definidas como {{nome_variavel}}.
 */
export function replaceVariables(
  template: string,
  context: VariableContext,
  customVariables?: Record<string, string>
): string {
  let result = template;

  // Variáveis do sistema (auto-preenchidas)
  Object.entries(VARIAVEIS_SISTEMA_VALORES).forEach(([key, getValue]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), getValue());
  });

  // Variáveis do usuário/destinatário
  if (context.usuario) {
    result = result.replace(/{{nome}}/g, context.usuario.nome || '');
    result = result.replace(/{{celular}}/g, context.usuario.celular || '');
  }

  // Variáveis da turma
  if (context.turma) {
    result = result.replace(/{{turma}}/g, context.turma.nome || '');
    result = result.replace(/{{serie}}/g, context.turma.serie || '');
  }

  // Variáveis do aluno
  if (context.aluno) {
    result = result.replace(/{{aluno}}/g, context.aluno.nome || '');
    result = result.replace(/{{matricula}}/g, context.aluno.matricula || '');
  }

  // Variáveis customizadas do template
  if (customVariables) {
    Object.entries(customVariables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    });
  }

  // Remove variáveis não substituídas (opcional: manter como placeholder)
  // result = result.replace(/{{([^}]+)}}/g, '[$1]');

  return result;
}

/**
 * Extrai todas as variáveis de um template.
 * Retorna array único de nomes de variáveis.
 */
export function extractVariables(template: string): string[] {
  const matches = template.match(/{{([^}]+)}}/g) || [];
  const variables = matches.map(m => m.replace(/[{}]/g, ''));
  return [...new Set(variables)];
}

/**
 * Valida se todas as variáveis obrigatórias foram preenchidas.
 */
export function validateVariables(
  template: string,
  providedValues: Record<string, string>,
  requiredVariables: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredVariables.filter(v => !providedValues[v]?.trim());
  return { valid: missing.length === 0, missing };
}

/**
 * Verifica se uma variável é do sistema (auto-preenchida).
 */
export function isSystemVariable(variableName: string): boolean {
  return variableName in VARIAVEIS_SISTEMA_VALORES ||
    ['nome', 'celular', 'turma', 'serie', 'aluno', 'matricula'].includes(variableName);
}

/**
 * Filtra variáveis que precisam de input manual.
 */
export function getManualVariables(allVariables: string[]): string[] {
  return allVariables.filter(v => !isSystemVariable(v));
}

/**
 * Preview de como ficará a mensagem com variáveis de exemplo.
 */
export function getPreviewWithExamples(template: string): string {
  const exampleContext: VariableContext = {
    usuario: { nome: 'João da Silva', celular: '(11) 99999-9999' },
    turma: { nome: '3º Ano A', serie: '3º Ano' },
    aluno: { nome: 'Maria Santos', matricula: '2024001' },
  };

  const exampleCustom: Record<string, string> = {
    data_reuniao: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
    horario: '19:00',
    local: 'Auditório Principal',
    pauta: 'Encerramento do bimestre',
    motivo: 'Reunião de pais',
    mensagem: 'Conteúdo da mensagem aqui...',
  };

  return replaceVariables(template, exampleContext, exampleCustom);
}
