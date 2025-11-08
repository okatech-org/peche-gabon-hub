import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Ship, FileText, Receipt, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { PecheurNav } from "@/components/PecheurNav";

const MonCompte = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pirogues, setPirogues] = useState<any[]>([]);
  const [licences, setLicences] = useState<any[]>([]);
  const [quittances, setQuittances] = useState<any[]>([]);
  const [stats, setStats] = useState({
    capturesTotal: 0,
    capturesMois: 0,
    cpueMoyen: 0,
    sortiesTotal: 0,
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Charger le profil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(profileData);

      // Charger les pirogues dont l'utilisateur est propriétaire
      const { data: proprietaireData } = await supabase
        .from("proprietaires")
        .select("id")
        .eq("email", user.email)
        .single();

      if (proprietaireData) {
        const { data: piroguesData } = await supabase
          .from("pirogues")
          .select(`
            *,
            cooperative:cooperatives(nom),
            site:sites(nom, province)
          `)
          .eq("proprietaire_id", proprietaireData.id);
        setPirogues(piroguesData || []);

        // Charger les licences
        const pirogueIds = piroguesData?.map(p => p.id) || [];
        if (pirogueIds.length > 0) {
          const { data: licencesData } = await supabase
            .from("licences")
            .select(`
              *,
              pirogue:pirogues(nom, immatriculation)
            `)
            .in("pirogue_id", pirogueIds)
            .order("created_at", { ascending: false });
          setLicences(licencesData || []);

          // Charger les quittances
          const licenceIds = licencesData?.map(l => l.id) || [];
          if (licenceIds.length > 0) {
            const { data: quittancesData } = await supabase
              .from("quittances")
              .select(`
                *,
                licence:licences(numero, pirogue:pirogues(nom))
              `)
              .in("licence_id", licenceIds)
              .order("created_at", { ascending: false });
            setQuittances(quittancesData || []);
          }

          // Charger les statistiques de captures
          const { data: capturesData } = await supabase
            .from("captures_pa")
            .select("poids_kg, cpue, date_capture")
            .in("pirogue_id", pirogueIds);

          const { data: sortiesData } = await supabase
            .from("sorties_peche")
            .select("capture_totale_kg, cpue")
            .in("pirogue_id", pirogueIds);

          if (capturesData) {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            const capturesMois = capturesData.filter(c => {
              const date = new Date(c.date_capture);
              return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });

            const cpues = capturesData.filter(c => c.cpue).map(c => c.cpue);
            const cpueMoyen = cpues.length > 0 
              ? cpues.reduce((a, b) => a + b, 0) / cpues.length 
              : 0;

            setStats({
              capturesTotal: capturesData.reduce((sum, c) => sum + (c.poids_kg || 0), 0),
              capturesMois: capturesMois.reduce((sum, c) => sum + (c.poids_kg || 0), 0),
              cpueMoyen: Number(cpueMoyen.toFixed(2)),
              sortiesTotal: sortiesData?.length || 0,
            });
          }
        }
      }
    } catch (error: any) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "valide":
      case "payee":
        return "bg-green-500";
      case "en_attente":
        return "bg-yellow-500";
      case "expiree":
      case "en_retard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PecheurNav />
      
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Mon Compte</h1>
          <p className="text-muted-foreground">
            Gérez vos informations et suivez vos activités de pêche
          </p>
        </div>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Captures Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.capturesTotal} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.capturesMois} kg</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPUE Moyen</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cpueMoyen}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sorties Totales</CardTitle>
              <Ship className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sortiesTotal}</div>
            </CardContent>
          </Card>
        </div>

        {/* Contenu Principal */}
        <Tabs defaultValue="profil" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profil">
              <User className="h-4 w-4 mr-2" />
              Profil
            </TabsTrigger>
            <TabsTrigger value="pirogues">
              <Ship className="h-4 w-4 mr-2" />
              Mes Pirogues
            </TabsTrigger>
            <TabsTrigger value="licences">
              <FileText className="h-4 w-4 mr-2" />
              Licences
            </TabsTrigger>
            <TabsTrigger value="quittances">
              <Receipt className="h-4 w-4 mr-2" />
              Quittances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profil">
            <Card>
              <CardHeader>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>Vos informations de compte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{user?.email}</p>
                </div>
                {profile?.first_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Prénom</label>
                    <p className="text-lg">{profile.first_name}</p>
                  </div>
                )}
                {profile?.last_name && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Nom</label>
                    <p className="text-lg">{profile.last_name}</p>
                  </div>
                )}
                {profile?.phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                    <p className="text-lg">{profile.phone}</p>
                  </div>
                )}
                {profile?.province && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Province</label>
                    <p className="text-lg">{profile.province}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pirogues">
            <div className="grid gap-4">
              {pirogues.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucune pirogue enregistrée
                  </CardContent>
                </Card>
              ) : (
                pirogues.map((pirogue) => (
                  <Card key={pirogue.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>{pirogue.nom}</CardTitle>
                        <Badge className={getStatutColor(pirogue.statut)}>
                          {pirogue.statut}
                        </Badge>
                      </div>
                      <CardDescription>
                        Immatriculation: {pirogue.immatriculation}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Type</label>
                        <p>{pirogue.type}</p>
                      </div>
                      {pirogue.cooperative && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Coopérative</label>
                          <p>{pirogue.cooperative.nom}</p>
                        </div>
                      )}
                      {pirogue.site && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Site</label>
                          <p>{pirogue.site.nom} - {pirogue.site.province}</p>
                        </div>
                      )}
                      {pirogue.longueur_m && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Longueur</label>
                          <p>{pirogue.longueur_m} m</p>
                        </div>
                      )}
                      {pirogue.puissance_cv && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Puissance</label>
                          <p>{pirogue.puissance_cv} CV</p>
                        </div>
                      )}
                      {pirogue.nb_pecheurs && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Nb Pêcheurs</label>
                          <p>{pirogue.nb_pecheurs}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="licences">
            <div className="grid gap-4">
              {licences.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucune licence enregistrée
                  </CardContent>
                </Card>
              ) : (
                licences.map((licence) => (
                  <Card key={licence.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Licence {licence.numero}</CardTitle>
                        <Badge className={getStatutColor(licence.statut)}>
                          {licence.statut}
                        </Badge>
                      </div>
                      <CardDescription>
                        Pirogue: {licence.pirogue?.nom} ({licence.pirogue?.immatriculation})
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Année</label>
                        <p>{licence.annee}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Montant Total</label>
                        <p>{licence.montant_total?.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date Début</label>
                        <p>{format(new Date(licence.date_debut), "dd/MM/yyyy", { locale: fr })}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date Fin</label>
                        <p>{format(new Date(licence.date_fin), "dd/MM/yyyy", { locale: fr })}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="quittances">
            <div className="grid gap-4">
              {quittances.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucune quittance enregistrée
                  </CardContent>
                </Card>
              ) : (
                quittances.map((quittance) => (
                  <Card key={quittance.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>
                          {quittance.mois}/{quittance.annee}
                        </CardTitle>
                        <Badge className={getStatutColor(quittance.statut)}>
                          {quittance.statut}
                        </Badge>
                      </div>
                      <CardDescription>
                        Licence: {quittance.licence?.numero} - Pirogue: {quittance.licence?.pirogue?.nom}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Montant</label>
                        <p className="text-lg font-semibold">{quittance.montant?.toLocaleString()} FCFA</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Date Échéance</label>
                        <p>{format(new Date(quittance.date_echeance), "dd/MM/yyyy", { locale: fr })}</p>
                      </div>
                      {quittance.date_paiement && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Date Paiement</label>
                          <p>{format(new Date(quittance.date_paiement), "dd/MM/yyyy", { locale: fr })}</p>
                        </div>
                      )}
                      {quittance.numero_recu && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Numéro Reçu</label>
                          <p>{quittance.numero_recu}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MonCompte;
