import { 
  LayoutDashboard, 
  Fish, 
  DollarSign, 
  MessageSquare, 
  User,
  Settings,
  LogOut
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";

const navigationItems = [
  { 
    title: "Tableau de Bord", 
    url: "/dashboard", 
    icon: LayoutDashboard,
  },
  { 
    title: "Mes Captures", 
    url: "/captures", 
    icon: Fish,
  },
  { 
    title: "Mes Taxes", 
    url: "/mes-taxes", 
    icon: DollarSign,
  },
  { 
    title: "Mes Remontées", 
    url: "/mes-remontees", 
    icon: MessageSquare,
  },
  { 
    title: "Mon Compte", 
    url: "/mon-compte", 
    icon: User,
  },
  { 
    title: "Paramètres", 
    url: "/parametres", 
    icon: Settings,
  },
];

export function PecheurSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const isActive = (url: string) => currentPath === url;

  const getInitials = () => {
    if (!user?.email) return "PG";
    return user.email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar
      className={`border-r border-border bg-card transition-all duration-300`}
      collapsible="icon"
    >
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <h2 className="font-bold text-sm truncate">PÊCHE GABON</h2>
            <p className="text-xs text-muted-foreground truncate">Espace Pêcheur</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarGroupContent className="px-2">
            <SidebarMenu className="space-y-2">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-accent group"
                      activeClassName="bg-primary text-primary-foreground font-semibold hover:bg-primary shadow-sm"
                      title={item.title}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-sm group-data-[collapsible=icon]:hidden">
                        {item.title}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-semibold text-xs">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="text-xs font-medium truncate">{user?.email}</p>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-[10px] text-muted-foreground">En ligne</span>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className={`w-full gap-2 h-9 text-xs hover:bg-destructive/10 hover:text-destructive transition-all justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2`}
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
            <span className="group-data-[collapsible=icon]:hidden">Déconnexion</span>
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
