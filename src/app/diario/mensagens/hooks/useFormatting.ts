/**
 * Hook para formatação de texto WhatsApp.
 */

'use client';
import { useCallback, RefObject } from 'react';
import { FormatType } from '../types';
import { applyFormatToText, insertTextAtCursor } from '../utils/formatWhatsApp';

interface FormatResult {
  newText: string;
  newCursorPos: number;
}

interface UseFormattingReturn {
  applyFormat: (format: FormatType, textareaRef: RefObject<HTMLTextAreaElement>) => FormatResult | null;
  insertAtCursor: (text: string, textareaRef: RefObject<HTMLTextAreaElement>) => FormatResult | null;
  wrapSelection: (prefix: string, suffix: string, textareaRef: RefObject<HTMLTextAreaElement>) => FormatResult | null;
}

export function useFormatting(): UseFormattingReturn {
  const applyFormat = useCallback((
    format: FormatType,
    textareaRef: RefObject<HTMLTextAreaElement>
  ): FormatResult | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const { selectionStart, selectionEnd, value } = textarea;
    return applyFormatToText(value, selectionStart, selectionEnd, format);
  }, []);

  const insertAtCursor = useCallback((
    text: string,
    textareaRef: RefObject<HTMLTextAreaElement>
  ): FormatResult | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const { selectionStart, value } = textarea;
    return insertTextAtCursor(value, selectionStart, text);
  }, []);

  const wrapSelection = useCallback((
    prefix: string,
    suffix: string,
    textareaRef: RefObject<HTMLTextAreaElement>
  ): FormatResult | null => {
    const textarea = textareaRef.current;
    if (!textarea) return null;

    const { selectionStart, selectionEnd, value } = textarea;
    const selectedText = value.substring(selectionStart, selectionEnd);
    const newText = value.substring(0, selectionStart) + prefix + selectedText + suffix + value.substring(selectionEnd);

    return {
      newText,
      newCursorPos: selectionEnd + prefix.length + suffix.length
    };
  }, []);

  return { applyFormat, insertAtCursor, wrapSelection };
}
