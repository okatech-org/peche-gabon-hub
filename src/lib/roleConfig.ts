import { LucideIcon, Crown, Anchor, Shield, Award, Ship, FlaskConical, Trees, TrendingUp, Fish, Users, Eye, Settings, Building2, Clipboard, BarChart3, Package, Globe, Handshake, Server } from "lucide-react";

export type AppRole = 
  | 'ministre' | 'admin' | 'super_admin' | 'pecheur' | 'cooperative' 
  | 'gestionnaire_coop' | 'armateur_pi' | 'dgpa' | 'anpa' | 'agasa' 
  | 'dgmm' | 'oprag' | 'anpn' | 'dgddi' | 'corep' | 'direction_centrale' 
  | 'direction_provinciale' | 'agent_collecte' | 'inspecteur' 
  | 'observateur_pi' | 'analyste' | 'partenaire_international';

export interface RoleConfig {
  role: AppRole;
  label: string;
  icon: LucideIcon;
  color: string;
  accentColor: string;
  dashboardRoute: string;
  category: 'gouvernance' | 'administration' | 'controle' | 'terrain' | 'industrie' | 'systeme';
}

export const roleConfigs: Record<AppRole, RoleConfig> = {
  ministre: {
    role: 'ministre',
    label: 'Ministère',
    icon: Crown,
    color: 'from-purple-500 to-indigo-600',
    accentColor: 'purple',
    dashboardRoute: '/minister-dashboard',
    category: 'gouvernance',
  },
  admin: {
    role: 'admin',
    label: 'Administrateur',
    icon: Settings,
    color: 'from-red-500 to-rose-600',
    accentColor: 'red',
    dashboardRoute: '/admin',
    category: 'systeme',
  },
  super_admin: {
    role: 'super_admin',
    label: 'Super Admin',
    icon: Server,
    color: 'from-slate-900 to-zinc-900',
    accentColor: 'slate',
    dashboardRoute: '/superadmin-dashboard',
    category: 'systeme',
  },
  direction_centrale: {
    role: 'direction_centrale',
    label: 'Direction Centrale',
    icon: Building2,
    color: 'from-violet-500 to-purple-500',
    accentColor: 'violet',
    dashboardRoute: '/dashboard',
    category: 'gouvernance',
  },
  direction_provinciale: {
    role: 'direction_provinciale',
    label: 'Direction Provinciale',
    icon: Building2,
    color: 'from-indigo-500 to-blue-500',
    accentColor: 'indigo',
    dashboardRoute: '/dashboard',
    category: 'gouvernance',
  },
  dgpa: {
    role: 'dgpa',
    label: 'DGPA',
    icon: Anchor,
    color: 'from-blue-500 to-cyan-600',
    accentColor: 'blue',
    dashboardRoute: '/dgpa-dashboard',
    category: 'administration',
  },
  anpa: {
    role: 'anpa',
    label: 'ANPA',
    icon: Shield,
    color: 'from-green-500 to-emerald-600',
    accentColor: 'green',
    dashboardRoute: '/anpa-dashboard',
    category: 'controle',
  },
  agasa: {
    role: 'agasa',
    label: 'AGASA',
    icon: Award,
    color: 'from-orange-500 to-red-600',
    accentColor: 'orange',
    dashboardRoute: '/agasa-dashboard',
    category: 'controle',
  },
  dgmm: {
    role: 'dgmm',
    label: 'DGMM',
    icon: Ship,
    color: 'from-teal-500 to-blue-600',
    accentColor: 'teal',
    dashboardRoute: '/dgmm-dashboard',
    category: 'administration',
  },
  oprag: {
    role: 'oprag',
    label: 'OPRAG',
    icon: FlaskConical,
    color: 'from-violet-500 to-purple-600',
    accentColor: 'violet',
    dashboardRoute: '/oprag-dashboard',
    category: 'controle',
  },
  anpn: {
    role: 'anpn',
    label: 'ANPN',
    icon: Trees,
    color: 'from-green-600 to-lime-600',
    accentColor: 'green',
    dashboardRoute: '/anpn-dashboard',
    category: 'controle',
  },
  dgddi: {
    role: 'dgddi',
    label: 'DGDDI',
    icon: Package,
    color: 'from-orange-500 to-red-500',
    accentColor: 'orange',
    dashboardRoute: '/dgddi-dashboard',
    category: 'controle',
  },
  corep: {
    role: 'corep',
    label: 'COREP',
    icon: TrendingUp,
    color: 'from-amber-500 to-orange-600',
    accentColor: 'amber',
    dashboardRoute: '/corep-dashboard',
    category: 'administration',
  },
  partenaire_international: {
    role: 'partenaire_international',
    label: 'Partenaire International',
    icon: Handshake,
    color: 'from-blue-400 to-purple-400',
    accentColor: 'blue',
    dashboardRoute: '/dashboard',
    category: 'administration',
  },
  pecheur: {
    role: 'pecheur',
    label: 'Pêcheur',
    icon: Fish,
    color: 'from-cyan-500 to-blue-500',
    accentColor: 'cyan',
    dashboardRoute: '/dashboard',
    category: 'terrain',
  },
  cooperative: {
    role: 'cooperative',
    label: 'Coopérative',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
    accentColor: 'indigo',
    dashboardRoute: '/cooperative-dashboard',
    category: 'terrain',
  },
  gestionnaire_coop: {
    role: 'gestionnaire_coop',
    label: 'Gestionnaire Coop',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
    accentColor: 'indigo',
    dashboardRoute: '/cooperative-dashboard',
    category: 'terrain',
  },
  armateur_pi: {
    role: 'armateur_pi',
    label: 'Armateur PI',
    icon: Anchor,
    color: 'from-slate-600 to-gray-700',
    accentColor: 'slate',
    dashboardRoute: '/armeur-dashboard',
    category: 'industrie',
  },
  agent_collecte: {
    role: 'agent_collecte',
    label: 'Agent de Collecte',
    icon: Clipboard,
    color: 'from-green-500 to-emerald-500',
    accentColor: 'green',
    dashboardRoute: '/dashboard',
    category: 'terrain',
  },
  inspecteur: {
    role: 'inspecteur',
    label: 'Inspecteur',
    icon: Eye,
    color: 'from-red-500 to-rose-600',
    accentColor: 'red',
    dashboardRoute: '/inspecteur-dashboard',
    category: 'controle',
  },
  observateur_pi: {
    role: 'observateur_pi',
    label: 'Observateur PI',
    icon: Eye,
    color: 'from-amber-500 to-yellow-500',
    accentColor: 'amber',
    dashboardRoute: '/dashboard',
    category: 'terrain',
  },
  analyste: {
    role: 'analyste',
    label: 'Analyste',
    icon: BarChart3,
    color: 'from-pink-500 to-rose-500',
    accentColor: 'pink',
    dashboardRoute: '/dashboard',
    category: 'administration',
  },
};

export const getRoleConfig = (role: AppRole): RoleConfig => {
  return roleConfigs[role];
};

export const getUserPrimaryRole = (roles: AppRole[]): RoleConfig | null => {
  // Priorité: système > gouvernance > administration > controle > industrie > terrain
  const priorityOrder: AppRole[] = [
    'super_admin',
    'admin',
    'ministre',
    'direction_centrale',
    'direction_provinciale',
    'dgpa',
    'anpa',
    'agasa',
    'dgmm',
    'oprag',
    'anpn',
    'dgddi',
    'corep',
    'armateur_pi',
    'gestionnaire_coop',
    'cooperative',
    'pecheur',
    'agent_collecte',
    'inspecteur',
    'observateur_pi',
    'analyste',
    'partenaire_international',
  ];

  for (const role of priorityOrder) {
    if (roles.includes(role)) {
      return getRoleConfig(role);
    }
  }

  return null;
};
