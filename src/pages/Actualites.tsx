import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

const Actualites = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const actualites = [
    {
      id: 1,
      title: "Nouvelle Réglementation sur la Pêche Durable",
      date: "2025-01-15",
      category: "Réglementation",
      excerpt: "Le Ministère annonce de nouvelles mesures pour renforcer la durabilité des pratiques de pêche au Gabon.",
      image: "/placeholder.svg",
    },
    {
      id: 2,
      title: "Partenariat International pour la Surveillance Maritime",
      date: "2025-01-10",
      category: "Coopération",
      excerpt: "Signature d'un accord avec l'Union Européenne pour moderniser le système de surveillance des eaux gabonaises.",
      image: "/placeholder.svg",
    },
    {
      id: 3,
      title: "Record de Captures pour la Pêche Artisanale",
      date: "2025-01-05",
      category: "Économie",
      excerpt: "Les pêcheurs artisanaux enregistrent leur meilleure année avec une augmentation de 15% des captures.",
      image: "/placeholder.svg",
    },
    {
      id: 4,
      title: "Investissement dans les Infrastructures Portuaires",
      date: "2024-12-28",
      category: "Infrastructure",
      excerpt: "Lancement d'un projet de 50 milliards FCFA pour moderniser les ports de pêche du pays.",
      image: "/placeholder.svg",
    },
    {
      id: 5,
      title: "Formation de 500 Pêcheurs aux Pratiques Durables",
      date: "2024-12-20",
      category: "Formation",
      excerpt: "Programme de formation lancé en partenariat avec la FAO pour améliorer les compétences des pêcheurs.",
      image: "/placeholder.svg",
    },
    {
      id: 6,
      title: "Nouvelle Flotte de Surveillance Opérationnelle",
      date: "2024-12-15",
      category: "Surveillance",
      excerpt: "Mise en service de 3 nouveaux navires de surveillance pour renforcer le contrôle des zones de pêche.",
      image: "/placeholder.svg",
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      "Réglementation": "bg-primary/10 text-primary",
      "Coopération": "bg-secondary/10 text-secondary",
      "Économie": "bg-accent/10 text-accent",
      "Infrastructure": "bg-cyan/10 text-cyan",
      "Formation": "bg-blue/10 text-blue",
      "Surveillance": "bg-primary/10 text-primary",
    };
    return colors[category] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Language Selector - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector />
      </div>
      
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 backdrop-blur-sm bg-card/95">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Button>
            <h1 className="text-2xl font-bold">{t("nav.news")}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-ocean text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <Newspaper className="h-12 w-12" />
            <h2 className="text-4xl lg:text-5xl font-bold">
              {t("news.hero.title")}
            </h2>
          </div>
          <p className="text-xl text-white/90 max-w-3xl">
            {t("news.hero.description")}
          </p>
        </div>
      </section>

      {/* News Grid */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actualites.map((article) => (
              <Card key={article.id} className="hover:shadow-elevated transition-shadow overflow-hidden group">
                <div className="aspect-video bg-muted overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={getCategoryColor(article.category)}>
                      {article.category}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(article.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-3">
                    {article.excerpt}
                  </CardDescription>
                  <Button variant="link" className="mt-4 p-0">
                    {t("news.readMore")} →
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              {t("news.loadMore")}
            </Button>
          </div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t("news.newsletter.title")}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("news.newsletter.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder={t("news.newsletter.placeholder")}
              className="flex-1 px-4 py-2 rounded-md border border-input bg-background"
            />
            <Button>{t("news.newsletter.subscribe")}</Button>
          </div>
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

export default Actualites;
