# Roadmap: Integração WhatsApp - SGE Diário Digital

## Visão Geral

Integração de mensageria via WhatsApp usando Evolution API para comunicação com professores cadastrados no sistema.

---

## 1. Comparativo de Infraestrutura

| Critério | Oracle Cloud | Digital Ocean | Vencedor |
|----------|--------------|---------------|----------|
| **Custo mensal** | R$ 0 (Free Tier permanente) | R$ 30-60/mês ($6-12 USD) | 🏆 Oracle |
| **Facilidade setup** | Complexo (VCN, Security Lists, Ingress Rules) | Simples (1-click Droplet) | 🏆 DO |
| **Latência para Manaus** | ~40ms (São Paulo) | ~45ms (São Paulo) | Empate |
| **Escalabilidade** | Excelente (ARM Ampere A1 grátis até 4 OCPUs) | Boa (resize fácil, custo adicional) | 🏆 Oracle |
| **Manutenção** | Manual (updates, firewall) | Managed backups disponíveis | 🏆 DO |
| **Confiabilidade** | Enterprise SLA 99.95% | 99.99% SLA | 🏆 DO |
| **Documentação** | Técnica, menos amigável | Excelente, tutoriais práticos | 🏆 DO |
| **Suporte** | Fóruns, documentação | Tickets, comunidade ativa | Empate |

### Recomendação: **Oracle Cloud**

**Justificativa:**
- Free Tier oferece recursos permanentes suficientes
- Você já possui conta ativa
- Custo zero de operação mensal
- Specs do Free Tier (ARM A1.Flex): até 4 OCPUs e 24GB RAM grátis

**Specs recomendadas:**
```
Shape: VM.Standard.A1.Flex (ARM - Free Tier)
OCPUs: 2
RAM: 4GB
Storage: 50GB boot volume
OS: Ubuntu 22.04 LTS (aarch64)
Portas: 22 (SSH), 8080 (Evolution API), 443 (HTTPS)
```

---

## 2. Arquitetura da Solução

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SGE Diário Digital (Vercel)                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────────┐ │
│  │    Frontend      │  │   API Routes     │  │      Firestore             │ │
│  │ /diario/mensagens│  │ /api/whatsapp/*  │  │  ├─ mensagensLog           │ │
│  │                  │──│                  │──│  ├─ templatesMensagem      │ │
│  │  - Composer      │  │  - send          │  │  └─ whatsappConfig         │ │
│  │  - Destinatarios │  │  - status        │  │                            │ │
│  │  - Historico     │  │  - groups        │  │                            │ │
│  │  - Templates     │  │  - qrcode        │  │                            │ │
│  └──────────────────┘  └────────┬─────────┘  └────────────────────────────┘ │
└─────────────────────────────────┼───────────────────────────────────────────┘
                                  │ HTTPS
                                  │
                    ┌─────────────▼─────────────┐
                    │   VPS Oracle Cloud        │
                    │   (wpp.seudominio.com)    │
                    │  ┌─────────────────────┐  │
                    │  │   Docker            │  │
                    │  │  ┌───────────────┐  │  │
                    │  │  │ Evolution API │  │  │
                    │  │  │   :8080       │  │  │
                    │  │  └───────┬───────┘  │  │
                    │  │          │          │  │
                    │  │  ┌───────▼───────┐  │  │
                    │  │  │   MongoDB     │  │  │
                    │  │  │   :27017      │  │  │
                    │  │  └───────────────┘  │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
                                  │
                                  │ WebSocket
                                  ▼
                    ┌───────────────────────────┐
                    │     WhatsApp Servers      │
                    │     (Meta/Facebook)       │
                    └───────────────────────────┘
```

---

## 3. Estrutura de Arquivos

```
src/
├── app/
│   ├── diario/mensagens/
│   │   ├── page.tsx                    # Página principal
│   │   ├── types.ts                    # Tipos locais
│   │   ├── components/
│   │   │   ├── index.ts
│   │   │   ├── MensagemComposer.tsx    # Editor de mensagem
│   │   │   ├── DestinatariosList.tsx   # Lista com checkboxes
│   │   │   ├── TemplateSelect.tsx      # Dropdown de templates
│   │   │   ├── TemplateManager.tsx     # CRUD de templates
│   │   │   ├── GruposList.tsx          # Lista grupos WhatsApp
│   │   │   ├── HistoricoTable.tsx      # Log de mensagens
│   │   │   ├── StatusIndicator.tsx     # Status conexão WPP
│   │   │   └── QRCodeModal.tsx         # Modal reconexão
│   │   └── hooks/
│   │       ├── index.ts
│   │       ├── useMensagensPage.ts     # Composição principal
│   │       ├── useMensagensLoader.ts   # Carrega destinatários, templates
│   │       ├── useMensagensActions.ts  # Envio, CRUD templates
│   │       └── useWhatsAppStatus.ts    # Polling status conexão
│   │
│   └── api/whatsapp/
│       ├── send/route.ts               # POST - Enviar mensagem
│       ├── send-bulk/route.ts          # POST - Envio em massa
│       ├── status/route.ts             # GET - Status conexão
│       ├── groups/route.ts             # GET - Listar grupos
│       ├── qrcode/route.ts             # GET - QR para reconexão
│       └── webhook/route.ts            # POST - Callbacks Evolution
│
├── services/
│   ├── whatsappService.ts              # Cliente Evolution API
│   └── firestore/
│       ├── index.ts                    # Re-export
│       ├── mensagemLogService.ts       # CRUD logs
│       └── templateMensagemService.ts  # CRUD templates
│
├── constants/
│   ├── permissions.ts                  # + mensagens:view, mensagens:send
│   └── navigation.tsx                  # + item menu WhatsApp
│
└── types/
    └── index.ts                        # + tipos WhatsApp
```

---

## 4. Tipos TypeScript

```typescript
// =====================================
// src/types/index.ts - ADICIONAR
// =====================================

// Status de entrega WhatsApp
export type MensagemStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed';

// Tipo de envio
export type MensagemTipo = 'individual' | 'broadcast' | 'grupo';

// Log de mensagem enviada
export interface MensagemLog {
  id: string;
  // Destinatário
  destinatarioId: string;         // ID do Usuario ou 'broadcast-{timestamp}'
  destinatarioNome: string;
  destinatarioNumero: string;     // Número formatado 5592999999999
  // Conteúdo
  mensagem: string;
  tipo: MensagemTipo;
  grupoId?: string;               // Se tipo = 'grupo'
  grupoNome?: string;
  // Status
  status: MensagemStatus;
  messageId?: string;             // ID retornado pelo WhatsApp
  erro?: string;
  // Metadata
  enviadoPorId: string;
  enviadoPorNome: string;
  templateId?: string;            // Se usou template
  // Timestamps
  enviadoEm: Date;
  entregueEm?: Date;
  lidoEm?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Template de mensagem reutilizável
export interface TemplateMensagem {
  id: string;
  nome: string;                   // Ex: "Aviso de reunião"
  conteudo: string;               // Texto com variáveis
  variaveis: string[];            // ['{{nome}}', '{{turma}}', '{{data}}']
  categoria: 'aviso' | 'lembrete' | 'comunicado' | 'outro';
  criadoPorId: string;
  criadoPorNome: string;
  usageCount: number;             // Contador de uso
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Configuração da instância WhatsApp
export interface WhatsAppConfig {
  id: string;
  instanceName: string;           // Ex: 'sge-diario'
  instanceId: string;             // ID interno Evolution
  connected: boolean;
  phoneNumber?: string;           // Número conectado
  profileName?: string;
  profilePicUrl?: string;
  lastSyncAt?: Date;
  webhookUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Grupo do WhatsApp
export interface GrupoWhatsApp {
  id: string;                     // ID do grupo no WhatsApp
  nome: string;
  descricao?: string;
  participantes: number;
  isAdmin: boolean;               // Se a instância é admin
  profilePicUrl?: string;
}

// Resposta do serviço de envio
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  status?: MensagemStatus;
  error?: string;
}

// Variáveis disponíveis para templates
export interface TemplateVariables {
  nome: string;
  email?: string;
  celular?: string;
  tipo?: string;
  disciplinas?: string;
  turmas?: string;
}
```

---

## 5. Serviço WhatsApp

```typescript
// =====================================
// src/services/whatsappService.ts
// =====================================

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL!;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY!;
const INSTANCE_NAME = process.env.EVOLUTION_INSTANCE || 'sge-diario';

interface EvolutionResponse<T = unknown> {
  error?: boolean;
  message?: string;
  data?: T;
}

/**
 * Formatar número para padrão internacional brasileiro.
 * Remove caracteres não numéricos e adiciona código do país.
 */
export function formatPhoneNumber(numero: string): string {
  const digits = numero.replace(/\D/g, '');

  // Se já tem 55, retorna
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }

  // Adiciona 55 se não tiver
  return `55${digits}`;
}

/**
 * Cliente para Evolution API.
 */
export const whatsappService = {
  /**
   * Headers padrão para requisições.
   */
  _headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'apikey': EVOLUTION_API_KEY,
    };
  },

  /**
   * Enviar mensagem de texto.
   */
  async sendText(
    numero: string,
    mensagem: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const formattedNumber = formatPhoneNumber(numero);

    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: this._headers(),
          body: JSON.stringify({
            number: formattedNumber,
            text: mensagem,
            delay: 1200, // 1.2s delay para evitar ban
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro ao enviar' };
      }

      const data = await response.json();
      return {
        success: true,
        messageId: data.key?.id || data.messageId,
      };
    } catch (error) {
      console.error('WhatsApp sendText error:', error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Enviar mensagem para grupo.
   */
  async sendToGroup(
    groupId: string,
    mensagem: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/message/sendText/${INSTANCE_NAME}`,
        {
          method: 'POST',
          headers: this._headers(),
          body: JSON.stringify({
            number: groupId,
            text: mensagem,
            delay: 1200,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Erro ao enviar' };
      }

      const data = await response.json();
      return { success: true, messageId: data.key?.id };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  /**
   * Verificar status da conexão.
   */
  async getStatus(): Promise<{
    connected: boolean;
    phoneNumber?: string;
    profileName?: string;
    profilePicUrl?: string;
  }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connectionState/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: this._headers(),
        }
      );

      if (!response.ok) {
        return { connected: false };
      }

      const data = await response.json();
      const isConnected = data.state === 'open' || data.instance?.state === 'open';

      return {
        connected: isConnected,
        phoneNumber: data.instance?.wuid?.split('@')[0],
        profileName: data.instance?.profileName,
        profilePicUrl: data.instance?.profilePicUrl,
      };
    } catch (error) {
      console.error('WhatsApp getStatus error:', error);
      return { connected: false };
    }
  },

  /**
   * Obter QR Code para conexão.
   */
  async getQRCode(): Promise<{ qrcode?: string; error?: string }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/connect/${INSTANCE_NAME}`,
        {
          method: 'GET',
          headers: this._headers(),
        }
      );

      if (!response.ok) {
        return { error: 'Erro ao obter QR Code' };
      }

      const data = await response.json();
      return { qrcode: data.qrcode?.base64 || data.base64 };
    } catch (error) {
      return { error: String(error) };
    }
  },

  /**
   * Listar grupos do WhatsApp.
   */
  async getGroups(): Promise<{
    groups: Array<{
      id: string;
      nome: string;
      participantes: number;
      isAdmin: boolean;
    }>;
    error?: string;
  }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/group/fetchAllGroups/${INSTANCE_NAME}?getParticipants=false`,
        {
          method: 'GET',
          headers: this._headers(),
        }
      );

      if (!response.ok) {
        return { groups: [], error: 'Erro ao listar grupos' };
      }

      const data = await response.json();
      const groups = (data || []).map((g: any) => ({
        id: g.id,
        nome: g.subject || g.name || 'Sem nome',
        participantes: g.size || g.participants?.length || 0,
        isAdmin: g.isAdmin || false,
      }));

      return { groups };
    } catch (error) {
      return { groups: [], error: String(error) };
    }
  },

  /**
   * Desconectar instância (logout).
   */
  async disconnect(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(
        `${EVOLUTION_API_URL}/instance/logout/${INSTANCE_NAME}`,
        {
          method: 'DELETE',
          headers: this._headers(),
        }
      );

      return { success: response.ok };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },
};
```

---

## 6. API Routes

### 6.1 Envio Individual

```typescript
// =====================================
// src/app/api/whatsapp/send/route.ts
// =====================================

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';
import { mensagemLogService } from '@/services/firestore';
import { MensagemLog } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destinatarioId, destinatarioNome, numero, mensagem, enviadoPorId, enviadoPorNome, templateId } = body;

    // Validações
    if (!numero || !mensagem) {
      return NextResponse.json(
        { error: 'Número e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    // Criar log inicial
    const logData: Omit<MensagemLog, 'id' | 'createdAt' | 'updatedAt'> = {
      destinatarioId: destinatarioId || 'manual',
      destinatarioNome: destinatarioNome || 'Desconhecido',
      destinatarioNumero: numero,
      mensagem,
      tipo: 'individual',
      status: 'queued',
      enviadoPorId,
      enviadoPorNome,
      templateId,
      enviadoEm: new Date(),
    };

    const logId = await mensagemLogService.create(logData);

    // Enviar via Evolution API
    const result = await whatsappService.sendText(numero, mensagem);

    // Atualizar log com resultado
    await mensagemLogService.update(logId, {
      status: result.success ? 'sent' : 'failed',
      messageId: result.messageId,
      erro: result.error,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, logId },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      logId,
    });
  } catch (error) {
    console.error('API send error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### 6.2 Envio em Massa (Bulk)

```typescript
// =====================================
// src/app/api/whatsapp/send-bulk/route.ts
// =====================================

import { NextRequest, NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';
import { mensagemLogService } from '@/services/firestore';

interface Destinatario {
  id: string;
  nome: string;
  numero: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { destinatarios, mensagem, enviadoPorId, enviadoPorNome, templateId } = body;

    if (!destinatarios?.length || !mensagem) {
      return NextResponse.json(
        { error: 'Destinatários e mensagem são obrigatórios' },
        { status: 400 }
      );
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    const DELAY_MS = 1500; // 1.5s entre mensagens

    for (const dest of destinatarios as Destinatario[]) {
      // Criar log
      const logId = await mensagemLogService.create({
        destinatarioId: dest.id,
        destinatarioNome: dest.nome,
        destinatarioNumero: dest.numero,
        mensagem,
        tipo: 'broadcast',
        status: 'queued',
        enviadoPorId,
        enviadoPorNome,
        templateId,
        enviadoEm: new Date(),
      });

      // Enviar
      const result = await whatsappService.sendText(dest.numero, mensagem);

      // Atualizar log
      await mensagemLogService.update(logId, {
        status: result.success ? 'sent' : 'failed',
        messageId: result.messageId,
        erro: result.error,
      });

      results.push({
        id: dest.id,
        success: result.success,
        error: result.error,
      });

      // Delay entre mensagens
      if (destinatarios.indexOf(dest) < destinatarios.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      total: destinatarios.length,
      enviadas: successCount,
      falhas: failCount,
      results,
    });
  } catch (error) {
    console.error('API send-bulk error:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
```

### 6.3 Status da Conexão

```typescript
// =====================================
// src/app/api/whatsapp/status/route.ts
// =====================================

import { NextResponse } from 'next/server';
import { whatsappService } from '@/services/whatsappService';

export async function GET() {
  try {
    const status = await whatsappService.getStatus();
    return NextResponse.json(status);
  } catch (error) {
    return NextResponse.json(
      { connected: false, error: 'Erro ao verificar status' },
      { status: 500 }
    );
  }
}
```

---

## 7. Permissões e Navegação

### 7.1 Permissões

```typescript
// =====================================
// src/constants/permissions.ts - ADICIONAR
// =====================================

// No tipo Permission, adicionar:
| 'mensagens:view'
| 'mensagens:send'
| 'mensagens:templates'

// Em COORDENADOR_PERMISSIONS, adicionar:
'mensagens:view',
'mensagens:send',
'mensagens:templates',
```

### 7.2 Navegação

```typescript
// =====================================
// src/constants/navigation.tsx - ADICIONAR
// =====================================

// Import
import { WhatsApp } from '@mui/icons-material';

// Na seção GESTAO, adicionar item:
{
  label: 'Mensagens WhatsApp',
  icon: <WhatsApp />,
  href: '/diario/mensagens',
  permission: 'mensagens:view',
  minRole: 'coordenador',
},

// Em ROUTES, adicionar:
MENSAGENS: '/diario/mensagens',
```

---

## 8. Fases de Implementação

### FASE 1: Infraestrutura (1-2 dias)

| # | Tarefa | Tempo Est. | Status |
|---|--------|------------|--------|
| 1.1 | Criar VM no Oracle Cloud (ARM A1.Flex) | 30min | ⬜ |
| 1.2 | Configurar Security List (portas 22, 8080, 443) | 15min | ⬜ |
| 1.3 | Instalar Docker e Docker Compose | 20min | ⬜ |
| 1.4 | Deploy Evolution API via docker-compose | 30min | ⬜ |
| 1.5 | Configurar Nginx + Certbot (SSL) | 45min | ⬜ |
| 1.6 | Configurar domínio DNS (wpp.seudominio.com) | 15min | ⬜ |
| 1.7 | Testar conexão com QR Code | 15min | ⬜ |
| 1.8 | Documentar credenciais em .env | 10min | ⬜ |

### FASE 2: Backend (2-3 dias)

| # | Tarefa | Tempo Est. | Status |
|---|--------|------------|--------|
| 2.1 | Criar `src/services/whatsappService.ts` | 2h | ⬜ |
| 2.2 | Criar `src/services/firestore/mensagemLogService.ts` | 1h | ⬜ |
| 2.3 | Criar `src/services/firestore/templateMensagemService.ts` | 1h | ⬜ |
| 2.4 | Adicionar tipos em `src/types/index.ts` | 30min | ⬜ |
| 2.5 | Criar API route `/api/whatsapp/send` | 1h | ⬜ |
| 2.6 | Criar API route `/api/whatsapp/send-bulk` | 1.5h | ⬜ |
| 2.7 | Criar API route `/api/whatsapp/status` | 30min | ⬜ |
| 2.8 | Criar API route `/api/whatsapp/groups` | 30min | ⬜ |
| 2.9 | Criar API route `/api/whatsapp/qrcode` | 30min | ⬜ |
| 2.10 | Testar envio individual via Postman/curl | 30min | ⬜ |

### FASE 3: Frontend Básico (3-4 dias)

| # | Tarefa | Tempo Est. | Status |
|---|--------|------------|--------|
| 3.1 | Criar estrutura `/diario/mensagens/` | 30min | ⬜ |
| 3.2 | Criar `types.ts` local | 30min | ⬜ |
| 3.3 | Criar `useMensagensLoader.ts` (carregar professores) | 1.5h | ⬜ |
| 3.4 | Criar `DestinatariosList.tsx` com CheckboxSelector | 2h | ⬜ |
| 3.5 | Criar `MensagemComposer.tsx` (textarea + preview) | 2h | ⬜ |
| 3.6 | Criar `useMensagensActions.ts` (enviar) | 2h | ⬜ |
| 3.7 | Criar `HistoricoTable.tsx` com DataTable | 2h | ⬜ |
| 3.8 | Criar `page.tsx` integrando componentes | 2h | ⬜ |
| 3.9 | Adicionar permissões em `permissions.ts` | 15min | ⬜ |
| 3.10 | Adicionar item no menu em `navigation.tsx` | 15min | ⬜ |
| 3.11 | Testar fluxo completo de envio | 1h | ⬜ |

### FASE 4: Funcionalidades Avançadas (2-3 dias)

| # | Tarefa | Tempo Est. | Status |
|---|--------|------------|--------|
| 4.1 | Criar `StatusIndicator.tsx` (conexão WhatsApp) | 1h | ⬜ |
| 4.2 | Criar `QRCodeModal.tsx` para reconexão | 1.5h | ⬜ |
| 4.3 | Criar `TemplateSelect.tsx` (dropdown) | 1h | ⬜ |
| 4.4 | Criar `TemplateManager.tsx` (CRUD modal) | 3h | ⬜ |
| 4.5 | Implementar variáveis dinâmicas ({{nome}}) | 2h | ⬜ |
| 4.6 | Criar `GruposList.tsx` | 2h | ⬜ |
| 4.7 | Integrar grupos no envio | 1.5h | ⬜ |
| 4.8 | Adicionar `useWhatsAppStatus.ts` (polling) | 1h | ⬜ |

### FASE 5: Refinamentos (1-2 dias)

| # | Tarefa | Tempo Est. | Status |
|---|--------|------------|--------|
| 5.1 | Dashboard de métricas (cards resumo) | 2h | ⬜ |
| 5.2 | Filtros no histórico (data, status, tipo) | 1.5h | ⬜ |
| 5.3 | Campo opt-out no Usuario | 30min | ⬜ |
| 5.4 | Respeitar opt-out no envio | 30min | ⬜ |
| 5.5 | Alerta de desconexão (toast) | 1h | ⬜ |
| 5.6 | Documentação de uso para usuários | 1h | ⬜ |
| 5.7 | Testes finais e ajustes | 2h | ⬜ |

---

## 9. Script de Setup - Evolution API

```bash
#!/bin/bash
# =====================================
# setup-evolution.sh
# Executar no servidor Oracle Cloud
# =====================================

set -e

echo "=== Atualizando sistema ==="
sudo apt update && sudo apt upgrade -y

echo "=== Instalando Docker ==="
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

echo "=== Instalando Docker Compose ==="
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo "=== Criando diretórios ==="
mkdir -p ~/evolution-api
cd ~/evolution-api

echo "=== Criando docker-compose.yml ==="
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  evolution-api:
    image: atendai/evolution-api:latest
    container_name: evolution-api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=https://wpp.seudominio.com
      - AUTHENTICATION_API_KEY=SUA_API_KEY_SEGURA_AQUI
      - AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true
      - DATABASE_ENABLED=true
      - DATABASE_PROVIDER=mongodb
      - DATABASE_CONNECTION_URI=mongodb://mongodb:27017/evolution
      - DATABASE_CONNECTION_DB_PREFIX_NAME=evolution
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      - DATABASE_SAVE_DATA_CONTACTS=true
      - DATABASE_SAVE_DATA_CHATS=true
      - QRCODE_LIMIT=30
      - QRCODE_COLOR=#000000
      - LOG_LEVEL=ERROR
      - DEL_INSTANCE=false
      - CONFIG_SESSION_PHONE_CLIENT=SGE Diario
      - CONFIG_SESSION_PHONE_NAME=Chrome
    volumes:
      - evolution_instances:/evolution/instances
    depends_on:
      - mongodb
    networks:
      - evolution-network

  mongodb:
    image: mongo:latest
    container_name: evolution-mongodb
    restart: always
    environment:
      - MONGO_INITDB_DATABASE=evolution
    volumes:
      - mongodb_data:/data/db
    networks:
      - evolution-network

volumes:
  evolution_instances:
  mongodb_data:

networks:
  evolution-network:
    driver: bridge
EOF

echo "=== Iniciando containers ==="
docker-compose up -d

echo "=== Aguardando inicialização ==="
sleep 10

echo "=== Status dos containers ==="
docker-compose ps

echo ""
echo "=== Setup concluído! ==="
echo "Evolution API disponível em: http://$(curl -s ifconfig.me):8080"
echo ""
echo "Próximos passos:"
echo "1. Configure o DNS para wpp.seudominio.com apontar para este IP"
echo "2. Configure Nginx + SSL com Certbot"
echo "3. Acesse /manager para criar instância"
```

---

## 10. Variáveis de Ambiente

```bash
# =====================================
# .env.local - ADICIONAR
# =====================================

# Evolution API
EVOLUTION_API_URL=https://wpp.seudominio.com
EVOLUTION_API_KEY=SUA_API_KEY_SEGURA_AQUI
EVOLUTION_INSTANCE=sge-diario
```

---

## 11. Estimativa de Tempo Total

| Fase | Dias | Horas |
|------|------|-------|
| Fase 1: Infraestrutura | 1-2 | 4-6h |
| Fase 2: Backend | 2-3 | 10-12h |
| Fase 3: Frontend Básico | 3-4 | 14-18h |
| Fase 4: Funcionalidades Avançadas | 2-3 | 12-14h |
| Fase 5: Refinamentos | 1-2 | 8-10h |
| **TOTAL** | **9-14** | **48-60h** |

---

## 12. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Ban do WhatsApp | Média | Alto | Rate limit rigoroso, delay entre msgs |
| Desconexão frequente | Baixa | Médio | Alertas automáticos, QR fácil |
| Latência Oracle Cloud | Baixa | Baixo | Monitorar, migrar para DO se necessário |
| Custo inesperado | Muito Baixa | Baixo | Manter dentro do Free Tier |
| Mudança na API Evolution | Média | Médio | Abstrair em service, acompanhar releases |

---

## 13. Próximos Passos Imediatos

1. **Confirmar domínio** para Evolution API (ex: wpp.christmaster.com.br)
2. **Provisionar VM** no Oracle Cloud
3. **Executar script de setup** do Evolution API
4. **Testar conexão** com QR Code no celular
5. **Iniciar Fase 2** (Backend)

---

*Documento gerado em: 2026-01-18*
*Versão: 1.0*
