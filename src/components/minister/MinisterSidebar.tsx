import { 
  LayoutDashboard, 
  Anchor, 
  Ship, 
  MapPin, 
  DollarSign, 
  Bell, 
  Gavel, 
  History,
  FileText,
  TrendingUp,
  LogOut,
  Building2
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

const navigationItems = [
  { 
    title: "Vue d'ensemble", 
    url: "#overview", 
    icon: LayoutDashboard,
    description: "KPIs et statistiques globales"
  },
  { 
    title: "Pêche Artisanale", 
    url: "#artisanal", 
    icon: Anchor,
    description: "Captures, CPUE, licences"
  },
  { 
    title: "Pêche Industrielle", 
    url: "#industrial", 
    icon: Ship,
    description: "Navires, armements, activité"
  },
  { 
    title: "Surveillance", 
    url: "#surveillance", 
    icon: MapPin,
    description: "Carte, zones, infractions"
  },
  { 
    title: "Économie", 
    url: "#economic", 
    icon: DollarSign,
    description: "Exportations, valeur, prix"
  },
  { 
    title: "Remontées Finances", 
    url: "#remontees", 
    icon: Building2,
    description: "Taxes et répartition institutionnelle"
  },
];

const actionsItems = [
  { 
    title: "Alertes", 
    url: "#alerts", 
    icon: Bell,
    badge: true,
    description: "Notifications automatiques"
  },
  { 
    title: "Pouvoirs", 
    url: "#powers", 
    icon: Gavel,
    description: "Actions ministérielles"
  },
  { 
    title: "Historique", 
    url: "#history", 
    icon: History,
    description: "Réglementations, notifications"
  },
];

export function MinisterSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentHash = location.hash || "#overview";
  const collapsed = state === "collapsed";

  const isActive = (url: string) => currentHash === url;

  // Extract user initials for avatar
  const getInitials = () => {
    if (!user?.email) return "MI";
    const parts = user.email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar
      className={`border-r ${collapsed ? "w-16" : "w-64"} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate">Ministre</h2>
              <p className="text-xs text-muted-foreground truncate">Tableau de Bord</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-4">
        {/* Analytics Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "justify-center" : ""}>
            {!collapsed && "Analytiques"}
            {collapsed && <FileText className="h-4 w-4" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.url)
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className={collapsed ? "h-5 w-5" : "h-4 w-4"} />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Actions Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "justify-center" : ""}>
            {!collapsed && "Actions"}
            {collapsed && <Gavel className="h-4 w-4" />}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {actionsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        isActive(item.url)
                          ? "bg-primary text-primary-foreground font-medium"
                          : "hover:bg-muted"
                      } ${collapsed ? "justify-center" : ""}`}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className={collapsed ? "h-5 w-5" : "h-4 w-4"} />
                      {!collapsed && (
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.title}</span>
                            {item.badge && (
                              <Badge variant="destructive" className="h-5 text-xs">
                                3
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.description}
                          </div>
                        </div>
                      )}
                      {collapsed && item.badge && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full" />
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground">Ministre</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="w-full justify-start gap-2"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="p-2"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
