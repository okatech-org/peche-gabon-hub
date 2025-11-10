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
  ChevronUp,
  Bot
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
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

// Sections de navigation groupées
const navigationSections = {
  analytics: {
    title: "ANALYTIQUES",
    items: [
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
    ]
  },
  economics: {
    title: "ÉCONOMIE & FINANCES",
    items: [
      { 
        title: "Économie & Finances", 
        url: "/minister-dashboard/economy", 
        icon: DollarSign,
        description: "Taxes, exportations, répartition"
      },
    ]
  },
  actions: {
    title: "ACTIONS & GESTION",
    items: [
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
        description: "Réclamations, suggestions"
      },
      { 
        title: "Actions Ministérielles", 
        url: "/minister-dashboard/actions", 
        icon: Gavel,
        description: "Documents, réglementations"
      },
      { 
        title: "Formations", 
        url: "/minister-dashboard/formations", 
        icon: GraduationCap,
        description: "Planification et suivi"
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
        description: "Configuration"
      },
    ]
  },
  assistants: {
    title: "ASSISTANTS IA",
    items: [
      { 
        title: "iAsted", 
        url: "/minister-dashboard/iasted", 
        icon: Bot,
        description: "Assistant vocal intelligent",
        highlight: true
      },
      { 
        title: "Briefing Quotidien", 
        url: "/minister-dashboard/briefing", 
        icon: FileText,
        description: "Rapport vocal matinal",
        highlight: true
      },
    ]
  }
};

export function MinisterSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";
  
  // États pour les sections collapsibles
  const [analyticsOpen, setAnalyticsOpen] = useState(true);
  const [economicsOpen, setEconomicsOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);
  const [assistantsOpen, setAssistantsOpen] = useState(true);

  const isActive = (url: string) => currentPath === url;
  const isSectionActive = (items: any[]) => 
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
      className={`border-r border-sidebar-border bg-sidebar-background ${collapsed ? "w-16" : "w-64"} transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-md">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-sm truncate text-sidebar-foreground">Ministre</h2>
              <p className="text-[10px] text-muted-foreground truncate">Gestion Stratégique</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary via-primary to-accent flex items-center justify-center shadow-md">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="py-2">
        {/* Analytics Section */}
        <SidebarGroup>
          <Collapsible open={analyticsOpen} onOpenChange={setAnalyticsOpen} defaultOpen={true}>
            {!collapsed && (
              <div className="px-3 py-2">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  {navigationSections.analytics.title}
                </p>
              </div>
            )}
            <CollapsibleContent>
              <SidebarGroupContent className="px-2">
                <SidebarMenu className="space-y-0.5">
                  {navigationSections.analytics.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 hover:bg-sidebar-accent group"
                          activeClassName="bg-primary/15 text-primary font-medium"
                          title={collapsed ? item.title : undefined}
                        >
                          <item.icon className={`${collapsed ? "h-4 w-4" : "h-4 w-4"} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                          {!collapsed && (
                            <span className="text-sm truncate">{item.title}</span>
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

        {/* Economics Section */}
        <SidebarGroup>
          <Collapsible open={economicsOpen} onOpenChange={setEconomicsOpen} defaultOpen={true}>
            {!collapsed && (
              <div className="px-3 py-2 mt-2">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  {navigationSections.economics.title}
                </p>
              </div>
            )}
            <CollapsibleContent>
              <SidebarGroupContent className="px-2">
                <SidebarMenu className="space-y-0.5">
                  {navigationSections.economics.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 hover:bg-sidebar-accent group"
                          activeClassName="bg-primary/15 text-primary font-medium"
                          title={collapsed ? item.title : undefined}
                        >
                          <item.icon className={`${collapsed ? "h-4 w-4" : "h-4 w-4"} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                          {!collapsed && (
                            <span className="text-sm truncate">{item.title}</span>
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

        {/* Actions Section */}
        <SidebarGroup>
          <Collapsible open={actionsOpen} onOpenChange={setActionsOpen} defaultOpen={true}>
            {!collapsed && (
              <div className="px-3 py-2 mt-2">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  {navigationSections.actions.title}
                </p>
              </div>
            )}
            <CollapsibleContent>
              <SidebarGroupContent className="px-2">
                <SidebarMenu className="space-y-0.5">
                  {navigationSections.actions.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 hover:bg-sidebar-accent group"
                          activeClassName="bg-primary/15 text-primary font-medium"
                          title={collapsed ? item.title : undefined}
                        >
                          <item.icon className={`${collapsed ? "h-4 w-4" : "h-4 w-4"} flex-shrink-0 group-hover:scale-110 transition-transform`} />
                          {!collapsed && (
                            <span className="text-sm truncate">{item.title}</span>
                          )}
                          {!collapsed && item.badge && (
                            <Badge variant="destructive" className="ml-auto h-4 px-1.5 text-[10px] font-bold">
                              3
                            </Badge>
                          )}
                          {collapsed && item.badge && (
                            <div className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-destructive rounded-full border border-sidebar-background" />
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

        {/* Assistants Section */}
        <SidebarGroup>
          <Collapsible open={assistantsOpen} onOpenChange={setAssistantsOpen} defaultOpen={true}>
            {!collapsed && (
              <div className="px-3 py-2 mt-2">
                <p className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
                  {navigationSections.assistants.title}
                </p>
              </div>
            )}
            <CollapsibleContent>
              <SidebarGroupContent className="px-2">
                <SidebarMenu className="space-y-0.5">
                  {navigationSections.assistants.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end
                          className="relative flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-all duration-200 hover:bg-sidebar-accent group bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10"
                          activeClassName="bg-primary/15 text-primary font-medium"
                          title={collapsed ? item.title : undefined}
                        >
                          <item.icon className={`${collapsed ? "h-4 w-4" : "h-4 w-4"} flex-shrink-0 group-hover:scale-110 transition-transform text-primary`} />
                          {!collapsed && (
                            <span className="text-sm truncate font-medium">{item.title}</span>
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

      <SidebarFooter className="border-t border-sidebar-border p-2.5">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-md">
              <Avatar className="h-8 w-8 border border-primary/20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-sidebar-foreground">{user?.email?.split('@')[0]}</p>
                <div className="flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-green-500" />
                  <span className="text-[10px] text-muted-foreground">Ministre</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start gap-2 h-8 text-xs hover:bg-sidebar-accent hover:text-destructive transition-all"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Déconnexion</span>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-7 w-7 border border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-[10px]">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="p-1.5 hover:bg-sidebar-accent hover:text-destructive transition-all"
              title="Déconnexion"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
