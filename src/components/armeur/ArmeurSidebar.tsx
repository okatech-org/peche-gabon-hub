import { useLocation, useNavigate } from "react-router-dom";
import {
  Ship,
  Activity,
  Receipt,
  BarChart3,
  LogOut,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  {
    title: "Tableau de bord",
    url: "/armeur-dashboard",
    icon: BarChart3,
  },
  {
    title: "Ma Flotte",
    url: "/armeur-dashboard/flotte",
    icon: Ship,
  },
  {
    title: "Marées",
    url: "/armeur-dashboard/marees",
    icon: Activity,
  },
  {
    title: "Taxes & Impôts",
    url: "/armeur-dashboard/taxes",
    icon: Receipt,
  },
];

export function ArmeurSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const currentPath = location.pathname;
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getInitials = () => {
    if (!user?.email) return "AR";
    const email = user.email;
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Logo size="sm" />
          <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
            <h2 className="font-bold text-sm truncate">PÊCHE GABON</h2>
            <p className="text-xs text-muted-foreground truncate">Espace Armateur</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <NavLink
                    to={item.url}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground group ${
                      currentPath === item.url
                        ? "bg-accent text-accent-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                    title={item.title}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="text-sm group-data-[collapsible=icon]:hidden">
                      {item.title}
                    </span>
                  </NavLink>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-600 text-white text-xs">
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
