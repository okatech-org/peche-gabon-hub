import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2, MapPin } from "lucide-react";
import { RemonteeLocationPicker } from "@/components/map/RemonteeLocationPicker";

const TYPE_REMONTEE_OPTIONS = [
  { value: "reclamation", label: "Réclamation" },
  { value: "suggestion", label: "Suggestion" },
  { value: "denonciation", label: "Dénonciation" },
  { value: "article_presse", label: "Article de presse" },
  { value: "commentaire_reseau", label: "Commentaire réseau social" },
  { value: "avis_reseau_social", label: "Avis réseau social" },
];

const PRIORITE_OPTIONS = [
  { value: "bas", label: "Basse" },
  { value: "moyen", label: "Moyenne" },
  { value: "haut", label: "Haute" },
  { value: "critique", label: "Critique" },
];

const SENTIMENT_OPTIONS = [
  { value: "positif", label: "Positif" },
  { value: "neutre", label: "Neutre" },
  { value: "negatif", label: "Négatif" },
];

interface SubmitRemonteeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubmitRemonteeDialog({ 
  open: controlledOpen, 
  onOpenChange: controlledOnOpenChange,
  onSuccess 
}: SubmitRemonteeDialogProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { toast } = useToast();
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [formData, setFormData] = useState({
    type_remontee: "",
    titre: "",
    description: "",
    source: "",
    url_source: "",
    localisation: "",
    niveau_priorite: "moyen",
    sentiment: "neutre",
    categorie: "",
    mots_cles: "",
    date_incident: "",
    impact_estime: "",
    nb_personnes_concernees: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour soumettre une remontée",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("remontees_terrain").insert({
        ...formData,
        mots_cles: formData.mots_cles ? formData.mots_cles.split(",").map(k => k.trim()) : [],
        nb_personnes_concernees: formData.nb_personnes_concernees ? parseInt(formData.nb_personnes_concernees) : null,
        date_incident: formData.date_incident || null,
        latitude: formData.latitude || null,
        longitude: formData.longitude || null,
        soumis_par: userData.user.id,
      });

      if (error) throw error;

      toast({
        title: "Remontée soumise",
        description: "Votre remontée a été enregistrée et sera validée prochainement",
      });

      if (onSuccess) {
        onSuccess();
      }
      
      setOpen(false);
      setFormData({
        type_remontee: "",
        titre: "",
        description: "",
        source: "",
        url_source: "",
        localisation: "",
        niveau_priorite: "moyen",
        sentiment: "neutre",
        categorie: "",
        mots_cles: "",
        date_incident: "",
        impact_estime: "",
        nb_personnes_concernees: "",
        latitude: undefined,
        longitude: undefined,
      });
    } catch (error: any) {
      console.error("Error submitting remontee:", error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle Remontée
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Soumettre une Remontée Terrain</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type_remontee">Type de remontée *</Label>
              <Select
                value={formData.type_remontee}
                onValueChange={(value) => setFormData({ ...formData, type_remontee: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {TYPE_REMONTEE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="niveau_priorite">Priorité</Label>
              <Select
                value={formData.niveau_priorite}
                onValueChange={(value) => setFormData({ ...formData, niveau_priorite: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                placeholder="Ex: Journal Le Monde, Facebook, Twitter..."
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_source">Lien source</Label>
              <Input
                id="url_source"
                type="url"
                placeholder="https://..."
                value={formData.url_source}
                onChange={(e) => setFormData({ ...formData, url_source: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="localisation">Localisation</Label>
              <div className="flex gap-2">
                <Input
                  id="localisation"
                  placeholder="Lieu concerné"
                  value={formData.localisation}
                  onChange={(e) => setFormData({ ...formData, localisation: e.target.value })}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant={formData.latitude && formData.longitude ? "default" : "outline"}
                  size="icon"
                  onClick={() => setShowLocationPicker(true)}
                  title="Sélectionner sur la carte"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              {formData.latitude && formData.longitude && (
                <p className="text-xs text-muted-foreground">
                  📍 {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select
                value={formData.sentiment}
                onValueChange={(value) => setFormData({ ...formData, sentiment: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENTIMENT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="categorie">Catégorie</Label>
              <Input
                id="categorie"
                placeholder="Ex: Surpêche, Pollution..."
                value={formData.categorie}
                onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date_incident">Date de l'incident</Label>
              <Input
                id="date_incident"
                type="date"
                value={formData.date_incident}
                onChange={(e) => setFormData({ ...formData, date_incident: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mots_cles">Mots-clés (séparés par des virgules)</Label>
              <Input
                id="mots_cles"
                placeholder="pêche, illégale, pollution..."
                value={formData.mots_cles}
                onChange={(e) => setFormData({ ...formData, mots_cles: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb_personnes_concernees">Nb personnes concernées</Label>
              <Input
                id="nb_personnes_concernees"
                type="number"
                value={formData.nb_personnes_concernees}
                onChange={(e) => setFormData({ ...formData, nb_personnes_concernees: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact_estime">Impact estimé</Label>
            <Textarea
              id="impact_estime"
              placeholder="Décrivez l'impact estimé de cette situation..."
              value={formData.impact_estime}
              onChange={(e) => setFormData({ ...formData, impact_estime: e.target.value })}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Soumettre
            </Button>
          </div>
        </form>
      </DialogContent>
      {showLocationPicker && (
        <RemonteeLocationPicker
          latitude={formData.latitude}
          longitude={formData.longitude}
          onLocationSelect={(lat, lng) => {
            setFormData({ ...formData, latitude: lat, longitude: lng });
            setShowLocationPicker(false);
          }}
          onClose={() => setShowLocationPicker(false)}
        />
      )}
    </Dialog>
  );
}
