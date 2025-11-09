import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare } from "lucide-react";
import { toast } from "sonner";

interface DemoFeedbackDialogProps {
  roleDemo: string;
  roleName: string;
}

export const DemoFeedbackDialog = ({ roleDemo, roleName }: DemoFeedbackDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type_feedback: "",
    titre: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("demo_feedbacks").insert({
        user_id: user.id,
        role_demo: roleDemo,
        type_feedback: formData.type_feedback,
        titre: formData.titre,
        description: formData.description,
      });

      if (error) throw error;

      toast.success("Votre remontée a été envoyée à l'administrateur");
      setOpen(false);
      setFormData({ type_feedback: "", titre: "", description: "" });
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast.error("Erreur lors de l'envoi de la remontée");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          Faire une remontée
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Remontée d'information</DialogTitle>
            <DialogDescription>
              Partagez vos connaissances sur le métier de <strong>{roleName}</strong> pour enrichir le cahier des charges
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type_feedback">Type de remontée</Label>
              <Select
                value={formData.type_feedback}
                onValueChange={(value) =>
                  setFormData({ ...formData, type_feedback: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="role">Précision sur le rôle</SelectItem>
                  <SelectItem value="mission">Mission spécifique</SelectItem>
                  <SelectItem value="besoin">Besoin métier</SelectItem>
                  <SelectItem value="amelioration">Amélioration suggérée</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="titre">Titre</Label>
              <Input
                id="titre"
                value={formData.titre}
                onChange={(e) =>
                  setFormData({ ...formData, titre: e.target.value })
                }
                placeholder="Résumé de votre remontée"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description détaillée</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Détaillez votre remontée d'information..."
                className="min-h-[120px]"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
