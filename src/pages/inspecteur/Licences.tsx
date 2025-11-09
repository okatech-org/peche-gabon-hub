import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRScanner } from "@/components/inspecteur/QRScanner";
import { supabase } from "@/integrations/supabase/client";
import { Search, QrCode, CheckCircle, XCircle, Clock, History } from "lucide-react";
import { toast } from "@/lib/toast";
import { format, isPast, isFuture, isWithinInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";

interface Licence {
  id: string;
  numero: string;
  date_debut: string;
  date_fin: string;
  statut: string;
  annee: number;
  montant_total: number;
  especes_cibles: string[];
  engins_autorises: string[];
  pirogue_id: string;
  pirogues?: {
    immatriculation: string;
    nom: string;
    proprietaires?: {
      nom: string;
      prenom: string;
    };
  };
}

interface Controle {
  id: string;
  date_controle: string;
  infraction: boolean;
  observations: string | null;
  type_infraction: string | null;
}

export default function Licences() {
  const [searchTerm, setSearchTerm] = useState("");
  const [licences, setLicences] = useState<Licence[]>([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedLicence, setSelectedLicence] = useState<Licence | null>(null);
  const [controleHistory, setControleHistory] = useState<Controle[]>([]);

  useEffect(() => {
    loadLicences();
  }, []);

  const loadLicences = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("licences")
        .select(`
          *,
          pirogues (
            immatriculation,
            nom,
            proprietaires (
              nom,
              prenom
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLicences(data || []);
    } catch (error: any) {
      toast.error("Erreur de chargement", error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadControleHistory = async (pirogueId: string) => {
    try {
      const { data, error } = await supabase
        .from("controles_surveillance")
        .select("id, date_controle, infraction, observations, type_infraction")
        .eq("pirogue_id", pirogueId)
        .order("date_controle", { ascending: false })
        .limit(10);

      if (error) throw error;
      setControleHistory(data || []);
    } catch (error: any) {
      toast.error("Erreur", "Impossible de charger l'historique");
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    setShowScanner(false);
    
    // Le QR code peut contenir soit le numéro de licence, soit l'ID
    const licence = licences.find(
      (l) => l.numero === decodedText || l.id === decodedText
    );

    if (licence) {
      setSelectedLicence(licence);
      await loadControleHistory(licence.pirogue_id);
      toast.success("Licence trouvée", `Licence N° ${licence.numero}`);
    } else {
      toast.error("Licence introuvable", "Aucune licence ne correspond à ce QR code");
    }
  };

  const getValidityStatus = (licence: Licence) => {
    const now = new Date();
    const dateDebut = new Date(licence.date_debut);
    const dateFin = new Date(licence.date_fin);

    if (licence.statut !== "validee") {
      return { label: "Non validée", variant: "secondary" as const, icon: Clock };
    }

    if (isPast(dateFin)) {
      return { label: "Expirée", variant: "destructive" as const, icon: XCircle };
    }

    if (isFuture(dateDebut)) {
      return { label: "Pas encore active", variant: "secondary" as const, icon: Clock };
    }

    if (isWithinInterval(now, { start: dateDebut, end: dateFin })) {
      return { label: "Valide", variant: "default" as const, icon: CheckCircle };
    }

    return { label: "Non valide", variant: "destructive" as const, icon: XCircle };
  };

  const filteredLicences = licences.filter((licence) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      licence.numero.toLowerCase().includes(searchLower) ||
      licence.pirogues?.immatriculation?.toLowerCase().includes(searchLower) ||
      licence.pirogues?.nom?.toLowerCase().includes(searchLower) ||
      licence.pirogues?.proprietaires?.nom?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <TableSkeleton rows={8} columns={6} />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vérification des Licences</h1>
          <p className="text-muted-foreground">
            Rechercher et vérifier la validité des licences de pêche
          </p>
        </div>
        <Button onClick={() => setShowScanner(true)} size="lg">
          <QrCode className="mr-2 h-5 w-5" />
          Scanner QR Code
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recherche de licences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Numéro de licence, immatriculation, nom du propriétaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Licence</TableHead>
                <TableHead>Pirogue</TableHead>
                <TableHead>Propriétaire</TableHead>
                <TableHead>Validité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLicences.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucune licence trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredLicences.map((licence) => {
                  const status = getValidityStatus(licence);
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={licence.id}>
                      <TableCell className="font-medium">{licence.numero}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{licence.pirogues?.nom}</div>
                          <div className="text-sm text-muted-foreground">
                            {licence.pirogues?.immatriculation}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {licence.pirogues?.proprietaires?.nom}{" "}
                        {licence.pirogues?.proprietaires?.prenom}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>Du {format(new Date(licence.date_debut), "dd/MM/yyyy", { locale: fr })}</div>
                          <div>Au {format(new Date(licence.date_fin), "dd/MM/yyyy", { locale: fr })}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setSelectedLicence(licence);
                            await loadControleHistory(licence.pirogue_id);
                          }}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Licence Details Dialog */}
      <Dialog open={!!selectedLicence} onOpenChange={() => setSelectedLicence(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de la Licence</DialogTitle>
          </DialogHeader>

          {selectedLicence && (
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">Informations</TabsTrigger>
                <TabsTrigger value="history">
                  <History className="h-4 w-4 mr-2" />
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">N° Licence</h4>
                    <p className="text-lg font-semibold">{selectedLicence.numero}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Statut</h4>
                    <Badge variant={getValidityStatus(selectedLicence).variant} className="mt-1">
                      {getValidityStatus(selectedLicence).label}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Période de validité</h4>
                    <p>
                      {format(new Date(selectedLicence.date_debut), "dd MMMM yyyy", { locale: fr })}
                      {" - "}
                      {format(new Date(selectedLicence.date_fin), "dd MMMM yyyy", { locale: fr })}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Montant</h4>
                    <p className="text-lg font-semibold">
                      {selectedLicence.montant_total.toLocaleString()} FCFA
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Pirogue</h4>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-sm text-muted-foreground">Nom:</span>
                          <p className="font-medium">{selectedLicence.pirogues?.nom}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">Immatriculation:</span>
                          <p className="font-medium">{selectedLicence.pirogues?.immatriculation}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-sm text-muted-foreground">Propriétaire:</span>
                          <p className="font-medium">
                            {selectedLicence.pirogues?.proprietaires?.nom}{" "}
                            {selectedLicence.pirogues?.proprietaires?.prenom}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedLicence.especes_cibles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Espèces autorisées
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLicence.especes_cibles.map((espece, idx) => (
                        <Badge key={idx} variant="outline">
                          {espece}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedLicence.engins_autorises.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Engins autorisés
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLicence.engins_autorises.map((engin, idx) => (
                        <Badge key={idx} variant="outline">
                          {engin}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history">
                <div className="space-y-3">
                  <h4 className="font-medium">Historique des contrôles</h4>
                  {controleHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Aucun contrôle enregistré pour cette pirogue
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {controleHistory.map((controle) => (
                        <Card key={controle.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant={controle.infraction ? "destructive" : "default"}>
                                    {controle.infraction ? "Infraction" : "Conforme"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {format(new Date(controle.date_controle), "dd MMMM yyyy à HH:mm", {
                                      locale: fr,
                                    })}
                                  </span>
                                </div>
                                {controle.type_infraction && (
                                  <p className="text-sm font-medium text-destructive">
                                    {controle.type_infraction}
                                  </p>
                                )}
                                {controle.observations && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {controle.observations}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
