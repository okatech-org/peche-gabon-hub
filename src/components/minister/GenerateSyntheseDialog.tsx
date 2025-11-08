import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GenerateSyntheseDialogProps {
  remonteeIds: string[];
  onSuccess?: () => void;
}

export function GenerateSyntheseDialog({ remonteeIds, onSuccess }: GenerateSyntheseDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [titre, setTitre] = useState("");
  const [periodeDebut, setPeriodeDebut] = useState("");
  const [periodeFin, setPeriodeFin] = useState("");
  const [synthese, setSynthese] = useState<any>(null);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!titre || !periodeDebut || !periodeFin) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    if (remonteeIds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins une remontée",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Récupérer les remontées sélectionnées
      const { data: remontees, error: fetchError } = await supabase
        .from("remontees_terrain")
        .select("*")
        .in("id", remonteeIds);

      if (fetchError) throw fetchError;

      // Appeler la fonction edge pour générer la synthèse
      const { data: syntheseData, error: functionError } = await supabase.functions.invoke(
        "generer-synthese-remontees",
        {
          body: {
            remontees,
            periode_debut: periodeDebut,
            periode_fin: periodeFin,
            titre,
          },
        }
      );

      if (functionError) throw functionError;

      if (!syntheseData.success) {
        throw new Error(syntheseData.error || "Erreur lors de la génération");
      }

      setSynthese(syntheseData.synthese);

      // Sauvegarder la synthèse dans la base de données
      const { data: userData } = await supabase.auth.getUser();
      
      const { data: savedSynthese, error: saveError } = await supabase
        .from("syntheses_remontees")
        .insert({
          titre,
          periode_debut: periodeDebut,
          periode_fin: periodeFin,
          types_remontees: [...new Set(remontees?.map(r => r.type_remontee) || [])],
          categories: [...new Set(remontees?.map(r => r.categorie).filter(Boolean) || [])],
          nombre_remontees: remontees?.length || 0,
          synthese_texte: syntheseData.synthese.synthese_texte,
          points_cles: syntheseData.synthese.points_cles,
          recommandations: syntheseData.synthese.recommandations,
          tendances: syntheseData.synthese.tendances,
          genere_par: userData.user?.id,
          genere_automatiquement: true,
          statut: "brouillon",
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Lier les remontées à la synthèse
      if (savedSynthese) {
        const links = remonteeIds.map(remonteeId => ({
          remontee_id: remonteeId,
          synthese_id: savedSynthese.id,
        }));

        const { error: linkError } = await supabase
          .from("remontees_syntheses")
          .insert(links);

        if (linkError) console.error("Erreur lors de la liaison:", linkError);
      }

      toast({
        title: "Synthèse générée",
        description: "La synthèse a été créée avec succès",
      });

      onSuccess?.();
    } catch (error: any) {
      console.error("Error generating synthese:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer la synthèse",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPrioriteColor = (priorite: string) => {
    switch (priorite) {
      case "immediate": return "destructive";
      case "court_terme": return "default";
      case "moyen_terme": return "secondary";
      default: return "outline";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "critique": return "destructive";
      case "haut": return "default";
      case "moyen": return "secondary";
      default: return "outline";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={remonteeIds.length === 0}>
          <Sparkles className="h-4 w-4 mr-2" />
          Générer Synthèse IA ({remonteeIds.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Générer une Synthèse Automatique</DialogTitle>
        </DialogHeader>

        {!synthese ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titre">Titre de la synthèse *</Label>
              <Input
                id="titre"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Ex: Synthèse des remontées - Janvier 2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="periode_debut">Période début *</Label>
                <Input
                  id="periode_debut"
                  type="date"
                  value={periodeDebut}
                  onChange={(e) => setPeriodeDebut(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periode_fin">Période fin *</Label>
                <Input
                  id="periode_fin"
                  type="date"
                  value={periodeFin}
                  onChange={(e) => setPeriodeFin(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{remonteeIds.length}</strong> remontée(s) sélectionnée(s) pour l'analyse
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleGenerate} disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Sparkles className="mr-2 h-4 w-4" />
                Générer avec IA
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {/* Synthèse narrative */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Synthèse Générale</h3>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {synthese.synthese_texte}
                  </p>
                </CardContent>
              </Card>

              {/* Points clés */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Points Clés</h3>
                  <div className="space-y-3">
                    {synthese.points_cles?.map((point: any, i: number) => (
                      <div key={i} className="border-l-4 border-primary pl-4 py-2">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{point.titre}</h4>
                          <Badge variant={getImportanceColor(point.niveau_importance)}>
                            {point.niveau_importance}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{point.description}</p>
                        {point.categories_concernees && point.categories_concernees.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {point.categories_concernees.map((cat: string, j: number) => (
                              <Badge key={j} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommandations */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3">Recommandations</h3>
                  <div className="space-y-3">
                    {synthese.recommandations?.map((reco: any, i: number) => (
                      <div key={i} className="bg-muted p-4 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium flex-1">{reco.titre}</h4>
                          <Badge variant={getPrioriteColor(reco.priorite)}>
                            {reco.priorite}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{reco.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">{reco.type_action}</Badge>
                          {reco.acteurs_impliques?.map((acteur: string, j: number) => (
                            <Badge key={j} variant="secondary" className="text-xs">
                              {acteur}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tendances */}
              {synthese.tendances && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3">Analyse des Tendances</h3>
                    
                    {synthese.tendances.themes_recurrents && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Thèmes récurrents</h4>
                        <div className="space-y-2">
                          {synthese.tendances.themes_recurrents.map((theme: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                              <span>{theme.theme}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {theme.frequence} occurrences
                                </span>
                                <Badge variant={
                                  theme.evolution === "hausse" ? "destructive" :
                                  theme.evolution === "baisse" ? "default" : "secondary"
                                }>
                                  {theme.evolution}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {synthese.tendances.sentiment_general && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Sentiment général</h4>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div className="text-center p-2 bg-green-100 dark:bg-green-900/20 rounded">
                            <div className="text-lg font-semibold">
                              {synthese.tendances.sentiment_general.positif_pct}%
                            </div>
                            <div className="text-xs">Positif</div>
                          </div>
                          <div className="text-center p-2 bg-gray-100 dark:bg-gray-800 rounded">
                            <div className="text-lg font-semibold">
                              {synthese.tendances.sentiment_general.neutre_pct}%
                            </div>
                            <div className="text-xs">Neutre</div>
                          </div>
                          <div className="text-center p-2 bg-red-100 dark:bg-red-900/20 rounded">
                            <div className="text-lg font-semibold">
                              {synthese.tendances.sentiment_general.negatif_pct}%
                            </div>
                            <div className="text-xs">Négatif</div>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {synthese.tendances.sentiment_general.interpretation}
                        </p>
                      </div>
                    )}

                    {synthese.tendances.zones_geographiques_prioritaires && 
                     synthese.tendances.zones_geographiques_prioritaires.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Zones géographiques prioritaires</h4>
                        <div className="flex gap-2 flex-wrap">
                          {synthese.tendances.zones_geographiques_prioritaires.map((zone: string, i: number) => (
                            <Badge key={i} variant="outline">📍 {zone}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    setSynthese(null);
                    setTitre("");
                    setPeriodeDebut("");
                    setPeriodeFin("");
                    setOpen(false);
                  }}
                >
                  Terminer
                </Button>
              </div>
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
