import { z } from 'zod';
import { Meses, MesesAbrev, Turnos, Series } from '@/types';

// Validação de CPF
const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

export const cpfSchema = z.string()
  .regex(cpfRegex, 'CPF inválido')
  .transform((val) => val.replace(/\D/g, ''));

// Validação de telefone
const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-?\d{4}$|^\d{10,11}$/;

export const telefoneSchema = z.string()
  .regex(telefoneRegex, 'Telefone inválido')
  .optional();

// Login
export const loginSchema = z.object({
  cpf: cpfSchema,
  senha: z.string().min(4, 'Senha deve ter no mínimo 4 caracteres'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Alterar Senha
export const alterarSenhaSchema = z.object({
  cpf: cpfSchema,
  senhaAtual: z.string().min(4, 'Senha deve ter no mínimo 4 caracteres'),
  novaSenha: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
  confirmarSenha: z.string(),
}).refine((data) => data.novaSenha === data.confirmarSenha, {
  message: 'Senhas não conferem',
  path: ['confirmarSenha'],
});

export type AlterarSenhaFormData = z.infer<typeof alterarSenhaSchema>;

// Professor
export const professorSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: cpfSchema,
  telefone: telefoneSchema,
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  coordenador: z.boolean().default(false),
  disciplinas: z.array(z.string()).default([]),
  turmas: z.array(z.string()).default([]),
});

export type ProfessorFormData = z.infer<typeof professorSchema>;

// Aluno
export const alunoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cpf: cpfSchema.optional(),
  dataNascimento: z.date().optional(),
  turmaId: z.string().min(1, 'Turma é obrigatória'),
  matricula: z.string().optional(),
});

export type AlunoFormData = z.infer<typeof alunoSchema>;

// Turma
export const turmaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  serie: z.enum(Series as unknown as [string, ...string[]]),
  turno: z.enum(Turnos),
  ano: z.number().int().min(2020).max(2100),
});

export type TurmaFormData = z.infer<typeof turmaSchema>;

// Disciplina
export const disciplinaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  codigo: z.string().optional(),
});

export type DisciplinaFormData = z.infer<typeof disciplinaSchema>;

// Chamada
export const chamadaFiltroSchema = z.object({
  ano: z.number().int().min(2020).max(2100),
  serieId: z.string().optional(),
  disciplinaId: z.string().optional(),
});

export type ChamadaFiltroFormData = z.infer<typeof chamadaFiltroSchema>;

export const chamadaSchema = z.object({
  turmaId: z.string().min(1, 'Turma é obrigatória'),
  disciplinaId: z.string().min(1, 'Disciplina é obrigatória'),
  data: z.date(),
  tempo: z.union([z.literal(1), z.literal(2)]),
  conteudo: z.string().optional(),
});

export type ChamadaFormData = z.infer<typeof chamadaSchema>;

// Notas
export const notaFiltroSchema = z.object({
  ano: z.number().int().min(2020).max(2100),
  serieId: z.string().optional(),
  disciplinaId: z.string().optional(),
});

export type NotaFiltroFormData = z.infer<typeof notaFiltroSchema>;

export const notaSchema = z.object({
  alunoId: z.string().min(1, 'Aluno é obrigatório'),
  disciplinaId: z.string().min(1, 'Disciplina é obrigatória'),
  bimestre: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  tipo: z.enum(['AV1', 'AV2', 'AV3', 'REC', 'MEDIA']),
  valor: z.number().min(0).max(10),
});

export type NotaFormData = z.infer<typeof notaSchema>;

// Conceitos
export const conceitoFiltroSchema = z.object({
  ano: z.number().int().min(2020).max(2100),
  mes: z.enum(Meses as unknown as [string, ...string[]]).optional(),
  serieId: z.string().optional(),
});

export type ConceitoFiltroFormData = z.infer<typeof conceitoFiltroSchema>;

export const conceitoSchema = z.object({
  alunoId: z.string().min(1, 'Aluno é obrigatório'),
  disciplinaId: z.string().min(1, 'Disciplina é obrigatória'),
  mes: z.enum(Meses as unknown as [string, ...string[]]),
  conceito: z.enum(['A', 'B', 'C', 'D', 'E']),
  observacao: z.string().optional(),
});

export type ConceitoFormData = z.infer<typeof conceitoSchema>;

// Ocorrência
export const ocorrenciaFiltroSchema = z.object({
  ano: z.number().int().min(2020).max(2100),
});

export type OcorrenciaFiltroFormData = z.infer<typeof ocorrenciaFiltroSchema>;

export const ocorrenciaSchema = z.object({
  alunoId: z.string().min(1, 'Aluno é obrigatório'),
  motivo: z.string().min(5, 'Motivo deve ter no mínimo 5 caracteres'),
  descricao: z.string().optional(),
});

export type OcorrenciaFormData = z.infer<typeof ocorrenciaSchema>;

// Aniversariantes
export const aniversarianteFiltroSchema = z.object({
  mes: z.enum(MesesAbrev as unknown as [string, ...string[]]),
});

export type AniversarianteFiltroFormData = z.infer<typeof aniversarianteFiltroSchema>;

// Relatório Mensal
export const relatorioMensalSchema = z.object({
  mes: z.enum(Meses as unknown as [string, ...string[]]),
});

export type RelatorioMensalFormData = z.infer<typeof relatorioMensalSchema>;
