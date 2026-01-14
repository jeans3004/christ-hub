# Diário Digital

Sistema de Gestão Escolar - Diário Digital

## Tecnologias

- **Frontend**: Next.js 14+ (App Router) + React 18+
- **Backend**: Firebase (Firestore + Authentication)
- **UI Framework**: Material-UI v6 (Material Design 3)
- **PWA**: Service Workers + Manifest (offline-first)
- **Linguagem**: TypeScript 5+
- **Estado**: Zustand
- **Formulários**: React Hook Form + Zod
- **Gráficos**: Recharts

## Instalação

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Firebase

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

## Estrutura do Projeto

```
src/
├── app/           # Rotas do Next.js App Router
├── components/    # Componentes React reutilizáveis
├── hooks/         # Hooks customizados
├── lib/           # Configurações e utilitários
├── services/      # Serviços de integração (Firebase)
├── store/         # Estado global (Zustand)
└── types/         # Tipos TypeScript
```

## Módulos

- **Menu Principal** - Dashboard de navegação
- **Chamada** - Registro de presença dos alunos
- **Notas** - Lançamento de notas por bimestre
- **Ocorrências** - Gestão de ocorrências disciplinares
- **Professores** - Cadastro de professores
- **Conceitos** - Atribuição de conceitos mensais
- **Gráficos** - Visualização de desempenho
- **Senha** - Alteração de senha
- **Aniversariantes** - Relatório de aniversários

## Configuração Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication (Email/Senha)
3. Crie um banco Firestore
4. Copie as credenciais para `.env.local`

## Scripts

```bash
npm run dev       # Desenvolvimento
npm run build     # Build produção
npm run start     # Iniciar produção
npm run lint      # Lint
npm run test      # Testes
```

## Licença

Projeto privado - Todos os direitos reservados.
