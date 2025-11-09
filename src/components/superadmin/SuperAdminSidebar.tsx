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
  Activity,
  FileText,
  Network,
  Database,
  Rocket,
  HardDrive,
  Shield,
  Code,
  Server,
} from "lucide-react";

const menuItems = [
  {
    group: "Surveillance",
    items: [
      { title: "Monitoring Système", url: "/superadmin-dashboard/monitoring", icon: Activity },
      { title: "Logs", url: "/superadmin-dashboard/logs", icon: FileText },
      { title: "Performance", url: "/superadmin-dashboard/performance", icon: Network },
    ],
  },
  {
    group: "Infrastructure",
    items: [
      { title: "Base de données", url: "/superadmin-dashboard/database", icon: Database },
      { title: "Backups", url: "/superadmin-dashboard/backup", icon: HardDrive },
      { title: "Déploiement", url: "/superadmin-dashboard/deployment", icon: Rocket },
    ],
  },
  {
    group: "Sécurité & Développement",
    items: [
      { title: "Sécurité", url: "/superadmin-dashboard/security", icon: Shield },
      { title: "Développement", url: "/superadmin-dashboard/developpement", icon: Code },
    ],
  },
];

export function SuperAdminSidebar() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-700 bg-slate-900">
      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.group}>
            {!isCollapsed && (
              <SidebarGroupLabel className="text-slate-400 text-xs uppercase tracking-wider">
                {section.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="hover:bg-slate-800/50 text-slate-300 hover:text-slate-100 transition-colors"
                        activeClassName="bg-slate-800 text-slate-100 font-medium border-l-2 border-slate-400"
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
