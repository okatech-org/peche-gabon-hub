import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

interface RapportMetadataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (metadata: RapportMetadata) => void;
}

export interface RapportMetadata {
  categorie_id: string | null;
  tags: string[];
  region: string;
  titre: string;
}

interface Categorie {
  id: string;
  nom: string;
  couleur: string;
  icone: string;
  description: string;
}

const RapportMetadataDialog = ({ open, onOpenChange, onConfirm }: RapportMetadataDialogProps) => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [selectedCategorie, setSelectedCategorie] = useState<string>("");
  const [titre, setTitre] = useState("");
  const [region, setRegion] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (open) {
      loadCategories();
      // Initialiser avec la date par défaut
      setTitre(`Rapport Zone - ${new Date().toLocaleDateString('fr-FR')}`);
    }
  }, [open]);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories_rapports")
        .select("*")
        .order("nom");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast.error("Erreur lors du chargement des catégories");
    }
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleConfirm = () => {
    if (!titre.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    if (!region.trim()) {
      toast.error("La région est requise");
      return;
    }

    onConfirm({
      categorie_id: selectedCategorie || null,
      tags,
      region: region.trim(),
      titre: titre.trim(),
    });

    // Reset form
    setSelectedCategorie("");
    setTitre(`Rapport Zone - ${new Date().toLocaleDateString('fr-FR')}`);
    setRegion("");
    setTags([]);
    setNewTag("");
  };

  const handleCancel = () => {
    // Reset form
    setSelectedCategorie("");
    setTitre(`Rapport Zone - ${new Date().toLocaleDateString('fr-FR')}`);
    setRegion("");
    setTags([]);
    setNewTag("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Informations du Rapport</DialogTitle>
          <DialogDescription>
            Ajoutez des métadonnées pour mieux organiser votre rapport
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Titre */}
          <div className="space-y-2">
            <Label htmlFor="titre">Titre du rapport *</Label>
            <Input
              id="titre"
              placeholder="Rapport Zone - Date"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </div>

          {/* Région */}
          <div className="space-y-2">
            <Label htmlFor="region">Région / Province *</Label>
            <Input
              id="region"
              placeholder="Ex: Estuaire, Ogooué-Maritime..."
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>

          {/* Catégorie */}
          <div className="space-y-2">
            <Label>Catégorie (optionnel)</Label>
            <Select value={selectedCategorie} onValueChange={setSelectedCategorie}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucune catégorie</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      <span>{cat.icone}</span>
                      <span>{cat.nom}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategorie && categories.find((c) => c.id === selectedCategorie) && (
              <p className="text-xs text-muted-foreground">
                {categories.find((c) => c.id === selectedCategorie)?.description}
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (optionnel)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ajouter un tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" onClick={addTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    #{tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Exemples: production, audit, mensuel, 2025, risque...
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Annuler
          </Button>
          <Button onClick={handleConfirm}>
            Générer le Rapport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RapportMetadataDialog;
