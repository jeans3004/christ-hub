/**
 * Hook para importação e exclusão em massa de alunos.
 */

import { useState, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';

interface ImportResult {
  success: boolean;
  message?: string;
  imported?: number;
  skipped?: number;
  errors?: string[];
  totalErrors?: number;
  error?: string;
}

export function useAlunosImport(onSuccess?: () => void) {
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const { addToast } = useUIStore();

  const importFromFile = useCallback(async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (!validTypes.includes(file.type) && !file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      addToast('Arquivo inválido. Envie um arquivo Excel (.xlsx ou .xls)', 'error');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/alunos/import', {
        method: 'POST',
        body: formData,
      });

      const result: ImportResult = await response.json();
      setImportResult(result);

      if (result.success) {
        addToast(result.message || 'Importação concluída!', 'success');
        onSuccess?.();
      } else {
        addToast(result.error || 'Erro na importação', 'error');
      }

      return result;
    } catch (error: any) {
      const errorMsg = error.message || 'Erro ao importar alunos';
      addToast(errorMsg, 'error');
      setImportResult({ success: false, error: errorMsg });
    } finally {
      setImporting(false);
    }
  }, [addToast, onSuccess]);

  const deleteAll = useCallback(async () => {
    setDeleting(true);

    try {
      const response = await fetch('/api/alunos/delete-all', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        addToast(result.message || 'Todos os alunos foram deletados', 'success');
        onSuccess?.();
      } else {
        addToast(result.error || 'Erro ao deletar alunos', 'error');
      }

      return result;
    } catch (error: any) {
      addToast(error.message || 'Erro ao deletar alunos', 'error');
    } finally {
      setDeleting(false);
    }
  }, [addToast, onSuccess]);

  return {
    importing,
    deleting,
    importResult,
    importFromFile,
    deleteAll,
    clearResult: () => setImportResult(null),
  };
}
