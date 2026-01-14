'use client';

import { Component, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface ErrorBoundaryProps {
  /** Componentes filhos a serem renderizados */
  children: ReactNode;
  /** Componente de fallback customizado (opcional) */
  fallback?: ReactNode;
  /** Callback executado ao clicar em "Tentar novamente" */
  onReset?: () => void;
  /** Titulo do erro (opcional) */
  title?: string;
  /** Mensagem do erro (opcional) */
  message?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Componente ErrorBoundary para capturar erros em componentes filhos.
 * Exibe uma UI de fallback amigavel quando um erro ocorre.
 *
 * @example
 * <ErrorBoundary>
 *   <ComponenteQuePodeFalhar />
 * </ErrorBoundary>
 *
 * @example Com fallback customizado
 * <ErrorBoundary fallback={<MeuFallback />}>
 *   <ComponenteQuePodeFalhar />
 * </ErrorBoundary>
 */
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log do erro para debugging
    console.error('ErrorBoundary capturou um erro:', error);
    console.error('Informacoes do componente:', errorInfo.componentStack);

    // Aqui pode ser adicionado envio para servico de logging (Sentry, etc.)
    // if (process.env.NODE_ENV === 'production') {
    //   sendToErrorService(error, errorInfo);
    // }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, title, message } = this.props;

    if (hasError) {
      // Renderiza fallback customizado se fornecido
      if (fallback) {
        return fallback;
      }

      // Renderiza UI de fallback padrao
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <ErrorOutline
              sx={{
                fontSize: 64,
                color: 'error.main',
                mb: 2,
              }}
            />

            <Typography variant="h5" fontWeight={600} gutterBottom>
              {title || 'Algo deu errado'}
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {message || 'Ocorreu um erro inesperado. Tente recarregar a pagina ou clique no botao abaixo.'}
            </Typography>

            {/* Detalhes do erro em desenvolvimento */}
            {process.env.NODE_ENV === 'development' && error && (
              <Box
                sx={{
                  bgcolor: 'grey.100',
                  p: 2,
                  borderRadius: 1,
                  mb: 3,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto',
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    m: 0,
                  }}
                >
                  <strong>Erro:</strong> {error.message}
                  {'\n\n'}
                  <strong>Stack:</strong>
                  {'\n'}
                  {error.stack}
                  {errorInfo && (
                    <>
                      {'\n\n'}
                      <strong>Componente:</strong>
                      {errorInfo.componentStack}
                    </>
                  )}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<Refresh />}
                onClick={this.handleReset}
                sx={{ textTransform: 'none' }}
              >
                Tentar novamente
              </Button>

              <Button
                variant="outlined"
                onClick={() => window.location.reload()}
                sx={{ textTransform: 'none' }}
              >
                Recarregar pagina
              </Button>
            </Box>
          </Paper>
        </Box>
      );
    }

    return children;
  }
}

/**
 * Componente de fallback simples para erros.
 * Pode ser usado como prop fallback do ErrorBoundary.
 */
export function ErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError?: () => void;
}) {
  return (
    <Box
      sx={{
        p: 3,
        textAlign: 'center',
        color: 'error.main',
      }}
    >
      <ErrorOutline sx={{ fontSize: 48, mb: 1 }} />
      <Typography variant="h6">Erro ao carregar componente</Typography>
      {error && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {error.message}
        </Typography>
      )}
      {resetError && (
        <Button
          size="small"
          onClick={resetError}
          sx={{ mt: 2, textTransform: 'none' }}
        >
          Tentar novamente
        </Button>
      )}
    </Box>
  );
}
