import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "@/components/Logo";
import { 
  Home, 
  BarChart3, 
  FileText, 
  Newspaper, 
  Database,
  ArrowLeft,
  Fish
} from "lucide-react";

const NotFound = () => {
  const quickLinks = [
    {
      title: "Accueil",
      description: "Retour à la page d'accueil",
      icon: Home,
      path: "/",
      color: "text-primary"
    },
    {
      title: "Données Publiques",
      description: "Consulter les données ouvertes",
      icon: Database,
      path: "/donnees-publiques",
      color: "text-blue-600"
    },
    {
      title: "Actualités",
      description: "Dernières nouvelles du secteur",
      icon: Newspaper,
      path: "/actualites",
      color: "text-green-600"
    },
    {
      title: "Documentation",
      description: "Registre des documents",
      icon: FileText,
      path: "/registre-documents",
      color: "text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full animate-fade-in">
        {/* Header with Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6 animate-scale-in">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-6 bg-background rounded-full shadow-elevated">
                <Logo size="xl" />
              </div>
            </div>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-bold text-primary mb-4">404</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-2">
            Page introuvable
          </h2>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            La page que vous recherchez n'existe pas ou a été déplacée.
          </p>
        </div>

        {/* Quick Action Button */}
        <div className="flex justify-center mb-12">
          <Link to="/">
            <Button size="lg" className="gap-2 hover-scale">
              <ArrowLeft className="h-5 w-5" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        {/* Quick Links Grid */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-center mb-6">
            Liens rapides
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.map((link, index) => {
              const IconComponent = link.icon;
              return (
                <Link 
                  key={link.path} 
                  to={link.path}
                  className="group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <Card className="hover:shadow-elevated transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg bg-primary/10 ${link.color} group-hover:scale-110 transition-transform`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
                            {link.title}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {link.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Additional Help Section */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <Fish className="h-8 w-8 mx-auto mb-3 text-primary" />
            <p className="text-sm text-muted-foreground mb-4">
              Besoin d'aide ? Connectez-vous à votre espace personnel pour accéder à toutes les fonctionnalités.
            </p>
            <Link to="/auth">
              <Button variant="outline" className="gap-2">
                Se connecter
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>© 2024 PÊCHE GABON - Tous droits réservés</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
