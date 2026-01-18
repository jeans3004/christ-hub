/**
 * Aba de informacoes pessoais do aluno.
 */

import { Box, Typography, Grid, Divider, Paper } from '@mui/material';
import { AlunoDossie } from '../types';
import { PhotoUpload } from './PhotoUpload';

interface TabPanelInfoProps {
  dossie: AlunoDossie;
  canEdit: boolean;
  onPhotoChange: (newUrl: string | null) => void;
}

export function TabPanelInfo({ dossie, canEdit, onPhotoChange }: TabPanelInfoProps) {
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateAge = (dataNascimento?: Date) => {
    if (!dataNascimento) return null;
    const birth = new Date(dataNascimento);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(dossie.dataNascimento);

  return (
    <Box sx={{ p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 3,
          alignItems: { xs: 'center', sm: 'flex-start' },
          mb: 3,
        }}
      >
        <PhotoUpload
          alunoId={dossie.id}
          alunoNome={dossie.nome}
          fotoUrl={dossie.fotoUrl}
          canEdit={canEdit}
          onPhotoChange={onPhotoChange}
        />

        <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
          <Typography variant="h5" fontWeight={600}>
            {dossie.nome}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {dossie.turmaNome}
          </Typography>
          {dossie.matricula && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Matricula: {dossie.matricula}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Data de Nascimento
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatDate(dossie.dataNascimento)}
              {age !== null && ` (${age} anos)`}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              CPF
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {dossie.cpf || '-'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Turno
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {dossie.turno || '-'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Serie
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {dossie.serie || '-'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Status
            </Typography>
            <Typography
              variant="body1"
              fontWeight={500}
              color={dossie.ativo ? 'success.main' : 'error.main'}
            >
              {dossie.ativo ? 'Ativo' : 'Inativo'}
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Cadastrado em
            </Typography>
            <Typography variant="body1" fontWeight={500}>
              {formatDate(dossie.createdAt)}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
