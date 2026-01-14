'use client';

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import { Add, Edit, Delete, Event } from '@mui/icons-material';
import MainLayout from '@/components/layout/MainLayout';
import FormModal from '@/components/ui/FormModal';
import { useUIStore } from '@/store/uiStore';

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  tipo: 'aula' | 'prova' | 'reuniao' | 'feriado' | 'outro';
}

const mockEventos: Evento[] = [
  {
    id: '1',
    titulo: 'Prova de Matemática',
    descricao: 'Prova bimestral - Capítulos 1 ao 4',
    data: '2025-01-15',
    tipo: 'prova',
  },
  {
    id: '2',
    titulo: 'Reunião de Pais',
    descricao: 'Reunião para entrega de boletins',
    data: '2025-01-20',
    tipo: 'reuniao',
  },
  {
    id: '3',
    titulo: 'Feriado - Dia do Estudante',
    descricao: 'Não haverá aula',
    data: '2025-01-25',
    tipo: 'feriado',
  },
];

const tipoColors: Record<string, 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
  aula: 'primary',
  prova: 'error',
  reuniao: 'info',
  feriado: 'success',
  outro: 'secondary',
};

const tipoLabels: Record<string, string> = {
  aula: 'Aula',
  prova: 'Prova',
  reuniao: 'Reunião',
  feriado: 'Feriado',
  outro: 'Outro',
};

export default function AgendaPage() {
  const { addToast } = useUIStore();
  const [eventos, setEventos] = useState<Evento[]>(mockEventos);
  const [modalOpen, setModalOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const handleDelete = (id: string) => {
    setEventos(prev => prev.filter(e => e.id !== id));
    addToast('Evento removido!', 'success');
  };

  return (
    <MainLayout title="Agenda">
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Event color="primary" />
            Agenda Escolar
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setModalOpen(true)}
          >
            Novo Evento
          </Button>
        </Box>

        <Paper>
          <List>
            {eventos.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary="Nenhum evento cadastrado"
                  secondary="Clique em 'Novo Evento' para adicionar"
                />
              </ListItem>
            ) : (
              eventos.map((evento, index) => (
                <Box key={evento.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    secondaryAction={
                      <Box>
                        <IconButton edge="end" onClick={() => handleDelete(evento.id)}>
                          <Delete />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {evento.titulo}
                          <Chip
                            label={tipoLabels[evento.tipo]}
                            color={tipoColors[evento.tipo]}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.secondary" display="block">
                            {formatDate(evento.data)}
                          </Typography>
                          <Typography component="span" variant="body2" display="block">
                            {evento.descricao}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </Box>
              ))
            )}
          </List>
        </Paper>
      </Box>

      <FormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Evento"
        onSubmit={() => {
          addToast('Evento criado!', 'success');
          setModalOpen(false);
        }}
      >
        <Typography color="text.secondary">
          Formulário de cadastro de evento...
        </Typography>
      </FormModal>
    </MainLayout>
  );
}
