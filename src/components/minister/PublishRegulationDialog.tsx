import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const PublishRegulationDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    texte: "",
    typeDocument: "",
    dateEffet: "",
    destination: [] as string[],
  });

  const destinationOptions = [
    { value: "tous", label: "Tous" },
    { value: "direction_centrale", label: "Direction Centrale" },
    { value: "direction_provinciale", label: "Directions Provinciales" },
    { value: "pecheurs", label: "Pêcheurs" },
    { value: "cooperatives", label: "Coopératives" },
    { value: "armateurs", label: "Armateurs" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("reglementations")
        .insert({
          titre: formData.titre,
          texte: formData.texte,
          type_document: formData.typeDocument,
          date_effet: formData.dateEffet,
          destination: formData.destination,
        });

      if (error) throw error;

      // Log l'action
      await supabase.rpc("log_action_ministerielle", {
        _action_type: "PUBLICATION_REGLEMENTATION",
        _description: `Publication: ${formData.titre}`,
        _metadata: { type: formData.typeDocument, destination: formData.destination },
      });

      toast({
        title: "Réglementation publiée",
        description: "La réglementation a été publiée avec succès. Les notifications ont été envoyées.",
      });

      setOpen(false);
      setFormData({
        titre: "",
        texte: "",
        typeDocument: "",
        dateEffet: "",
        destination: [],
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de publier la réglementation.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDestinationToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      destination: prev.destination.includes(value)
        ? prev.destination.filter((d) => d !== value)
        : [...prev.destination, value],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-24 flex flex-col gap-2" variant="outline">
          <FileText className="h-6 w-6" />
          Publier une Réglementation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Publier une Réglementation</DialogTitle>
          <DialogDescription>
            Promulguer numériquement une nouvelle réglementation du secteur halieutique
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Décret n°X/2025 fixant les quotas de pêche"
              required
            />
          </div>

          <div>
            <Label htmlFor="typeDocument">Type de document *</Label>
            <Select
              value={formData.typeDocument}
              onValueChange={(value) => setFormData({ ...formData, typeDocument: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner le type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="decret">Décret</SelectItem>
                <SelectItem value="arrete">Arrêté</SelectItem>
                <SelectItem value="note">Note de service</SelectItem>
                <SelectItem value="circulaire">Circulaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dateEffet">Date d'entrée en vigueur *</Label>
            <Input
              id="dateEffet"
              type="date"
              value={formData.dateEffet}
              onChange={(e) => setFormData({ ...formData, dateEffet: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="texte">Texte de la réglementation *</Label>
            <Textarea
              id="texte"
              value={formData.texte}
              onChange={(e) => setFormData({ ...formData, texte: e.target.value })}
              placeholder="Contenu intégral ou résumé de la mesure..."
              rows={8}
              required
            />
          </div>

          <div>
            <Label>Destinataires *</Label>
            <div className="space-y-2 mt-2">
              {destinationOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={formData.destination.includes(option.value)}
                    onCheckedChange={() => handleDestinationToggle(option.value)}
                  />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || formData.destination.length === 0}>
              {loading ? "Publication..." : "Publier"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PublishRegulationDialog;
