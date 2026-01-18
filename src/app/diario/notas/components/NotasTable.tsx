/**
 * Componente de tabela de notas.
 */

import { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { Save } from '@mui/icons-material';
import { getCellKey } from '../types';
import {
  NotaCell,
  RecuperacaoCell,
  MediaCell,
  ModoMenu,
  NotasTableHeader,
} from './table';
import type { NotasTableProps } from './table/types';

export function NotasTable({
  alunos,
  notas,
  saving,
  getModoCell,
  handleNotaChange,
  calcularMedia,
  handleSaveNotas,
  handleOpenTemplateModal,
  handleSelectModo,
  openCompositionModal,
}: NotasTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [menuCellKey, setMenuCellKey] = useState<string | null>(null);

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, alunoId: string, av: 'av1' | 'av2') => {
    setMenuAnchor(event.currentTarget);
    setMenuCellKey(getCellKey(alunoId, av));
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setMenuCellKey(null);
  };

  return (
    <>
      <NotasTableHeader onOpenTemplateModal={handleOpenTemplateModal} />

      <Box sx={{ bgcolor: 'background.paper', borderRadius: '0 0 8px 8px' }}>
        {alunos.map((aluno, index) => (
          <Box
            key={aluno.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '35px 1fr repeat(4, 70px) 50px', sm: '40px 1fr repeat(4, 90px) 60px' },
              gap: { xs: 0.5, sm: 1 },
              alignItems: 'center',
              px: { xs: 1, sm: 2 },
              py: 1.5,
              borderBottom: index < alunos.length - 1 ? '1px solid' : 'none',
              borderColor: 'divider',
            }}
          >
            <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', sm: '0.95rem' }, textAlign: 'center', color: 'text.secondary' }}>
              {index + 1}
            </Typography>
            <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', sm: '0.95rem' } }}>
              {aluno.nome}
            </Typography>

            {/* AV1 */}
            <NotaCell
              alunoId={aluno.id}
              av="av1"
              nota={notas[aluno.id]?.av1}
              modoCell={getModoCell(aluno.id, 'av1')}
              onNotaChange={(valor) => handleNotaChange(aluno.id, 'av1', valor)}
              onOpenMenu={(e) => handleOpenMenu(e, aluno.id, 'av1')}
              onOpenComposition={() => openCompositionModal(getCellKey(aluno.id, 'av1'))}
            />

            {/* RP1 */}
            <RecuperacaoCell
              nota={notas[aluno.id]?.rp1}
              onChange={(valor) => handleNotaChange(aluno.id, 'rp1', valor)}
            />

            {/* AV2 */}
            <NotaCell
              alunoId={aluno.id}
              av="av2"
              nota={notas[aluno.id]?.av2}
              modoCell={getModoCell(aluno.id, 'av2')}
              onNotaChange={(valor) => handleNotaChange(aluno.id, 'av2', valor)}
              onOpenMenu={(e) => handleOpenMenu(e, aluno.id, 'av2')}
              onOpenComposition={() => openCompositionModal(getCellKey(aluno.id, 'av2'))}
            />

            {/* RP2 */}
            <RecuperacaoCell
              nota={notas[aluno.id]?.rp2}
              onChange={(valor) => handleNotaChange(aluno.id, 'rp2', valor)}
            />

            {/* Media */}
            <MediaCell mediaStr={calcularMedia(aluno.id)} />
          </Box>
        ))}
      </Box>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
          onClick={handleSaveNotas}
          disabled={saving}
          sx={{ textTransform: 'none', borderRadius: 2, px: 4, py: 1 }}
        >
          {saving ? 'Salvando...' : 'Salvar Notas'}
        </Button>
      </Box>

      <ModoMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleCloseMenu}
        onSelectModo={(modo) => {
          if (menuCellKey) handleSelectModo(modo, menuCellKey);
          handleCloseMenu();
        }}
      />
    </>
  );
}
