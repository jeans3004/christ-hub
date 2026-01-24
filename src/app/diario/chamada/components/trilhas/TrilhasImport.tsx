/**
 * Componente de importacao de areas do conhecimento.
 * Suporta importacao via Google Sheets ou CSV.
 */

'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  TableChart as SheetsIcon,
  Check as CheckIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { Aluno } from '@/types';
import { useImportAreas } from '../../hooks';
import { AREAS_CONHECIMENTO } from '@/constants';

interface TrilhasImportProps {
  alunos: Aluno[];
  onImportComplete: () => void;
}

export function TrilhasImport({ alunos, onImportComplete }: TrilhasImportProps) {
  const [tabIndex, setTabIndex] = useState(0);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    status,
    preview,
    result,
    error,
    loadFromSpreadsheet,
    loadFromCSV,
    confirmImport,
    reset,
  } = useImportAreas(alunos);

  const handleLoadFromSheets = () => {
    if (spreadsheetUrl.trim()) {
      loadFromSpreadsheet(spreadsheetUrl.trim());
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      loadFromCSV(file);
    }
  };

  const handleClose = () => {
    reset();
    if (result && result.processados > 0) {
      onImportComplete();
    }
  };

  const getAreaColor = (areaId: string) => {
    return AREAS_CONHECIMENTO.find(a => a.id === areaId)?.cor || '#999';
  };

  const getAreaNome = (areaId: string) => {
    return AREAS_CONHECIMENTO.find(a => a.id === areaId)?.nome || areaId;
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Importar Areas do Conhecimento
      </Typography>

      <Alert severity="info" sx={{ mb: 2 }}>
        Importe as escolhas de areas dos alunos a partir de uma planilha do Google Forms ou arquivo CSV.
        A planilha deve conter colunas para: nome/matricula do aluno e area escolhida.
      </Alert>

      <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} sx={{ mb: 3 }}>
        <Tab icon={<SheetsIcon />} iconPosition="start" label="Google Sheets" />
        <Tab icon={<UploadIcon />} iconPosition="start" label="Arquivo CSV" />
      </Tabs>

      {/* Tab: Google Sheets */}
      {tabIndex === 0 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cole o link da planilha de respostas do Google Forms.
            Certifique-se de que a planilha esta compartilhada com seu email do Google.
          </Typography>

          <TextField
            fullWidth
            label="URL da Planilha"
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
            disabled={status === 'loading'}
            sx={{ mb: 2 }}
          />

          <Button
            variant="contained"
            onClick={handleLoadFromSheets}
            disabled={!spreadsheetUrl.trim() || status === 'loading'}
            startIcon={status === 'loading' ? <CircularProgress size={20} color="inherit" /> : <SheetsIcon />}
          >
            {status === 'loading' ? 'Carregando...' : 'Carregar Planilha'}
          </Button>
        </Box>
      )}

      {/* Tab: CSV */}
      {tabIndex === 1 && (
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Selecione um arquivo CSV exportado do Google Forms ou outra fonte.
            O arquivo deve usar virgula ou ponto-e-virgula como separador.
          </Typography>

          <input
            type="file"
            accept=".csv"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Button
            variant="contained"
            onClick={() => fileInputRef.current?.click()}
            disabled={status === 'loading'}
            startIcon={status === 'loading' ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
          >
            {status === 'loading' ? 'Processando...' : 'Selecionar Arquivo CSV'}
          </Button>

          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => {
                const csv = 'Nome,Matricula,Serie,Area\nJoao Silva,2024001,1a Serie,Linguagens\nMaria Santos,2024002,2a Serie,Matematica';
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'modelo_importacao.csv';
                a.click();
              }}
            >
              Baixar modelo CSV
            </Button>
          </Box>
        </Box>
      )}

      {/* Erro */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {/* Preview Dialog */}
      <Dialog
        open={status === 'preview'}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Preview da Importacao
        </DialogTitle>
        <DialogContent dividers>
          {preview && (
            <Box>
              {/* Resumo */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Resumo por Area:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {Object.entries(preview.resumoPorArea).map(([areaId, count]) => (
                    <Chip
                      key={areaId}
                      label={`${getAreaNome(areaId)}: ${count}`}
                      size="small"
                      sx={{ bgcolor: getAreaColor(areaId), color: 'white' }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Linhas validas */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckIcon color="success" />
                    <Typography>
                      {preview.linhasValidas.length} aluno(s) encontrado(s)
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <TableContainer sx={{ maxHeight: 300 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Linha</TableCell>
                          <TableCell>Nome</TableCell>
                          <TableCell>Aluno no Sistema</TableCell>
                          <TableCell>Area</TableCell>
                          <TableCell>Mudanca</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.linhasValidas.map((linha) => (
                          <TableRow key={linha.linha}>
                            <TableCell>{linha.linha}</TableCell>
                            <TableCell>{linha.nome || linha.identificador}</TableCell>
                            <TableCell>{linha.alunoExistente?.nome}</TableCell>
                            <TableCell>
                              {linha.areaId && (
                                <Chip
                                  label={getAreaNome(linha.areaId)}
                                  size="small"
                                  sx={{ bgcolor: getAreaColor(linha.areaId), color: 'white' }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              {linha.alunoExistente?.areaAtual ? (
                                <Typography variant="caption" color="text.secondary">
                                  {linha.alunoExistente.areaAtual} → Nova
                                </Typography>
                              ) : (
                                <Typography variant="caption" color="success.main">
                                  Novo
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>

              {/* Linhas invalidas */}
              {preview.linhasInvalidas.length > 0 && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ErrorIcon color="error" />
                      <Typography color="error">
                        {preview.linhasInvalidas.length} linha(s) com erro
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails sx={{ p: 0 }}>
                    <TableContainer sx={{ maxHeight: 200 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Linha</TableCell>
                            <TableCell>Dados</TableCell>
                            <TableCell>Erros</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {preview.linhasInvalidas.map((linha) => (
                            <TableRow key={linha.linha}>
                              <TableCell>{linha.linha}</TableCell>
                              <TableCell>
                                <Typography variant="caption" noWrap sx={{ maxWidth: 200, display: 'block' }}>
                                  {linha.dados.filter(Boolean).join(' | ')}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                {linha.erros.map((erro, i) => (
                                  <Typography key={i} variant="caption" color="error" display="block">
                                    {erro}
                                  </Typography>
                                ))}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            variant="contained"
            onClick={confirmImport}
            disabled={!preview || preview.linhasValidas.length === 0}
          >
            Confirmar Importacao ({preview?.linhasValidas.length || 0} alunos)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Importing Dialog */}
      <Dialog open={status === 'importing'}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
          <CircularProgress />
          <Typography>Importando areas...</Typography>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={status === 'success'} onClose={handleClose}>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon color="success" />
            Importacao Concluida
          </Box>
        </DialogTitle>
        <DialogContent>
          {result && (
            <Box>
              <Typography variant="body1" gutterBottom>
                <strong>{result.processados}</strong> de {result.total} aluno(s) atualizado(s).
              </Typography>

              {result.erros.length > 0 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  {result.erros.length} erro(s) durante a importacao.
                </Alert>
              )}

              {result.atualizados.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Alunos atualizados:
                  </Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                    {result.atualizados.slice(0, 10).map((item) => (
                      <Typography key={item.alunoId} variant="body2" color="text.secondary">
                        {item.nome}: {item.areaAnterior || 'Sem area'} → {getAreaNome(item.areaNova)}
                      </Typography>
                    ))}
                    {result.atualizados.length > 10 && (
                      <Typography variant="caption" color="text.secondary">
                        ... e mais {result.atualizados.length - 10} aluno(s)
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleClose}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
