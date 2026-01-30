# Atualização Evolution API 2.2.3 → 2.3.7 + Suporte a Grupos WhatsApp

## Sistema Luminar - Guia de Implementação

**Versão**: 1.0.0  
**Data**: 25/01/2026  
**Autor**: Engenheiro de Prompts Sênior

---

## 📋 Análise de Compatibilidade

### O que já existe no sistema Luminar:

| Componente | Localização | Status |
|------------|-------------|--------|
| `whatsappService.ts` | `services/whatsappService.ts` | ✅ Existe - Modificar |
| `useMensagensLoader.ts` | `app/diario/mensagens/hooks/` | ✅ Existe - Modificar |
| `useMensagensActions.ts` | `app/diario/mensagens/hooks/` | ✅ Existe - Modificar |
| `DestinatarioSelector.tsx` | `app/diario/mensagens/components/` | ✅ Existe - Modificar |
| `MensagemLog` (tipos) | `types/index.ts` | ✅ Existe - Já suporta grupos |
| `/api/whatsapp/groups` | `app/api/whatsapp/groups/route.ts` | ✅ Existe - Modificar |
| `/api/whatsapp/send-group` | `app/api/whatsapp/send-group/route.ts` | ✅ Existe - Corrigir bug |
| `grupoWhatsappService.ts` | `services/firestore/` | ❌ Criar |
| `GrupoSelector.tsx` | `app/diario/mensagens/components/` | ❌ Criar |

### Padrões a Seguir:

- Hooks separados: `Loader` (fetch) e `Actions` (mutations)
- Componentes < 200 linhas
- Serviços em `services/firestore/[entidade]Service.ts`
- Toast via `useUIStore().addToast()`
- Permissões via `usePermissions().can()`

---

## 🖥️ PARTE 1: Atualização do Servidor Evolution API

### Informações do Servidor

```env
# Servidor Oracle Cloud Free Tier
IP: 163.176.239.167
Porta: 8080
Instância: christmaster
API Key: B6D711FCDE4D4FD5936544120E713976
SSH: ssh -i ~/.ssh/evolution_key ubuntu@163.176.239.167
```

### Passo 1: Conectar ao Servidor e Fazer Backup

```bash
# 1. Conectar via SSH
ssh -i ~/.ssh/evolution_key ubuntu@163.176.239.167

# 2. Navegar até pasta da Evolution
cd /home/ubuntu/evolution-api  # ou onde estiver instalado

# 3. Backup do .env
cp .env .env.backup_$(date +%Y%m%d)

# 4. Backup das instâncias (se usar volumes Docker)
docker exec evolution-api tar -czf /tmp/instances_backup.tar.gz /evolution/instances 2>/dev/null || echo "Skip - sem Docker"
docker cp evolution-api:/tmp/instances_backup.tar.gz ./backup_instances_$(date +%Y%m%d).tar.gz 2>/dev/null || echo "Skip"

# 5. Verificar versão atual
curl -s http://localhost:8080/ | grep -i version
```

### Passo 2: Atualizar via Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  evolution-api:
    # ❌ ANTIGA: image: atendai/evolution-api:v2.2.3
    # ✅ NOVA:
    image: atendai/evolution-api:v2.3.7
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - evolution_instances:/evolution/instances
      - evolution_store:/evolution/store
    networks:
      - evolution-network

volumes:
  evolution_instances:
  evolution_store:

networks:
  evolution-network:
    driver: bridge
```

### Passo 3: Atualizar Variáveis de Ambiente

```bash
# .env - Adicionar/verificar estas variáveis

# === Configurações Existentes (MANTER) ===
AUTHENTICATION_API_KEY=B6D711FCDE4D4FD5936544120E713976
SERVER_URL=http://163.176.239.167:8080

# === Configurações de Instância ===
DEL_INSTANCE=false
CONFIG_SESSION_PHONE_CLIENT=Luminar
CONFIG_SESSION_PHONE_NAME=Chrome

# === Database (manter desabilitado se não usar) ===
DATABASE_ENABLED=false

# === Novas Opções 2.3.x (ADICIONAR) ===

# Retry de webhooks (recomendado)
WEBHOOK_MAX_RETRIES=3
WEBHOOK_RETRY_DELAY=1000

# Timeout maior para operações
INSTANCE_TIMEOUT=300000

# Métricas (opcional - para monitoramento)
PROMETHEUS_METRICS=false

# Log level
LOG_LEVEL=ERROR
```

### Passo 4: Executar Atualização

```bash
# Via Docker Compose
cd /home/ubuntu/evolution-api

# 1. Parar containers
docker-compose down

# 2. Baixar nova imagem
docker pull atendai/evolution-api:v2.3.7

# 3. Subir com nova versão
docker-compose up -d

# 4. Verificar logs (aguardar ~30s)
sleep 30
docker-compose logs --tail 50 evolution-api

# 5. Verificar se está rodando
docker ps | grep evolution
```

### Passo 5: Verificar Atualização

```bash
# 1. Verificar versão via API
curl -s "http://163.176.239.167:8080/" | jq .

# 2. Verificar status da instância
curl -s -X GET "http://163.176.239.167:8080/instance/connectionState/christmaster" \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" | jq .

# Resposta esperada: { "instance": {...}, "state": "open" }

# 3. Se não conectar, reiniciar instância
curl -s -X PUT "http://163.176.239.167:8080/instance/restart/christmaster" \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976"

# 4. Se necessário reconectar (gera QR Code)
curl -s -X GET "http://163.176.239.167:8080/instance/connect/christmaster" \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" | jq .
```

### Passo 6: Testar Envio para Grupo (2.3.7)

```bash
# Listar grupos disponíveis
curl -s -X GET "http://163.176.239.167:8080/group/fetchAllGroups/christmaster" \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" | jq '.[] | {id, subject, size}'

# Testar envio para grupo (substitua o groupJid)
curl -s -X POST "http://163.176.239.167:8080/message/sendText/christmaster" \
  -H "apikey: B6D711FCDE4D4FD5936544120E713976" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "120363123456789012@g.us",
    "options": {
      "delay": 1200,
      "presence": "composing"
    },
    "textMessage": {
      "text": "🧪 Teste Evolution API 2.3.7 - Luminar"
    }
  }' | jq .
```

---

## 💻 PARTE 2: Atualização do Sistema Luminar (Next.js)

### Estrutura de Arquivos a Criar/Modificar

```
src/
├── app/
│   ├── api/whatsapp/
│   │   ├── groups/route.ts              # MODIFICAR - compatibilidade 2.3.7
│   │   └── send-group/route.ts          # MODIFICAR - correção SessionError
│   └── diario/mensagens/
│       ├── types.ts                     # MODIFICAR - adicionar GrupoDestinatario
│       ├── components/
│       │   ├── index.ts                 # MODIFICAR - exportar GrupoSelector
│       │   ├── GrupoSelector.tsx        # CRIAR
│       │   └── DestinatarioSelector.tsx # MODIFICAR - adicionar aba Grupo
│       └── hooks/
│           ├── useMensagensLoader.ts    # MODIFICAR - carregar grupos
│           └── useMensagensActions.ts   # MODIFICAR - envio para grupo
├── services/
│   ├── whatsappService.ts               # MODIFICAR - retry logic + fetchAllGroups
│   └── firestore/
│       └── grupoWhatsappService.ts      # CRIAR
└── types/
    └── index.ts                         # VERIFICAR - MensagemLog já suporta grupos
```

---

### Arquivo 1: `services/whatsappService.ts` (MODIFICAR)

```typescript
// services/whatsappService.ts
// Adicionar retry logic e método fetchAllGroups

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://163.176.239.167:8080';
const API_KEY = process.env.EVOLUTION_API_KEY || 'B6D711FCDE4D4FD5936544120E713976';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'christmaster';

// Tipos
export interface WhatsAppGroup {
  id: string;              // groupJid (formato: 120363123456789012@g.us)
  subject: string;         // Nome do grupo
  size: number;            // Quantidade de participantes
  creation: number;        // Timestamp de criação
  owner?: string;          // ID do criador
  participants?: Array<{
    id: string;
    admin: 'admin' | 'superadmin' | null;
  }>;
}

export interface SendMessageResult {
  key?: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: Record<string, unknown>;
  messageTimestamp?: string;
  status?: string;
  error?: string;
}

export interface WhatsAppStatus {
  instance?: {
    instanceName: string;
    state: 'open' | 'close' | 'connecting';
  };
  state?: string;
  error?: string;
  errorType?: string;
  errorCode?: string;
}

// Helper para retry com exponential backoff
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30s timeout (recomendado 2.3.x)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error as Error;
      console.error(`[WhatsApp] Tentativa ${attempt}/${maxRetries} falhou:`, error);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  throw lastError || new Error('Erro desconhecido após retries');
}

export const whatsappService = {
  // ============================================
  // ENVIO DE MENSAGENS
  // ============================================

  /**
   * Envia mensagem de texto (individual ou grupo)
   * Na 2.3.7, o campo 'number' aceita tanto número quanto groupJid
   */
  async sendText(numero: string, mensagem: string): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: true,
          },
          textMessage: {
            text: mensagem,
          },
        }),
      }
    );
  },

  /**
   * Envia mensagem para grupo (wrapper de sendText)
   */
  async sendToGroup(groupJid: string, mensagem: string): Promise<SendMessageResult> {
    // Valida formato do groupJid
    if (!groupJid.endsWith('@g.us')) {
      throw new Error('ID de grupo inválido. Deve terminar com @g.us');
    }
    return this.sendText(groupJid, mensagem);
  },

  /**
   * Envia imagem
   */
  async sendImage(
    numero: string,
    media: { base64?: string; url?: string },
    caption?: string
  ): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: { delay: 1200, presence: 'composing' },
          mediaMessage: {
            mediatype: 'image',
            caption,
            ...(media.base64 ? { media: media.base64 } : { media: media.url }),
          },
        }),
      }
    );
  },

  /**
   * Envia documento
   */
  async sendDocument(
    numero: string,
    media: { base64?: string; url?: string; filename?: string },
    caption?: string
  ): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: { delay: 1200, presence: 'composing' },
          mediaMessage: {
            mediatype: 'document',
            caption,
            fileName: media.filename || 'document',
            ...(media.base64 ? { media: media.base64 } : { media: media.url }),
          },
        }),
      }
    );
  },

  /**
   * Envia áudio
   */
  async sendAudio(
    numero: string,
    media: { base64?: string; url?: string }
  ): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendWhatsAppAudio/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: { delay: 1200, presence: 'recording' },
          audioMessage: {
            ...(media.base64 ? { audio: media.base64 } : { audio: media.url }),
          },
        }),
      }
    );
  },

  /**
   * Envia vídeo
   */
  async sendVideo(
    numero: string,
    media: { base64?: string; url?: string },
    caption?: string
  ): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendMedia/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: { delay: 1200, presence: 'composing' },
          mediaMessage: {
            mediatype: 'video',
            caption,
            ...(media.base64 ? { media: media.base64 } : { media: media.url }),
          },
        }),
      }
    );
  },

  /**
   * Envia localização
   */
  async sendLocation(
    numero: string,
    location: { latitude: number; longitude: number; name?: string; address?: string }
  ): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendLocation/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: { delay: 1200 },
          locationMessage: {
            latitude: location.latitude,
            longitude: location.longitude,
            name: location.name,
            address: location.address,
          },
        }),
      }
    );
  },

  /**
   * Envia contato
   */
  async sendContact(
    numero: string,
    contact: { name: string; phone: string }
  ): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendContact/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: { delay: 1200 },
          contactMessage: [{
            fullName: contact.name,
            wuid: contact.phone,
            phoneNumber: contact.phone,
          }],
        }),
      }
    );
  },

  /**
   * Envia sticker
   */
  async sendSticker(
    numero: string,
    media: { base64?: string; url?: string }
  ): Promise<SendMessageResult> {
    return fetchWithRetry<SendMessageResult>(
      `${EVOLUTION_API_URL}/message/sendSticker/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: numero,
          options: { delay: 1200 },
          stickerMessage: {
            ...(media.base64 ? { image: media.base64 } : { image: media.url }),
          },
        }),
      }
    );
  },

  // ============================================
  // GRUPOS (NOVO - Evolution API 2.3.7)
  // ============================================

  /**
   * Busca todos os grupos da instância
   */
  async fetchAllGroups(): Promise<WhatsAppGroup[]> {
    const response = await fetchWithRetry<WhatsAppGroup[]>(
      `${EVOLUTION_API_URL}/group/fetchAllGroups/${INSTANCE_NAME}`,
      {
        method: 'GET',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    // Normalizar resposta (pode vir como array direto ou dentro de objeto)
    if (Array.isArray(response)) {
      return response;
    }
    return (response as unknown as { groups?: WhatsAppGroup[] })?.groups || [];
  },

  /**
   * Busca informações detalhadas de um grupo específico
   */
  async getGroupInfo(groupJid: string): Promise<WhatsAppGroup | null> {
    try {
      const response = await fetchWithRetry<WhatsAppGroup>(
        `${EVOLUTION_API_URL}/group/findGroupInfos/${INSTANCE_NAME}?groupJid=${encodeURIComponent(groupJid)}`,
        {
          method: 'GET',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      return response;
    } catch (error) {
      console.error('[WhatsApp] Erro ao buscar info do grupo:', error);
      return null;
    }
  },

  /**
   * Lista grupos (alias para fetchAllGroups - compatibilidade)
   */
  async getGroups(): Promise<{ groups: WhatsAppGroup[]; error?: string }> {
    try {
      const groups = await this.fetchAllGroups();
      return { groups };
    } catch (error) {
      return { groups: [], error: (error as Error).message };
    }
  },

  // ============================================
  // STATUS E CONEXÃO
  // ============================================

  /**
   * Verifica status da conexão
   */
  async getStatus(): Promise<WhatsAppStatus> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return {
          state: 'close',
          error: error.message || 'Erro ao verificar status',
          errorType: 'API_ERROR',
          errorCode: String(response.status),
        };
      }

      return await response.json();
    } catch (error) {
      return {
        state: 'close',
        error: (error as Error).message,
        errorType: 'CONNECTION_ERROR',
      };
    }
  },

  /**
   * Obtém QR Code para conexão
   */
  async getQRCode(): Promise<{ qrcode?: string; pairingCode?: string; error?: string }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        return { error: error.message || 'Erro ao gerar QR Code' };
      }

      const data = await response.json();
      return {
        qrcode: data.qrcode?.base64 || data.base64 || data.qrcode,
        pairingCode: data.pairingCode,
      };
    } catch (error) {
      return { error: (error as Error).message };
    }
  },

  /**
   * Desconecta a instância
   */
  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`,
        {
          method: 'DELETE',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        }
      );

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Cria nova instância
   */
  async createInstance(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/create`,
        {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceName: INSTANCE_NAME,
            qrcode: true,
          }),
          signal: AbortSignal.timeout(30000),
        }
      );

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Verifica se número existe no WhatsApp
   */
  async checkNumber(numero: string): Promise<{ exists: boolean; jid?: string; error?: string }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/chat/whatsappNumbers/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: {
            'apikey': API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ numbers: [numero] }),
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        return { exists: false, error: 'Erro ao verificar número' };
      }

      const data = await response.json();
      const result = data[0] || data;
      return {
        exists: result.exists || false,
        jid: result.jid,
      };
    } catch (error) {
      return { exists: false, error: (error as Error).message };
    }
  },

  /**
   * Health check da API
   */
  async checkHealth(): Promise<{ status: string; version?: string }> {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      const data = await response.json();
      return { status: 'ok', version: data.version };
    } catch {
      return { status: 'error' };
    }
  },
};
```

---

### Arquivo 2: `services/firestore/grupoWhatsappService.ts` (CRIAR)

```typescript
// services/firestore/grupoWhatsappService.ts
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  Timestamp,
  query,
  where,
  orderBy,
} from 'firebase/firestore';
import type { WhatsAppGroup } from '@/services/whatsappService';

// Interface para grupo salvo no Firestore
export interface GrupoWhatsApp {
  id: string;              // groupJid (formato: 120363...@g.us)
  nome: string;
  tamanho: number;
  owner?: string;
  sincronizadoEm: Timestamp;
  ativo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

const COLLECTION = 'gruposWhatsapp';

export const grupoWhatsappService = {
  /**
   * Sincroniza grupos do WhatsApp para o Firestore
   * Usa batch write para melhor performance
   */
  async syncFromEvolution(grupos: WhatsAppGroup[]): Promise<number> {
    if (!grupos.length) return 0;

    const batch = writeBatch(db);
    const now = Timestamp.now();
    let count = 0;

    for (const grupo of grupos) {
      // Usa o ID do grupo como document ID
      const docRef = doc(db, COLLECTION, grupo.id);
      
      batch.set(docRef, {
        id: grupo.id,
        nome: grupo.subject || 'Grupo sem nome',
        tamanho: grupo.size || 0,
        owner: grupo.owner || null,
        sincronizadoEm: now,
        ativo: true,
        updatedAt: now,
        // Só adiciona createdAt se não existir (merge)
      }, { merge: true });
      
      count++;
    }

    await batch.commit();
    return count;
  },

  /**
   * Lista todos os grupos ativos
   */
  async getAll(): Promise<GrupoWhatsApp[]> {
    const q = query(
      collection(db, COLLECTION),
      where('ativo', '==', true),
      orderBy('nome', 'asc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as GrupoWhatsApp));
  },

  /**
   * Busca grupo por ID (groupJid)
   */
  async getById(id: string): Promise<GrupoWhatsApp | null> {
    const docRef = doc(db, COLLECTION, id);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      ...snapshot.data(),
      id: snapshot.id,
    } as GrupoWhatsApp;
  },

  /**
   * Desativa um grupo (soft delete)
   */
  async deactivate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await setDoc(docRef, {
      ativo: false,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },

  /**
   * Atualiza informações de um grupo
   */
  async update(id: string, data: Partial<GrupoWhatsApp>): Promise<void> {
    const docRef = doc(db, COLLECTION, id);
    await setDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    }, { merge: true });
  },
};
```

---

### Arquivo 3: `app/diario/mensagens/types.ts` (MODIFICAR)

```typescript
// app/diario/mensagens/types.ts
// Adicionar tipos para grupos

// Tipos de destinatário (atualizado)
export type TipoDestinatario = 'individual' | 'broadcast' | 'grupo';

// Interface para grupo no contexto de mensagens
export interface GrupoDestinatario {
  id: string;       // groupJid
  nome: string;
  tamanho: number;
}

// Tipos de mídia suportados
export type TipoMensagemMedia = 
  | 'text' 
  | 'image' 
  | 'document' 
  | 'audio' 
  | 'video' 
  | 'location' 
  | 'contact' 
  | 'sticker';

// Payload de mensagem
export interface MensagemPayload {
  tipo: TipoMensagemMedia;
  texto?: string;
  mediaUrl?: string;
  mediaBase64?: string;
  mimetype?: string;
  filename?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  linkPreview?: boolean;
  variaveis?: Record<string, string>;
}

// Tipos de formatação WhatsApp
export type FormatType = 'bold' | 'italic' | 'strike' | 'mono' | 'code' | 'list' | 'quote';

// Marcadores de formatação
export const FORMAT_MARKERS: Record<FormatType, { prefix: string; suffix: string }> = {
  bold: { prefix: '*', suffix: '*' },
  italic: { prefix: '_', suffix: '_' },
  strike: { prefix: '~', suffix: '~' },
  mono: { prefix: '`', suffix: '`' },
  code: { prefix: '```\n', suffix: '\n```' },
  list: { prefix: '• ', suffix: '' },
  quote: { prefix: '> ', suffix: '' },
};
```

---

### Arquivo 4: `app/diario/mensagens/components/GrupoSelector.tsx` (CRIAR)

```typescript
// app/diario/mensagens/components/GrupoSelector.tsx
'use client';

import { useState } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { Refresh, People, CheckCircle, Groups, Info } from '@mui/icons-material';
import type { GrupoDestinatario } from '../types';

interface GrupoSelectorProps {
  value: string | null;
  onChange: (grupoId: string | null) => void;
  grupos: GrupoDestinatario[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function GrupoSelector({
  value,
  onChange,
  grupos,
  loading,
  onRefresh,
  disabled = false,
}: GrupoSelectorProps) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const grupoSelecionado = grupos.find(g => g.id === value);

  return (
    <Box>
      {/* Seletor + Botão Sincronizar */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <FormControl fullWidth disabled={loading || disabled}>
          <InputLabel id="grupo-select-label">Grupo de Destino</InputLabel>
          <Select
            labelId="grupo-select-label"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || null)}
            label="Grupo de Destino"
            startAdornment={
              <InputAdornment position="start">
                <Groups sx={{ color: 'action.active' }} />
              </InputAdornment>
            }
          >
            <MenuItem value="">
              <em>Selecione um grupo</em>
            </MenuItem>
            {grupos.map((grupo) => (
              <MenuItem key={grupo.id} value={grupo.id}>
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body1" fontWeight={500}>
                    {grupo.nome}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {grupo.tamanho} participantes
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Tooltip title="Buscar grupos do WhatsApp">
          <Button
            variant="outlined"
            onClick={handleRefresh}
            disabled={refreshing || loading || disabled}
            sx={{ minWidth: 130, height: 56 }}
          >
            {refreshing ? (
              <CircularProgress size={20} />
            ) : (
              <>
                <Refresh sx={{ mr: 0.5 }} />
                Sincronizar
              </>
            )}
          </Button>
        </Tooltip>
      </Box>

      {/* Grupo Selecionado */}
      {grupoSelecionado && (
        <Alert 
          severity="info" 
          icon={<CheckCircle />}
          sx={{ mb: 2 }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="body2">
              Mensagem será enviada para:
            </Typography>
            <Chip 
              icon={<People />}
              label={`${grupoSelecionado.nome} (${grupoSelecionado.tamanho} pessoas)`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Alert>
      )}

      {/* Estado Vazio */}
      {grupos.length === 0 && !loading && (
        <Alert 
          severity="warning"
          icon={<Info />}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Sincronizar
            </Button>
          }
        >
          Nenhum grupo encontrado. Clique em "Sincronizar" para buscar grupos do WhatsApp.
        </Alert>
      )}

      {/* Loading */}
      {loading && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Carregando grupos...
          </Typography>
        </Box>
      )}
    </Box>
  );
}
```

---

### Arquivo 5: `app/diario/mensagens/hooks/useMensagensLoader.ts` (MODIFICAR)

Adicionar ao hook existente:

```typescript
// app/diario/mensagens/hooks/useMensagensLoader.ts
// ADICIONAR ao hook existente

import { useState, useEffect, useCallback } from 'react';
import { whatsappService } from '@/services/whatsappService';
import { grupoWhatsappService } from '@/services/firestore/grupoWhatsappService';
import { useUIStore } from '@/store/uiStore';
import type { GrupoDestinatario } from '../types';

// Dentro do hook useMensagensLoader, ADICIONAR:

export function useMensagensLoader() {
  // ... estados existentes ...

  // === NOVOS ESTADOS PARA GRUPOS ===
  const [grupos, setGrupos] = useState<GrupoDestinatario[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  
  const { addToast } = useUIStore();

  // === CARREGAR GRUPOS DO FIRESTORE ===
  const loadGrupos = useCallback(async () => {
    try {
      const gruposData = await grupoWhatsappService.getAll();
      setGrupos(gruposData.map(g => ({
        id: g.id,
        nome: g.nome,
        tamanho: g.tamanho,
      })));
    } catch (error) {
      console.error('[Mensagens] Erro ao carregar grupos:', error);
      // Não mostra toast aqui pois pode ser chamado no mount
    }
  }, []);

  // === SINCRONIZAR GRUPOS DO WHATSAPP ===
  const syncGrupos = useCallback(async () => {
    setLoadingGrupos(true);
    try {
      // 1. Buscar grupos da Evolution API
      const gruposWhatsApp = await whatsappService.fetchAllGroups();
      
      if (!gruposWhatsApp.length) {
        addToast('Nenhum grupo encontrado no WhatsApp', 'warning');
        return;
      }

      // 2. Sincronizar com Firestore
      const count = await grupoWhatsappService.syncFromEvolution(gruposWhatsApp);
      
      // 3. Recarregar lista
      await loadGrupos();
      
      addToast(`${count} grupo(s) sincronizado(s) com sucesso`, 'success');
    } catch (error) {
      console.error('[Mensagens] Erro ao sincronizar grupos:', error);
      addToast('Erro ao sincronizar grupos do WhatsApp', 'error');
      throw error;
    } finally {
      setLoadingGrupos(false);
    }
  }, [loadGrupos, addToast]);

  // === CARREGAR GRUPOS NO MOUNT ===
  useEffect(() => {
    loadGrupos();
  }, [loadGrupos]);

  return {
    // ... retornos existentes ...

    // === NOVOS RETORNOS ===
    grupos,
    loadingGrupos,
    syncGrupos,
    loadGrupos,
  };
}
```

---

### Arquivo 6: `app/diario/mensagens/hooks/useMensagensActions.ts` (MODIFICAR)

Atualizar função de envio:

```typescript
// app/diario/mensagens/hooks/useMensagensActions.ts
// MODIFICAR função enviarMensagem

import { whatsappService } from '@/services/whatsappService';
import { mensagemLogService } from '@/services/firestore/mensagemLogService';
import { grupoWhatsappService } from '@/services/firestore/grupoWhatsappService';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import type { TipoDestinatario, MensagemPayload } from '../types';

export function useMensagensActions() {
  const { usuario } = useAuthStore();
  const { addToast } = useUIStore();

  /**
   * Envia mensagem (individual, broadcast ou grupo)
   */
  const enviarMensagem = async (
    tipo: TipoDestinatario,
    destinatarios: string[],  // Para individual/broadcast (números)
    grupoId: string | null,   // Para grupo (groupJid)
    payload: MensagemPayload
  ) => {
    if (!usuario) {
      throw new Error('Usuário não autenticado');
    }

    const mensagem = payload.texto || payload.caption || '';

    try {
      // ============================================
      // ENVIAR PARA GRUPO
      // ============================================
      if (tipo === 'grupo' && grupoId) {
        const result = await whatsappService.sendToGroup(grupoId, mensagem);
        
        // Buscar info do grupo para log
        const grupo = await grupoWhatsappService.getById(grupoId);
        
        // Registrar no log
        await mensagemLogService.create({
          tipo: 'grupo',
          grupoId: grupoId,
          grupoNome: grupo?.nome || 'Grupo',
          mensagem: mensagem,
          status: result.key?.id ? 'sent' : 'failed',
          messageId: result.key?.id,
          enviadoPorId: usuario.id,
          enviadoPorNome: usuario.nome,
          enviadoEm: new Date(),
          erro: result.error,
        });
        
        addToast(`Mensagem enviada para ${grupo?.nome || 'grupo'}`, 'success');
        return { success: true, result };
      }

      // ============================================
      // ENVIAR INDIVIDUAL
      // ============================================
      if (tipo === 'individual' && destinatarios.length === 1) {
        const numero = destinatarios[0];
        const result = await whatsappService.sendText(numero, mensagem);
        
        // Registrar no log
        await mensagemLogService.create({
          tipo: 'individual',
          destinatarioNumero: numero,
          mensagem: mensagem,
          status: result.key?.id ? 'sent' : 'failed',
          messageId: result.key?.id,
          enviadoPorId: usuario.id,
          enviadoPorNome: usuario.nome,
          enviadoEm: new Date(),
          erro: result.error,
        });
        
        addToast('Mensagem enviada com sucesso', 'success');
        return { success: true, result };
      }

      // ============================================
      // ENVIAR BROADCAST (múltiplos)
      // ============================================
      if (tipo === 'broadcast' && destinatarios.length > 1) {
        let successCount = 0;
        let errorCount = 0;

        for (const numero of destinatarios) {
          try {
            const result = await whatsappService.sendText(numero, mensagem);
            
            await mensagemLogService.create({
              tipo: 'broadcast',
              destinatarioNumero: numero,
              mensagem: mensagem,
              status: result.key?.id ? 'sent' : 'failed',
              messageId: result.key?.id,
              enviadoPorId: usuario.id,
              enviadoPorNome: usuario.nome,
              enviadoEm: new Date(),
            });
            
            successCount++;
            
            // Delay entre mensagens para evitar bloqueio
            await new Promise(resolve => setTimeout(resolve, 1500));
          } catch (error) {
            errorCount++;
            console.error(`[Broadcast] Erro ao enviar para ${numero}:`, error);
          }
        }

        if (errorCount === 0) {
          addToast(`${successCount} mensagem(ns) enviada(s) com sucesso`, 'success');
        } else {
          addToast(`${successCount} enviada(s), ${errorCount} erro(s)`, 'warning');
        }

        return { success: errorCount === 0, successCount, errorCount };
      }

      throw new Error('Configuração inválida de envio');

    } catch (error) {
      console.error('[Mensagens] Erro ao enviar:', error);
      addToast('Erro ao enviar mensagem', 'error');
      throw error;
    }
  };

  return { enviarMensagem };
}
```

---

### Arquivo 7: `app/api/whatsapp/groups/route.ts` (MODIFICAR)

```typescript
// app/api/whatsapp/groups/route.ts
import { NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://163.176.239.167:8080';
const API_KEY = process.env.EVOLUTION_API_KEY || 'B6D711FCDE4D4FD5936544120E713976';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'christmaster';

export async function GET() {
  try {
    const response = await fetch(
      `${EVOLUTION_API_URL}/group/fetchAllGroups/${INSTANCE_NAME}`,
      {
        method: 'GET',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        // Timeout de 30s para Evolution API 2.3.7
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          groups: [], 
          error: errorData.message || `Erro HTTP ${response.status}` 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Normaliza resposta (pode vir como array ou objeto)
    const groups = Array.isArray(data) ? data : (data.groups || []);

    return NextResponse.json({ groups });

  } catch (error) {
    console.error('[API/WhatsApp/Groups] Erro:', error);
    return NextResponse.json(
      { 
        groups: [], 
        error: (error as Error).message || 'Erro ao buscar grupos' 
      },
      { status: 500 }
    );
  }
}
```

---

### Arquivo 8: `app/api/whatsapp/send-group/route.ts` (MODIFICAR)

```typescript
// app/api/whatsapp/send-group/route.ts
import { NextRequest, NextResponse } from 'next/server';

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://163.176.239.167:8080';
const API_KEY = process.env.EVOLUTION_API_KEY || 'B6D711FCDE4D4FD5936544120E713976';
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || 'christmaster';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { groupId, message, text } = body;

    // Valida parâmetros
    const groupJid = groupId;
    const mensagem = message || text;

    if (!groupJid) {
      return NextResponse.json(
        { error: 'groupId é obrigatório' },
        { status: 400 }
      );
    }

    if (!mensagem) {
      return NextResponse.json(
        { error: 'message é obrigatório' },
        { status: 400 }
      );
    }

    // Valida formato do groupJid
    if (!groupJid.endsWith('@g.us')) {
      return NextResponse.json(
        { error: 'groupId deve estar no formato: 120363...@g.us' },
        { status: 400 }
      );
    }

    // Envia mensagem usando endpoint sendText (Evolution API 2.3.7)
    // O campo 'number' aceita tanto número quanto groupJid
    const response = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
      {
        method: 'POST',
        headers: {
          'apikey': API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          number: groupJid,
          options: {
            delay: 1200,
            presence: 'composing',
            linkPreview: true,
          },
          textMessage: {
            text: mensagem,
          },
        }),
        // Timeout de 30s
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[API/WhatsApp/SendGroup] Erro Evolution:', errorData);
      
      return NextResponse.json(
        { 
          error: errorData.message || `Erro HTTP ${response.status}`,
          details: errorData,
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      messageId: result.key?.id,
      result,
    });

  } catch (error) {
    console.error('[API/WhatsApp/SendGroup] Erro:', error);
    return NextResponse.json(
      { 
        error: (error as Error).message || 'Erro ao enviar para grupo',
        success: false,
      },
      { status: 500 }
    );
  }
}
```

---

## 📋 Checklist de Implementação

### Servidor (Oracle Cloud)

- [ ] Conectar via SSH ao servidor
- [ ] Fazer backup do .env e instâncias
- [ ] Atualizar docker-compose.yml para v2.3.7
- [ ] Executar `docker-compose down && docker pull atendai/evolution-api:v2.3.7 && docker-compose up -d`
- [ ] Verificar logs: `docker-compose logs -f evolution-api`
- [ ] Testar status: `curl http://163.176.239.167:8080/instance/connectionState/christmaster -H "apikey: ..."`
- [ ] Testar listagem de grupos: `curl http://163.176.239.167:8080/group/fetchAllGroups/christmaster -H "apikey: ..."`
- [ ] Testar envio para grupo

### Frontend (Next.js/Luminar)

- [ ] Modificar `services/whatsappService.ts` - Adicionar retry logic e fetchAllGroups
- [ ] Criar `services/firestore/grupoWhatsappService.ts`
- [ ] Modificar `app/diario/mensagens/types.ts` - Adicionar GrupoDestinatario
- [ ] Criar `app/diario/mensagens/components/GrupoSelector.tsx`
- [ ] Modificar `app/diario/mensagens/hooks/useMensagensLoader.ts` - Adicionar grupos
- [ ] Modificar `app/diario/mensagens/hooks/useMensagensActions.ts` - Envio para grupo
- [ ] Modificar `app/api/whatsapp/groups/route.ts` - Compatibilidade 2.3.7
- [ ] Modificar `app/api/whatsapp/send-group/route.ts` - Correção SessionError
- [ ] Atualizar `app/diario/mensagens/components/index.ts` - Exportar GrupoSelector
- [ ] Modificar `DestinatarioSelector.tsx` - Adicionar aba "Grupo"

### Firestore

- [ ] Criar índice composto para `gruposWhatsapp`:
  ```
  Coleção: gruposWhatsapp
  Campos: ativo (ASC), nome (ASC)
  ```

### Testes

- [ ] Testar health check da API
- [ ] Testar envio individual (deve continuar funcionando)
- [ ] Testar sincronização de grupos
- [ ] Testar seleção de grupo na UI
- [ ] Testar envio de mensagem para grupo
- [ ] Verificar log de mensagens no Firestore
- [ ] Testar em mobile (responsividade)

---

## ⚠️ Observações Importantes

1. **Formato do groupJid**: Sempre termina com `@g.us` (ex: `120363123456789012@g.us`)

2. **Limitações do Baileys**:
   - ✅ Mensagens de texto funcionam em grupos
   - ❌ Botões interativos NÃO funcionam em grupos
   - ⚠️ Use listas (`sendList`) se precisar de interatividade

3. **Timeout**: A Evolution API 2.3.7 recomenda timeout de 30s para operações

4. **Retry Logic**: Implementado exponential backoff (1s, 2s, 4s)

5. **SessionError**: O bug da v2.2.3 deve estar corrigido na v2.3.7

6. **Permissões**: O envio para grupos usa a mesma permissão `mensagens:send`

---

## 🧪 Script de Teste

```bash
#!/bin/bash
# test-evolution-237.sh

API_URL="http://163.176.239.167:8080"
API_KEY="B6D711FCDE4D4FD5936544120E713976"
INSTANCE="christmaster"

echo "🧪 Testando Evolution API 2.3.7..."
echo ""

# 1. Health check
echo "1. Health Check..."
curl -s "$API_URL/" | jq -r '.version // "Erro"'
echo ""

# 2. Status da instância
echo "2. Status da Instância..."
curl -s -X GET "$API_URL/instance/connectionState/$INSTANCE" \
  -H "apikey: $API_KEY" | jq -r '.state // .instance.state // "Erro"'
echo ""

# 3. Listar grupos
echo "3. Listando Grupos..."
curl -s -X GET "$API_URL/group/fetchAllGroups/$INSTANCE" \
  -H "apikey: $API_KEY" | jq -r '.[] | "\(.subject) (\(.size) membros) - \(.id)"' | head -5
echo ""

echo "✅ Testes concluídos!"
```

---

**Fim do documento**

*Versão: 1.0.0 | Data: 25/01/2026*
