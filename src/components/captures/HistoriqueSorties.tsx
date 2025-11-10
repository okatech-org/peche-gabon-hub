import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, MapPin, Anchor, TrendingUp, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SortieTerminee {
  id: string;
  date_depart: string;
  heure_depart: string;
  date_retour: string;
  heure_retour: string;
  effort_unite: number;
  pirogue: { nom: string };
  site: { nom: string; province?: string };
}

interface Statistiques {
  totalSorties: number;
  dureeToaleMoyenne: number;
  effortTotal: number;
  sitesPlusFrequentes: { nom: string; count: number; province?: string }[];
}

export const HistoriqueSorties = () => {
  const { user } = useAuth();
  const [sorties, setSorties] = useState<SortieTerminee[]>([]);
  const [stats, setStats] = useState<Statistiques | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistorique();
    }
  }, [user]);

  const loadHistorique = async () => {
    try {
      setLoading(true);

      // Charger les sorties terminées
      const { data: sortiesData, error: sortiesError } = await supabase
        .from("sorties_peche")
        .select(`
          id,
          date_depart,
          heure_depart,
          date_retour,
          heure_retour,
          effort_unite,
          pirogues!inner(nom),
          sites!inner(nom, province)
        `)
        .eq("pecheur_id", user!.id)
        .not("date_retour", "is", null)
        .order("date_depart", { ascending: false })
        .limit(20);

      if (sortiesError) throw sortiesError;

      const formattedSorties = (sortiesData || []).map((s: any) => ({
        id: s.id,
        date_depart: s.date_depart,
        heure_depart: s.heure_depart,
        date_retour: s.date_retour,
        heure_retour: s.heure_retour,
        effort_unite: s.effort_unite || 0,
        pirogue: { nom: s.pirogues?.nom || "N/A" },
        site: { nom: s.sites?.nom || "N/A", province: s.sites?.province },
      }));

      setSorties(formattedSorties);

      // Calculer les statistiques
      if (formattedSorties.length > 0) {
        const totalSorties = formattedSorties.length;
        const effortTotal = formattedSorties.reduce((sum, s) => sum + s.effort_unite, 0);
        const dureeToaleMoyenne = effortTotal / totalSorties;

        // Sites les plus fréquentés
        const sitesCount: Record<string, { count: number; province?: string }> = {};
        formattedSorties.forEach((s) => {
          const siteName = s.site.nom;
          if (!sitesCount[siteName]) {
            sitesCount[siteName] = { count: 0, province: s.site.province };
          }
          sitesCount[siteName].count++;
        });

        const sitesPlusFrequentes = Object.entries(sitesCount)
          .map(([nom, data]) => ({ nom, count: data.count, province: data.province }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setStats({
          totalSorties,
          dureeToaleMoyenne,
          effortTotal,
          sitesPlusFrequentes,
        });
      }
    } catch (error) {
      console.error("Erreur chargement historique:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des Sorties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats || sorties.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des Sorties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Aucune sortie terminée pour le moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sorties</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSorties}</div>
            <p className="text-xs text-muted-foreground">sorties terminées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Effort Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.effortTotal.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              ~{stats.dureeToaleMoyenne.toFixed(1)}h par sortie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Préféré</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold truncate">{stats.sitesPlusFrequentes[0]?.nom}</div>
            <p className="text-xs text-muted-foreground">
              {stats.sitesPlusFrequentes[0]?.count} sorties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sites les plus fréquentés */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Sites les Plus Fréquentés
          </CardTitle>
          <CardDescription>Top 5 des sites de pêche</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.sitesPlusFrequentes.map((site, index) => (
              <div key={site.nom} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant={index === 0 ? "default" : "secondary"}>#{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{site.nom}</p>
                    {site.province && (
                      <p className="text-xs text-muted-foreground">{site.province}</p>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{site.count} sorties</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historique détaillé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Anchor className="h-5 w-5" />
            Historique Détaillé
          </CardTitle>
          <CardDescription>Les 20 dernières sorties terminées</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Pirogue</TableHead>
                <TableHead>Site</TableHead>
                <TableHead className="text-right">Effort (h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorties.map((sortie) => (
                <TableRow key={sortie.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{sortie.date_depart}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(sortie.date_depart), {
                          addSuffix: true,
                          locale: fr,
                        })}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{sortie.pirogue.nom}</TableCell>
                  <TableCell>
                    <div>
                      <p>{sortie.site.nom}</p>
                      {sortie.site.province && (
                        <p className="text-xs text-muted-foreground">{sortie.site.province}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {sortie.effort_unite.toFixed(2)}h
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
