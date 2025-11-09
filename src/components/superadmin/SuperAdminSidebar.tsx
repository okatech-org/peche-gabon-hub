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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent className="bg-sidebar py-4">
        {menuItems.map((section) => (
          <SidebarGroup key={section.group} className="py-2">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-muted-foreground text-[10px] uppercase tracking-wider font-semibold px-4 mb-2">
                {section.group}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-3">
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200 group"
                        activeClassName="bg-primary/10 text-primary font-medium shadow-elevated border border-primary/20"
                      >
                        <item.icon className="h-[18px] w-[18px] flex-shrink-0 group-hover:scale-110 transition-transform" />
                        {!isCollapsed && <span className="text-[15px]">{item.title}</span>}
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
