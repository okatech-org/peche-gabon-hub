import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Fish, User, LayoutDashboard, LogOut, MessageSquare } from "lucide-react";

export const PecheurNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, user } = useAuth();

  const navItems = [
    { path: "/dashboard", label: "Tableau de Bord", icon: LayoutDashboard },
    { path: "/captures", label: "Captures", icon: Fish },
    { path: "/mes-remontees", label: "Mes Remontées", icon: MessageSquare },
    { path: "/mon-compte", label: "Mon Compte", icon: User },
  ];

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Fish className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">PÊCHE GABON</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-muted mr-2">
              Pêcheur
            </Badge>
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? "default" : "ghost"}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            ))}
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

