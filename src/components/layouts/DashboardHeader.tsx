import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { RoleConfig } from "@/lib/roleConfig";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/Logo";

interface DashboardHeaderProps {
  roleConfig: RoleConfig;
}

export const DashboardHeader = ({ roleConfig }: DashboardHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const IconComponent = roleConfig.icon;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4 px-4">
        {/* Sidebar Toggle */}
        <SidebarTrigger className="-ml-2" />

        {/* Logo & Role Badge */}
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${roleConfig.color}`}>
            <IconComponent className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Logo size="sm" />
              <h1 className="text-lg font-bold">PÊCHE GABON</h1>
            </div>
            <Badge variant="secondary" className="text-xs mt-0.5">
              {roleConfig.label}
            </Badge>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Info & Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block text-right mr-2">
            <p className="text-sm font-medium">{user?.email}</p>
          </div>

          <LanguageSelector />
          <ThemeToggle />

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/parametres')}
            title="Paramètres"
          >
            <SettingsIcon className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={signOut}
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};
