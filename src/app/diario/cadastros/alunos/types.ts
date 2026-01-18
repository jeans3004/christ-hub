/**
 * Tipos e constantes para a pagina de alunos.
 */

export interface AlunoForm {
  nome: string;
  cpf: string;
  dataNascimento: string;
  turmaId: string;
  matricula: string;
}

export const initialForm: AlunoForm = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  turmaId: '',
  matricula: '',
};

export const avatarColors = [
  '#4CAF50', '#2196F3', '#9C27B0', '#FF9800',
  '#E91E63', '#00BCD4', '#FF5722', '#3F51B5',
];
