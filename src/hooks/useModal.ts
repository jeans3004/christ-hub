import { useState, useCallback } from 'react';

/**
 * Hook generico para controle de modais.
 * Suporta dados associados ao modal e estados de abertura/fechamento.
 *
 * @example
 * const modal = useModal<Aluno>();
 *
 * // Abrir com dados
 * modal.open(alunoSelecionado);
 *
 * // No componente
 * <Modal open={modal.isOpen} onClose={modal.close}>
 *   {modal.data && <span>{modal.data.nome}</span>}
 * </Modal>
 */
interface UseModalReturn<T = unknown> {
  /** Se o modal esta aberto */
  isOpen: boolean;
  /** Dados associados ao modal */
  data: T | null;
  /** Abre o modal, opcionalmente com dados */
  open: (data?: T) => void;
  /** Fecha o modal e limpa os dados apos delay para animacao */
  close: () => void;
  /** Alterna estado do modal */
  toggle: () => void;
  /** Atualiza os dados do modal sem fechar */
  setData: (data: T | null) => void;
}

export function useModal<T = unknown>(initialState = false): UseModalReturn<T> {
  const [isOpen, setIsOpen] = useState(initialState);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((modalData?: T) => {
    setData(modalData ?? null);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    // Delay para permitir animacao de fechamento do MUI
    setTimeout(() => setData(null), 200);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const updateData = useCallback((newData: T | null) => {
    setData(newData);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData: updateData,
  };
}

/**
 * Hook para controle de modal de confirmacao.
 * Especializado para dialogos de confirmacao com callback de acao.
 *
 * @example
 * const confirm = useConfirmModal<Aluno>();
 *
 * // Abrir confirmacao
 * confirm.open(aluno, async () => {
 *   await alunoService.delete(aluno.id);
 * });
 *
 * // No componente
 * <ConfirmDialog
 *   open={confirm.isOpen}
 *   message={`Excluir ${confirm.data?.nome}?`}
 *   onConfirm={confirm.onConfirm}
 *   onCancel={confirm.close}
 * />
 */
interface UseConfirmModalReturn<T = unknown> {
  isOpen: boolean;
  data: T | null;
  open: (data: T, onConfirm: () => Promise<void> | void) => void;
  close: () => void;
  onConfirm: () => Promise<void>;
  isConfirming: boolean;
}

export function useConfirmModal<T = unknown>(): UseConfirmModalReturn<T> {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);
  const [confirmCallback, setConfirmCallback] = useState<(() => Promise<void> | void) | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const open = useCallback((modalData: T, onConfirm: () => Promise<void> | void) => {
    setData(modalData);
    setConfirmCallback(() => onConfirm);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => {
      setData(null);
      setConfirmCallback(null);
    }, 200);
  }, []);

  const onConfirm = useCallback(async () => {
    if (!confirmCallback) return;
    setIsConfirming(true);
    try {
      await confirmCallback();
      close();
    } finally {
      setIsConfirming(false);
    }
  }, [confirmCallback, close]);

  return {
    isOpen,
    data,
    open,
    close,
    onConfirm,
    isConfirming,
  };
}
