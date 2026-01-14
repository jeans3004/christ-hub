/**
 * Utilitarios de formatacao para exibicao de dados.
 */

/**
 * Formata CPF para exibicao (XXX.XXX.XXX-XX)
 *
 * @param cpf - CPF com ou sem formatacao
 * @returns CPF formatado
 *
 * @example
 * formatCPF('12345678901') // '123.456.789-01'
 */
export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Remove formatacao do CPF, retornando apenas digitos.
 *
 * @param cpf - CPF formatado ou nao
 * @returns Apenas os 11 digitos
 */
export function unformatCPF(cpf: string): string {
  return cpf.replace(/\D/g, '');
}

/**
 * Valida se um CPF tem formato valido (nao valida digitos verificadores).
 *
 * @param cpf - CPF a validar
 * @returns true se tem 11 digitos
 */
export function isValidCPFFormat(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '');
  return digits.length === 11;
}

/**
 * Formata telefone para exibicao.
 *
 * @param phone - Telefone com ou sem formatacao
 * @returns Telefone formatado ((XX) XXXXX-XXXX ou (XX) XXXX-XXXX)
 *
 * @example
 * formatPhone('11999998888') // '(11) 99999-8888'
 * formatPhone('1133334444') // '(11) 3333-4444'
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }

  return phone;
}

/**
 * Remove formatacao do telefone.
 *
 * @param phone - Telefone formatado
 * @returns Apenas digitos
 */
export function unformatPhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Formata data para exibicao no padrao brasileiro.
 *
 * @param date - Data (Date ou string ISO)
 * @returns Data formatada (DD/MM/YYYY)
 *
 * @example
 * formatDate(new Date('2024-01-15')) // '15/01/2024'
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora para exibicao.
 *
 * @param date - Data (Date ou string ISO)
 * @returns Data e hora formatadas (DD/MM/YYYY HH:mm)
 *
 * @example
 * formatDateTime(new Date('2024-01-15T14:30:00')) // '15/01/2024 14:30'
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formata data para exibicao longa.
 *
 * @param date - Data (Date ou string ISO)
 * @returns Data formatada (15 de janeiro de 2024)
 */
export function formatDateLong(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Formata apenas a hora.
 *
 * @param date - Data (Date ou string ISO)
 * @returns Hora formatada (HH:mm)
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Retorna iniciais de um nome.
 *
 * @param name - Nome completo
 * @param maxChars - Maximo de caracteres (padrao: 2)
 * @returns Iniciais em maiusculo
 *
 * @example
 * getInitials('Maria Silva Santos') // 'MS'
 * getInitials('Joao') // 'J'
 */
export function getInitials(name: string, maxChars = 2): string {
  return name
    .split(' ')
    .map(n => n[0])
    .filter(Boolean)
    .slice(0, maxChars)
    .join('')
    .toUpperCase();
}

/**
 * Trunca texto com ellipsis.
 *
 * @param text - Texto a truncar
 * @param maxLength - Tamanho maximo
 * @returns Texto truncado com '...' se necessario
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Formata percentual.
 *
 * @param value - Valor decimal (0-1) ou percentual (0-100)
 * @param isDecimal - Se true, assume valor entre 0-1
 * @returns Valor formatado com %
 *
 * @example
 * formatPercent(0.85, true) // '85%'
 * formatPercent(85) // '85%'
 */
export function formatPercent(value: number, isDecimal = false): string {
  const percent = isDecimal ? value * 100 : value;
  return `${Math.round(percent)}%`;
}

/**
 * Pluraliza uma palavra baseado na quantidade.
 *
 * @param count - Quantidade
 * @param singular - Forma singular
 * @param plural - Forma plural (opcional, adiciona 's' por padrao)
 * @returns Palavra pluralizada
 *
 * @example
 * pluralize(1, 'aluno') // 'aluno'
 * pluralize(5, 'aluno') // 'alunos'
 * pluralize(0, 'aula', 'aulas') // 'aulas'
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural || `${singular}s`);
}

/**
 * Gera cor de avatar baseada no nome.
 *
 * @param name - Nome para gerar cor
 * @returns Cor hex
 */
export function getAvatarColor(name: string): string {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7',
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFC107', '#FF9800', '#FF5722', '#795548',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

/**
 * Capitaliza a primeira letra de cada palavra.
 *
 * @param text - Texto a capitalizar
 * @returns Texto capitalizado
 *
 * @example
 * capitalize('maria silva') // 'Maria Silva'
 */
export function capitalize(text: string): string {
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
