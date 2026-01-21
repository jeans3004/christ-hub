/**
 * API Route para inicializar estrutura de pastas no Google Drive.
 * Suporta Drive de Equipe (Shared Drive) quando NEXT_PUBLIC_SHARED_DRIVE_ID esta definido.
 * POST /api/drive/init-folders
 */

import { NextRequest, NextResponse } from 'next/server';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const FOLDER_MIME_TYPE = 'application/vnd.google-apps.folder';

// ID do Drive de Equipe (Shared Drive)
const SHARED_DRIVE_ID = process.env.NEXT_PUBLIC_SHARED_DRIVE_ID || '';

const FOLDER_STRUCTURE = {
  PARENT: 'SGE_NOVO',           // Pasta pai existente no Shared Drive
  ROOT: 'SGE Diário Digital',
  DOCUMENTOS: 'Documentos',
  COMUNICADOS: 'Comunicados',
  ATAS: 'Atas',
  RELATORIOS: 'Relatórios',
  ANEXOS: 'Anexos',
  OCORRENCIAS: 'Ocorrencias',
  MENSAGENS: 'Mensagens',
  FOTOS: 'Fotos',
  ALUNOS: 'Alunos',
  BACKUPS: 'Backups',
  EXPORTS: 'Exports',
};

interface FolderIds {
  [key: string]: string;
}

function isSharedDrive(sharedDriveId: string): boolean {
  return !!sharedDriveId;
}

function getSharedDriveParams(sharedDriveId: string): Record<string, string> {
  if (!isSharedDrive(sharedDriveId)) return {};
  return {
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  };
}

async function findFolder(
  accessToken: string,
  name: string,
  parentId?: string,
  sharedDriveId?: string,
  searchAnywhere = false
): Promise<string | null> {
  const driveId = sharedDriveId || SHARED_DRIVE_ID;
  let query = `name='${name}' and mimeType='${FOLDER_MIME_TYPE}' and trashed=false`;

  // Se tem parentId, buscar dentro dele
  // Se searchAnywhere=true, não adiciona restrição de parent (busca em todo o Drive)
  // Se não tem parentId e é Shared Drive, buscar na raiz do Shared Drive
  if (parentId) {
    query += ` and '${parentId}' in parents`;
  } else if (!searchAnywhere && isSharedDrive(driveId)) {
    query += ` and '${driveId}' in parents`;
  }

  const params = new URLSearchParams({
    q: query,
    fields: 'files(id,name,parents)',
    pageSize: '10',
    ...getSharedDriveParams(driveId),
  });

  // Para Shared Drive, especificar corpora e driveId
  if (isSharedDrive(driveId)) {
    params.set('corpora', 'drive');
    params.set('driveId', driveId);
  }

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Drive API error:', response.status, errorData);
    return null;
  }

  const data = await response.json();
  console.log(`Search for "${name}":`, data.files?.length || 0, 'results');
  return data.files && data.files.length > 0 ? data.files[0].id : null;
}

async function createFolder(
  accessToken: string,
  name: string,
  parentId?: string,
  sharedDriveId?: string
): Promise<string> {
  const driveId = sharedDriveId || SHARED_DRIVE_ID;

  // Se não tem parentId e é Shared Drive, usar o Shared Drive como parent
  const parents = parentId
    ? [parentId]
    : (isSharedDrive(driveId) ? [driveId] : undefined);

  const metadata = {
    name,
    mimeType: FOLDER_MIME_TYPE,
    parents,
  };

  const params = new URLSearchParams(getSharedDriveParams(driveId));

  const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
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
  parentId?: string,
  sharedDriveId?: string
): Promise<string> {
  const existingId = await findFolder(accessToken, name, parentId, sharedDriveId);
  if (existingId) {
    return existingId;
  }
  return createFolder(accessToken, name, parentId, sharedDriveId);
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

    // Obter sharedDriveId do body (opcional)
    let sharedDriveId: string | undefined;
    try {
      const body = await request.json();
      sharedDriveId = body.sharedDriveId;
    } catch {
      // Body vazio ou inválido, usa env var
    }

    const driveId = sharedDriveId || SHARED_DRIVE_ID;

    // Criar estrutura de pastas
    const ids: FolderIds = {};

    // Primeiro, buscar a pasta pai SGE_NOVO em qualquer lugar do Shared Drive
    const parentId = await findFolder(accessToken, FOLDER_STRUCTURE.PARENT, undefined, driveId, true);
    if (!parentId) {
      return NextResponse.json(
        { error: `Pasta "${FOLDER_STRUCTURE.PARENT}" não encontrada no Drive. Crie-a manualmente primeiro.` },
        { status: 404 }
      );
    }
    console.log(`Found parent folder "${FOLDER_STRUCTURE.PARENT}" with ID:`, parentId);
    ids.PARENT = parentId;

    // Pasta raiz: SGE Diário Digital (dentro de SGE_NOVO)
    ids.ROOT = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.ROOT, parentId, driveId);

    // Documentos
    ids.DOCUMENTOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.DOCUMENTOS, ids.ROOT, driveId);
    ids.COMUNICADOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.COMUNICADOS, ids.DOCUMENTOS, driveId);
    ids.ATAS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.ATAS, ids.DOCUMENTOS, driveId);
    ids.RELATORIOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.RELATORIOS, ids.DOCUMENTOS, driveId);

    // Anexos
    ids.ANEXOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.ANEXOS, ids.ROOT, driveId);
    ids.OCORRENCIAS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.OCORRENCIAS, ids.ANEXOS, driveId);
    ids.MENSAGENS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.MENSAGENS, ids.ANEXOS, driveId);

    // Fotos de Alunos
    ids.FOTOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.FOTOS, ids.ROOT, driveId);
    ids.ALUNOS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.ALUNOS, ids.FOTOS, driveId);

    // Backups
    ids.BACKUPS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.BACKUPS, ids.ROOT, driveId);
    ids.EXPORTS = await findOrCreateFolder(accessToken, FOLDER_STRUCTURE.EXPORTS, ids.BACKUPS, driveId);

    // Incluir referência ao Shared Drive se aplicável
    if (isSharedDrive(driveId)) {
      ids.SHARED_DRIVE = driveId;
    }

    return NextResponse.json({
      success: true,
      folderIds: ids,
      isSharedDrive: isSharedDrive(driveId),
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
