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
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import MainLayout from '@/components/layout/MainLayout';
import { useFilterStore } from '@/store/filterStore';

const turmas = [
  { id: '1', nome: '6o Ano - Ensino Fundamental II [ Matutino A ]' },
  { id: '2', nome: '7o Ano - Ensino Fundamental II [ Matutino A ]' },
  { id: '3', nome: '8o Ano - Ensino Fundamental II [ Matutino A ]' },
];

// Mock data for charts
const mockDesempenhoData = [
  { name: 'Jan', aprovados: 30, reprovados: 5 },
  { name: 'Fev', aprovados: 28, reprovados: 7 },
  { name: 'Mar', aprovados: 32, reprovados: 3 },
  { name: 'Abr', aprovados: 29, reprovados: 6 },
  { name: 'Mai', aprovados: 31, reprovados: 4 },
  { name: 'Jun', aprovados: 33, reprovados: 2 },
];

const mockFrequenciaData = [
  { name: 'Jan', presenca: 95 },
  { name: 'Fev', presenca: 92 },
  { name: 'Mar', presenca: 97 },
  { name: 'Abr', presenca: 90 },
  { name: 'Mai', presenca: 94 },
  { name: 'Jun', presenca: 96 },
];

const mockConceitosData = [
  { name: 'A', value: 15, color: '#4caf50' },
  { name: 'B', value: 12, color: '#2196f3' },
  { name: 'C', value: 8, color: '#ff9800' },
  { name: 'D', value: 3, color: '#f44336' },
  { name: 'E', value: 2, color: '#9c27b0' },
];

const COLORS = ['#4caf50', '#2196f3', '#ff9800', '#f44336', '#9c27b0'];

export default function GraficosPage() {
  const { ano, setAno, serieId, setSerieId } = useFilterStore();
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    setShowCharts(!!serieId);
  }, [serieId]);

  return (
    <MainLayout title="Gráficos">
      <Alert severity="warning" sx={{ mb: 2 }}>
        Atenção! Para uma melhor experiência com alguns gráficos, orientamos maximizar a tela.
      </Alert>

      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        {/* Filters */}
        <Paper sx={{ p: 2, width: { xs: '100%', md: 250 }, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Ano</InputLabel>
              <Select value={ano} label="Ano" onChange={(e) => setAno(Number(e.target.value))}>
                <MenuItem value={2025}>2025</MenuItem>
                <MenuItem value={2024}>2024</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Série</InputLabel>
              <Select value={serieId} label="Série" onChange={(e) => setSerieId(e.target.value)}>
                <MenuItem value="">...</MenuItem>
                {turmas.map((t) => (
                  <MenuItem key={t.id} value={t.id}>{t.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Aluno</InputLabel>
              <Select value="" label="Aluno">
                <MenuItem value="">...</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>

        {/* Charts */}
        <Box sx={{ flex: 1 }}>
          {showCharts ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Desempenho por Mês */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Desempenho por Mês
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockDesempenhoData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="aprovados" fill="#4caf50" name="Aprovados" />
                      <Bar dataKey="reprovados" fill="#f44336" name="Reprovados" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Frequência */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Frequência Mensal (%)
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockFrequenciaData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis domain={[80, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="presenca"
                        stroke="#1a365d"
                        strokeWidth={2}
                        name="Presença (%)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>

              {/* Distribuição de Conceitos */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Distribuição de Conceitos
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mockConceitosData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockConceitosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Box>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Selecione uma série para visualizar os gráficos
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </MainLayout>
  );
}
