import { Button } from "@/components/ui/button";
import { Fish, Waves, Shield, BarChart3, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-ocean text-white py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-left">
              <div className="flex items-center gap-3 justify-center lg:justify-start mb-6">
                <Fish className="h-16 w-16" />
                <h1 className="text-5xl lg:text-6xl font-bold">PÊCHE GABON</h1>
              </div>
              <p className="text-xl lg:text-2xl mb-8 text-white/90">
                Plateforme Nationale de Gestion des Ressources Halieutiques
              </p>
              <p className="text-lg mb-8 text-white/80">
                Solution intégrée pour le suivi des captures, la gestion des licences,
                la surveillance maritime et l'analyse des données du secteur de la pêche au Gabon.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth")}
                  className="bg-white text-primary hover:bg-white/90"
                >
                  Accéder à la Plateforme
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                >
                  En Savoir Plus
                </Button>
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                  <Waves className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">Pêche Artisanale</h3>
                  <p className="text-sm text-white/80">Suivi des captures et CPUE</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                  <Shield className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">Surveillance</h3>
                  <p className="text-sm text-white/80">Infractions et conformité</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                  <BarChart3 className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">Analytics</h3>
                  <p className="text-sm text-white/80">Dashboards temps réel</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
                  <Users className="h-8 w-8 mb-3" />
                  <h3 className="font-semibold mb-2">RBAC</h3>
                  <p className="text-sm text-white/80">10 rôles utilisateurs</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Fonctionnalités Principales</h2>
            <p className="text-xl text-muted-foreground">
              Une solution complète pour le secteur halieutique gabonais
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Fish className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Gestion des Captures</h3>
              <p className="text-muted-foreground">
                Déclaration et suivi des captures artisanales et industrielles avec calcul automatique du CPUE
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Licences & Conformité</h3>
              <p className="text-muted-foreground">
                Gestion automatisée des licences, quittances et paiements avec suivi en temps réel
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics Avancées</h3>
              <p className="text-muted-foreground">
                Tableaux de bord personnalisés par rôle avec exports et rapports détaillés
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-sunset text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Prêt à Moderniser la Gestion de la Pêche ?
          </h2>
          <p className="text-xl mb-8 text-white/90">
            Rejoignez la plateforme nationale et contribuez à une gestion durable des ressources halieutiques
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90"
          >
            Commencer Maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>© 2025 PÊCHE GABON - Ministère de la Pêche et de l'Aquaculture</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
