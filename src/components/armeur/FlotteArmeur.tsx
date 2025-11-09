import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ship } from "lucide-react";
import { toast } from "sonner";

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
}

interface Armement {
  id: string;
  nom: string;
  responsable: string;
  telephone: string;
  email: string;
  user_id: string;
}

export function FlotteArmeur() {
  const [loading, setLoading] = useState(true);
  const [armement, setArmement] = useState<Armement | null>(null);
  const [navires, setNavires] = useState<Navire[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Charger l'armement de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié");

      const { data: armementData, error: armementError } = await supabase
        .from("armements")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (armementError) {
        if (armementError.code === 'PGRST116') {
          toast.error("Aucun armement associé à votre compte");
          return;
        }
        throw armementError;
      }

      setArmement(armementData);

      // Charger les navires de cet armement
      const { data: naviresData, error: naviresError } = await supabase
        .from("navires")
        .select("*")
        .eq("armement_id", armementData.id)
        .order("nom");

      if (naviresError) throw naviresError;

      setNavires(naviresData || []);
    } catch (error) {
      console.error("Erreur lors du chargement:", error);
      toast.error("Erreur lors du chargement des données");
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

  if (!armement) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">
            Aucun armement associé à votre compte. Veuillez contacter l'administration.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Informations de l'armement */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'Armement</CardTitle>
          <CardDescription>Détails de votre entreprise</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Nom de l'armement</p>
            <p className="font-medium">{armement.nom}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Responsable</p>
            <p className="font-medium">{armement.responsable || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Téléphone</p>
            <p className="font-medium">{armement.telephone || "-"}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{armement.email || "-"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Liste des navires */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Vos Navires ({navires.length})
          </CardTitle>
          <CardDescription>Liste de vos navires enregistrés</CardDescription>
        </CardHeader>
        <CardContent>
          {navires.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">
              Aucun navire enregistré
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Navire</TableHead>
                    <TableHead>Matricule</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Pavillon</TableHead>
                    <TableHead>Port d'attache</TableHead>
                    <TableHead className="text-right">Tonnage (TJB)</TableHead>
                    <TableHead className="text-right">Puissance (KW)</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {navires.map((navire) => (
                    <TableRow key={navire.id}>
                      <TableCell className="font-medium">{navire.nom}</TableCell>
                      <TableCell>{navire.matricule}</TableCell>
                      <TableCell>{navire.type_navire}</TableCell>
                      <TableCell>{navire.pavillon}</TableCell>
                      <TableCell>{navire.port_attache}</TableCell>
                      <TableCell className="text-right">
                        {navire.jauge_brute?.toLocaleString() || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {navire.puissance_moteur_kw?.toLocaleString() || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={navire.statut === "active" ? "default" : "secondary"}>
                          {navire.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
