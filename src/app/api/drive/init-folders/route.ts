/**
 * API Route para inicializar estrutura de pastas no Google Drive.
 * POST /api/drive/init-folders
 */

import { NextRequest, NextResponse } from 'next/server';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

const FOLDER_STRUCTURE = {
  ROOT: 'SGE Diário Digital',
  DOCUMENTOS: 'Documentos',
  COMUNICADOS: 'Comunicados',
  ATAS: 'Atas',
  RELATORIOS: 'Relatórios',
  ANEXOS: 'Anexos',
  OCORRENCIAS: 'Ocorrencias',
  MENSAGENS: 'Mensagens',
  BACKUPS: 'Backups',
  EXPORTS: 'Exports',
};

interface FolderIds {
  [key: string]: string;
}

async function findFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string | null> {
  let query = `name='${name}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`;
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  }

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id)',
    pageSize: '1',
  });

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  const metadata = {
    name,
    mimeType: FOLDER_MIME_TYPE,
    parents: parentId ? [parentId] : undefined,
  };

  const response = await fetch(`${DRIVE_API_BASE}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erro ao criar pasta');
  }

  const data = await response.json();
  return data.id;
}

async function findOrCreateFolder(
  accessToken: string,
  name: string,
  parentId?: string
): Promise<string> {
  const existingId = await findFolder(accessToken, name, parentId);
  if (existingId) {
    return existingId;
  }
  return createFolder(accessToken, name, parentId);
}

export async function POST(request: NextRequest) {
  try {
    // Obter token do header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de acesso não fornecido' },
        { status: 401 }
      );
    }

    const accessToken = authHeader.substring(7);

    // Criar estrutura de pastas
    const ids: FolderIds = {};

    // Pasta raiz
    ids.ROOT = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.ROOT);

    // Documentos
    ids.DOCUMENTOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.DOCUMENTOS, ids.ROOT);
    ids.COMUNICADOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.COMUNICADOS, ids.DOCUMENTOS);
    ids.ATAS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.ATAS, ids.DOCUMENTOS);
    ids.RELATORIOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.RELATORIOS, ids.DOCUMENTOS);

    // Anexos
    ids.ANEXOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.ANEXOS, ids.ROOT);
    ids.OCORRENCIAS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.OCORRENCIAS, ids.ANEXOS);
    ids.MENSAGENS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.MENSAGENS, ids.ANEXOS);

    // Backups
    ids.BACKUPS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.BACKUPS, ids.ROOT);
    ids.EXPORTS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.EXPORTS, ids.BACKUPS);

    return NextResponse.json({
      success: true,
      folderIds: ids,
    });
  } catch (error) {
    console.error('Erro ao inicializar pastas do Drive:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro ao inicializar pastas',
      },
      { status: 500 }
    );
  }
}
