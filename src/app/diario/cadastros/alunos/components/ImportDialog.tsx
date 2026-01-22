/**
 * Dialog para importação de alunos via planilha Excel.
 */

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Warning,
  Download,
  TableChart,
} from '@mui/icons-material';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<any>;
  importing: boolean;
  importResult: {
    success: boolean;
    message?: string;
    imported?: number;
    skipped?: number;
    errors?: string[];
    totalErrors?: number;
    error?: string;
  } | null;
}

export function ImportDialog({
  open,
  onClose,
  onImport,
  importing,
  importResult,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      setSelectedFile(file);
    }
  };

  const handleImport = async () => {
    if (selectedFile) {
      await onImport(selectedFile);
    }
  };

  const handleClose = () => {
    if (!importing) {
      setSelectedFile(null);
      onClose();
    }
  };

  const handleDownloadTemplate = () => {
    // Criar template CSV para download
    const headers = [
      'Matricula', 'INEP', 'Nome', 'CPF', 'RG', 'Sexo', 'Data de Nascimento',
      'Naturalidade', 'UF', 'Serie', 'Ensino', 'Turma', 'Turno',
      'Responsavel', 'Telefone', 'CPF', 'Email',
      'Pai', 'Telefone', 'Email',
      'Mae', 'Telefone', 'Email',
      'Logradouro', 'CEP', 'Bairro', 'Indicador'
    ].join(',');

    const blob = new Blob([headers], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'modelo_importacao_alunos.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <TableChart color="primary" />
        Importar Alunos
      </DialogTitle>

      <DialogContent>
        {/* Instruções */}
        <Alert severity="info" sx={{ mb: 2 }}>
          Importe alunos de uma planilha Excel (.xlsx). A planilha deve conter as colunas:
          Matricula, Nome, Turma, etc. As turmas devem existir previamente no sistema.
        </Alert>

        {/* Área de upload */}
        {!importResult && (
          <>
            <Box
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                border: 2,
                borderStyle: 'dashed',
                borderColor: dragActive ? 'primary.main' : 'divider',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: dragActive ? 'action.hover' : 'background.paper',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: 'primary.light',
                  bgcolor: 'action.hover',
                },
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography variant="body1" fontWeight={500}>
                {selectedFile ? selectedFile.name : 'Arraste o arquivo aqui ou clique para selecionar'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Formatos aceitos: .xlsx, .xls
              </Typography>
            </Box>

            {/* Download template */}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                size="small"
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
              >
                Baixar modelo de planilha
              </Button>
            </Box>
          </>
        )}

        {/* Progress */}
        {importing && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>Importando alunos...</Typography>
            <LinearProgress />
          </Box>
        )}

        {/* Resultado */}
        {importResult && (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity={importResult.success ? 'success' : 'error'}
              icon={importResult.success ? <CheckCircle /> : <Error />}
              sx={{ mb: 2 }}
            >
              {importResult.message || importResult.error}
            </Alert>

            {importResult.success && (
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <Box sx={{ textAlign: 'center', flex: 1, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h4" color="success.dark">{importResult.imported || 0}</Typography>
                  <Typography variant="body2">Importados</Typography>
                </Box>
                <Box sx={{ textAlign: 'center', flex: 1, p: 2, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="h4" color="warning.dark">{importResult.skipped || 0}</Typography>
                  <Typography variant="body2">Ignorados</Typography>
                </Box>
              </Box>
            )}

            {importResult.errors && importResult.errors.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="error" sx={{ mb: 1 }}>
                  <Warning sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                  Erros ({importResult.totalErrors || importResult.errors.length}):
                </Typography>
                <List dense sx={{ maxHeight: 150, overflow: 'auto', bgcolor: 'grey.50', borderRadius: 1 }}>
                  {importResult.errors.map((error, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Error fontSize="small" color="error" />
                      </ListItemIcon>
                      <ListItemText primary={error} primaryTypographyProps={{ variant: 'caption' }} />
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          {importResult ? 'Fechar' : 'Cancelar'}
        </Button>
        {!importResult && (
          <Button
            variant="contained"
            onClick={handleImport}
            disabled={!selectedFile || importing}
            startIcon={<CloudUpload />}
          >
            {importing ? 'Importando...' : 'Importar'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
