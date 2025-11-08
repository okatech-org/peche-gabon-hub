import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Sparkles,
  Calendar,
  MapPin,
  User,
  FileText,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { GenerateSyntheseDialog } from "./GenerateSyntheseDialog";

interface Remontee {
  id: string;
  numero_reference: string;
  type_remontee: string;
  titre: string;
  description: string;
  source?: string;
  url_source?: string;
  localisation?: string;
  niveau_priorite: string;
  statut: string;
  sentiment?: string;
  categorie?: string;
  created_at: string;
  date_incident?: string;
  impact_estime?: string;
  nb_personnes_concernees?: number;
}

interface RemonteeTypeDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeId: string;
  typeLabel: string;
  remontees: Remontee[];
}

export function RemonteeTypeDetailDialog({
  open,
  onOpenChange,
  typeId,
  typeLabel,
  remontees,
}: RemonteeTypeDetailDialogProps) {
  const [selectedTab, setSelectedTab] = useState("liste");

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case "nouveau":
        return "bg-blue-500";
      case "en_analyse":
        return "bg-yellow-500";
      case "en_traitement":
        return "bg-orange-500";
      case "resolu":
        return "bg-green-500";
      case "rejete":
        return "bg-red-500";
      case "archive":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "urgent":
        return "destructive";
      case "haute":
        return "default";
      case "moyenne":
        return "secondary";
      case "basse":
        return "outline";
      default:
        return "outline";
    }
  };

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case "positif":
        return "😊";
      case "neutre":
        return "😐";
      case "negatif":
        return "😞";
      default:
        return "";
    }
  };

  // Statistiques par statut
  const statsByStatus = remontees.reduce((acc, r) => {
    acc[r.statut] = (acc[r.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Statistiques par priorité
  const statsByPriority = remontees.reduce((acc, r) => {
    acc[r.niveau_priorite] = (acc[r.niveau_priorite] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const remonteeIds = remontees.map((r) => r.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{typeLabel}</DialogTitle>
          <DialogDescription>
            Analyse détaillée des remontées de type "{typeLabel}" ({remontees.length} remontée
            {remontees.length > 1 ? "s" : ""})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Actions rapides */}
          <div className="flex gap-2 flex-wrap">
            <GenerateSyntheseDialog remonteeIds={remonteeIds} onSuccess={() => {}} />
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exporter CSV
            </Button>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatutColor("nouveau")}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Nouveau</p>
                    <p className="text-xl font-bold">{statsByStatus["nouveau"] || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatutColor("en_analyse")}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">En analyse</p>
                    <p className="text-xl font-bold">{statsByStatus["en_analyse"] || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatutColor("en_traitement")}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">En traitement</p>
                    <p className="text-xl font-bold">{statsByStatus["en_traitement"] || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatutColor("resolu")}`} />
                  <div>
                    <p className="text-xs text-muted-foreground">Résolu</p>
                    <p className="text-xl font-bold">{statsByStatus["resolu"] || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="liste">Liste détaillée</TabsTrigger>
              <TabsTrigger value="synthese">Synthèse</TabsTrigger>
            </TabsList>

            <TabsContent value="liste" className="space-y-3 mt-4">
              {remontees.map((remontee) => (
                <Card key={remontee.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline">{remontee.numero_reference}</Badge>
                            <Badge variant={getPrioriteColor(remontee.niveau_priorite)}>
                              {remontee.niveau_priorite}
                            </Badge>
                            <div className={`w-2 h-2 rounded-full ${getStatutColor(remontee.statut)}`} />
                            {remontee.sentiment && (
                              <span className="text-sm">{getSentimentIcon(remontee.sentiment)}</span>
                            )}
                          </div>
                          <h4 className="font-semibold text-lg">{remontee.titre}</h4>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-sm text-muted-foreground">{remontee.description}</p>

                      {/* Meta info */}
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {remontee.localisation && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {remontee.localisation}
                          </div>
                        )}
                        {remontee.date_incident && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(remontee.date_incident).toLocaleDateString("fr-FR")}
                          </div>
                        )}
                        {remontee.source && (
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {remontee.source}
                          </div>
                        )}
                        {remontee.nb_personnes_concernees && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {remontee.nb_personnes_concernees} personnes
                          </div>
                        )}
                      </div>

                      {/* Impact estimé */}
                      {remontee.impact_estime && (
                        <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                                Impact estimé
                              </p>
                              <p className="text-xs text-amber-700 dark:text-amber-200">
                                {remontee.impact_estime}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="synthese" className="space-y-4 mt-4">
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Répartition par priorité</h4>
                    <div className="space-y-2">
                      {Object.entries(statsByPriority).map(([priorite, count]) => (
                        <div key={priorite} className="flex items-center justify-between">
                          <Badge variant={getPrioriteColor(priorite)}>{priorite}</Badge>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Répartition par statut</h4>
                    <div className="space-y-2">
                      {Object.entries(statsByStatus).map(([statut, count]) => (
                        <div key={statut} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatutColor(statut)}`} />
                            <span className="text-sm">{statut.replace("_", " ")}</span>
                          </div>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h4 className="font-semibold mb-1">Analyse</h4>
                        <p className="text-sm text-muted-foreground">
                          Sur {remontees.length} remontées de type "{typeLabel}", {statsByStatus["nouveau"] || 0} nécessitent
                          une attention immédiate. {statsByPriority["urgent"] || 0} sont marquées comme urgentes.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
