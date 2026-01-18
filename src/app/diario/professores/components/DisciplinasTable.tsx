'use client';

/**
 * Tabela de disciplinas do professor selecionado.
 */

import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Professor } from '@/types';

interface DisciplinasTableProps {
  professor: Professor | null;
}

export function DisciplinasTable({ professor }: DisciplinasTableProps) {
  return (
    <Paper sx={{ p: 2 }}>
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Disciplina (s)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {professor?.disciplinas.map((d) => (
              <TableRow key={d}>
                <TableCell>{d}</TableCell>
              </TableRow>
            )) || (
              <TableRow>
                <TableCell>Selecione um professor para ver as disciplinas</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
