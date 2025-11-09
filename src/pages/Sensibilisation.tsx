import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Heart, Fish, Waves, AlertTriangle, BookOpen, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

const Sensibilisation = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

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
            <h1 className="text-2xl font-bold">{t("nav.awareness")}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-ocean text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center gap-4 mb-4">
            <Heart className="h-12 w-12" />
            <h2 className="text-4xl lg:text-5xl font-bold">
              {t("awareness.hero.title")}
            </h2>
          </div>
          <p className="text-xl text-white/90 max-w-3xl">
            {t("awareness.hero.description")}
          </p>
        </div>
      </section>

      {/* Key Messages */}
      <section className="py-12 px-4 -mt-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="shadow-elevated bg-primary/5">
              <CardHeader>
                <Fish className="h-12 w-12 text-primary mb-4" />
                <CardTitle>{t("awareness.responsible.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("awareness.responsible.description")}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elevated bg-secondary/5">
              <CardHeader>
                <Waves className="h-12 w-12 text-secondary mb-4" />
                <CardTitle>{t("awareness.ecosystem.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("awareness.ecosystem.description")}
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-elevated bg-accent/5">
              <CardHeader>
                <AlertTriangle className="h-12 w-12 text-accent mb-4" />
                <CardTitle>{t("awareness.illegal.title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {t("awareness.illegal.description")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Educational Content */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">{t("awareness.practices.title")}</h2>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <BookOpen className="h-10 w-10 text-primary mb-4" />
                <CardTitle>{t("awareness.practices.fishermen")}</CardTitle>
                <CardDescription>{t("awareness.practices.fishermenDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Utilisez des engins de pêche sélectifs pour réduire les prises accessoires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Respectez les tailles minimales de capture pour chaque espèce</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Déclarez vos captures pour permettre une gestion durable des stocks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Participez aux formations sur les techniques de pêche responsable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>Évitez les zones de reproduction pendant les périodes sensibles</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-secondary mb-4" />
                <CardTitle>{t("awareness.practices.consumers")}</CardTitle>
                <CardDescription>{t("awareness.practices.consumersDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">•</span>
                    <span>Privilégiez les poissons issus de la pêche durable et certifiée</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">•</span>
                    <span>Diversifiez votre consommation pour réduire la pression sur les espèces populaires</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">•</span>
                    <span>Achetez du poisson local pour soutenir les pêcheurs gabonais</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">•</span>
                    <span>Informez-vous sur les espèces menacées à éviter</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-secondary mt-1">•</span>
                    <span>Respectez les saisons de pêche et les recommandations officielles</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Threatened Species Alert */}
      <section className="py-12 px-4 bg-destructive/10">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-12 w-12 text-destructive flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-3xl font-bold mb-4">{t("awareness.threatened.title")}</h2>
              <p className="text-lg mb-6">
                {t("awareness.threatened.description")}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Mérou Géant</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                      {t("awareness.threatened.forbidden")}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Requin Marteau</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                      {t("awareness.threatened.forbidden")}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Tortue Marine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                      {t("awareness.threatened.protected")}
                    </span>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Raie Manta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <span className="text-xs bg-destructive/20 text-destructive px-2 py-1 rounded">
                      {t("awareness.threatened.protected")}
                    </span>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-8 text-center">{t("awareness.resources.title")}</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("awareness.resources.guide")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t("awareness.resources.guideDesc")}
                </p>
                <Button variant="outline" className="w-full">
                  {t("awareness.resources.downloadPdf")}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("awareness.resources.regulations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t("awareness.resources.regulationsDesc")}
                </p>
                <Button variant="outline" className="w-full">
                  {t("awareness.resources.consult")}
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("awareness.resources.calendar")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {t("awareness.resources.calendarDesc")}
                </p>
                <Button variant="outline" className="w-full">
                  {t("awareness.resources.viewCalendar")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-sunset text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t("awareness.cta.title")}</h2>
          <p className="text-xl mb-8 text-white/90">
            {t("awareness.cta.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
              {t("awareness.cta.engage")}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              {t("awareness.cta.report")}
            </Button>
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

export default Sensibilisation;
