import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Ship, Anchor, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Navire {
  id: string;
  nom: string;
  matricule: string;
  type_navire: string;
  pavillon: string;
  port_attache: string;
  statut: string;
  jauge_brute: number;
  puissance_moteur_kw: number;
  armement?: {
    nom: string;
  };
}

interface Armement {
  id: string;
  nom: string;
  responsable: string;
  telephone: string;
  email: string;
  statut: string;
}

export function IndustrialFleetOverview() {
  const [loading, setLoading] = useState(true);
  const [navires, setNavires] = useState<Navire[]>([]);
  const [armements, setArmements] = useState<Armement[]>([]);
  const [stats, setStats] = useState({
    totalNavires: 0,
    naviresActifs: 0,
    naviresInactifs: 0,
    armementsActifs: 0,
    tonnageTotal: 0,
    puissanceTotal: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger les navires avec leurs armements séparément
      const { data: naviresData, error: naviresError } = await supabase
        .from("navires")
        .select("*")
        .order("nom");

      if (naviresError) throw naviresError;

      // Charger les armements
      const { data: armementsData, error: armementsError } = await supabase
        .from("armements")
        .select("*")
        .order("nom");

      if (armementsError) throw armementsError;

      // Créer un map des armements
      const armementsMap = new Map(
        (armementsData || []).map(a => [a.id, a])
      );

      // Joindre manuellement les données
      const naviresAvecArmements = (naviresData || []).map(navire => ({
        ...navire,
        armement: navire.armement_id ? armementsMap.get(navire.armement_id) : undefined
      }));

      setNavires(naviresAvecArmements as any);
      setArmements(armementsData || []);

      // Calculer les statistiques
      const naviresActifs = (naviresData || []).filter(n => n.statut === 'active');
      const naviresInactifs = (naviresData || []).filter(n => n.statut !== 'active');
      const armementsActifs = (armementsData || []).filter(a => a.statut === 'active');
      
      const tonnageTotal = (naviresData || []).reduce((sum, n) => sum + (n.jauge_brute || 0), 0);
      const puissanceTotal = (naviresData || []).reduce((sum, n) => sum + (n.puissance_moteur_kw || 0), 0);

      setStats({
        totalNavires: (naviresData || []).length,
        naviresActifs: naviresActifs.length,
        naviresInactifs: naviresInactifs.length,
        armementsActifs: armementsActifs.length,
        tonnageTotal,
        puissanceTotal,
      });
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Ship className="h-4 w-4" />
              Flotte Totale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNavires}</div>
            <p className="text-xs text-muted-foreground">Navires enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.naviresActifs}</div>
            <p className="text-xs text-muted-foreground">En exploitation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              Inactifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.naviresInactifs}</div>
            <p className="text-xs text-muted-foreground">Hors service</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Anchor className="h-4 w-4" />
              Armements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.armementsActifs}</div>
            <p className="text-xs text-muted-foreground">Entreprises actives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tonnage Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tonnageTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">TJB cumulés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Puissance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.puissanceTotal.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">KW totaux</p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets détaillés */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="navires" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="navires">
                <Ship className="h-4 w-4 mr-2" />
                Flotte Industrielle
              </TabsTrigger>
              <TabsTrigger value="armements">
                <Anchor className="h-4 w-4 mr-2" />
                Armements
              </TabsTrigger>
            </TabsList>

            <TabsContent value="navires" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Navire</TableHead>
                      <TableHead>Matricule</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Pavillon</TableHead>
                      <TableHead>Port d'attache</TableHead>
                      <TableHead>Armement</TableHead>
                      <TableHead className="text-right">Tonnage (TJB)</TableHead>
                      <TableHead className="text-right">Puissance (KW)</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {navires.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center text-muted-foreground">
                          Aucun navire enregistré
                        </TableCell>
                      </TableRow>
                    ) : (
                      navires.map((navire) => (
                        <TableRow key={navire.id}>
                          <TableCell className="font-medium">{navire.nom}</TableCell>
                          <TableCell>{navire.matricule}</TableCell>
                          <TableCell>{navire.type_navire}</TableCell>
                          <TableCell>{navire.pavillon}</TableCell>
                          <TableCell>{navire.port_attache}</TableCell>
                          <TableCell>{navire.armement?.nom || "-"}</TableCell>
                          <TableCell className="text-right">
                            {navire.jauge_brute?.toLocaleString() || "-"}
                          </TableCell>
                          <TableCell className="text-right">
                            {navire.puissance_moteur_kw?.toLocaleString() || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={navire.statut === "active" ? "default" : "secondary"}
                            >
                              {navire.statut}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="armements" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Armement</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Téléphone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Navires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {armements.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          Aucun armement enregistré
                        </TableCell>
                      </TableRow>
                    ) : (
                      armements.map((armement) => {
                        const nbNavires = navires.filter(
                          n => n.armement?.nom === armement.nom
                        ).length;
                        
                        return (
                          <TableRow key={armement.id}>
                            <TableCell className="font-medium">{armement.nom}</TableCell>
                            <TableCell>{armement.responsable || "-"}</TableCell>
                            <TableCell>{armement.telephone || "-"}</TableCell>
                            <TableCell>{armement.email || "-"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={armement.statut === "active" ? "default" : "secondary"}
                              >
                                {armement.statut}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {nbNavires}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
