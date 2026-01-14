'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  Button,
  Alert,
} from '@mui/material';
import { Print, Cake } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import DataTable from '@/components/ui/DataTable';
import { MesesAbrev } from '@/types';

const currentMonth = new Date().getMonth();
const mesesAbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

interface Aniversariante {
  id: string;
  nome: string;
  dataNascimento: string;
  idade: number;
  serie: string;
  turma: string;
  turno: string;
}

const mockAniversariantes: Aniversariante[] = [
  {
    id: '1',
    nome: 'Ana Carolina Silva',
    dataNascimento: '08/01/2010',
    idade: 15,
    serie: '9º Ano',
    turma: 'A',
    turno: 'Matutino',
  },
  {
    id: '2',
    nome: 'Bruno Henrique Costa',
    dataNascimento: '15/01/2011',
    idade: 14,
    serie: '8º Ano',
    turma: 'B',
    turno: 'Vespertino',
  },
  {
    id: '3',
    nome: 'Carla Maria dos Santos',
    dataNascimento: '22/01/2009',
    idade: 16,
    serie: '1ª Série EM',
    turma: 'A',
    turno: 'Matutino',
  },
  {
    id: '4',
    nome: 'Daniel Oliveira',
    dataNascimento: '28/01/2010',
    idade: 15,
    serie: '9º Ano',
    turma: 'A',
    turno: 'Matutino',
  },
];

export default function AniversariantesPage() {
  const [mes, setMes] = useState(mesesAbrev[currentMonth]);
  const [aniversariantes, setAniversariantes] = useState<Aniversariante[]>([]);

  useEffect(() => {
    // Filter by month - in real app this would be a Firebase query
    setAniversariantes(mockAniversariantes);
  }, [mes]);

  const handlePrint = () => {
    window.print();
  };

  const columns = [
    { id: 'nome', label: 'Nome', minWidth: 200 },
    { id: 'dataNascimento', label: 'Data', minWidth: 100 },
    { id: 'idade', label: 'Idade', minWidth: 60, align: 'center' as const },
    { id: 'serie', label: 'Série', minWidth: 100 },
    { id: 'turma', label: 'Turma', minWidth: 60, align: 'center' as const },
    { id: 'turno', label: 'Turno', minWidth: 100 },
  ];

  const mesNome = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ][mesesAbrev.indexOf(mes)];

  return (
    <MainLayout title="Relatório de Aniversário">
      <Alert severity="info" sx={{ mb: 2 }} className="no-print">
        Para impressão, no final do relatório existe o botão imprimir.
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Filter */}
        <Paper sx={{ p: 2, width: { xs: '100%', md: 200 }, flexShrink: 0 }} className="no-print">
          <FormControl fullWidth size="small">
            <InputLabel>Mês</InputLabel>
            <Select value={mes} label="Mês" onChange={(e) => setMes(e.target.value)}>
              {mesesAbrev.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Paper>

        {/* Main Content */}
        <Paper sx={{ flex: 1, p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Cake color="primary" />
            <Typography variant="h6">
              Aniversariantes de {mesNome}
            </Typography>
          </Box>

          <DataTable
            columns={columns}
            data={aniversariantes}
            rowKey="id"
            emptyMessage="Nenhum aniversariante encontrado para este mês"
            pagination={false}
          />

          {aniversariantes.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }} className="no-print">
              <Button
                variant="contained"
                startIcon={<Print />}
                onClick={handlePrint}
              >
                Imprimir
              </Button>
            </Box>
          )}
        </Paper>
      </Box>
    </MainLayout>
  );
}
