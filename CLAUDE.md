# CLAUDE.md - Luminar (SGE)

Sistema de Gestao Escolar para o colegio Christ Master. Nome do produto: **Luminar**.

## Stack

- **Framework**: Next.js 16+ (App Router, Turbopack)
- **Linguagem**: TypeScript 5+ (strict mode)
- **UI**: MUI v7 (Material UI) - tema customizado (Navy #2A3F5F + Gold #E5A53A)
- **Backend**: Firebase (Firestore, Auth com Google, Storage)
- **Estado global**: Zustand (authStore, uiStore, filterStore, driveStore)
- **WhatsApp**: Evolution API v2.2.3 (Baileys) em Oracle Cloud
- **Google**: Classroom API, Drive API (Shared Drive), Sheets API
- **PWA**: next-pwa com service worker
- **Hospedagem**: Vercel (frontend) + Oracle Cloud Free Tier (Evolution API)
- **Fonte**: IBM Plex Sans (400, 500, 600, 700)
- **Dominio**: Restrito a `@christmaster.com.br`

## Comandos

```bash
npm run dev       # Dev server (Turbopack)
npm run build     # Build de producao (npx next build)
npm run lint      # ESLint
npm test          # Jest
```

## Estrutura de Arquivos

```
src/
├── app/
│   ├── api/                      # API Routes (Next.js)
│   │   ├── whatsapp/             # Rotas WhatsApp (send, chats, status, qrcode, groups)
│   │   ├── google/sheets/        # Google Sheets API
│   │   ├── horarios/             # Notificacoes automaticas
│   │   └── seed/                 # Dados ficticios
│   ├── diario/[modulo]/          # Modulos do sistema
│   │   ├── page.tsx              # Pagina principal (orquestracao)
│   │   ├── types.ts              # Tipos locais do modulo
│   │   ├── components/           # Componentes (max 150-200 linhas cada)
│   │   └── hooks/                # use[Modulo]Loader.ts + use[Modulo]Actions.ts
│   └── login/
├── components/
│   ├── ui/                       # DataTable, FormModal, ConfirmDialog, ResponsiveContainer
│   ├── common/                   # DisciplinaSelect, TurmaSelect
│   └── layout/                   # MainLayout, Sidebar (3 modos), Header
├── hooks/                        # useAuth, useModal, usePermissions, useResponsive, useOffline
├── services/
│   ├── firestore/                # [entidade]Service.ts (CRUD)
│   ├── whatsappService.ts        # Cliente Evolution API
│   ├── classroomService.ts       # Cliente Google Classroom API
│   └── driveService.ts           # Cliente Google Drive API (Shared Drive)
├── store/                        # Zustand stores
├── types/                        # Tipos globais (index.ts, classroom.ts)
├── constants/                    # navigation.tsx, permissions.ts, areasConhecimento.ts
└── lib/                          # firebase.ts, theme.ts
```

## Convencoes de Codigo

- **Componentes < 200 linhas**: Extrair sub-componentes quando necessario
- **Hooks separados**: Loader (fetch) + Actions (mutations)
- **Servicos**: `[entidade]Service` em `services/firestore/` com metodos CRUD
- **Modais**: `useModal<T>()` para gerenciar estado
- **Permissoes**: `usePermissions().can('recurso:acao')`
- **Toast**: `useUIStore().addToast(message, 'success'|'error'|'warning'|'info')`
- **Filtros globais**: `useFilterStore()` (ano, turma)
- **Responsividade**: `useResponsive()` para breakpoints
- **Timezone**: Usar `new Date(data + 'T12:00:00')` para evitar problemas UTC

## Modulos Principais

| Rota | Descricao |
|------|-----------|
| `/diario/menu` | Dashboard |
| `/diario/chamada` | Presenca + Relatorios + Trilhas BNCC |
| `/diario/notas` | Notas com composicao + rubricas |
| `/diario/conceitos` | Avaliacoes por rubricas |
| `/diario/mensagens` | WhatsApp: chat CRM, tabs, texto, midias, grupos, enquetes, botoes |
| `/diario/classroom` | Google Classroom (turmas, atividades, anuncios, alunos, professores) |
| `/diario/horarios` | Grade de horarios por turno |
| `/diario/mapeamento` | Mapa de sala drag-and-drop |
| `/diario/sorteador` | Sorteio de alunos |
| `/diario/ocorrencias` | Gestao de ocorrencias |
| `/diario/dossie` | Dossie completo do aluno |

## Modulo de Mensagens (Conversas)

O chat WhatsApp usa estilo Chatwoot/CRM:

- **Layout desktop**: 3 colunas - Lista (350px) | Tabs + Thread (flex) | CRM Sidebar (280px, toggle)
- **Layout mobile**: Lista OU Thread. CRM como Drawer
- **ChatBubble**: Nome do remetente em negrito com cores rotativas (12 cores, hash-based) em grupos
- **ChatTabs**: Ate 8 tabs abertas, persistidas em `localStorage('chat-open-tabs')`
- **ChatSidebar CRM**: Tags (Pai, Mae, Aluno, Professor, VIP, Pendente), Status (Aberto, Em atendimento, Resolvido, Arquivado), Notas. Tudo em localStorage por JID
- **ChatList**: Filtros chip (Todos, Nao lidos, Grupos, Contatos) + busca textual
- **useChat**: Polling lista 30s, mensagens 7s. Tab management com localStorage
- **API**: `POST /api/whatsapp/chats/messages` enriquece pushName com findContacts() para grupos

## WhatsApp Service (Evolution API)

```typescript
// services/whatsappService.ts - Metodos principais:
sendText, sendImage, sendDocument, sendAudio, sendVideo, sendLocation, sendContact, sendSticker
sendToGroup
getStatus, getQRCode, getGroups, disconnect, createInstance, checkNumber
findContacts, findChats, findMessages, fetchProfilePicture
```

## Padroes Importantes

- **Dark mode**: Todas as cores devem ter variante dark. Chat usa cores WhatsApp (#005C4B dark, #D9FDD3 light)
- **Dead keys/Acentos**: Em inputs com atalhos, verificar `e.nativeEvent.isComposing` antes de processar
- **Assinatura**: Mensagens WhatsApp incluem `"\n\n_Enviado por: {nome} - Christ Master_"`
- **Numeros BR**: Formato internacional 55+DDD+numero. `whatsappService.formatPhoneNumber()` normaliza
- **Shared Drive**: Todas operacoes Drive precisam `supportsAllDrives: true`
- **Admin emails**: `wesley.ferreira@christmaster.com.br`, `roberta.karoline@christmaster.com.br` - auto-promocao

## Documentacao Detalhada

Para documentacao completa com todos os tipos, interfaces e exemplos de codigo, consultar:
- `filesMD/modeloDePrompt.md` - Prompt completo com toda a arquitetura (v3.5.0)
