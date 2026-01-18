/**
 * Aba de gerenciamento de rubricas.
 * Organiza rubricas em grupos: Geral/Colegiado e por Professor.
 */

import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { RubricaModal } from './RubricaModal';
import {
  RubricasTabHeader,
  GrupoHeader,
  RubricaItem,
  useRubricasTab,
} from './rubricas-tab';
import type { RubricasTabProps } from './rubricas-tab';

export function RubricasTab({ rubricas, loading, onRefresh }: RubricasTabProps) {
  const {
    grupos,
    modalOpen,
    editingRubrica,
    deleting,
    initializing,
    expandedGroup,
    handleOpenModal,
    handleCloseModal,
    handleDelete,
    handleInitializeDefaults,
    canEdit,
    getGroupKey,
    toggleGroup,
  } = useRubricasTab(rubricas, onRefresh);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <RubricasTabHeader
        showInitButton={grupos[0].rubricas.length === 0}
        initializing={initializing}
        onInitialize={handleInitializeDefaults}
        onAddNew={() => handleOpenModal()}
      />

      {rubricas.length === 0 ? (
        <Alert severity="info">
          Nenhuma rubrica cadastrada. Clique em "Criar Padroes Colegiado" para iniciar
          com rubricas basicas ou crie uma nova rubrica.
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {grupos.map((grupo) => {
            const groupKey = getGroupKey(grupo);
            const isExpanded = expandedGroup === groupKey;

            return (
              <Paper key={groupKey || 'geral'} sx={{ overflow: 'hidden' }}>
                <GrupoHeader
                  grupo={grupo}
                  isExpanded={isExpanded}
                  onToggle={() => toggleGroup(groupKey)}
                />

                {isExpanded && (
                  <Box sx={{ p: 2 }}>
                    {grupo.rubricas.length === 0 ? (
                      <Typography color="text.secondary" textAlign="center" py={2}>
                        Nenhuma rubrica neste grupo
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {grupo.rubricas.map((rubrica) => (
                          <RubricaItem
                            key={rubrica.id}
                            rubrica={rubrica}
                            canEdit={canEdit(rubrica)}
                            deleting={deleting === rubrica.id}
                            onEdit={() => handleOpenModal(rubrica)}
                            onDelete={() => handleDelete(rubrica)}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                )}
              </Paper>
            );
          })}
        </Box>
      )}

      <RubricaModal
        open={modalOpen}
        rubrica={editingRubrica}
        existingOrder={rubricas.length}
        onClose={handleCloseModal}
        onSave={onRefresh}
      />
    </Box>
  );
}
