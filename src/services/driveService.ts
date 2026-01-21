/**
 * Servico para integracao com Google Drive API.
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

/**
 * Classe de servico para operacoes do Google Drive.
 */
class DriveService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
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
   * Busca uma pasta pelo nome dentro de um parent.
   */
  async findFolder(name: string, parentId?: string): Promise<DriveFile | null> {
    let query = `name='${name}' and mimeType='${DRIVE_MIME_TYPES.FOLDER}' and trashed=false`;
    if (parentId) {
      query += ` and '${parentId}' in parents`;
    }

    const params = new URLSearchParams({
      q: query,
      fields: 'files(id,name,mimeType,webViewLink,createdTime)',
      pageSize: '1',
    });

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
   */
  async createFolder(name: string, parentId?: string): Promise<string> {
    const metadata: DriveFileMetadata = {
      name,
      mimeType: DRIVE_MIME_TYPES.FOLDER,
      parents: parentId ? [parentId] : undefined,
    };

    const response = await fetch(`${DRIVE_API_BASE}/files`, {
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
   * Inicializa a estrutura de pastas do SGE no Drive.
   * Retorna um mapa com os IDs de cada pasta.
   */
  async initializeFolderStructure(): Promise<DriveFolderIds> {
    const ids: DriveFolderIds = {};

    // Pasta raiz: SGE Diário Digital
    ids.ROOT = await this.findOrCreateFolder(DRIVE_FOLDERS.ROOT);

    // Documentos
    ids.DOCUMENTOS = await this.findOrCreateFolder(DRIVE_FOLDERS.DOCUMENTOS, ids.ROOT);
    ids.COMUNICADOS = await this.findOrCreateFolder(DRIVE_FOLDERS.COMUNICADOS, ids.DOCUMENTOS);
    ids.ATAS = await this.findOrCreateFolder(DRIVE_FOLDERS.ATAS, ids.DOCUMENTOS);
    ids.RELATORIOS = await this.findOrCreateFolder(DRIVE_FOLDERS.RELATORIOS, ids.DOCUMENTOS);

    // Anexos
    ids.ANEXOS = await this.findOrCreateFolder(DRIVE_FOLDERS.ANEXOS, ids.ROOT);
    ids.OCORRENCIAS = await this.findOrCreateFolder(DRIVE_FOLDERS.OCORRENCIAS, ids.ANEXOS);
    ids.MENSAGENS = await this.findOrCreateFolder(DRIVE_FOLDERS.MENSAGENS, ids.ANEXOS);

    // Backups
    ids.BACKUPS = await this.findOrCreateFolder(DRIVE_FOLDERS.BACKUPS, ids.ROOT);
    ids.EXPORTS = await this.findOrCreateFolder(DRIVE_FOLDERS.EXPORTS, ids.BACKUPS);

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

        xhr.open('POST', `${DRIVE_UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,size,createdTime`);
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
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}`, {
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
   */
  async setPublicAccess(fileId: string): Promise<string> {
    // Criar permissao de leitura para qualquer pessoa
    const response = await fetch(`${DRIVE_API_BASE}/files/${fileId}/permissions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Erro ao definir permissões');
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
}

/**
 * Criar instancia do servico com token de acesso.
 */
export function createDriveService(accessToken: string): DriveService {
  return new DriveService(accessToken);
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

export type { DriveService };
