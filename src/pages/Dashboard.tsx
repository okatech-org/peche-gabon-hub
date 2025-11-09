import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Fish, 
  Users, 
  FileText, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  TrendingUp,
  Activity,
  LogOut,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PecheurNav } from "@/components/PecheurNav";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const roleLabels: Record<string, string> = {
  pecheur: "Pêcheur",
  agent_collecte: "Agent de Collecte",
  gestionnaire_coop: "Gestionnaire Coopérative",
  inspecteur: "Inspecteur",
  direction_provinciale: "Direction Provinciale",
  direction_centrale: "Direction Centrale",
  admin: "Administrateur",
  super_admin: "Super Administrateur",
  armateur_pi: "Armateur Pêche Industrielle",
  observateur_pi: "Observateur Pêche Industrielle",
  analyste: "Analyste",
  ministre: "Ministre",
};

const roleColors: Record<string, string> = {
  admin: "bg-destructive",
  ministre: "bg-accent",
  direction_centrale: "bg-primary",
  direction_provinciale: "bg-primary",
  analyste: "bg-secondary",
  inspecteur: "bg-secondary",
  gestionnaire_coop: "bg-muted",
  agent_collecte: "bg-muted",
  pecheur: "bg-muted",
  armateur_pi: "bg-muted",
  observateur_pi: "bg-muted",
};

const Dashboard = () => {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pecheurStats, setPecheurStats] = useState({
    capturesMois: 0,
    capturesMoisTrend: "",
    licenceStatut: "Non renseigné",
    cpueMoyen: 0,
    cpueTrend: "",
    notifications: 0,
    province: "",
    capturesMoyenneProvince: 0,
    cpueMoyenProvince: 0,
    comparaisonCaptures: "",
    comparaisonCPUE: "",
  });
  const [classementProvince, setClassementProvince] = useState<Array<{
    rang: number;
    proprietaireNom: string;
    captures: number;
    cpue: number;
    estUtilisateurActuel: boolean;
  }>>([]);
  const [historiqueClassement, setHistoriqueClassement] = useState<Array<{
    mois: number;
    annee: number;
    rang: number;
    totalPecheurs: number;
    captures: number;
    cpue: number;
  }>>([]);

  // Redirection automatique des admins vers le panel d'administration
  if (roles.includes('admin')) {
    navigate('/admin', { replace: true });
    return null;
  }

  // Redirection automatique du super admin vers son dashboard technique
  if (roles.includes('super_admin')) {
    navigate('/superadmin-dashboard', { replace: true });
    return null;
  }

  // Redirection automatique du ministre vers son dashboard exécutif
  if (roles.includes('ministre')) {
    navigate('/minister-dashboard', { replace: true });
    return null;
  }

  const primaryRole = roles[0] || 'pecheur';
  const isPecheur = roles.includes('pecheur') && !roles.includes('admin');

  useEffect(() => {
    if (isPecheur && user) {
      loadPecheurData();
    } else {
      setLoading(false);
    }
  }, [isPecheur, user]);

  const loadPecheurData = async () => {
    if (!user) return;

    try {
      // Récupérer le propriétaire associé à cet utilisateur
      const { data: proprietaireData } = await supabase
        .from("proprietaires")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (!proprietaireData) {
        setLoading(false);
        return;
      }

      // Récupérer les pirogues du propriétaire avec leur site pour la province
      const { data: piroguesData } = await supabase
        .from("pirogues")
        .select("id, site:sites(province)")
        .eq("proprietaire_id", proprietaireData.id);

      if (!piroguesData || piroguesData.length === 0) {
        setLoading(false);
        return;
      }

      // Déterminer la province du pêcheur (depuis la première pirogue ayant un site)
      const province = piroguesData.find(p => p.site?.province)?.site?.province || "";

      const pirogueIds = piroguesData.map(p => p.id);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const lastMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      // Captures du mois en cours
      const { data: capturesMoisData } = await supabase
        .from("captures_pa")
        .select("poids_kg, cpue")
        .in("pirogue_id", pirogueIds)
        .eq("mois", currentMonth)
        .eq("annee", currentYear);

      // Captures du mois dernier
      const { data: capturesMoisDernierData } = await supabase
        .from("captures_pa")
        .select("poids_kg")
        .in("pirogue_id", pirogueIds)
        .eq("mois", lastMonth)
        .eq("annee", lastMonthYear);

      // Calculer les statistiques
      const capturesMois = capturesMoisData?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0;
      const capturesMoisDernier = capturesMoisDernierData?.reduce((sum, c) => sum + (c.poids_kg || 0), 0) || 0;
      
      let capturesMoisTrend = "";
      if (capturesMoisDernier > 0) {
        const diff = ((capturesMois - capturesMoisDernier) / capturesMoisDernier) * 100;
        capturesMoisTrend = `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
      }

      // CPUE moyen
      const cpues = capturesMoisData?.filter(c => c.cpue).map(c => c.cpue) || [];
      const cpueMoyen = cpues.length > 0 
        ? cpues.reduce((a, b) => a + b, 0) / cpues.length 
        : 0;

      // Vérifier le statut de la licence la plus récente
      const { data: licencesData } = await supabase
        .from("licences")
        .select("statut, date_fin")
        .in("pirogue_id", pirogueIds)
        .order("date_fin", { ascending: false })
        .limit(1);

      const licenceStatut = licencesData && licencesData.length > 0 
        ? licencesData[0].statut === "valide" ? "Valide" : "Expirée"
        : "Non renseigné";

      // Notifications (quittances en retard + licences expirées)
      const { data: quittancesRetard } = await supabase
        .from("quittances")
        .select("id, licence:licences!inner(pirogue_id)")
        .in("licence.pirogue_id", pirogueIds)
        .eq("statut", "en_retard");

      const notifications = (quittancesRetard?.length || 0) + 
        (licenceStatut === "Expirée" ? 1 : 0);

      // Calculer les moyennes provinciales si on a une province
      let capturesMoyenneProvince = 0;
      let cpueMoyenProvince = 0;
      let comparaisonCaptures = "";
      let comparaisonCPUE = "";
      let piroguesProvince: any[] = [];

      if (province) {
        // Récupérer toutes les pirogues de la province
        const { data: piroguesProvinceData } = await supabase
          .from("pirogues")
          .select("id, site:sites!inner(province)")
          .eq("site.province", province);

        piroguesProvince = piroguesProvinceData || [];

        if (piroguesProvince && piroguesProvince.length > 1) {
          const pirogueIdsProvince = piroguesProvince.map(p => p.id);
          
          // Exclure les pirogues du pêcheur actuel pour la comparaison
          const autresPiroguesIds = pirogueIdsProvince.filter(id => !pirogueIds.includes(id));

          if (autresPiroguesIds.length > 0) {
            // Captures moyennes de la province
            const { data: capturesProvinceData } = await supabase
              .from("captures_pa")
              .select("poids_kg, cpue, pirogue_id")
              .in("pirogue_id", autresPiroguesIds)
              .eq("mois", currentMonth)
              .eq("annee", currentYear);

            if (capturesProvinceData && capturesProvinceData.length > 0) {
              // Grouper par pirogue pour avoir la moyenne par pêcheur
              const capturesParPirogue = new Map<string, { total: number; cpues: number[] }>();
              
              capturesProvinceData.forEach(c => {
                const existing = capturesParPirogue.get(c.pirogue_id) || { total: 0, cpues: [] };
                existing.total += c.poids_kg || 0;
                if (c.cpue) existing.cpues.push(c.cpue);
                capturesParPirogue.set(c.pirogue_id, existing);
              });

              const nbPecheurs = capturesParPirogue.size;
              const totalCapturesProvince = Array.from(capturesParPirogue.values())
                .reduce((sum, val) => sum + val.total, 0);
              
              capturesMoyenneProvince = nbPecheurs > 0 
                ? totalCapturesProvince / nbPecheurs 
                : 0;

              // CPUE moyen de la province
              const tousLesCPUEs = Array.from(capturesParPirogue.values())
                .flatMap(val => val.cpues);
              cpueMoyenProvince = tousLesCPUEs.length > 0
                ? tousLesCPUEs.reduce((a, b) => a + b, 0) / tousLesCPUEs.length
                : 0;

              // Comparaisons
              if (capturesMoyenneProvince > 0) {
                const diffCaptures = ((capturesMois - capturesMoyenneProvince) / capturesMoyenneProvince) * 100;
                comparaisonCaptures = `${diffCaptures > 0 ? '+' : ''}${diffCaptures.toFixed(0)}% vs moyenne provinciale`;
              }

              if (cpueMoyenProvince > 0 && cpueMoyen > 0) {
                const diffCPUE = ((cpueMoyen - cpueMoyenProvince) / cpueMoyenProvince) * 100;
                comparaisonCPUE = `${diffCPUE > 0 ? '+' : ''}${diffCPUE.toFixed(0)}% vs moyenne provinciale`;
              }
            }
          }
        }
      }

      // Calculer le classement provincial
      if (province && piroguesProvince && piroguesProvince.length > 1) {
        const pirogueIdsProvince = piroguesProvince.map(p => p.id);
        
        // Récupérer toutes les captures du mois pour la province avec infos propriétaires
        const { data: capturesProvinceData } = await supabase
          .from("captures_pa")
          .select(`
            poids_kg, 
            cpue, 
            pirogue:pirogues!inner(
              id,
              proprietaire:proprietaires(nom, prenom)
            )
          `)
          .in("pirogue.id", pirogueIdsProvince)
          .eq("mois", currentMonth)
          .eq("annee", currentYear);

        if (capturesProvinceData && capturesProvinceData.length > 0) {
          // Grouper par pirogue
          const statsParPirogue = new Map<string, {
            proprietaireNom: string;
            captures: number;
            cpues: number[];
          }>();

          capturesProvinceData.forEach((c: any) => {
            const pirogueId = c.pirogue?.id;
            if (!pirogueId) return;

            const existing = statsParPirogue.get(pirogueId) || {
              proprietaireNom: c.pirogue?.proprietaire 
                ? `${c.pirogue.proprietaire.prenom} ${c.pirogue.proprietaire.nom}`.trim() 
                : "Non renseigné",
              captures: 0,
              cpues: [],
            };

            existing.captures += c.poids_kg || 0;
            if (c.cpue) existing.cpues.push(c.cpue);
            statsParPirogue.set(pirogueId, existing);
          });

          // Créer le classement
          const classement = Array.from(statsParPirogue.entries()).map(([pirogueId, stats]) => ({
            pirogueId,
            proprietaireNom: stats.proprietaireNom,
            captures: stats.captures,
            cpue: stats.cpues.length > 0 
              ? stats.cpues.reduce((a, b) => a + b, 0) / stats.cpues.length 
              : 0,
            estUtilisateurActuel: pirogueIds.includes(pirogueId),
          }));

          // Trier par captures décroissantes
          classement.sort((a, b) => b.captures - a.captures);

          // Ajouter les rangs
          const classementAvecRangs = classement.map((item, index) => ({
            rang: index + 1,
            ...item,
          }));

          // Ne garder que le top 10 + utilisateur actuel s'il n'est pas dans le top 10
          let classementFinal = classementAvecRangs.slice(0, 10);
          const utilisateurDansTop10 = classementFinal.some(c => c.estUtilisateurActuel);
          
          if (!utilisateurDansTop10) {
            const utilisateurClassement = classementAvecRangs.find(c => c.estUtilisateurActuel);
            if (utilisateurClassement) {
              classementFinal.push(utilisateurClassement);
            }
          }

          setClassementProvince(classementFinal);
        }
      }

      // Calculer l'historique des classements (6 derniers mois)
      const historiqueData: Array<{
        mois: number;
        annee: number;
        rang: number;
        totalPecheurs: number;
        captures: number;
        cpue: number;
      }> = [];

      if (province && piroguesProvince && piroguesProvince.length > 1) {
        const pirogueIdsProvince = piroguesProvince.map(p => p.id);
        
        // Calculer pour les 6 derniers mois
        for (let i = 0; i < 6; i++) {
          let moisCible = currentMonth - i;
          let anneeCible = currentYear;
          
          if (moisCible <= 0) {
            moisCible += 12;
            anneeCible -= 1;
          }

          // Récupérer toutes les captures de ce mois pour la province
          const { data: capturesMois } = await supabase
            .from("captures_pa")
            .select("poids_kg, cpue, pirogue_id")
            .in("pirogue_id", pirogueIdsProvince)
            .eq("mois", moisCible)
            .eq("annee", anneeCible);

          if (capturesMois && capturesMois.length > 0) {
            // Grouper par pirogue
            const statsParPirogue = new Map<string, {
              captures: number;
              cpues: number[];
            }>();

            capturesMois.forEach((c: any) => {
              const existing = statsParPirogue.get(c.pirogue_id) || {
                captures: 0,
                cpues: [],
              };
              existing.captures += c.poids_kg || 0;
              if (c.cpue) existing.cpues.push(c.cpue);
              statsParPirogue.set(c.pirogue_id, existing);
            });

            // Créer le classement du mois
            const classementMois = Array.from(statsParPirogue.entries()).map(([pirogueId, stats]) => ({
              pirogueId,
              captures: stats.captures,
              cpue: stats.cpues.length > 0 
                ? stats.cpues.reduce((a, b) => a + b, 0) / stats.cpues.length 
                : 0,
            }));

            // Trier par captures
            classementMois.sort((a, b) => b.captures - a.captures);

            // Trouver le rang de l'utilisateur actuel
            const rangUtilisateur = classementMois.findIndex(item => 
              pirogueIds.includes(item.pirogueId)
            ) + 1;

            // Capturer les stats de l'utilisateur pour ce mois
            const statsUtilisateur = classementMois.find(item => 
              pirogueIds.includes(item.pirogueId)
            );

            if (rangUtilisateur > 0 && statsUtilisateur) {
              historiqueData.push({
                mois: moisCible,
                annee: anneeCible,
                rang: rangUtilisateur,
                totalPecheurs: classementMois.length,
                captures: statsUtilisateur.captures,
                cpue: statsUtilisateur.cpue,
              });
            }
          }
        }

        // Inverser pour avoir l'ordre chronologique
        historiqueData.reverse();
        setHistoriqueClassement(historiqueData);
      }

      setPecheurStats({
        capturesMois,
        capturesMoisTrend,
        licenceStatut,
        cpueMoyen: Number(cpueMoyen.toFixed(1)),
        cpueTrend: capturesMoisTrend ? `${capturesMoisTrend.replace(/[+-]/, '')} vs mois dernier` : "",
        notifications,
        province,
        capturesMoyenneProvince: Number(capturesMoyenneProvince.toFixed(0)),
        cpueMoyenProvince: Number(cpueMoyenProvince.toFixed(1)),
        comparaisonCaptures,
        comparaisonCPUE,
      });
    } catch (error) {
      console.error("Erreur lors du chargement des données pêcheur:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDashboardContent = () => {
    if (roles.includes('admin')) {
      return {
        title: "Tableau de Bord Administrateur",
        description: "Gestion complète du système et des utilisateurs",
        kpis: [
          { icon: Users, label: "Utilisateurs Actifs", value: "1,234", trend: "+12%" },
          { icon: Fish, label: "Captures Totales", value: "45.8T", trend: "+8%" },
          { icon: FileText, label: "Licences Valides", value: "892", trend: "+5%" },
          { icon: Shield, label: "Missions", value: "156", trend: "+15%" },
        ],
      };
    }
    
    if (roles.includes('ministre')) {
      return {
        title: "Tableau de Bord Exécutif",
        description: "Vue d'ensemble stratégique du secteur halieutique",
        kpis: [
          { icon: TrendingUp, label: "Production Annuelle", value: "125.4T", trend: "+18%" },
          { icon: BarChart3, label: "Exportations", value: "78.2T", trend: "+22%" },
          { icon: Activity, label: "CPUE Moyenne", value: "12.4", trend: "-3%" },
          { icon: AlertTriangle, label: "Infractions", value: "45", trend: "-8%" },
        ],
      };
    }

    if (roles.includes('direction_centrale') || roles.includes('direction_provinciale')) {
      return {
        title: "Tableau de Bord Direction",
        description: "Supervision et validation des opérations",
        kpis: [
          { icon: FileText, label: "Demandes Pending", value: "23", trend: "" },
          { icon: Fish, label: "Captures du Mois", value: "8.2T", trend: "+5%" },
          { icon: Shield, label: "Infractions", value: "12", trend: "-15%" },
          { icon: Users, label: "Pêcheurs Actifs", value: "456", trend: "+3%" },
        ],
      };
    }

    if (roles.includes('pecheur')) {
      return {
        title: "Mes Activités de Pêche",
        description: "Suivi de vos captures et licences",
        kpis: [
          { 
            icon: Fish, 
            label: "Captures ce Mois", 
            value: loading ? "..." : `${pecheurStats.capturesMois}kg`, 
            trend: pecheurStats.capturesMoisTrend 
          },
          { 
            icon: FileText, 
            label: "Licence", 
            value: loading ? "..." : pecheurStats.licenceStatut, 
            trend: "" 
          },
          { 
            icon: Activity, 
            label: "CPUE Moyen", 
            value: loading ? "..." : pecheurStats.cpueMoyen.toString(), 
            trend: pecheurStats.cpueTrend 
          },
          { 
            icon: AlertTriangle, 
            label: "Notifications", 
            value: loading ? "..." : pecheurStats.notifications.toString(), 
            trend: "" 
          },
        ],
      };
    }

    return {
      title: "Tableau de Bord",
      description: "Bienvenue sur la plateforme PÊCHE GABON",
      kpis: [
        { icon: Fish, label: "Captures", value: "0", trend: "" },
        { icon: FileText, label: "Documents", value: "0", trend: "" },
        { icon: Users, label: "Équipe", value: "0", trend: "" },
        { icon: BarChart3, label: "Statistiques", value: "0", trend: "" },
      ],
    };
  };

  const content = getDashboardContent();

  if (loading && isPecheur) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {isPecheur ? (
        <PecheurNav />
      ) : (
        <header className="border-b bg-card shadow-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fish className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">PÊCHE GABON</h1>
                <p className="text-sm text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <Badge key={role} variant="secondary" className={roleColors[role]}>
                    {roleLabels[role]}
                  </Badge>
                ))}
              </div>
              <ThemeToggle />
              {roles.includes('admin') && (
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin")}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">{content.title}</h2>
          <p className="text-muted-foreground">{content.description}</p>
        </div>

        {/* KPIs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {content.kpis.map((kpi, index) => (
            <Card key={index} className="shadow-card hover:shadow-elevated transition-all">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <kpi.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.trend && (
                  <p className={`text-xs ${kpi.trend.startsWith('+') ? 'text-green-600' : kpi.trend.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {kpi.trend}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Comparaison Provinciale */}
        {isPecheur && pecheurStats.province && pecheurStats.capturesMoyenneProvince > 0 && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>Comparaison Province: {pecheurStats.province}</CardTitle>
              <CardDescription>
                Vos performances comparées à la moyenne des pêcheurs de votre province
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Vos captures ce mois</span>
                    <span className="text-lg font-bold">{pecheurStats.capturesMois} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Moyenne provinciale</span>
                    <span className="text-lg font-semibold text-muted-foreground">
                      {pecheurStats.capturesMoyenneProvince} kg
                    </span>
                  </div>
                  {pecheurStats.comparaisonCaptures && (
                    <div className={`text-sm font-medium ${pecheurStats.comparaisonCaptures.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {pecheurStats.comparaisonCaptures}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Votre CPUE moyen</span>
                    <span className="text-lg font-bold">{pecheurStats.cpueMoyen}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">CPUE moyen provincial</span>
                    <span className="text-lg font-semibold text-muted-foreground">
                      {pecheurStats.cpueMoyenProvince}
                    </span>
                  </div>
                  {pecheurStats.comparaisonCPUE && (
                    <div className={`text-sm font-medium ${pecheurStats.comparaisonCPUE.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                      {pecheurStats.comparaisonCPUE}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Classement Provincial */}
        {isPecheur && classementProvince.length > 0 && pecheurStats.province && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>Classement Province: {pecheurStats.province}</CardTitle>
              <CardDescription>
                Top 10 des pêcheurs du mois en cours basé sur les captures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {classementProvince.map((item) => (
                  <div
                    key={item.rang}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      item.estUtilisateurActuel 
                        ? 'bg-primary/10 border-2 border-primary' 
                        : 'bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        item.rang === 1 ? 'bg-yellow-500 text-white' :
                        item.rang === 2 ? 'bg-gray-400 text-white' :
                        item.rang === 3 ? 'bg-orange-600 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {item.rang}
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${item.estUtilisateurActuel ? 'text-primary' : ''}`}>
                          {item.proprietaireNom}
                          {item.estUtilisateurActuel && ' (Vous)'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-right">
                      <div>
                        <p className="text-sm text-muted-foreground">Captures</p>
                        <p className="text-lg font-bold">{item.captures.toFixed(0)} kg</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CPUE</p>
                        <p className="text-lg font-bold">{item.cpue.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Historique des Classements Mensuels */}
        {isPecheur && historiqueClassement.length > 0 && pecheurStats.province && (
          <Card className="shadow-card mb-8">
            <CardHeader>
              <CardTitle>Historique des Classements - {pecheurStats.province}</CardTitle>
              <CardDescription>
                Évolution de votre position dans le classement provincial sur les 6 derniers mois
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {historiqueClassement.map((item, index) => {
                  const moisNom = new Date(item.annee, item.mois - 1).toLocaleDateString('fr-FR', { 
                    month: 'long', 
                    year: 'numeric' 
                  });
                  
                  // Calculer la tendance par rapport au mois précédent
                  let tendance = "";
                  let tendanceColor = "text-muted-foreground";
                  if (index > 0) {
                    const rangPrecedent = historiqueClassement[index - 1].rang;
                    const diff = rangPrecedent - item.rang;
                    if (diff > 0) {
                      tendance = `↑ +${diff}`;
                      tendanceColor = "text-green-600";
                    } else if (diff < 0) {
                      tendance = `↓ ${diff}`;
                      tendanceColor = "text-red-600";
                    } else {
                      tendance = "→ =";
                      tendanceColor = "text-muted-foreground";
                    }
                  }

                  return (
                    <div
                      key={`${item.annee}-${item.mois}`}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 border-2 border-primary">
                          <span className="text-lg font-bold text-primary">#{item.rang}</span>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold capitalize">{moisNom}</p>
                          <p className="text-sm text-muted-foreground">
                            Sur {item.totalPecheurs} pêcheurs
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-6 items-center">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Captures</p>
                          <p className="text-lg font-bold">{item.captures.toFixed(0)} kg</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">CPUE</p>
                          <p className="text-lg font-bold">{item.cpue.toFixed(1)}</p>
                        </div>
                        {tendance && (
                          <div className="text-right min-w-[60px]">
                            <p className="text-sm text-muted-foreground">Position</p>
                            <p className={`text-lg font-bold ${tendanceColor}`}>
                              {tendance}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accédez rapidement aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.includes('pecheur') && (
              <>
                <Button 
                  className="h-24 flex flex-col gap-2" 
                  variant="outline"
                  onClick={() => navigate("/captures")}
                >
                  <Fish className="h-6 w-6" />
                  Déclarer une Capture
                </Button>
                <Button 
                  className="h-24 flex flex-col gap-2" 
                  variant="outline"
                  onClick={() => navigate("/mon-compte")}
                >
                  <Users className="h-6 w-6" />
                  Mon Compte
                </Button>
              </>
            )}
            {(roles.includes('agent_collecte') || roles.includes('admin')) && (
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <FileText className="h-6 w-6" />
                Nouvelle Licence
              </Button>
            )}
            {(roles.includes('inspecteur') || roles.includes('admin')) && (
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <Shield className="h-6 w-6" />
                Mission de Surveillance
              </Button>
            )}
            {(roles.includes('analyste') || roles.includes('direction_centrale') || roles.includes('admin')) && (
              <Button className="h-24 flex flex-col gap-2" variant="outline">
                <BarChart3 className="h-6 w-6" />
                Rapports & Analytics
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
