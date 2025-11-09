import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, TrendingUp, Fish, DollarSign, Ship, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCSVData } from "@/hooks/useCSVData";
import { useLanguage } from "@/hooks/useLanguage";
import { LanguageSelector } from "@/components/LanguageSelector";

const DonneesPubliques = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { data: indicateurs } = useCSVData("/data/analytics/indicateurs_cles.csv");

  const stats = indicateurs?.[0] || {};

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
            <h1 className="text-2xl font-bold">{t("nav.publicData")}</h1>
            <div className="w-24" />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-ocean text-white py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">
            {t("publicData.hero.title")}
          </h2>
          <p className="text-xl text-white/90 max-w-3xl">
            {t("publicData.hero.description")}
          </p>
        </div>
      </section>

      {/* Key Indicators */}
      <section className="py-12 px-4 -mt-8">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="shadow-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Fish className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium">{t("publicData.stats.totalCaptures")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {stats.captures_totales_kg ? `${(parseInt(String(stats.captures_totales_kg)) / 1000).toFixed(1)}T` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("publicData.stats.currentYear")}</p>
              </CardContent>
            </Card>

            <Card className="shadow-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-secondary" />
                  <CardTitle className="text-sm font-medium">{t("publicData.stats.totalRevenue")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-secondary">
                  {stats.recettes_totales ? `${(parseInt(String(stats.recettes_totales)) / 1000000).toFixed(1)}M` : "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">FCFA</p>
              </CardContent>
            </Card>

            <Card className="shadow-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Ship className="h-5 w-5 text-accent" />
                  <CardTitle className="text-sm font-medium">{t("publicData.stats.activeLicenses")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-accent">
                  {stats.nb_licences_actives || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("publicData.stats.professionals")}</p>
              </CardContent>
            </Card>

            <Card className="shadow-elevated">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <CardTitle className="text-sm font-medium">{t("publicData.stats.fishermen")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">
                  {stats.nb_pecheurs || "N/A"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{t("publicData.stats.registered")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Data Categories */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-8">{t("publicData.categories.title")}</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("publicData.categories.captures")}</CardTitle>
                <CardDescription>
                  {t("publicData.categories.capturesDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  {t("common.download")} CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("publicData.categories.financial")}</CardTitle>
                <CardDescription>
                  {t("publicData.categories.financialDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  {t("common.download")} CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("publicData.categories.licenses")}</CardTitle>
                <CardDescription>
                  {t("publicData.categories.licensesDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  {t("common.download")} CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("publicData.categories.fleet")}</CardTitle>
                <CardDescription>
                  {t("publicData.categories.fleetDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  {t("common.download")} CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("publicData.categories.species")}</CardTitle>
                <CardDescription>
                  {t("publicData.categories.speciesDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  {t("common.download")} CSV
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-elevated transition-shadow">
              <CardHeader>
                <CardTitle>{t("publicData.categories.surveillance")}</CardTitle>
                <CardDescription>
                  {t("publicData.categories.surveillanceDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  {t("common.download")} CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Investment Info */}
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto max-w-4xl text-center">
          <TrendingUp className="h-16 w-16 text-primary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-4">{t("publicData.investment.title")}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {t("publicData.investment.description")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              {t("publicData.investment.createAccount")}
            </Button>
            <Button size="lg" variant="outline">
              {t("publicData.investment.downloadGuide")}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t py-8 px-4">
        <div className="container mx-auto max-w-6xl text-center text-muted-foreground">
          <p>{t("footer.copyright")}</p>
          <p className="text-sm mt-2">{t("footer.dataUpdated")}</p>
        </div>
      </footer>
    </div>
  );
};

export default DonneesPubliques;
