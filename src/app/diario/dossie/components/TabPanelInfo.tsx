/**
 * Aba de informacoes pessoais do aluno.
 */

import { Box, Typography, Grid, Divider, Paper } from '@mui/material';
import { Person, School, Home, Phone, Badge } from '@mui/icons-material';
import { AlunoDossie } from '../types';
import { PhotoUpload } from './PhotoUpload';

interface TabPanelInfoProps {
  dossie: AlunoDossie;
  canEdit: boolean;
  onPhotoChange: (newUrl: string | null) => void;
}

interface InfoItemProps {
  label: string;
  value?: string | null;
  highlight?: boolean;
}

function InfoItem({ label, value, highlight }: InfoItemProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body1"
        fontWeight={500}
        color={highlight ? 'primary.main' : 'text.primary'}
      >
        {value || '-'}
      </Typography>
    </Paper>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

function Section({ title, icon, children }: SectionProps) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon}
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
      </Box>
      {children}
    </Box>
  );
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
      {/* Header com foto */}
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
            {dossie.turmaNome} - {dossie.turno || 'Turno não informado'}
          </Typography>
          {dossie.matricula && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Matrícula: {dossie.matricula}
            </Typography>
          )}
          {dossie.inep && (
            <Typography variant="body2" color="text.secondary">
              INEP: {dossie.inep}
            </Typography>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Dados Pessoais */}
      <Section title="Dados Pessoais" icon={<Person color="primary" />}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem
              label="Data de Nascimento"
              value={age !== null ? `${formatDate(dossie.dataNascimento)} (${age} anos)` : formatDate(dossie.dataNascimento)}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Sexo" value={dossie.sexo === 'M' ? 'Masculino' : dossie.sexo === 'F' ? 'Feminino' : undefined} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Naturalidade" value={dossie.naturalidade && dossie.uf ? `${dossie.naturalidade}/${dossie.uf}` : dossie.naturalidade} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="CPF" value={dossie.cpf} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="RG" value={dossie.rg} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem
              label="Status"
              value={dossie.ativo ? 'Ativo' : 'Inativo'}
              highlight={dossie.ativo}
            />
          </Grid>
        </Grid>
      </Section>

      {/* Dados Escolares */}
      <Section title="Dados Escolares" icon={<School color="primary" />}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Turma" value={dossie.turmaNome} highlight />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Série" value={dossie.serie} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Ensino" value={dossie.ensino} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Turno" value={dossie.turno} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="Matrícula" value={dossie.matricula} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <InfoItem label="INEP" value={dossie.inep} />
          </Grid>
          {dossie.indicador && (
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Indicador" value={dossie.indicador} />
            </Grid>
          )}
        </Grid>
      </Section>

      {/* Responsável */}
      {(dossie.responsavelNome || dossie.responsavelTelefone) && (
        <Section title="Responsável" icon={<Badge color="primary" />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Nome" value={dossie.responsavelNome} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Telefone" value={dossie.responsavelTelefone} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="CPF" value={dossie.responsavelCpf} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Email" value={dossie.responsavelEmail} />
            </Grid>
          </Grid>
        </Section>
      )}

      {/* Pai */}
      {(dossie.paiNome || dossie.paiTelefone) && (
        <Section title="Pai" icon={<Person color="primary" />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Nome" value={dossie.paiNome} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Telefone" value={dossie.paiTelefone} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Email" value={dossie.paiEmail} />
            </Grid>
          </Grid>
        </Section>
      )}

      {/* Mãe */}
      {(dossie.maeNome || dossie.maeTelefone) && (
        <Section title="Mãe" icon={<Person color="primary" />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Nome" value={dossie.maeNome} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Telefone" value={dossie.maeTelefone} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <InfoItem label="Email" value={dossie.maeEmail} />
            </Grid>
          </Grid>
        </Section>
      )}

      {/* Endereço */}
      {(dossie.logradouro || dossie.bairro || dossie.cep) && (
        <Section title="Endereço" icon={<Home color="primary" />}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <InfoItem label="Logradouro" value={dossie.logradouro} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoItem label="Bairro" value={dossie.bairro} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <InfoItem label="CEP" value={dossie.cep} />
            </Grid>
          </Grid>
        </Section>
      )}

      {/* Datas do sistema */}
      <Box sx={{ mt: 4, pt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          Cadastrado em: {formatDate(dossie.createdAt)} | Última atualização: {formatDate(dossie.updatedAt)}
        </Typography>
      </Box>
    </Box>
  );
}
