import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Receipt, 
  DollarSign,
  Bell,
  Users,
  BarChart3,
  MessageSquare,
  LogOut,
  LayoutDashboard
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Logo } from "@/components/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const navigationItems = [
  { title: "Tableau de bord", value: "dashboard", icon: LayoutDashboard },
  { title: "Taxes des Membres", value: "taxes", icon: Receipt },
  { title: "Paiements Groupés", value: "paiements", icon: DollarSign },
  { title: "Mes Remontées", value: "remontees", icon: MessageSquare },
  { title: "Notifications", value: "notifications", icon: Bell },
  { title: "Membres", value: "membres", icon: Users },
  { title: "Statistiques", value: "stats", icon: BarChart3 },
];

interface CooperativeSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export function CooperativeSidebar({ activeTab = "dashboard", onTabChange }: CooperativeSidebarProps) {
  const { state } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    const { supabase } = await import("@/integrations/supabase/client");
    await supabase.auth.signOut();
    navigate("/auth");
  };

  // Extraire les initiales du user
  const userEmail = user?.email || "cooperative@demo.ga";
  const initials = userEmail
    .split("@")[0]
    .split(".")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Sidebar collapsible="icon" className="border-r bg-card">
      {/* Header avec Logo */}
      <SidebarHeader className="border-b">
        {!isCollapsed ? (
          <div className="px-4 py-3">
            <div className="flex items-center gap-3 mb-2">
              <Logo size="sm" />
              <div className="flex-1">
                <h2 className="text-sm font-bold">PÊCHE GABON</h2>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Espace coopérative</p>
          </div>
        ) : (
          <div className="flex justify-center py-3">
            <Logo size="xs" />
          </div>
        )}
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const ItemIcon = item.icon;
                const isActive = activeTab === item.value;
                
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => onTabChange?.(item.value)}
                      className={`
                        hover:bg-accent/50 transition-colors cursor-pointer
                        ${isActive ? "bg-primary/10 text-primary font-medium" : ""}
                      `}
                    >
                      <ItemIcon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer avec profil utilisateur */}
      <SidebarFooter className="border-t">
        {!isCollapsed ? (
          <div className="p-3 space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 bg-primary/10">
                <AvatarFallback className="text-primary font-semibold bg-primary/10">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{userEmail}</p>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                >
                  ● En ligne
                </Badge>
              </div>
            </div>
            <Separator />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </Button>
          </div>
        ) : (
          <div className="p-2 flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8 bg-primary/10">
              <AvatarFallback className="text-xs text-primary font-semibold bg-primary/10">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-3 w-3" />
            </Button>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
