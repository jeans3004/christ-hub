import {
  Home,
  Dashboard,
  Groups,
  FamilyRestroom,
  School,
  FormatListNumbered,
  Grade,
  ReportProblem,
  People,
  BarChart,
  Cake,
  Settings,
  CalendarMonth,
  MenuBook,
  PersonAdd,
  Class,
  Folder,
  GridView,
  WhatsApp,
  Schedule,
  CloudQueue,
  Casino,
} from '@mui/icons-material';
import { Permission } from '@/lib/permissions';
import { UserRole } from '@/types';

/**
 * Item de navegacao do Sidebar
 */
export interface NavItem {
  /** Label exibido no menu */
  label: string;
  /** Icone do item */
  icon: React.ReactNode;
  /** Rota de destino (opcional se tiver filhos) */
  href?: string;
  /** Subitens do menu */
  children?: NavItem[];
  /** Permissao necessaria para visualizar */
  permission?: Permission;
  /** Role minimo para visualizar */
  minRole?: UserRole;
}

/**
 * Secao de navegacao do Sidebar
 */
export interface NavSection {
  /** Titulo da secao (opcional) */
  title?: string;
  /** Itens da secao */
  items: NavItem[];
  /** Role minimo para visualizar a secao */
  minRole?: UserRole;
}

/**
 * Configuracao completa de navegacao do sistema.
 * Centraliza todos os itens de menu em um unico lugar.
 */
export const NAVIGATION: NavSection[] = [
  {
    items: [
      { label: 'Inicio', icon: <Home />, href: '/diario/menu' },
    ],
  },
  {
    title: 'GESTAO',
    items: [
      {
        label: 'Painel de Gestao',
        icon: <Dashboard />,
        children: [
          { label: 'Chamada', icon: <FormatListNumbered />, href: '/diario/chamada', permission: 'chamada:view' },
          { label: 'Notas', icon: <Grade />, href: '/diario/notas', permission: 'notas:view' },
          { label: 'Conceitos', icon: <School />, href: '/diario/conceitos', permission: 'conceitos:view' },
          { label: 'Dossie do Aluno', icon: <Folder />, href: '/diario/dossie', permission: 'alunos:view' },
          { label: 'Graficos', icon: <BarChart />, href: '/diario/graficos', permission: 'graficos:view', minRole: 'coordenador' },
        ],
      },
      {
        label: 'Gestor de turmas',
        icon: <Groups />,
        minRole: 'coordenador',
        children: [
          { label: 'Professores', icon: <People />, href: '/diario/professores', permission: 'professores:view' },
          { label: 'Ocorrencias', icon: <ReportProblem />, href: '/diario/ocorrencias', permission: 'ocorrencias:view' },
        ],
      },
      {
        label: 'Mensagens WhatsApp',
        icon: <WhatsApp />,
        href: '/diario/mensagens',
        permission: 'mensagens:view',
        minRole: 'coordenador',
      },
      {
        label: 'Google Classroom',
        icon: <CloudQueue />,
        href: '/diario/classroom',
        permission: 'classroom:view',
      },
      { label: 'Familia', icon: <FamilyRestroom />, href: '/diario/familia', minRole: 'coordenador' },
    ],
  },
  {
    title: 'SALA DE AULA',
    items: [
      { label: 'Calendario', icon: <CalendarMonth />, href: '/diario/agenda', permission: 'agenda:view' },
      { label: 'Horarios', icon: <Schedule />, href: '/diario/horarios', permission: 'horarios:view' },
      { label: 'Mapeamento', icon: <GridView />, href: '/diario/mapeamento', permission: 'chamada:view' },
      { label: 'Sorteador', icon: <Casino />, href: '/diario/sorteador', permission: 'sorteador:view' },
      { label: 'Aniversariantes', icon: <Cake />, href: '/diario/aniversariantes', permission: 'aniversariantes:view', minRole: 'coordenador' },
    ],
  },
  {
    title: 'CADASTROS',
    minRole: 'coordenador',
    items: [
      { label: 'Turmas', icon: <Class />, href: '/diario/cadastros/turmas', permission: 'turmas:view' },
      { label: 'Alunos', icon: <PersonAdd />, href: '/diario/cadastros/alunos', permission: 'alunos:view' },
      { label: 'Disciplinas', icon: <MenuBook />, href: '/diario/cadastros/disciplinas' },
    ],
  },
  {
    title: 'ADMINISTRACAO',
    minRole: 'coordenador',
    items: [
      {
        label: 'Usuarios',
        icon: <People />,
        href: '/diario/usuarios',
        permission: 'usuarios:view',
      },
      {
        label: 'Configuracoes do Sistema',
        icon: <Settings />,
        href: '/diario/configuracoes',
        minRole: 'administrador',
      },
    ],
  },
];

/**
 * Constantes de rotas do sistema
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  MENU: '/diario/menu',
  CHAMADA: '/diario/chamada',
  NOTAS: '/diario/notas',
  CONCEITOS: '/diario/conceitos',
  GRAFICOS: '/diario/graficos',
  DOSSIE: '/diario/dossie',
  MAPEAMENTO: '/diario/mapeamento',
  HORARIOS: '/diario/horarios',
  PROFESSORES: '/diario/professores',
  OCORRENCIAS: '/diario/ocorrencias',
  FAMILIA: '/diario/familia',
  AGENDA: '/diario/agenda',
  ANIVERSARIANTES: '/diario/aniversariantes',
  CADASTROS: {
    TURMAS: '/diario/cadastros/turmas',
    ALUNOS: '/diario/cadastros/alunos',
    DISCIPLINAS: '/diario/cadastros/disciplinas',
  },
  USUARIOS: '/diario/usuarios',
  CONFIGURACOES: '/diario/configuracoes',
  SENHA: '/diario/senha',
  MENSAGENS: '/diario/mensagens',
  CLASSROOM: '/diario/classroom',
  SORTEADOR: '/diario/sorteador',
} as const;

/**
 * Larguras do drawer do Sidebar
 */
export const DRAWER_WIDTH = 260;
export const DRAWER_WIDTH_COLLAPSED = 72;
