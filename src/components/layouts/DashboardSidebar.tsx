import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { RoleConfig } from "@/lib/roleConfig";
import { 
  LayoutDashboard, 
  Fish, 
  Receipt, 
  MessageSquare, 
  User,
  Ship,
  Activity,
  BarChart3,
  Users,
  DollarSign,
  Bell,
  FileText,
  Settings,
  Home
} from "lucide-react";
import { NavLink } from "@/components/NavLink";

interface DashboardSidebarProps {
  roleConfig: RoleConfig;
}

// Navigation items par rôle
const getNavigationItems = (role: string) => {
  const baseItems = [
    { title: "Accueil", url: "/", icon: Home },
  ];

  const roleNavigation: Record<string, Array<{ title: string; url: string; icon: any }>> = {
    pecheur: [
      ...baseItems,
      { title: "Tableau de Bord", url: "/dashboard", icon: LayoutDashboard },
      { title: "Captures", url: "/captures", icon: Fish },
      { title: "Mes Taxes", url: "/mes-taxes", icon: Receipt },
      { title: "Mes Remontées", url: "/mes-remontees", icon: MessageSquare },
      { title: "Mon Compte", url: "/mon-compte", icon: User },
    ],
    armateur_pi: [
      ...baseItems,
      { title: "Ma Flotte", url: "/armeur-dashboard", icon: Ship },
      { title: "Marées", url: "/armeur-dashboard", icon: Activity },
      { title: "Taxes & Impôts", url: "/armeur-dashboard", icon: Receipt },
      { title: "Statistiques", url: "/armeur-dashboard", icon: BarChart3 },
    ],
    cooperative: [
      ...baseItems,
      { title: "Taxes des Membres", url: "/cooperative-dashboard", icon: Receipt },
      { title: "Paiements Groupés", url: "/cooperative-dashboard", icon: DollarSign },
      { title: "Notifications", url: "/cooperative-dashboard", icon: Bell },
      { title: "Membres", url: "/cooperative-dashboard", icon: Users },
      { title: "Statistiques", url: "/cooperative-dashboard", icon: BarChart3 },
    ],
    gestionnaire_coop: [
      ...baseItems,
      { title: "Taxes des Membres", url: "/cooperative-dashboard", icon: Receipt },
      { title: "Paiements Groupés", url: "/cooperative-dashboard", icon: DollarSign },
      { title: "Notifications", url: "/cooperative-dashboard", icon: Bell },
      { title: "Membres", url: "/cooperative-dashboard", icon: Users },
      { title: "Statistiques", url: "/cooperative-dashboard", icon: BarChart3 },
    ],
    admin: [
      ...baseItems,
      { title: "Administration", url: "/admin", icon: Settings },
      { title: "Utilisateurs", url: "/admin/users", icon: Users },
      { title: "Finances", url: "/admin/finances", icon: DollarSign },
      { title: "Rapports", url: "/admin/reports", icon: FileText },
    ],
    ministre: [
      ...baseItems,
      { title: "Vue d'ensemble", url: "/minister-dashboard", icon: LayoutDashboard },
      { title: "Pêche Artisanale", url: "/minister-dashboard/artisanal", icon: Fish },
      { title: "Pêche Industrielle", url: "/minister-dashboard/industrial", icon: Ship },
      { title: "Économie", url: "/minister-dashboard/economy", icon: DollarSign },
      { title: "Alertes", url: "/minister-dashboard/alerts", icon: Bell },
      { title: "Formations", url: "/minister-dashboard/formations", icon: Users },
    ],
    dgpa: [
      ...baseItems,
      { title: "Vue d'ensemble", url: "/dgpa-dashboard", icon: LayoutDashboard },
      { title: "Ports & Débarquements", url: "/dgpa-dashboard", icon: Ship },
      { title: "Statistiques", url: "/dgpa-dashboard", icon: BarChart3 },
    ],
    anpa: [
      ...baseItems,
      { title: "Vue d'ensemble", url: "/anpa-dashboard", icon: LayoutDashboard },
      { title: "Licences", url: "/anpa-dashboard", icon: FileText },
      { title: "Quotas", url: "/anpa-dashboard", icon: BarChart3 },
    ],
    agasa: [
      ...baseItems,
      { title: "Vue d'ensemble", url: "/agasa-dashboard", icon: LayoutDashboard },
      { title: "Contrôles", url: "/agasa-dashboard", icon: FileText },
      { title: "Certifications", url: "/agasa-dashboard", icon: BarChart3 },
    ],
  };

  return roleNavigation[role] || [
    ...baseItems,
    { title: "Tableau de Bord", url: "/dashboard", icon: LayoutDashboard },
  ];
};

export const DashboardSidebar = ({ roleConfig }: DashboardSidebarProps) => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const IconComponent = roleConfig.icon;

  const navigationItems = getNavigationItems(roleConfig.role);
  const isActive = (path: string) => location.pathname === path;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar
      collapsible="icon"
      className="border-r"
    >
      <SidebarContent>
        {/* Role Header */}
        {!isCollapsed && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${roleConfig.color}`}>
                <IconComponent className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-semibold">{roleConfig.label}</p>
                <p className="text-xs text-muted-foreground capitalize">{roleConfig.category}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end
                        className="hover:bg-muted/50 transition-colors"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <ItemIcon className="h-4 w-4" />
                        {!isCollapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
