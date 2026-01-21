/**
 * Utilitário para formatação de texto no padrão WhatsApp.
 */

import { FormatType, FORMAT_MARKERS } from '../types';

/**
 * Aplica formatação ao texto selecionado ou na posição do cursor.
 */
export function applyFormatToText(
  text: string,
  selectionStart: number,
  selectionEnd: number,
  format: FormatType
): { newText: string; newCursorPos: number } {
  const selectedText = text.substring(selectionStart, selectionEnd);
  const { prefix, suffix } = FORMAT_MARKERS[format];

  let newText: string;
  let newCursorPos: number;

  if (format === 'list' || format === 'quote') {
    // Para lista e citação, aplica no início de cada linha selecionada
    if (selectedText) {
      const lines = selectedText.split('\n');
      const formattedLines = lines.map(line => `${prefix}${line}`);
      newText = text.substring(0, selectionStart) + formattedLines.join('\n') + text.substring(selectionEnd);
      newCursorPos = selectionStart + formattedLines.join('\n').length;
    } else {
      // Sem seleção: insere prefixo na linha atual
      newText = text.substring(0, selectionStart) + prefix + text.substring(selectionEnd);
      newCursorPos = selectionStart + prefix.length;
    }
  } else if (selectedText) {
    // Texto selecionado: verifica se já está formatado
    if (selectedText.startsWith(prefix) && selectedText.endsWith(suffix)) {
      // Remove formatação
      const unformatted = selectedText.slice(prefix.length, -suffix.length || undefined);
      newText = text.substring(0, selectionStart) + unformatted + text.substring(selectionEnd);
      newCursorPos = selectionStart + unformatted.length;
    } else {
      // Aplica formatação
      newText = text.substring(0, selectionStart) + prefix + selectedText + suffix + text.substring(selectionEnd);
      newCursorPos = selectionEnd + prefix.length + suffix.length;
    }
  } else {
    // Sem seleção: insere marcadores e posiciona cursor no meio
    newText = text.substring(0, selectionStart) + prefix + suffix + text.substring(selectionEnd);
    newCursorPos = selectionStart + prefix.length;
  }

  return { newText, newCursorPos };
}

/**
 * Insere texto na posição do cursor.
 */
export function insertTextAtCursor(
  text: string,
  cursorPos: number,
  insertText: string
): { newText: string; newCursorPos: number } {
  const newText = text.substring(0, cursorPos) + insertText + text.substring(cursorPos);
  return { newText, newCursorPos: cursorPos + insertText.length };
}

/**
 * Converte formatação WhatsApp para HTML (para preview).
 */
export function whatsappToHtml(text: string): string {
  let html = text
    // Escapa HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bloco de código (deve vir antes do mono)
    .replace(/```([\s\S]+?)```/g, '<pre class="wa-code-block"><code>$1</code></pre>')
    // Formatações inline (ordem importa!)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')           // *negrito*
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')                     // _itálico_
    .replace(/~([^~\n]+)~/g, '<del>$1</del>')                   // ~tachado~
    .replace(/`([^`\n]+)`/g, '<code class="wa-mono">$1</code>') // `mono`
    // Citação (linhas começando com >)
    .replace(/^&gt;\s*(.+)$/gm, '<blockquote class="wa-quote">$1</blockquote>')
    // Lista (linhas começando com • ou -)
    .replace(/^[•\-]\s*(.+)$/gm, '<li>$1</li>')
    // Links
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="wa-link">$1</a>')
    // Quebras de linha
    .replace(/\n/g, '<br/>');

  // Envolve itens de lista consecutivos
  html = html.replace(/(<li>[\s\S]*?<\/li>)(<br\/>)?(<li>)/g, '$1$3');
  html = html.replace(/(<li>[\s\S]*?<\/li>)+/g, '<ul class="wa-list">$&</ul>');

  // Mescla blockquotes consecutivos
  html = html.replace(/<\/blockquote>(<br\/>)?<blockquote class="wa-quote">/g, '<br/>');

  return html;
}

/**
 * Remove formatação WhatsApp do texto.
 */
export function stripWhatsAppFormatting(text: string): string {
  return text
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~([^~]+)~/g, '$1')
    .replace(/```([\s\S]+?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[•\-]\s*/gm, '');
}

/**
 * Conta caracteres do texto (sem formatação).
 */
export function countCharacters(text: string): number {
  return stripWhatsAppFormatting(text).length;
}

/**
 * Verifica se o texto tem formatação.
 */
export function hasFormatting(text: string): boolean {
  return /[*_~`]/.test(text) || /^>/m.test(text) || /^[•\-]/m.test(text);
}

/**
 * Estilos CSS para o preview da mensagem WhatsApp.
 */
export const WHATSAPP_PREVIEW_STYLES = {
  container: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontSize: '14.2px',
    lineHeight: 1.4,
    color: '#111b21',
  },
  strong: {
    fontWeight: 700,
  },
  em: {
    fontStyle: 'italic',
  },
  del: {
    textDecoration: 'line-through',
  },
  code: {
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '2px 4px',
    borderRadius: '4px',
    fontSize: '13px',
  },
  codeBlock: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: '8px 12px',
    borderRadius: '8px',
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: '13px',
    margin: '4px 0',
  },
  quote: {
    borderLeft: '3px solid #25D366',
    paddingLeft: '8px',
    marginLeft: 0,
    color: '#667781',
  },
  list: {
    paddingLeft: '16px',
    margin: '4px 0',
    listStyleType: 'none',
  },
  link: {
    color: '#039be5',
    textDecoration: 'none',
  },
};
