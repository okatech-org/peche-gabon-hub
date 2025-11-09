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
  Building2,
  Settings,
  GraduationCap,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useState } from "react";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigationItems = [
  { 
    title: "Vue d'ensemble", 
    url: "/minister-dashboard", 
    icon: LayoutDashboard,
    description: "KPIs et statistiques globales"
  },
  { 
    title: "Pêche Artisanale", 
    url: "/minister-dashboard/artisanal", 
    icon: Anchor,
    description: "Captures, CPUE, licences"
  },
  { 
    title: "Pêche Industrielle", 
    url: "/minister-dashboard/industrial", 
    icon: Ship,
    description: "Navires, armements, activité"
  },
  { 
    title: "Surveillance", 
    url: "/minister-dashboard/surveillance", 
    icon: MapPin,
    description: "Carte, zones, infractions"
  },
  { 
    title: "Économie", 
    url: "/minister-dashboard/economy", 
    icon: DollarSign,
    description: "Exportations, valeur, prix"
  },
  { 
    title: "Remontées Finances", 
    url: "/minister-dashboard/institutional-flows", 
    icon: Building2,
    description: "Taxes et répartition institutionnelle"
  },
];

const actionsItems = [
  { 
    title: "Alertes", 
    url: "/minister-dashboard/alerts", 
    icon: Bell,
    badge: true,
    description: "Notifications automatiques"
  },
  { 
    title: "Remontées Terrain", 
    url: "/minister-dashboard/remontees", 
    icon: MessageSquare,
    description: "Réclamations, suggestions, articles"
  },
  { 
    title: "Actions Ministérielles", 
    url: "/minister-dashboard/actions", 
    icon: Gavel,
    description: "Documents, réglementations, notifications"
  },
  { 
    title: "Formations", 
    url: "/minister-dashboard/formations", 
    icon: GraduationCap,
    description: "Planification et suivi des formations"
  },
  { 
    title: "Historique", 
    url: "/minister-dashboard/history", 
    icon: History,
    description: "Réglementations, notifications"
  },
  { 
    title: "Paramètres", 
    url: "/minister-dashboard/settings", 
    icon: Settings,
    description: "Configuration et préférences"
  },
];

export function MinisterSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  // États pour les groupes collapsibles
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);

  const isActive = (url: string) => currentPath === url;
  const isGroupActive = (items: typeof navigationItems) => 
    items.some(item => currentPath === item.url);

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
      className={`border-r bg-sidebar-background ${collapsed ? "w-16" : "w-72"} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
              <div className="relative h-11 w-11 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <TrendingUp className="h-6 w-6 text-primary-foreground" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-base truncate text-sidebar-foreground">Espace Ministre</h2>
              <p className="text-xs text-muted-foreground truncate">Tableau de Bord Exécutif</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center group">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-xl blur-md group-hover:blur-lg transition-all" />
              <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <TrendingUp className="h-5 w-5 text-primary-foreground" />
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Analytics Section - Collapsible */}
        <SidebarGroup>
          <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className={`group flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg transition-all duration-200 px-3 py-2 mx-2 ${collapsed ? "justify-center" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
                    <LayoutDashboard className="h-4 w-4 text-primary" />
                  </div>
                  {!collapsed && <span className="font-semibold text-sm text-sidebar-foreground">Analytiques</span>}
                </div>
                {!collapsed && (
                  <div className="flex items-center gap-1">
                    {isGroupActive(navigationItems) && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                    {analyticsOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                    )}
                  </div>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="mt-1 px-2">
                <SidebarMenu className="space-y-1">
                  {navigationItems.map((item, index) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent group relative overflow-hidden"
                          activeClassName="bg-primary/10 text-primary font-semibold shadow-sm before:absolute before:left-0 before:inset-y-0 before:w-1 before:bg-primary before:rounded-r"
                          title={collapsed ? item.title : undefined}
                        >
                          <div className="p-1.5 rounded-md bg-background/50 group-hover:bg-primary/10 transition-colors">
                            <item.icon className={`${collapsed ? "h-5 w-5" : "h-4 w-4"} group-hover:scale-110 transition-transform duration-200`} />
                          </div>
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-sidebar-foreground group-hover:text-primary transition-colors">{item.title}</div>
                              <div className="text-xs text-muted-foreground truncate leading-relaxed">
                                {item.description}
                              </div>
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>

        {/* Actions Section - Collapsible */}
        <SidebarGroup>
          <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className={`group flex items-center justify-between cursor-pointer hover:bg-sidebar-accent/50 rounded-lg transition-all duration-200 px-3 py-2 mx-2 ${collapsed ? "justify-center" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-accent/10 group-hover:bg-accent/20 transition-colors">
                    <Gavel className="h-4 w-4 text-accent" />
                  </div>
                  {!collapsed && <span className="font-semibold text-sm text-sidebar-foreground">Actions</span>}
                </div>
                {!collapsed && (
                  <div className="flex items-center gap-1">
                    {isGroupActive(actionsItems) && (
                      <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                    )}
                    {actionsOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                    )}
                  </div>
                )}
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="mt-1 px-2">
                <SidebarMenu className="space-y-1">
                  {actionsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="relative flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent group overflow-hidden"
                          activeClassName="bg-accent/10 text-accent font-semibold shadow-sm before:absolute before:left-0 before:inset-y-0 before:w-1 before:bg-accent before:rounded-r"
                          title={collapsed ? item.title : undefined}
                        >
                          <div className="p-1.5 rounded-md bg-background/50 group-hover:bg-accent/10 transition-colors">
                            <item.icon className={`${collapsed ? "h-5 w-5" : "h-4 w-4"} group-hover:scale-110 transition-transform duration-200`} />
                          </div>
                          {!collapsed && (
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-sidebar-foreground group-hover:text-accent transition-colors">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="destructive" className="h-5 px-1.5 text-[10px] font-bold animate-pulse shadow-sm">
                                    3
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground truncate leading-relaxed">
                                {item.description}
                              </div>
                            </div>
                          )}
                          {collapsed && item.badge && (
                            <div className="absolute -top-1 -right-1 h-3 w-3 bg-destructive rounded-full animate-pulse border-2 border-sidebar-background shadow-sm" />
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </Collapsible>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-sidebar-accent/30 hover:bg-sidebar-accent/50 transition-colors group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm group-hover:blur-md transition-all" />
                <Avatar className="relative h-10 w-10 border-2 border-primary/30 shadow-sm">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-sidebar-foreground">{user?.email?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse shadow-sm shadow-green-500/50" />
                  <span>Ministre</span>
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={signOut}
              className="w-full justify-start gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all duration-200 group"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span>Déconnexion</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-sm group-hover:blur-md transition-all" />
              <Avatar className="relative h-9 w-9 border-2 border-primary/30 shadow-sm">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="p-2 hover:bg-destructive/10 hover:text-destructive transition-all duration-200 group"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
