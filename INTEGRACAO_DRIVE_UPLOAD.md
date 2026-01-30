# Prompt de Integração: Upload de Arquivos para Google Drive de Equipe

## Objetivo

Implementar uma funcionalidade de **upload de arquivos** no sistema **SGE Diário Digital** que permita ao usuário selecionar arquivos do seu dispositivo e enviá-los diretamente para o **Google Drive de Equipe (Shared Drive)** da organização. O fluxo é unidirecional: **sistema → Drive**. O sistema não precisa baixar ou exibir arquivos do Drive; apenas fazer upload e armazenar a referência (link + metadados) no Firestore.

---

## Contexto do Sistema

### Stack Tecnológica
| Tecnologia | Versão | Uso |
|---|---|---|
| Next.js | 16.1.1 | Framework fullstack (App Router) |
| React | 19.2.3 | UI |
| TypeScript | 5.9.3 | Tipagem |
| Material UI (MUI) | 7.3.7 | Componentes visuais |
| Firebase Auth | 12.7.0 | Autenticação com Google OAuth |
| Firestore | 12.7.0 | Banco de dados (NoSQL) |
| Zustand | 5.0.9 | State management |
| Zod | 3.23.8 | Validação de schemas |

### Autenticação com Google
O sistema já usa **Firebase Auth com Google Provider**. O login Google solicita o escopo `https://www.googleapis.com/auth/drive` (acesso completo ao Drive). O `accessToken` OAuth retornado pelo Firebase é armazenado no Zustand store (`useDriveStore`) e persistido em `sessionStorage`. Esse token é usado como `Bearer` token nas chamadas diretas à Google Drive REST API.

**Arquivo de referência:** `src/hooks/auth/authConstants.ts`

```typescript
// Escopo já configurado no GoogleAuthProvider:
googleProvider.addScope('https://www.googleapis.com/auth/drive');

// Domínio restrito:
googleProvider.setCustomParameters({
  prompt: 'select_account consent',
  hd: 'christmaster.com.br',
  access_type: 'offline',
});
```

### Variáveis de Ambiente Relevantes
```env
# ID do Drive Compartilhado (Shared Drive)
NEXT_PUBLIC_SHARED_DRIVE_ID=<id_do_shared_drive>

# ID da pasta raiz (SGE_NOVO) dentro do Shared Drive
NEXT_PUBLIC_DRIVE_PARENT_FOLDER_ID=<id_da_pasta_pai>
```

---

## Infraestrutura Já Existente (NÃO recriar)

### 1. Serviço DriveService (`src/services/driveService.ts`)

Classe `DriveService` com métodos prontos:

| Método | Descrição |
|---|---|
| `findFolder(name, parentId?)` | Busca pasta por nome dentro de parent |
| `createFolder(name, parentId?)` | Cria pasta no Drive |
| `findOrCreateFolder(name, parentId?)` | Busca ou cria pasta |
| `uploadFile(options)` | **Upload multipart** com progresso (usa `XMLHttpRequest`) |
| `listFiles(folderId, pageSize?)` | Lista arquivos de uma pasta |
| `getFile(fileId)` | Obtém metadados de arquivo |
| `deleteFile(fileId)` | Deleta arquivo |
| `setPublicAccess(fileId)` | Torna arquivo público e retorna link |
| `moveFile(fileId, newFolderId)` | Move arquivo entre pastas |
| `getSubfolder(parentId, name)` | Obtém/cria subpasta (ex: por ano/mês) |
| `initializeFolderStructure()` | Cria toda a árvore de pastas do SGE |

**Factory function:**
```typescript
import { createDriveService } from '@/services/driveService';

const service = createDriveService(accessToken, sharedDriveId?);
```

**Upload de arquivo:**
```typescript
const result = await service.uploadFile({
  file: fileObject,        // File do input ou drag-and-drop
  folderId: targetFolder,  // ID da pasta de destino no Drive
  fileName: 'nome.pdf',   // Nome opcional (usa file.name se omitido)
  onProgress: (pct) => setProgress(pct), // Callback 0-100
});

if (result.success) {
  // result.file contém: id, name, mimeType, webViewLink, webContentLink, size, createdTime
}
```

### 2. Tipos (`src/types/drive.ts`)

```typescript
interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string;
  webContentLink?: string;
  thumbnailLink?: string;
  size?: number;
  createdTime: Date;
  modifiedTime?: Date;
  parents?: string[];
}

interface DriveUploadOptions {
  file: File;
  folderId: string;
  fileName?: string;
  description?: string;
  onProgress?: (progress: number) => void;
}

interface DriveUploadResult {
  success: boolean;
  file?: DriveFile;
  error?: string;
}

// Limites
const DRIVE_SIZE_LIMITS = {
  IMAGE: 10 * 1024 * 1024,      // 10MB
  DOCUMENT: 25 * 1024 * 1024,   // 25MB
  AUDIO: 16 * 1024 * 1024,      // 16MB
  VIDEO: 50 * 1024 * 1024,      // 50MB
  DEFAULT: 25 * 1024 * 1024,    // 25MB
};
```

### 3. Zustand Store (`src/store/driveStore.ts`)

```typescript
import { useDriveStore } from '@/store/driveStore';

// Ler token e estado:
const { accessToken, folderIds, isInitialized, isTokenValid, getAccessToken } = useDriveStore();

// Guardar folder IDs após init:
useDriveStore.getState().setFolderIds(ids);

// Verificar token válido (com buffer de 5min antes da expiração):
const tokenOk = useDriveStore.getState().isTokenValid();
```

### 4. Estrutura de Pastas no Drive

Hierarquia já definida e criada por `POST /api/drive/init-folders`:

```
SGE_NOVO (pasta raiz existente no Shared Drive)
└── SGE Diário Digital
    ├── Documentos
    │   ├── Comunicados
    │   ├── Atas
    │   └── Relatórios
    ├── Anexos
    │   ├── Ocorrencias
    │   └── Mensagens (subpastas por YYYY-MM)
    ├── Fotos
    │   └── Alunos
    └── Backups
        └── Exports
```

### 5. API Route Existente (`src/app/api/drive/init-folders/route.ts`)

```
POST /api/drive/init-folders
Authorization: Bearer <google_access_token>
Body (opcional): { sharedDriveId: string }

Retorno: { success: true, folderIds: Record<string, string>, isSharedDrive: boolean }
```

### 6. Padrão de Referência no Firestore

O tipo `OcorrenciaAnexo` já é usado para armazenar referências de arquivos do Drive:

```typescript
interface OcorrenciaAnexo {
  id: string;              // UUID local
  driveFileId: string;     // ID do arquivo no Google Drive
  fileName: string;        // Nome original do arquivo
  mimeType: string;        // Tipo MIME
  size: number;            // Tamanho em bytes
  webViewLink: string;     // Link para visualização no Drive
  thumbnailLink?: string;  // Link para thumbnail (se imagem)
  uploadedAt: Date;        // Timestamp do upload
  uploadedBy: string;      // UID do usuário que fez upload
}
```

---

## O Que Deve Ser Implementado

### Fluxo Completo de Upload

```
[Usuário seleciona arquivo(s)]
         │
         ▼
[Validação client-side]
  • Tipo de arquivo permitido?
  • Tamanho dentro do limite?
  • Token do Google Drive válido?
         │
         ▼
[Determinar pasta destino no Drive]
  • Baseado no contexto (ex: "Ocorrências" → folderIds.OCORRENCIAS)
  • Criar subpasta se necessário (ex: por ano ou mês)
         │
         ▼
[Upload via DriveService.uploadFile()]
  • Exibir progresso (0-100%)
  • Permitir cancelar (abort XMLHttpRequest)
         │
         ▼
[Salvar referência no Firestore]
  • Documento na coleção relevante
  • Campos: driveFileId, fileName, mimeType, size, webViewLink, uploadedAt, uploadedBy
         │
         ▼
[Feedback visual]
  • Sucesso: mostrar link do arquivo
  • Erro: mensagem clara + opção de retry
```

### Componentes a Criar

#### 1. `src/components/ui/DriveFileUploader.tsx`
Componente reutilizável de upload para o Drive.

**Props:**
```typescript
interface DriveFileUploaderProps {
  folderId: string;                        // Pasta destino no Drive
  onUploadComplete: (file: DriveFile) => void; // Callback ao completar
  onError?: (error: string) => void;       // Callback de erro
  accept?: string;                         // MIME types aceitos (ex: "image/*,.pdf")
  maxSize?: number;                        // Tamanho máximo em bytes
  maxFiles?: number;                       // Máximo de arquivos simultâneos (default: 1)
  label?: string;                          // Texto do botão/área de drop
  variant?: 'button' | 'dropzone';         // Estilo visual
  disabled?: boolean;
}
```

**Funcionalidades:**
- Input `type="file"` com `accept` configurável
- Drag-and-drop zone (variante `dropzone`)
- Barra de progresso durante upload
- Preview do arquivo selecionado (nome, tamanho, ícone por tipo)
- Botão de cancelar upload em andamento
- Validação de tamanho e tipo antes de iniciar upload
- Suporte a múltiplos arquivos (`maxFiles > 1`)
- Estado de loading/disabled durante upload

**Comportamento:**
1. Ao selecionar arquivo, validar tipo e tamanho
2. Obter `accessToken` do `useDriveStore`
3. Se token inválido/expirado, mostrar mensagem pedindo re-login
4. Criar instância do `DriveService` com `createDriveService(accessToken)`
5. Chamar `service.uploadFile({ file, folderId, onProgress })`
6. Se sucesso, chamar `onUploadComplete(result.file)`
7. Se erro, chamar `onError(result.error)`

#### 2. `src/components/ui/DriveFileList.tsx`
Lista de arquivos já enviados (referências do Firestore, não do Drive).

**Props:**
```typescript
interface DriveFileListProps {
  files: DriveFileReference[];    // Array de referências armazenadas no Firestore
  onDelete?: (fileId: string) => void; // Callback para deletar
  showDelete?: boolean;
  emptyMessage?: string;
}

// Tipo da referência armazenada no Firestore
interface DriveFileReference {
  id: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  thumbnailLink?: string;
  uploadedAt: Date;
  uploadedBy: string;
}
```

**Funcionalidades:**
- Exibir lista de arquivos com ícone por tipo, nome, tamanho formatado, data
- Link para abrir no Google Drive (`webViewLink`)
- Botão de deletar (se `onDelete` fornecido)
- Estado vazio com mensagem customizável
- Ícones por tipo: PDF, DOC, XLS, imagem, áudio, vídeo, genérico

#### 3. Hook: `src/hooks/useDriveUpload.ts`
Hook que encapsula a lógica de upload.

```typescript
interface UseDriveUploadOptions {
  folderId: string;
  autoSubfolder?: string;  // ex: "2025-01" para criar subpasta automática
}

interface UseDriveUploadReturn {
  upload: (file: File, fileName?: string) => Promise<DriveUploadResult>;
  uploadMultiple: (files: File[]) => Promise<DriveUploadResult[]>;
  isUploading: boolean;
  progress: number;       // 0-100
  currentFile: string | null;
  error: string | null;
  cancel: () => void;
  reset: () => void;
}
```

**Lógica interna:**
1. Obter token via `useDriveStore.getState().getAccessToken()`
2. Se token nulo, lançar erro `"Sessão Google expirada. Faça login novamente."`
3. Criar `DriveService` com `createDriveService(token)`
4. Se `autoSubfolder`, chamar `service.getSubfolder(folderId, autoSubfolder)` antes
5. Chamar `service.uploadFile(...)` com tracking de progresso
6. Atualizar estado reativo (progress, currentFile, error)
7. Incrementar/decrementar `pendingUploads` no `driveStore`

---

### Integração nos Módulos Existentes

#### A. Ocorrências (`src/app/diario/ocorrencias/`)

**Onde integrar:** Formulário de criação/edição de ocorrência.

**Comportamento:**
- Adicionar campo "Anexos" com `DriveFileUploader` (variante `dropzone`)
- `folderId` = `folderIds.OCORRENCIAS` do `driveStore`
- Criar subpasta automática por ano: `getSubfolder(folderId, "2025")`
- Ao completar upload, adicionar referência ao array `anexos` da ocorrência no Firestore
- Ao salvar ocorrência, os anexos já estarão no Drive e as referências no documento

**Modelo Firestore (campo `anexos` no documento da ocorrência):**
```typescript
interface Ocorrencia {
  // ... campos existentes
  anexos?: OcorrenciaAnexo[];  // Tipo já existe em src/types/drive.ts
}
```

#### B. Mensagens (`src/app/diario/mensagens/`)

**Onde integrar:** O sistema já tem `MediaUploader` que converte para base64 e envia via WhatsApp.

**Nova funcionalidade:** Opção de "Salvar cópia no Drive" ao enviar mídia.
- Após upload de mídia no WhatsApp, opcionalmente fazer upload do mesmo arquivo ao Drive
- `folderId` = `folderIds.MENSAGENS` do `driveStore`
- Subpasta automática por mês: `getSubfolder(folderId, "2025-01")`
- Salvar referência no log da mensagem (`mensagemLogs` collection)

#### C. Documentos / Comunicados (Nova Seção)

**Funcionalidade futura:** Área para upload de documentos gerais (comunicados, atas, relatórios).
- Usar pastas: `COMUNICADOS`, `ATAS`, `RELATORIOS`
- `DriveFileUploader` com `accept=".pdf,.doc,.docx,.xls,.xlsx"`
- `DriveFileList` para listar documentos enviados
- Metadados no Firestore: coleção `documentos`

```typescript
interface DocumentoUpload {
  id: string;
  tipo: 'comunicado' | 'ata' | 'relatorio' | 'outro';
  titulo: string;
  descricao?: string;
  driveFileId: string;
  fileName: string;
  mimeType: string;
  size: number;
  webViewLink: string;
  uploadedAt: Date;
  uploadedBy: string;
  turmaId?: string;        // Associado a uma turma (opcional)
  disciplinaId?: string;   // Associado a uma disciplina (opcional)
  ano: number;
  bimestre?: number;
}
```

---

## Regras de Negócio

### Validação de Arquivos

| Tipo | Extensões Permitidas | Tamanho Máximo |
|---|---|---|
| Imagens | `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp` | 10 MB |
| Documentos | `.pdf`, `.doc`, `.docx`, `.xls`, `.xlsx`, `.ppt`, `.pptx` | 25 MB |
| Áudio | `.mp3`, `.ogg`, `.wav`, `.m4a` | 16 MB |
| Vídeo | `.mp4`, `.avi`, `.mov`, `.mkv` | 50 MB |
| Outros | Qualquer | 25 MB |

### Permissões
- Apenas usuários autenticados com Google (`@christmaster.com.br`) podem fazer upload
- O token OAuth deve ter o escopo `drive` (já configurado)
- Em Shared Drives, as permissões de pasta são herdadas do Drive de Equipe
- **NÃO** tornar arquivos públicos automaticamente (diferente do fluxo de fotos de alunos)

### Nomenclatura de Arquivos
Ao fazer upload, renomear o arquivo seguindo o padrão:
```
[TIPO]_[CONTEXTO]_[TIMESTAMP]_[NOME_ORIGINAL]
```
Exemplos:
- `OCORRENCIA_12345_20250129_relatorio.pdf`
- `COMUNICADO_TURMA3A_20250129_aviso_reuniao.pdf`
- `MENSAGEM_202501_foto_evento.jpg`

### Tratamento de Erros

| Erro | Mensagem para o Usuário | Ação |
|---|---|---|
| Token expirado | "Sua sessão Google expirou. Faça login novamente." | Redirecionar para login |
| Arquivo muito grande | "O arquivo excede o tamanho máximo de X MB." | Impedir upload |
| Tipo não permitido | "Tipo de arquivo não suportado." | Impedir upload |
| Erro de rede | "Erro de conexão. Tente novamente." | Botão de retry |
| Sem permissão no Drive | "Sem permissão para acessar o Drive. Contacte o administrador." | Log do erro |
| Pasta não encontrada | "Estrutura de pastas não inicializada. Execute a configuração do Drive." | Link para init |
| Quota excedida | "Drive sem espaço disponível." | Notificar admin |

---

## Padrões de Código do Projeto

### Estrutura de Componentes
```typescript
'use client';

import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

interface ComponentProps {
  // Props tipadas
}

export default function Component({ prop1, prop2 }: ComponentProps) {
  const theme = useTheme();
  // ...
}
```

### API Routes (App Router)
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }
    const accessToken = authHeader.substring(7);

    const body = await request.json();
    // ... lógica

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno' },
      { status: 500 }
    );
  }
}
```

### Hooks Customizados
```typescript
'use client';

import { useState, useCallback } from 'react';

export function useCustomHook(options: Options) {
  const [state, setState] = useState(initialState);

  const action = useCallback(async () => {
    // ...
  }, [dependencies]);

  return { state, action };
}
```

### Firestore Service
```typescript
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, getDoc, query, where, getDocs } from 'firebase/firestore';

const COLLECTION = 'nome_colecao';

export async function createDocument(data: DocType): Promise<string> {
  const ref = doc(collection(db, COLLECTION));
  await setDoc(ref, { ...data, id: ref.id, criadoEm: new Date() });
  return ref.id;
}
```

---

## Checklist de Implementação

### Fase 1: Componentes Base
- [ ] Criar tipo `DriveFileReference` em `src/types/drive.ts`
- [ ] Criar hook `useDriveUpload` em `src/hooks/useDriveUpload.ts`
- [ ] Criar componente `DriveFileUploader` em `src/components/ui/DriveFileUploader.tsx`
- [ ] Criar componente `DriveFileList` em `src/components/ui/DriveFileList.tsx`
- [ ] Exportar novos componentes em `src/components/ui/index.ts`
- [ ] Exportar hook em `src/hooks/index.ts` (se existir barrel export)

### Fase 2: Integração com Ocorrências
- [ ] Adicionar campo `anexos` no formulário de ocorrência
- [ ] Usar `DriveFileUploader` com `folderId = folderIds.OCORRENCIAS`
- [ ] Salvar referências no documento Firestore da ocorrência
- [ ] Exibir anexos com `DriveFileList` na visualização da ocorrência
- [ ] Implementar deleção de anexo (Drive + Firestore)

### Fase 3: Integração com Mensagens (Opcional)
- [ ] Adicionar toggle "Salvar cópia no Drive" no `MediaUploader`
- [ ] Ao enviar mensagem com mídia, fazer upload paralelo ao Drive
- [ ] Salvar referência no log de mensagem

### Fase 4: Área de Documentos (Futuro)
- [ ] Criar page `src/app/diario/documentos/page.tsx`
- [ ] CRUD de documentos com categorização (comunicado/ata/relatório)
- [ ] Upload + listagem por categoria e período
- [ ] Busca por nome/tipo/data

### Verificação Final
- [ ] `npm run build` sem erros TypeScript
- [ ] Upload funciona em Shared Drive (supportsAllDrives=true)
- [ ] Progresso exibido corretamente (0-100%)
- [ ] Referência salva no Firestore após upload
- [ ] Link do Drive abre o arquivo corretamente
- [ ] Token expirado mostra mensagem adequada
- [ ] Arquivos acima do limite são rejeitados no client
- [ ] Funciona em mobile (PWA)

---

## Arquivos Importantes para Referência

| Arquivo | Conteúdo |
|---|---|
| `src/services/driveService.ts` | Serviço completo do Google Drive (usar, NÃO recriar) |
| `src/types/drive.ts` | Tipos, constantes, MIME types, limites |
| `src/store/driveStore.ts` | Estado do Drive (token, folder IDs) |
| `src/hooks/auth/authConstants.ts` | Configuração OAuth com escopos |
| `src/app/api/drive/init-folders/route.ts` | API de inicialização de pastas |
| `src/services/storageService.ts` | Exemplo de upload com progresso (Firebase Storage) |
| `src/app/diario/mensagens/components/composer/MediaUploader.tsx` | Exemplo de UI de upload existente |
| `src/lib/firebase.ts` | Configuração Firebase (Firestore, Auth, Storage) |
| `.env.example` | Variáveis de ambiente necessárias |

---

## Resumo Executivo

O sistema **já possui** toda a infraestrutura de Drive (serviço, tipos, store, auth, pastas). O que falta é:

1. **Componente UI de upload** (`DriveFileUploader`) — seletor de arquivo + drag-and-drop + progresso
2. **Hook de upload** (`useDriveUpload`) — encapsula lógica de token + upload + estado
3. **Componente de listagem** (`DriveFileList`) — exibe arquivos já enviados com links
4. **Integração nos módulos** — usar os componentes acima dentro de Ocorrências, Mensagens e futura área de Documentos
5. **Persistência** — salvar `DriveFileReference` (metadados) no Firestore ao completar upload

Toda a comunicação com a Google Drive API v3 já está implementada em `driveService.ts`. Basta instanciar com `createDriveService(accessToken)` e usar `uploadFile()`. O Shared Drive é tratado automaticamente via `supportsAllDrives=true`.
