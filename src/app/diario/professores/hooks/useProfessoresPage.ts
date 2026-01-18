'use client';

/**
 * Hook principal para a pagina de professores.
 * Compoe os hooks de loader e actions.
 */

import { useProfessoresLoader } from './useProfessoresLoader';
import { useProfessoresActions } from './useProfessoresActions';

export function useProfessoresPage() {
  const loader = useProfessoresLoader();
  const actions = useProfessoresActions(loader.reload);

  return {
    // Dados
    professores: loader.professores,
    professoresTable: loader.professoresTable,
    disciplinas: loader.disciplinas,
    turmas: loader.turmas,
    loading: loader.loading,
    filtro: loader.filtro,
    setFiltro: loader.setFiltro,

    // Formulario
    form: actions.form,
    setForm: actions.setForm,
    saving: actions.saving,

    // Modais
    formModal: actions.formModal,
    deleteModal: actions.deleteModal,

    // Handlers
    handleOpenModal: actions.handleOpenModal,
    handleCloseModal: actions.handleCloseModal,
    handleSave: actions.handleSave,
    handleToggleStatus: actions.handleToggleStatus,
  };
}
