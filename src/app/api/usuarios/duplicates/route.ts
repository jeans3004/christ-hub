/**
 * API Route para gerenciar usuários duplicados.
 * GET /api/usuarios/duplicates - Lista usuários duplicados
 * POST /api/usuarios/duplicates/merge - Faz merge de duplicados
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, deleteDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UsuarioData {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  googleEmail?: string;
  googleUid?: string;
  tipo?: string;
  turmaIds?: string[];
  disciplinaIds?: string[];
  ativo?: boolean;
  authStatus?: string;
  telefone?: string;
  celular?: string;
  createdAt?: any;
  updatedAt?: any;
}

interface DuplicateGroup {
  key: string;
  field: string;
  usuarios: UsuarioData[];
}

export async function GET() {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);

    const usuarios: UsuarioData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as UsuarioData[];

    // Encontrar duplicados por diferentes critérios
    const duplicates: DuplicateGroup[] = [];

    // 1. Duplicados por nome (case insensitive)
    const byNome = new Map<string, UsuarioData[]>();
    usuarios.forEach(u => {
      const key = u.nome?.toLowerCase().trim();
      if (key) {
        if (!byNome.has(key)) byNome.set(key, []);
        byNome.get(key)!.push(u);
      }
    });
    byNome.forEach((users, key) => {
      if (users.length > 1) {
        duplicates.push({ key, field: 'nome', usuarios: users });
      }
    });

    // 2. Duplicados por email
    const byEmail = new Map<string, UsuarioData[]>();
    usuarios.forEach(u => {
      const key = u.email?.toLowerCase().trim();
      if (key) {
        if (!byEmail.has(key)) byEmail.set(key, []);
        byEmail.get(key)!.push(u);
      }
    });
    byEmail.forEach((users, key) => {
      if (users.length > 1) {
        duplicates.push({ key, field: 'email', usuarios: users });
      }
    });

    // 3. Duplicados por googleEmail
    const byGoogleEmail = new Map<string, UsuarioData[]>();
    usuarios.forEach(u => {
      const key = u.googleEmail?.toLowerCase().trim();
      if (key) {
        if (!byGoogleEmail.has(key)) byGoogleEmail.set(key, []);
        byGoogleEmail.get(key)!.push(u);
      }
    });
    byGoogleEmail.forEach((users, key) => {
      if (users.length > 1) {
        duplicates.push({ key, field: 'googleEmail', usuarios: users });
      }
    });

    // 4. Duplicados por CPF
    const byCpf = new Map<string, UsuarioData[]>();
    usuarios.forEach(u => {
      const key = u.cpf?.replace(/\D/g, '').trim();
      if (key && key.length >= 11) {
        if (!byCpf.has(key)) byCpf.set(key, []);
        byCpf.get(key)!.push(u);
      }
    });
    byCpf.forEach((users, key) => {
      if (users.length > 1) {
        duplicates.push({ key, field: 'cpf', usuarios: users });
      }
    });

    return NextResponse.json({
      success: true,
      total: usuarios.length,
      duplicatesCount: duplicates.length,
      duplicates: duplicates.map(d => ({
        key: d.key,
        field: d.field,
        count: d.usuarios.length,
        usuarios: d.usuarios.map(u => ({
          id: u.id,
          nome: u.nome,
          email: u.email,
          googleEmail: u.googleEmail,
          cpf: u.cpf,
          tipo: u.tipo,
          ativo: u.ativo,
          authStatus: u.authStatus,
          googleUid: u.googleUid,
          turmaIds: u.turmaIds,
          disciplinaIds: u.disciplinaIds,
        })),
      })),
    });
  } catch (error: any) {
    console.error('Error finding duplicates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao buscar duplicados' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keepId, deleteIds, autoMergeAll } = body;

    // Auto merge all duplicates
    if (autoMergeAll) {
      return autoMergeAllDuplicates();
    }

    if (!keepId || !deleteIds || !Array.isArray(deleteIds) || deleteIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Parâmetros inválidos. Envie keepId e deleteIds[] ou autoMergeAll: true' },
        { status: 400 }
      );
    }

    // Buscar todos os usuários envolvidos
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);
    const usuarios = new Map<string, UsuarioData>();
    snapshot.docs.forEach(doc => {
      usuarios.set(doc.id, { id: doc.id, ...doc.data() } as UsuarioData);
    });

    const keepUser = usuarios.get(keepId);
    if (!keepUser) {
      return NextResponse.json(
        { success: false, error: `Usuário ${keepId} não encontrado` },
        { status: 404 }
      );
    }

    // Coletar dados dos usuários a serem deletados para merge
    const toDelete: UsuarioData[] = [];
    for (const id of deleteIds) {
      const user = usuarios.get(id);
      if (user) {
        toDelete.push(user);
      }
    }

    // Fazer merge dos dados
    const mergedTurmaIds = new Set(keepUser.turmaIds || []);
    const mergedDisciplinaIds = new Set(keepUser.disciplinaIds || []);

    toDelete.forEach(u => {
      u.turmaIds?.forEach(id => mergedTurmaIds.add(id));
      u.disciplinaIds?.forEach(id => mergedDisciplinaIds.add(id));
    });

    // Atualizar usuário que será mantido
    const updateData: any = {
      turmaIds: Array.from(mergedTurmaIds),
      disciplinaIds: Array.from(mergedDisciplinaIds),
      updatedAt: Timestamp.now(),
    };

    // Preencher campos vazios do usuário mantido com dados dos deletados
    toDelete.forEach(u => {
      if (!keepUser.googleUid && u.googleUid) updateData.googleUid = u.googleUid;
      if (!keepUser.googleEmail && u.googleEmail) updateData.googleEmail = u.googleEmail;
      if (!keepUser.email && u.email) updateData.email = u.email;
      if (!keepUser.cpf && u.cpf) updateData.cpf = u.cpf;
      if (!keepUser.telefone && u.telefone) updateData.telefone = u.telefone;
      if (!keepUser.celular && u.celular) updateData.celular = u.celular;
      if (keepUser.authStatus === 'pending' && u.authStatus === 'linked') {
        updateData.authStatus = 'linked';
      }
    });

    await updateDoc(doc(db, 'usuarios', keepId), updateData);

    // Deletar usuários duplicados
    let deleted = 0;
    for (const id of deleteIds) {
      try {
        await deleteDoc(doc(db, 'usuarios', id));
        deleted++;
      } catch (err) {
        console.error(`Error deleting user ${id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Merge concluído. ${deleted} usuários deletados, dados mesclados em ${keepUser.nome}`,
      kept: keepId,
      deleted: deleteIds,
      mergedTurmaIds: Array.from(mergedTurmaIds),
      mergedDisciplinaIds: Array.from(mergedDisciplinaIds),
    });
  } catch (error: any) {
    console.error('Error merging duplicates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao fazer merge' },
      { status: 500 }
    );
  }
}

async function autoMergeAllDuplicates() {
  try {
    const usuariosRef = collection(db, 'usuarios');
    const snapshot = await getDocs(usuariosRef);

    const usuarios: UsuarioData[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as UsuarioData[];

    // Agrupar por nome (case insensitive)
    const byNome = new Map<string, UsuarioData[]>();
    usuarios.forEach(u => {
      const key = u.nome?.toLowerCase().trim();
      if (key) {
        if (!byNome.has(key)) byNome.set(key, []);
        byNome.get(key)!.push(u);
      }
    });

    const mergeResults: { nome: string; kept: string; deleted: string[] }[] = [];
    let totalDeleted = 0;

    for (const [nome, users] of byNome.entries()) {
      if (users.length <= 1) continue;

      // Escolher qual manter: priorizar o que tem mais turmaIds e disciplinaIds
      users.sort((a, b) => {
        const scoreA = (a.turmaIds?.length || 0) + (a.disciplinaIds?.length || 0);
        const scoreB = (b.turmaIds?.length || 0) + (b.disciplinaIds?.length || 0);
        return scoreB - scoreA; // Maior primeiro
      });

      const keepUser = users[0];
      const toDelete = users.slice(1);

      // Coletar dados para merge
      const mergedTurmaIds = new Set(keepUser.turmaIds || []);
      const mergedDisciplinaIds = new Set(keepUser.disciplinaIds || []);

      const updateData: any = {};

      toDelete.forEach(u => {
        u.turmaIds?.forEach(id => mergedTurmaIds.add(id));
        u.disciplinaIds?.forEach(id => mergedDisciplinaIds.add(id));

        // Preencher campos vazios
        if (!keepUser.googleUid && u.googleUid) updateData.googleUid = u.googleUid;
        if (!keepUser.googleEmail && u.googleEmail) updateData.googleEmail = u.googleEmail;
        if (!keepUser.email && u.email) updateData.email = u.email;
        if (!keepUser.cpf && u.cpf) updateData.cpf = u.cpf;
        if (!keepUser.telefone && u.telefone) updateData.telefone = u.telefone;
        if (!keepUser.celular && u.celular) updateData.celular = u.celular;
        if (keepUser.authStatus === 'pending' && u.authStatus === 'linked') {
          updateData.authStatus = 'linked';
        }
      });

      // Atualizar usuário mantido
      updateData.turmaIds = Array.from(mergedTurmaIds);
      updateData.disciplinaIds = Array.from(mergedDisciplinaIds);
      updateData.updatedAt = Timestamp.now();

      await updateDoc(doc(db, 'usuarios', keepUser.id), updateData);

      // Deletar duplicados
      const deletedIds: string[] = [];
      for (const u of toDelete) {
        try {
          await deleteDoc(doc(db, 'usuarios', u.id));
          deletedIds.push(u.id);
          totalDeleted++;
        } catch (err) {
          console.error(`Error deleting user ${u.id}:`, err);
        }
      }

      mergeResults.push({
        nome: keepUser.nome,
        kept: keepUser.id,
        deleted: deletedIds,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Auto-merge concluído. ${totalDeleted} usuários duplicados removidos.`,
      totalMerged: mergeResults.length,
      totalDeleted,
      details: mergeResults,
    });
  } catch (error: any) {
    console.error('Error auto-merging duplicates:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Erro ao fazer auto-merge' },
      { status: 500 }
    );
  }
}
