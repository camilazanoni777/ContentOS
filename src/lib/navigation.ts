import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckSquare,
  Clapperboard,
  DollarSign,
  FileEdit,
  Film,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  Megaphone,
  Send,
  Settings,
  SunMedium,
  Sparkles,
  Target,
  User,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Aparece também na navegação inferior do mobile (mantenha curto — 4-5 itens). */
  mobilePrimary?: boolean;
}

export interface NavGroup {
  /** null = itens soltos, sem cabeçalho de grupo (Hoje, Check-in, Configurações). */
  label: string | null;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [
      { label: "Hoje", href: "/hoje", icon: SunMedium, mobilePrimary: true },
      { label: "Check-in", href: "/checkin", icon: CheckSquare },
    ],
  },
  {
    label: "Criar",
    items: [
      { label: "Banco de ideias", href: "/ideias", icon: Lightbulb, mobilePrimary: true },
      { label: "Roteiros", href: "/roteiros", icon: FileEdit },
      { label: "Gravação", href: "/gravacao", icon: Clapperboard },
      { label: "Edição", href: "/edicao", icon: Film },
      { label: "Agendamento", href: "/agendamento", icon: CalendarClock },
      { label: "Publicados", href: "/publicados", icon: Send },
    ],
  },
  {
    label: "Planejar",
    items: [
      { label: "Semana", href: "/planejamento/semana", icon: ListTodo },
      { label: "Calendário", href: "/planejamento/calendario", icon: Calendar, mobilePrimary: true },
      { label: "Metas", href: "/metas", icon: Target },
    ],
  },
  {
    label: "Analisar",
    items: [
      { label: "Conteúdos", href: "/metricas/conteudos", icon: BarChart3 },
      { label: "Perfil", href: "/metricas/perfil", icon: User },
      { label: "Revisão semanal", href: "/revisao-semanal", icon: CalendarCheck },
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobilePrimary: true },
    ],
  },
  {
    label: "Negócio",
    items: [
      { label: "Campanhas", href: "/negocio/campanhas", icon: Megaphone },
      { label: "Receita", href: "/negocio/receita", icon: DollarSign },
    ],
  },
  {
    label: null,
    items: [{ label: "Configurações", href: "/configuracoes", icon: Settings, mobilePrimary: true }],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const MOBILE_PRIMARY_ITEMS: NavItem[] = ALL_NAV_ITEMS.filter((item) => item.mobilePrimary);

export const QUICK_CAPTURE_ICON: LucideIcon = Sparkles;
