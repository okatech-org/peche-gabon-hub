import { Button } from "@/components/ui/button";
import { Fish, Waves, Shield, BarChart3, Users, ArrowRight, FileText, TrendingUp, Newspaper, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";
import { Logo } from "@/components/Logo";
import heroImage from "@/assets/hero-fisherman.jpg";
import artisanalImage from "@/assets/artisanal-fishing.jpg";
import industrialImage from "@/assets/industrial-fishing.jpg";
import surveillanceImage from "@/assets/surveillance.jpg";
import marketImage from "@/assets/market-economy.jpg";
import investorsImage from "@/assets/investors.jpg";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Pêcheur gabonais en action" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent" />
        </div>
        <div className="relative container mx-auto max-w-6xl py-24 px-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <Logo size="xl" className="drop-shadow-lg" />
              <h1 className="text-5xl lg:text-7xl font-bold text-white">{t("hero.title")}</h1>
            </div>
            <p className="text-2xl lg:text-3xl mb-6 text-primary font-semibold">
              {t("hero.subtitle")}
            </p>
            <p className="text-lg mb-8 text-white/90">
              {t("hero.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/donnees-publiques")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow button-hover-lift button-glow"
              >
                <TrendingUp className="mr-2 h-5 w-5" />
                {t("hero.dataInvestment")}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="border-primary text-white bg-background/20 backdrop-blur-sm hover:bg-primary/20 button-hover-lift"
              >
                {t("nav.professionalSpace")}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-card border-b py-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="ghost" className="button-hover-lift" onClick={() => navigate("/donnees-publiques")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              {t("nav.publicData")}
            </Button>
            <Button variant="ghost" className="button-hover-lift" onClick={() => navigate("/actualites")}>
              <Newspaper className="mr-2 h-4 w-4" />
              {t("nav.news")}
            </Button>
            <Button variant="ghost" className="button-hover-lift" onClick={() => navigate("/sensibilisation")}>
              <Heart className="mr-2 h-4 w-4" />
              {t("nav.awareness")}
            </Button>
            <Button variant="ghost" className="button-hover-lift" onClick={() => navigate("/registre-documents")}>
              <FileText className="mr-2 h-4 w-4" />
              {t("nav.registry")}
            </Button>
          </div>
        </div>
      </section>

      {/* Investment Opportunities */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Opportunités d'Investissement</h2>
            <p className="text-xl text-muted-foreground">
              Un secteur en pleine croissance avec un cadre réglementaire moderne
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <div className="relative overflow-hidden rounded-lg shadow-elevated group">
              <img 
                src={artisanalImage} 
                alt="Pêche artisanale" 
                className="w-full h-80 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pêche Artisanale</h3>
                  <p className="text-white/90 mb-4">
                    Soutien aux communautés locales avec des pratiques durables et un suivi CPUE en temps réel
                  </p>
                  <Button variant="secondary" size="sm" className="button-hover-lift button-glow" onClick={() => navigate("/donnees-publiques")}>
                    En savoir plus
                  </Button>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-lg shadow-elevated group">
              <img 
                src={industrialImage} 
                alt="Pêche industrielle" 
                className="w-full h-80 object-cover transition-transform group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-end p-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Pêche Industrielle</h3>
                  <p className="text-white/90 mb-4">
                    Infrastructure moderne et réglementations conformes aux standards internationaux
                  </p>
                  <Button variant="secondary" size="sm" className="button-hover-lift button-glow" onClick={() => navigate("/donnees-publiques")}>
                    En savoir plus
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 px-4 bg-card">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Un Écosystème Digital Complet</h2>
            <p className="text-xl text-muted-foreground">
              Transparence, traçabilité et excellence opérationnelle
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="relative overflow-hidden rounded-lg bg-background p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                <img 
                  src={surveillanceImage} 
                  alt="Surveillance maritime" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">Conformité & Surveillance</h3>
              </div>
              <p className="text-muted-foreground">
                Système de surveillance maritime avancé garantissant la conformité réglementaire 
                et la protection des ressources
              </p>
            </div>
            
            <div className="relative overflow-hidden rounded-lg bg-background p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                <img 
                  src={investorsImage} 
                  alt="Analytics" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold">Données en Temps Réel</h3>
              </div>
              <p className="text-muted-foreground">
                Tableaux de bord et analytics avancés pour une prise de décision éclairée 
                basée sur des données fiables
              </p>
            </div>
            
            <div className="relative overflow-hidden rounded-lg bg-background p-6 shadow-card hover:shadow-elevated transition-shadow">
              <div className="aspect-video mb-4 overflow-hidden rounded-lg">
                <img 
                  src={marketImage} 
                  alt="Économie" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold">Croissance Économique</h3>
              </div>
              <p className="text-muted-foreground">
                Un marché dynamique créant de la valeur pour les communautés locales 
                et les investisseurs internationaux
              </p>
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
                <Logo size="md" />
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
            className="bg-white text-primary hover:bg-white/90 button-hover-lift button-glow"
          >
            Commencer Maintenant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>{t("footer.copyright")}</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
