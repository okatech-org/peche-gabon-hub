import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Users,
  Shield,
  FileText,
  Fish,
  Anchor,
  Map,
  Building2,
  Upload,
  Download,
  Settings,
  Database,
  LayoutDashboard,
  TrendingUp,
  History,
  Lightbulb,
  Wind,
} from "lucide-react";

const menuItems = [
  {
    group: "Vue d'ensemble",
    items: [
      { title: "Tableau de Bord", url: "/admin/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    group: "Gestion des Utilisateurs",
    items: [
      { title: "Utilisateurs", url: "/admin/users", icon: Users },
      { title: "Rôles & Permissions", url: "/admin/roles", icon: Shield },
      { title: "Logs d'Audit", url: "/admin/audit", icon: FileText },
    ],
  },
  {
    group: "Référentiels",
    items: [
      { title: "Espèces", url: "/admin/especes", icon: Fish },
      { title: "Engins de Pêche", url: "/admin/engins", icon: Anchor },
      { title: "Sites & Strates", url: "/admin/sites", icon: Map },
      { title: "Coopératives", url: "/admin/cooperatives", icon: Building2 },
    ],
  },
  {
    group: "Flottes",
    items: [
      { title: "Pirogues (PA)", url: "/admin/pirogues", icon: Users },
      { title: "Navires (PI)", url: "/admin/navires", icon: Anchor },
      { title: "Licences", url: "/admin/licences", icon: FileText },
    ],
  },
  {
    group: "Finances",
    items: [
      { title: "Quittances", url: "/admin/quittances", icon: FileText },
      { title: "Tableau de Bord", url: "/admin/finances-dashboard", icon: LayoutDashboard },
      { title: "Prévisions", url: "/admin/previsions", icon: TrendingUp },
      { title: "Historique Prévisions", url: "/admin/previsions-history", icon: History },
      { title: "Simulation Scénarios", url: "/admin/scenarios", icon: Lightbulb },
      { title: "Facteurs Externes", url: "/admin/facteurs-externes", icon: Wind },
    ],
  },
  {
    group: "Données",
    items: [
      { title: "Import de Données", url: "/admin/import", icon: Upload },
      { title: "Export de Données", url: "/admin/export", icon: Download },
      { title: "Intégrité des Données", url: "/admin/data-integrity", icon: Database },
    ],
  },
  {
    group: "Système",
    items: [
      { title: "Paramètres", url: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.group}>
            {!isCollapsed && <SidebarGroupLabel>{section.group}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-muted/50"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <item.icon className="h-4 w-4" />
                        {!isCollapsed && <span className="ml-2">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
