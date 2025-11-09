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
    <Sidebar collapsible="icon" className="border-r border-slate-800/50 bg-slate-950">
      <SidebarContent className="bg-slate-950">
        {menuItems.map((section) => (
          <SidebarGroup key={section.group} className="py-3">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-slate-500 text-[10px] uppercase tracking-widest font-semibold px-3 mb-2">
                {section.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="px-3">
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-slate-400 hover:bg-slate-900/50 hover:text-slate-100 transition-all duration-200 group"
                        activeClassName="bg-gradient-to-r from-slate-900 to-slate-800/50 text-slate-50 font-medium shadow-sm border-l-2 border-slate-400"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0 group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span className="text-sm">{item.title}</span>}
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
