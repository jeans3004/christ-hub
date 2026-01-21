/**
 * Servico para integracao com Google Drive API.
 * Suporta Drive de Equipe (Shared Drive).
 * Usa REST API diretamente (sem biblioteca do Google).
 */

import {
  DriveFile,
  DriveUploadOptions,
  DriveUploadResult,
  DriveFolderIds,
  DRIVE_FOLDERS,
  DRIVE_MIME_TYPES,
  DriveApiResponse,
  DriveFileMetadata,
} from '@/types/drive';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3';

// ID do Drive de Equipe (Shared Drive)
const SHARED_DRIVE_ID = process.env.NEXT_PUBLIC_SHARED_DRIVE_ID || '';

// Nome da pasta pai existente no Shared Drive
const PARENT_FOLDER_NAME = DRIVE_FOLDERS.PARENT;

/**
 * Classe de servico para operacoes do Google Drive.
 * Configurada para usar Drive de Equipe quando SHARED_DRIVE_ID esta definido.
 */
class DriveService {
  private accessToken: string;
  private sharedDriveId: string;

  constructor(accessToken: string, sharedDriveId?: string) {
    this.accessToken = accessToken;
    this.sharedDriveId = sharedDriveId || SHARED_DRIVE_ID;
  }

  /**
   * Verifica se esta usando Drive de Equipe.
   */
  private isSharedDrive(): boolean {
    return !!this.sharedDriveId;
  }

  /**
   * Headers padrao para requisicoes autenticadas.
   */
  private getHeaders(): HeadersInit {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Parametros comuns para operacoes em Drive de Equipe.
   */
  private getSharedDriveParams(): Record<string, string> {
    if (!this.isSharedDrive()) return {};
    return {
      supportsAllDrives: 'true',
      includeItemsFromAllDrives: 'true',
    };
  }

  /**
   * Busca uma pasta pelo nome dentro de um parent.
   * Para Drive de Equipe, usa corpora=drive e driveId.
   */
  async findFolder(name: string, parentId?: string): Promise<DriveFile | null> {
    let query = `name='${name}' and mimeType='${DRIVE_MIME_TYPES.FOLDER}' and trashed=false`;

    // Se tem parentId, buscar dentro dele
    // Se não tem parentId e é Shared Drive, buscar na raiz do Shared Drive
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    } else if (this.isSharedDrive()) {
      query += ` and '${this.sharedDriveId}' in parents`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,webViewLink,createdTime)',
      pageSize: '1',
      ...this.getSharedDriveParams(),
    });

    // Para Shared Drive, especificar corpora e driveId
    if (this.isSharedDrive()) {
      params.set('corpora', 'drive');
      params.set('driveId', this.sharedDriveId);
    }

    const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao buscar pasta');
    }

    const data: DriveApiResponse<DriveFile> = await response.json();
    return data.files && data.files.length > 0 ? data.files[0] : null;
  }

  /**
   * Cria uma pasta no Drive.
   * Para Drive de Equipe, coloca na raiz do Shared Drive se não tiver parent.
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    // Se não tem parentId e é Shared Drive, usar o Shared Drive como parent
    const parents = parentId
      ? [parentId]
      : (this.isSharedDrive() ? [this.sharedDriveId] : undefined);

    const metadata: DriveFileMetadata = {
      name,
      mimeType: DRIVE_MIME_TYPES.FOLDER,
      parents,
    };

    const params = new URLSearchParams(this.getSharedDriveParams());

    const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao criar pasta');
    }

    const data = await response.json();
    return data.id;
  }

  /**
   * Busca ou cria uma pasta.
   */
  async findOrCreateFolder(name: string, parentId?: string): Promise<string> {
    const existing = await this.findFolder(name, parentId);
    if (existing) {
      return existing.id;
    }
    return this.createFolder(name, parentId);
  }

  /**
   * Busca a pasta pai existente (SGE_NOVO) no Shared Drive.
   * Esta pasta deve existir previamente.
   */
  async findParentFolder(): Promise<string | null> {
    const folder = await this.findFolder(PARENT_FOLDER_NAME);
    return folder?.id || null;
  }

  /**
   * Inicializa a estrutura de pastas do SGE no Drive.
   * Cria as pastas dentro de SGE_NOVO (existente) > SGE Diário Digital > subpastas.
   * Retorna um mapa com os IDs de cada pasta.
   */
  async initializeFolderStructure(): Promise<DriveFolderIds> {
    const ids: DriveFolderIds = {};

    // Primeiro, buscar a pasta pai SGE_NOVO (deve existir)
    const parentId = await this.findParentFolder();
    if (!parentId) {
      throw new Error(`Pasta "${PARENT_FOLDER_NAME}" não encontrada no Drive. Crie-a manualmente primeiro.`);
    }
    ids.PARENT = parentId;

    // Pasta raiz: SGE Diário Digital (dentro de SGE_NOVO)
    ids.ROOT = await this.findOrCreateFolder(DRIVE_FOLDERS.ROOT, parentId);

    // Documentos
    ids.DOCUMENTOS = await this.findOrCreateFolder(DRIVE_FOLDERS.DOCUMENTOS, ids.ROOT);
    ids.COMUNICADOS = await this.findOrCreateFolder(DRIVE_FOLDERS.COMUNICADOS, ids.DOCUMENTOS);
    ids.ATAS = await this.findOrCreateFolder(DRIVE_FOLDERS.ATAS, ids.DOCUMENTOS);
    ids.RELATORIOS = await this.findOrCreateFolder(DRIVE_FOLDERS.RELATORIOS, ids.DOCUMENTOS);

    // Anexos
    ids.ANEXOS = await this.findOrCreateFolder(DRIVE_FOLDERS.ANEXOS, ids.ROOT);
    ids.OCORRENCIAS = await this.findOrCreateFolder(DRIVE_FOLDERS.OCORRENCIAS, ids.ANEXOS);
    ids.MENSAGENS = await this.findOrCreateFolder(DRIVE_FOLDERS.MENSAGENS, ids.ANEXOS);

    // Fotos de Alunos
    ids.FOTOS = await this.findOrCreateFolder(DRIVE_FOLDERS.FOTOS, ids.ROOT);
    ids.ALUNOS = await this.findOrCreateFolder(DRIVE_FOLDERS.ALUNOS, ids.FOTOS);

    // Backups
    ids.BACKUPS = await this.findOrCreateFolder(DRIVE_FOLDERS.BACKUPS, ids.ROOT);
    ids.EXPORTS = await this.findOrCreateFolder(DRIVE_FOLDERS.EXPORTS, ids.BACKUPS);

    // Salvar referencia ao Shared Drive se aplicavel
    if (this.isSharedDrive()) {
      ids.SHARED_DRIVE = this.sharedDriveId;
    }

    return ids;
  }

  /**
   * Busca ou cria subpasta com ano/mes.
   */
  async getSubfolder(parentId: string, name: string): Promise<string> {
    return this.findOrCreateFolder(name, parentId);
  }

  /**
   * Upload de arquivo usando multipart upload.
   * Suporta Drive de Equipe com supportsAllDrives=true.
   */
  async uploadFile(options: DriveUploadOptions): Promise<DriveUploadResult> {
    const { file, folderId, fileName, onProgress } = options;

    try {
      // Metadata do arquivo
      const metadata: DriveFileMetadata = {
        name: fileName || file.name,
        parents: [folderId],
      };

      // Criar form data para multipart upload
      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', file);

      // Montar URL com parametros para Shared Drive
      const uploadParams = new URLSearchParams({
        uploadType: 'multipart',
        fields: 'id,name,mimeType,webViewLink,webContentLink,size,createdTime',
        ...this.getSharedDriveParams(),
      });

      // Para rastrear progresso, usamos XMLHttpRequest
      const result = await new Promise<DriveFile>((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable && onProgress) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const data = JSON.parse(xhr.responseText);
            resolve({
              id: data.id,
              name: data.name,
              mimeType: data.mimeType,
              webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`,
              webContentLink: data.webContentLink,
              size: data.size ? parseInt(data.size, 10) : undefined,
              createdTime: new Date(data.createdTime),
            });
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error?.message || 'Erro ao fazer upload'));
            } catch {
              reject(new Error(`Erro HTTP ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Erro de rede ao fazer upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelado'));
        });

        xhr.open('POST', `${DRIVE_UPLOAD_BASE}/files?${uploadParams}`);
        xhr.setRequestHeader('Authorization', `Bearer ${this.accessToken}`);
        xhr.send(form);
      });

      return { success: true, file: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
    }
  }

  /**
   * Lista arquivos em uma pasta.
   */
  async listFiles(folderId: string, pageSize = 100): Promise<DriveFile[]> {
    const query = `'${folderId}' in parents and trashed=false`;

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink,size,createdTime,modifiedTime)',
      pageSize: pageSize.toString(),
      orderBy: 'createdTime desc',
      ...this.getSharedDriveParams(),
    });

    const response = await fetch(`${DRIVE_API_BASE}/files?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao listar arquivos');
    }

    const data: DriveApiResponse<DriveFile> = await response.json();
    return (data.files || []).map((file) => ({
      ...file,
      createdTime: new Date(file.createdTime),
      modifiedTime: file.modifiedTime ? new Date(file.modifiedTime) : undefined,
    }));
  }

  /**
   * Obter metadados de um arquivo.
   */
  async getFile(fileId: string): Promise<DriveFile> {
    const params = new URLSearchParams({
      fields: 'id,name,mimeType,webViewLink,webContentLink,thumbnailLink,size,createdTime,modifiedTime,parents',
      ...this.getSharedDriveParams(),
    });

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao obter arquivo');
    }

    const data = await response.json();
    return {
      ...data,
      createdTime: new Date(data.createdTime),
      modifiedTime: data.modifiedTime ? new Date(data.modifiedTime) : undefined,
    };
  }

  /**
   * Deletar um arquivo.
   */
  async deleteFile(fileId: string): Promise<void> {
    const params = new URLSearchParams(this.getSharedDriveParams());

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao deletar arquivo');
    }
  }

  /**
   * Tornar arquivo publico e retornar link.
   * Nota: Em Shared Drives, as permissoes sao controladas pelo Drive.
   */
  async setPublicAccess(fileId: string): Promise<string> {
    const params = new URLSearchParams(this.getSharedDriveParams());

    // Criar permissao de leitura para qualquer pessoa
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions?${params}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // Em Shared Drives, pode nao ter permissao para mudar acesso
      console.warn('Aviso ao definir permissões:', error.error?.message);
    }

    // Retornar link de visualizacao
    return `https://drive.google.com/file/d/${fileId}/view`;
  }

  /**
   * Mover arquivo para outra pasta.
   */
  async moveFile(fileId: string, newFolderId: string, currentFolderId?: string): Promise<void> {
    const params = new URLSearchParams({
      addParents: newFolderId,
      ...this.getSharedDriveParams(),
    });

    if (currentFolderId) {
      params.append('removeParents', currentFolderId);
    }

    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}?${params}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao mover arquivo');
    }
  }

  /**
   * Retorna o ID do Shared Drive configurado.
   */
  getSharedDriveId(): string | null {
    return this.sharedDriveId || null;
  }
}

/**
 * Criar instancia do servico com token de acesso.
 * @param accessToken Token OAuth do Google
 * @param sharedDriveId ID do Shared Drive (opcional, usa env var se nao fornecido)
 */
export function createDriveService(accessToken: string, sharedDriveId?: string): DriveService {
  return new DriveService(accessToken, sharedDriveId);
}

/**
 * Helper para obter pasta de ocorrencias por ano.
 */
export async function getOcorrenciasFolderForYear(
  service: DriveService,
  folderIds: DriveFolderIds,
  ano: number
): Promise<string> {
  return service.getSubfolder(folderIds.OCORRENCIAS, ano.toString());
}

/**
 * Helper para obter pasta de mensagens por mes.
 */
export async function getMensagensFolderForMonth(
  service: DriveService,
  folderIds: DriveFolderIds,
  ano: number,
  mes: number
): Promise<string> {
  const mesStr = `${ano}-${mes.toString().padStart(2, '0')}`;
  return service.getSubfolder(folderIds.MENSAGENS, mesStr);
}

/**
 * Verifica se esta configurado para usar Shared Drive.
 */
export function isSharedDriveConfigured(): boolean {
  return !!SHARED_DRIVE_ID;
}

/**
 * Retorna o ID do Shared Drive configurado.
 */
export function getConfiguredSharedDriveId(): string | null {
  return SHARED_DRIVE_ID || null;
}

/**
 * Upload de foto de aluno para o Drive.
 * A foto é salva em: SGE_NOVO/SGE Diário Digital/Fotos/Alunos/{alunoId}.jpg
 */
export async function uploadAlunoPhotoDrive(
  service: DriveService,
  folderIds: DriveFolderIds,
  alunoId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<DriveUploadResult> {
  const fileName = `${alunoId}.jpg`;
  return service.uploadFile({
    file,
    folderId: folderIds.ALUNOS,
    fileName,
    onProgress,
  });
}

/**
 * Busca foto de aluno no Drive pelo ID.
 */
export async function findAlunoPhotoDrive(
  service: DriveService,
  folderIds: DriveFolderIds,
  alunoId: string
): Promise<DriveFile | null> {
  const files = await service.listFiles(folderIds.ALUNOS);
  return files.find(f => f.name.startsWith(alunoId)) || null;
}

/**
 * Remove foto de aluno do Drive.
 */
export async function deleteAlunoPhotoDrive(
  service: DriveService,
  folderIds: DriveFolderIds,
  alunoId: string
): Promise<void> {
  const existingFile = await findAlunoPhotoDrive(service, folderIds, alunoId);
  if (existingFile) {
    await service.deleteFile(existingFile.id);
  }
}

/**
 * Gera link público para visualização da foto do aluno.
 */
export async function getAlunoPhotoUrlDrive(
  service: DriveService,
  folderIds: DriveFolderIds,
  alunoId: string
): Promise<string | null> {
  const file = await findAlunoPhotoDrive(service, folderIds, alunoId);
  if (!file) return null;

  // Torna público e retorna link
  return service.setPublicAccess(file.id);
}

export type { DriveService };
