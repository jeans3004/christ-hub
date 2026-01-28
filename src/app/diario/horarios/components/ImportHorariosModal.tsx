'use client';

/**
 * Modal para importar horarios de planilha Excel.
 * Permite upload, mapeamento de turmas/disciplinas e importacao.
 */

import { useState, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Alert,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  ExpandMore,
  ExpandLess,
  Download,
} from '@mui/icons-material';
import { Turma, Disciplina, Usuario, DiaSemana } from '@/types';
import { ParsedHorario } from '@/app/api/horarios/import/route';

const DIAS_SEMANA = ['', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'];

interface ImportHorariosModalProps {
  open: boolean;
  onClose: () => void;
  turmas: Turma[];
  disciplinas: Disciplina[];
  professores: Usuario[];
  ano: number;
  onImport: (horarios: {
    professorId: string;
    professorIds?: string[]; // Para Trilhas: todos os professores
    turmaId: string;
    disciplinaId: string;
    diaSemana: DiaSemana;
    horaInicio: string;
    horaFim: string;
    ano: number;
    ativo: boolean;
    isTrilhas?: boolean; // Flag para permitir conflitos
  }[]) => Promise<number>;
}

interface TurmaMapping {
  excelCode: string;
  turmaId: string | null;
}

interface DisciplinaMapping {
  excelNome: string;
  disciplinaId: string | null;
  professorId: string | null;
  professorIds: string[]; // Para Trilhas: todos os professores vinculados
  isTrilhas: boolean; // Flag para identificar se é Trilhas
}

const steps = ['Upload', 'Mapear Turmas', 'Mapear Disciplinas', 'Confirmar'];

export function ImportHorariosModal({
  open,
  onClose,
  turmas,
  disciplinas,
  professores,
  ano,
  onImport,
}: ImportHorariosModalProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dados parseados
  const [parsedData, setParsedData] = useState<{
    horarios: ParsedHorario[];
    turmasEncontradas: string[];
    disciplinasEncontradas: string[];
    turnoMatutino: number;
    turnoVespertino: number;
  } | null>(null);

  // Mapeamentos
  const [turmaMappings, setTurmaMappings] = useState<TurmaMapping[]>([]);
  const [disciplinaMappings, setDisciplinaMappings] = useState<DisciplinaMapping[]>([]);

  // Expansao da preview
  const [expandedPreview, setExpandedPreview] = useState(false);

  // Reset ao fechar
  const handleClose = useCallback(() => {
    setActiveStep(0);
    setParsedData(null);
    setTurmaMappings([]);
    setDisciplinaMappings([]);
    setError(null);
    setLoading(false);
    onClose();
  }, [onClose]);

  // Upload do arquivo
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/horarios/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || 'Erro ao processar arquivo');
        return;
      }

      setParsedData(result.data);

      // Funcao para normalizar nomes de turmas (remove acentos, espacos extras, etc)
      const normalizeTurmaName = (name: string) =>
        name.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove acentos
          .replace(/\s+/g, ' ') // Normaliza espacos
          .trim();

      // Inicializar mapeamentos de turmas
      const initialTurmaMappings: TurmaMapping[] = result.data.turmasEncontradas.map(
        (code: string) => {
          const codeNorm = normalizeTurmaName(code);

          // 1. Primeiro tentar match exato pelo nome completo (normalizado)
          let matchedTurma = turmas.find(t =>
            normalizeTurmaName(t.nome) === codeNorm
          );

          // 2. Se nao encontrou, tentar match pelo nome sem turno
          if (!matchedTurma) {
            // Remove " - Matutino" ou " - Vespertino" do final
            const codeWithoutTurno = codeNorm.replace(/\s*-\s*(matutino|vespertino)\s*$/i, '').trim();
            matchedTurma = turmas.find(t => {
              const turmaWithoutTurno = normalizeTurmaName(t.nome).replace(/\s*-\s*(matutino|vespertino)\s*$/i, '').trim();
              return turmaWithoutTurno === codeWithoutTurno;
            });
          }

          // 3. Se ainda nao encontrou, tentar match pelo codigo curto (ex: "6ºA")
          if (!matchedTurma) {
            const shortCode = code.replace(/[^\dºªABCabc]/g, '').toUpperCase();
            matchedTurma = turmas.find(t => {
              const turmaShort = t.nome.replace(/[^\dºªABCabc]/g, '').toUpperCase();
              return turmaShort === shortCode;
            });
          }

          return {
            excelCode: code,
            turmaId: matchedTurma?.id || null,
          };
        }
      );
      setTurmaMappings(initialTurmaMappings);

      // Inicializar mapeamentos de disciplinas
      // Funcao para normalizar texto (remove acentos e converte para minusculas)
      const normalizeText = (text: string) =>
        text.toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .trim();

      // Funcao para verificar se e disciplina de Trilhas
      const isTrilhasDisc = (nome: string) =>
        normalizeText(nome).includes('trilha');

      const initialDisciplinaMappings: DisciplinaMapping[] = result.data.disciplinasEncontradas.map(
        (valor: string) => {
          // 1. Primeiro tentar match por ID (se o usuario usou o ID da disciplina)
          let matchedDisciplina = disciplinas.find(d => d.id === valor);

          // 2. Se nao encontrou por ID, tentar match exato por nome (case insensitive, sem acentos)
          if (!matchedDisciplina) {
            const valorNorm = normalizeText(valor);
            matchedDisciplina = disciplinas.find(d =>
              normalizeText(d.nome) === valorNorm
            );
          }

          // 3. Se ainda nao encontrou, tentar match exato com o nome original
          if (!matchedDisciplina) {
            matchedDisciplina = disciplinas.find(d =>
              d.nome.toUpperCase() === valor.toUpperCase()
            );
          }

          // NAO fazer match parcial para evitar confusao (ex: FISICA vs EDUCACAO FISICA)

          // Verificar se e Trilhas
          const isTrilhas = matchedDisciplina ? isTrilhasDisc(matchedDisciplina.nome) : false;

          // Encontrar professores vinculados
          let professorId: string | null = null;
          let professorIds: string[] = [];

          if (matchedDisciplina) {
            // Encontrar TODOS os professores vinculados a esta disciplina
            const linkedProfessors = professores.filter(p =>
              p.disciplinaIds?.includes(matchedDisciplina!.id)
            );

            if (isTrilhas) {
              // Para Trilhas: usar todos os professores vinculados
              professorIds = linkedProfessors.map(p => p.id);
              professorId = professorIds[0] || null;
            } else {
              // Para outras disciplinas: o professor será determinado por turma
              // Por enquanto, marcar o primeiro como default
              professorId = linkedProfessors[0]?.id || null;
            }
          }

          return {
            excelNome: valor,
            disciplinaId: matchedDisciplina?.id || null,
            professorId,
            professorIds,
            isTrilhas,
          };
        }
      );
      setDisciplinaMappings(initialDisciplinaMappings);

      // Verificar se pode pular etapas de mapeamento
      const allTurmasMapped = initialTurmaMappings.every(m => m.turmaId);
      const allDisciplinasMapped = initialDisciplinaMappings.every(m => m.disciplinaId && m.professorId);

      if (allTurmasMapped && allDisciplinasMapped) {
        // Tudo mapeado automaticamente - ir direto para confirmação
        setActiveStep(3);
      } else if (allTurmasMapped) {
        // Turmas ok, precisa mapear disciplinas
        setActiveStep(2);
      } else {
        // Precisa mapear turmas
        setActiveStep(1);
      }
    } catch (err) {
      setError('Erro ao enviar arquivo: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [turmas, disciplinas, professores]);

  // Atualizar mapeamento de turma
  const handleTurmaMapping = useCallback((excelCode: string, turmaId: string | null) => {
    setTurmaMappings(prev =>
      prev.map(m => m.excelCode === excelCode ? { ...m, turmaId } : m)
    );
  }, []);

  // Atualizar mapeamento de disciplina
  const handleDisciplinaMapping = useCallback((
    excelNome: string,
    field: 'disciplinaId' | 'professorId',
    value: string | null
  ) => {
    setDisciplinaMappings(prev =>
      prev.map(m => {
        if (m.excelNome !== excelNome) return m;

        const updated = { ...m, [field]: value };

        // Se mudou a disciplina, tentar auto-selecionar professor
        if (field === 'disciplinaId' && value) {
          const linkedProfessor = professores.find(p =>
            p.disciplinaIds?.includes(value)
          );
          updated.professorId = linkedProfessor?.id || m.professorId;
        }

        return updated;
      })
    );
  }, [professores]);

  // Verificar se pode avancar
  const canAdvance = useMemo(() => {
    if (activeStep === 1) {
      // Todas as turmas devem estar mapeadas
      return turmaMappings.every(m => m.turmaId);
    }
    if (activeStep === 2) {
      // Todas as disciplinas devem ter disciplina e professor(es)
      // Trilhas: precisa ter professorIds.length > 0
      // Outras: precisa ter professorId (professor será determinado por turma na importação)
      return disciplinaMappings.every(m => {
        if (!m.disciplinaId) return false;
        if (m.isTrilhas) return m.professorIds.length > 0;
        return true; // Para não-Trilhas, o professor será determinado por turma
      });
    }
    return true;
  }, [activeStep, turmaMappings, disciplinaMappings]);

  // Contagem de mapeamentos invalidos
  const unmappedTurmas = turmaMappings.filter(m => !m.turmaId).length;
  const unmappedDisciplinas = disciplinaMappings.filter(m => !m.disciplinaId).length;
  const unmappedProfessores = disciplinaMappings.filter(m => {
    if (m.isTrilhas) return m.professorIds.length === 0;
    return false; // Para não-Trilhas, professor é determinado por turma
  }).length;

  // Gerar horarios para importacao
  const horariosToImport = useMemo(() => {
    if (!parsedData) return [];

    const turmaMap = new Map(turmaMappings.map(m => [m.excelCode, m.turmaId]));
    const disciplinaMap = new Map(disciplinaMappings.map(m => [m.excelNome, m]));

    return parsedData.horarios
      .map(h => {
        const turmaId = turmaMap.get(h.turmaCode);
        const discMapping = disciplinaMap.get(h.disciplinaNome);

        if (!turmaId || !discMapping?.disciplinaId) {
          return null;
        }

        if (discMapping.isTrilhas) {
          // TRILHAS: usar todos os professores vinculados
          if (discMapping.professorIds.length === 0) {
            return null;
          }
          return {
            professorId: discMapping.professorIds[0], // Primeiro como principal
            professorIds: discMapping.professorIds, // Todos os professores
            turmaId,
            disciplinaId: discMapping.disciplinaId,
            diaSemana: h.diaSemana as DiaSemana,
            horaInicio: h.horaInicio,
            horaFim: h.horaFim,
            ano,
            ativo: true,
            isTrilhas: true, // Flag para permitir conflitos
          };
        } else {
          // NÃO-TRILHAS: encontrar professor que tem a disciplina E a turma
          const professorComTurma = professores.find(p =>
            p.disciplinaIds?.includes(discMapping.disciplinaId!) &&
            p.turmaIds?.includes(turmaId)
          );

          if (!professorComTurma) {
            // Se não encontrou professor com a turma, pular este horário
            console.warn(`Professor não encontrado para disciplina ${discMapping.disciplinaId} e turma ${turmaId}`);
            return null;
          }

          return {
            professorId: professorComTurma.id,
            turmaId,
            disciplinaId: discMapping.disciplinaId,
            diaSemana: h.diaSemana as DiaSemana,
            horaInicio: h.horaInicio,
            horaFim: h.horaFim,
            ano,
            ativo: true,
            isTrilhas: false,
          };
        }
      })
      .filter((h): h is NonNullable<typeof h> => h !== null);
  }, [parsedData, turmaMappings, disciplinaMappings, ano, professores]);

  // Executar importacao
  const handleImport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const count = await onImport(horariosToImport);
      if (count > 0) {
        handleClose();
      }
    } catch (err) {
      setError('Erro ao importar: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  }, [horariosToImport, onImport, handleClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { minHeight: '60vh' } }}
    >
      <DialogTitle>
        Importar Horarios de Planilha
      </DialogTitle>

      <DialogContent dividers>
        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Erro */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Loading */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Step 0: Upload */}
        {activeStep === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CloudUpload sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Selecione a planilha de horarios
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Formato aceito: Excel (.xlsx) no padrao da escola
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                component="label"
                disabled={loading}
                startIcon={<CloudUpload />}
              >
                Escolher Arquivo
                <input
                  type="file"
                  hidden
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                />
              </Button>
              <Button
                variant="outlined"
                href="/api/horarios/template"
                download="MODELO_HORARIOS_IMPORTACAO.xlsx"
                startIcon={<Download />}
              >
                Baixar Modelo
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 1: Mapear Turmas */}
        {activeStep === 1 && parsedData && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Encontrados {parsedData.horarios.length} registros ({parsedData.turnoMatutino} matutino, {parsedData.turnoVespertino} vespertino).
              Vincule cada turma da planilha a uma turma do sistema.
            </Alert>

            {unmappedTurmas > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {unmappedTurmas} turma(s) ainda nao mapeada(s)
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Codigo na Planilha</TableCell>
                    <TableCell>Turma no Sistema</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {turmaMappings.map((mapping) => (
                    <TableRow key={mapping.excelCode}>
                      <TableCell>
                        <Chip label={mapping.excelCode} size="small" />
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth>
                          <Select
                            value={mapping.turmaId || ''}
                            onChange={(e) => handleTurmaMapping(mapping.excelCode, e.target.value || null)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Selecionar...</em>
                            </MenuItem>
                            {turmas.map((turma) => (
                              <MenuItem key={turma.id} value={turma.id}>
                                {turma.nome} ({turma.turno})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {mapping.turmaId ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : (
                          <Warning color="warning" fontSize="small" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 2: Mapear Disciplinas */}
        {activeStep === 2 && parsedData && (
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              Vincule cada disciplina da planilha a uma disciplina e professor do sistema.
            </Alert>

            {(unmappedDisciplinas > 0 || unmappedProfessores > 0) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {unmappedDisciplinas > 0 && `${unmappedDisciplinas} disciplina(s) nao mapeada(s). `}
                {unmappedProfessores > 0 && `${unmappedProfessores} professor(es) nao selecionado(s).`}
              </Alert>
            )}

            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome na Planilha</TableCell>
                    <TableCell>Disciplina</TableCell>
                    <TableCell>Professor</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {disciplinaMappings.map((mapping) => (
                    <TableRow key={mapping.excelNome}>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                          {mapping.excelNome}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                          <Select
                            value={mapping.disciplinaId || ''}
                            onChange={(e) => handleDisciplinaMapping(mapping.excelNome, 'disciplinaId', e.target.value || null)}
                            displayEmpty
                          >
                            <MenuItem value="">
                              <em>Selecionar...</em>
                            </MenuItem>
                            {disciplinas.map((d) => (
                              <MenuItem key={d.id} value={d.id}>
                                {d.nome}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" fullWidth sx={{ minWidth: 150 }}>
                          <Select
                            value={mapping.professorId || ''}
                            onChange={(e) => handleDisciplinaMapping(mapping.excelNome, 'professorId', e.target.value || null)}
                            displayEmpty
                            disabled={!mapping.disciplinaId}
                          >
                            <MenuItem value="">
                              <em>Selecionar...</em>
                            </MenuItem>
                            {professores
                              .filter(p => p.ativo)
                              .map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                  {p.nome}
                                  {mapping.disciplinaId && p.disciplinaIds?.includes(mapping.disciplinaId) && (
                                    <Chip label="Vinculado" size="small" sx={{ ml: 1 }} color="success" />
                                  )}
                                </MenuItem>
                              ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {mapping.disciplinaId && mapping.professorId ? (
                          <CheckCircle color="success" fontSize="small" />
                        ) : !mapping.disciplinaId ? (
                          <Tooltip title="Disciplina nao mapeada">
                            <ErrorIcon color="error" fontSize="small" />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Professor nao selecionado">
                            <Warning color="warning" fontSize="small" />
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* Step 3: Confirmar */}
        {activeStep === 3 && (
          <Box>
            <Alert severity="success" sx={{ mb: 2 }}>
              Pronto para importar {horariosToImport.length} horarios!
            </Alert>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Resumo da Importacao
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={`${horariosToImport.length} horarios`} color="primary" />
                <Chip label={`${turmaMappings.length} turmas`} />
                <Chip label={`${disciplinaMappings.length} disciplinas`} />
                <Chip label={`Ano: ${ano}`} />
              </Box>
            </Paper>

            {/* Preview */}
            <Paper variant="outlined">
              <Box
                sx={{
                  p: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandedPreview(!expandedPreview)}
              >
                <Typography variant="subtitle2">
                  Preview dos Horarios
                </Typography>
                <IconButton size="small">
                  {expandedPreview ? <ExpandLess /> : <ExpandMore />}
                </IconButton>
              </Box>
              <Collapse in={expandedPreview}>
                <TableContainer sx={{ maxHeight: 300 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Dia</TableCell>
                        <TableCell>Horario</TableCell>
                        <TableCell>Turma</TableCell>
                        <TableCell>Disciplina</TableCell>
                        <TableCell>Professor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {horariosToImport.slice(0, 50).map((h, i) => {
                        const turma = turmas.find(t => t.id === h.turmaId);
                        const disc = disciplinas.find(d => d.id === h.disciplinaId);
                        const prof = professores.find(p => p.id === h.professorId);
                        return (
                          <TableRow key={i}>
                            <TableCell>{DIAS_SEMANA[h.diaSemana]}</TableCell>
                            <TableCell>{h.horaInicio}-{h.horaFim}</TableCell>
                            <TableCell>{turma?.nome}</TableCell>
                            <TableCell>{disc?.nome}</TableCell>
                            <TableCell>{prof?.nome}</TableCell>
                          </TableRow>
                        );
                      })}
                      {horariosToImport.length > 50 && (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            <Typography variant="caption" color="text.secondary">
                              ... e mais {horariosToImport.length - 50} registros
                            </Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Collapse>
            </Paper>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>

        {activeStep > 0 && activeStep < 3 && (
          <Button onClick={() => setActiveStep(s => s - 1)} disabled={loading}>
            Voltar
          </Button>
        )}

        {activeStep > 0 && activeStep < 3 && (
          <Button
            variant="contained"
            onClick={() => setActiveStep(s => s + 1)}
            disabled={!canAdvance || loading}
          >
            Proximo
          </Button>
        )}

        {activeStep === 3 && (
          <Button
            variant="contained"
            color="primary"
            onClick={handleImport}
            disabled={loading || horariosToImport.length === 0}
          >
            {loading ? 'Importando...' : `Importar ${horariosToImport.length} Horarios`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
