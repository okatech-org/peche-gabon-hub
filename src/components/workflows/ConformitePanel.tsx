import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, CheckCircle, Shield, TrendingUp, FileText } from "lucide-react";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { StatCardsSkeleton } from "@/components/skeletons/StatCardsSkeleton";

interface ConformiteStats {
  totalControles: number;
  conformes: number;
  nonConformes: number;
  tauxConformite: number;
  infractions: number;
}

interface Controle {
  id: string;
  date_controle: string;
  infraction: boolean;
  type_infraction?: string;
  categorie_infraction?: string;
  observations?: string;
}

export function ConformitePanel() {
  const [stats, setStats] = useState<ConformiteStats>({
    totalControles: 0,
    conformes: 0,
    nonConformes: 0,
    tauxConformite: 0,
    infractions: 0,
  });
  const [controles, setControles] = useState<Controle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConformiteData();
  }, []);

  const loadConformiteData = async () => {
    try {
      // Charger les contrôles de surveillance
      const { data: controlesData, error } = await supabase
        .from("controles_surveillance")
        .select("*")
        .order("date_controle", { ascending: false })
        .limit(10);

      if (error) throw error;

      const controlesList = controlesData || [];
      setControles(controlesList);

      // Calculer les statistiques
      const totalControles = controlesList.length;
      const nonConformes = controlesList.filter((c) => c.infraction).length;
      const conformes = totalControles - nonConformes;
      const tauxConformite = totalControles > 0 
        ? Math.round((conformes / totalControles) * 100)
        : 0;

      // Compter les types d'infractions
      const infractions = controlesList.filter(
        (c) => c.infraction && c.type_infraction
      ).length;

      setStats({
        totalControles,
        conformes,
        nonConformes,
        tauxConformite,
        infractions,
      });
    } catch (error) {
      console.error("Erreur chargement conformité:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <StatCardsSkeleton count={4} />
        <TableSkeleton rows={10} columns={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs Conformité */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              Contrôles Effectués
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats.totalControles}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Conformes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.conformes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Non Conformes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats.nonConformes}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-600" />
              Taux de Conformité
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats.tauxConformite}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barre de progression globale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Conformité Globale au Code des Pêches
          </CardTitle>
          <CardDescription>
            Application de la Loi n°015/2005 - Taux de conformité réglementaire
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Objectif: 95%</span>
              <span className="font-bold">{stats.tauxConformite}%</span>
            </div>
            <Progress value={stats.tauxConformite} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Infractions Relevées</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.infractions}
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Sanctions Appliquées</div>
              <div className="text-2xl font-bold text-amber-600">
                {controles.filter((c) => c.infraction).length}
              </div>
            </div>
            <div className="p-3 border rounded-lg bg-muted/50">
              <div className="text-sm text-muted-foreground">Taux de Résolution</div>
              <div className="text-2xl font-bold text-green-600">
                {stats.infractions > 0 
                  ? Math.round((stats.conformes / stats.totalControles) * 100)
                  : 0}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des contrôles récents */}
      <Card>
        <CardHeader>
          <CardTitle>Contrôles Récents</CardTitle>
          <CardDescription>10 derniers contrôles de surveillance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Type d'Infraction</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Observations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {controles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Aucun contrôle enregistré
                    </TableCell>
                  </TableRow>
                ) : (
                  controles.map((controle) => (
                    <TableRow key={controle.id}>
                      <TableCell>
                        {new Date(controle.date_controle).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        {controle.infraction ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Infraction
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Conforme
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {controle.type_infraction || "N/A"}
                      </TableCell>
                      <TableCell>
                        {controle.categorie_infraction || "N/A"}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {controle.observations || "Aucune"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
