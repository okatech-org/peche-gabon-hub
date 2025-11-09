import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GenererRedistributionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GenererRedistributionsDialog({ open, onOpenChange, onSuccess }: GenererRedistributionsDialogProps) {
  const [montantTotal, setMontantTotal] = useState("");
  const [mois, setMois] = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  const handleGenerer = async () => {
    if (!montantTotal || parseFloat(montantTotal) <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generer-redistributions', {
        body: {
          montant_total: parseFloat(montantTotal),
          periode_mois: mois,
          periode_annee: annee
        }
      });

      if (error) throw error;

      toast.success(data.message || "Redistributions générées avec succès");
      console.log("✅ Redistributions créées:", data.redistributions);
      
      onOpenChange(false);
      onSuccess();
      
      // Reset form
      setMontantTotal("");
      setMois(new Date().getMonth() + 1);
      setAnnee(new Date().getFullYear());
    } catch (error) {
      console.error("❌ Erreur:", error);
      toast.error(error.message || "Erreur lors de la génération des redistributions");
    } finally {
      setLoading(false);
    }
  };

  const moisNoms = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Générer les Redistributions</DialogTitle>
          <DialogDescription>
            Entrez le montant total des recettes du Trésor Public pour la période sélectionnée.
            Les redistributions seront calculées automatiquement selon les pourcentages établis.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="montant">Montant Total (FCFA)</Label>
            <Input
              id="montant"
              type="number"
              placeholder="Ex: 28500000"
              value={montantTotal}
              onChange={(e) => setMontantTotal(e.target.value)}
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="mois">Mois</Label>
              <Select
                value={mois.toString()}
                onValueChange={(value) => setMois(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger id="mois">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {moisNoms.map((nom, index) => (
                    <SelectItem key={index + 1} value={(index + 1).toString()}>
                      {nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="annee">Année</Label>
              <Select
                value={annee.toString()}
                onValueChange={(value) => setAnnee(parseInt(value))}
                disabled={loading}
              >
                <SelectTrigger id="annee">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4 text-sm">
            <p className="font-medium mb-2">Répartition selon les pourcentages établis :</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• État Central: 40%</li>
              <li>• Province Maritime: 25%</li>
              <li>• Commune Locale: 15%</li>
              <li>• Coopératives de Pêcheurs: 10%</li>
              <li>• Fonds de Développement Durable: 10%</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleGenerer} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Générer les Redistributions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
