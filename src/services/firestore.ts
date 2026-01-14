import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Professor,
  Aluno,
  Turma,
  Disciplina,
  Chamada,
  Nota,
  Conceito,
  Ocorrencia,
  Usuario,
  Rubrica,
  AvaliacaoRubrica,
} from '@/types';

// Helper function to convert Firestore timestamps
const convertTimestamp = (data: DocumentData) => {
  const converted = { ...data };
  Object.keys(converted).forEach((key) => {
    if (converted[key] instanceof Timestamp) {
      converted[key] = converted[key].toDate();
    }
  });
  return converted;
};

// Generic CRUD operations
async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return { id: docSnap.id, ...convertTimestamp(docSnap.data()) } as T;
  }
  return null;
}

async function getDocuments<T>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...convertTimestamp(doc.data()),
  })) as T[];
}

async function createDocument<T extends { id?: string }>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const docRef = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

async function updateDocument<T>(
  collectionName: string,
  id: string,
  data: Partial<T>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

async function deleteDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

// Usuario Service
export const usuarioService = {
  get: (id: string) => getDocument<Usuario>('usuarios', id),
  getAll: () => getDocuments<Usuario>('usuarios'),
  getByEmail: async (email: string) => {
    const docs = await getDocuments<Usuario>('usuarios', [
      where('email', '==', email),
      limit(1),
    ]);
    return docs[0] || null;
  },
  create: (data: Omit<Usuario, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('usuarios', data),
  update: (id: string, data: Partial<Usuario>) =>
    updateDocument('usuarios', id, data),
  delete: (id: string) => deleteDocument('usuarios', id),
};

// Professor Service
export const professorService = {
  get: (id: string) => getDocument<Professor>('professores', id),
  getAll: () => getDocuments<Professor>('professores', [orderBy('nome')]),
  getAtivos: () =>
    getDocuments<Professor>('professores', [
      where('ativo', '==', true),
      orderBy('nome'),
    ]),
  create: (data: Omit<Professor, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('professores', data),
  update: (id: string, data: Partial<Professor>) =>
    updateDocument('professores', id, data),
  delete: (id: string) => deleteDocument('professores', id),
};

// Aluno Service
export const alunoService = {
  get: (id: string) => getDocument<Aluno>('alunos', id),
  getAll: () => getDocuments<Aluno>('alunos', [orderBy('nome')]),
  getByTurma: (turmaId: string) =>
    getDocuments<Aluno>('alunos', [
      where('turmaId', '==', turmaId),
      where('ativo', '==', true),
      orderBy('nome'),
    ]),
  create: (data: Omit<Aluno, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('alunos', data),
  update: (id: string, data: Partial<Aluno>) =>
    updateDocument('alunos', id, data),
  delete: (id: string) => deleteDocument('alunos', id),
};

// Turma Service
export const turmaService = {
  get: (id: string) => getDocument<Turma>('turmas', id),
  getAll: () => getDocuments<Turma>('turmas', [orderBy('nome')]),
  getByAno: (ano: number) =>
    getDocuments<Turma>('turmas', [
      where('ano', '==', ano),
      where('ativo', '==', true),
      orderBy('nome'),
    ]),
  create: (data: Omit<Turma, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('turmas', data),
  update: (id: string, data: Partial<Turma>) =>
    updateDocument('turmas', id, data),
  delete: (id: string) => deleteDocument('turmas', id),
};

// Disciplina Service
export const disciplinaService = {
  get: (id: string) => getDocument<Disciplina>('disciplinas', id),
  getAll: () => getDocuments<Disciplina>('disciplinas', [orderBy('nome')]),
  getAtivas: () =>
    getDocuments<Disciplina>('disciplinas', [
      where('ativo', '==', true),
      orderBy('nome'),
    ]),
  create: (data: Omit<Disciplina, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('disciplinas', data),
  update: (id: string, data: Partial<Disciplina>) =>
    updateDocument('disciplinas', id, data),
  delete: (id: string) => deleteDocument('disciplinas', id),
};

// Chamada Service
export const chamadaService = {
  get: (id: string) => getDocument<Chamada>('chamadas', id),
  getByTurmaData: async (turmaId: string, data: Date) => {
    const startOfDay = new Date(data);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data);
    endOfDay.setHours(23, 59, 59, 999);

    return getDocuments<Chamada>('chamadas', [
      where('turmaId', '==', turmaId),
      where('data', '>=', Timestamp.fromDate(startOfDay)),
      where('data', '<=', Timestamp.fromDate(endOfDay)),
    ]);
  },
  create: (data: Omit<Chamada, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('chamadas', data),
  update: (id: string, data: Partial<Chamada>) =>
    updateDocument('chamadas', id, data),
  delete: (id: string) => deleteDocument('chamadas', id),
};

// Nota Service
export const notaService = {
  get: (id: string) => getDocument<Nota>('notas', id),
  getByAlunoTurmaDisciplina: (alunoId: string, turmaId: string, disciplinaId: string, ano: number) =>
    getDocuments<Nota>('notas', [
      where('alunoId', '==', alunoId),
      where('turmaId', '==', turmaId),
      where('disciplinaId', '==', disciplinaId),
      where('ano', '==', ano),
    ]),
  create: (data: Omit<Nota, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('notas', data),
  update: (id: string, data: Partial<Nota>) =>
    updateDocument('notas', id, data),
  delete: (id: string) => deleteDocument('notas', id),
};

// Conceito Service
export const conceitoService = {
  get: (id: string) => getDocument<Conceito>('conceitos', id),
  getByAlunoMes: (alunoId: string, mes: string, ano: number) =>
    getDocuments<Conceito>('conceitos', [
      where('alunoId', '==', alunoId),
      where('mes', '==', mes),
      where('ano', '==', ano),
    ]),
  create: (data: Omit<Conceito, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('conceitos', data),
  update: (id: string, data: Partial<Conceito>) =>
    updateDocument('conceitos', id, data),
  delete: (id: string) => deleteDocument('conceitos', id),
};

// Rubrica Service
export const rubricaService = {
  get: (id: string) => getDocument<Rubrica>('rubricas', id),
  getAll: () =>
    getDocuments<Rubrica>('rubricas', [
      where('ativo', '==', true),
      orderBy('ordem', 'asc'),
    ]),
  getAllIncludingInactive: () =>
    getDocuments<Rubrica>('rubricas', [orderBy('ordem', 'asc')]),
  create: (data: Omit<Rubrica, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('rubricas', data),
  update: (id: string, data: Partial<Rubrica>) =>
    updateDocument('rubricas', id, data),
  delete: (id: string) => deleteDocument('rubricas', id),
};

// Avaliacao Rubrica Service
export const avaliacaoRubricaService = {
  get: (id: string) => getDocument<AvaliacaoRubrica>('avaliacoesRubricas', id),
  getByTurmaBimestre: (turmaId: string, bimestre: number, ano: number) =>
    getDocuments<AvaliacaoRubrica>('avaliacoesRubricas', [
      where('turmaId', '==', turmaId),
      where('bimestre', '==', bimestre),
      where('ano', '==', ano),
    ]),
  getByAluno: (alunoId: string, ano: number) =>
    getDocuments<AvaliacaoRubrica>('avaliacoesRubricas', [
      where('alunoId', '==', alunoId),
      where('ano', '==', ano),
    ]),
  getByAlunoBimestre: (alunoId: string, bimestre: number, ano: number) =>
    getDocuments<AvaliacaoRubrica>('avaliacoesRubricas', [
      where('alunoId', '==', alunoId),
      where('bimestre', '==', bimestre),
      where('ano', '==', ano),
    ]),
  create: (data: Omit<AvaliacaoRubrica, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('avaliacoesRubricas', data),
  update: (id: string, data: Partial<AvaliacaoRubrica>) =>
    updateDocument('avaliacoesRubricas', id, data),
  delete: (id: string) => deleteDocument('avaliacoesRubricas', id),
};

// Ocorrencia Service
export const ocorrenciaService = {
  get: (id: string) => getDocument<Ocorrencia>('ocorrencias', id),
  getByStatus: (status: 'pendente' | 'aprovada' | 'cancelada', ano?: number) => {
    const constraints: QueryConstraint[] = [where('status', '==', status)];
    if (ano) {
      const startOfYear = new Date(ano, 0, 1);
      const endOfYear = new Date(ano, 11, 31, 23, 59, 59);
      constraints.push(
        where('data', '>=', Timestamp.fromDate(startOfYear)),
        where('data', '<=', Timestamp.fromDate(endOfYear))
      );
    }
    constraints.push(orderBy('data', 'desc'));
    return getDocuments<Ocorrencia>('ocorrencias', constraints);
  },
  getByAluno: (alunoId: string) =>
    getDocuments<Ocorrencia>('ocorrencias', [
      where('alunoId', '==', alunoId),
      orderBy('data', 'desc'),
    ]),
  create: (data: Omit<Ocorrencia, 'id' | 'createdAt' | 'updatedAt'>) =>
    createDocument('ocorrencias', data),
  update: (id: string, data: Partial<Ocorrencia>) =>
    updateDocument('ocorrencias', id, data),
  delete: (id: string) => deleteDocument('ocorrencias', id),
  aprovar: (id: string, aprovadaPor: string) =>
    updateDocument<Ocorrencia>('ocorrencias', id, {
      status: 'aprovada',
      aprovadaPor,
      aprovadaEm: new Date(),
    }),
  cancelar: (id: string, canceladaPor: string) =>
    updateDocument<Ocorrencia>('ocorrencias', id, {
      status: 'cancelada',
      canceladaPor,
      canceladaEm: new Date(),
    }),
};
