import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const SendNotificationDialog = () => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titre: "",
    message: "",
    audience: [] as string[],
    priorite: "information",
    urlRessource: "",
  });

  const audienceOptions = [
    { value: "tous", label: "Tous" },
    { value: "direction_centrale", label: "Direction Centrale" },
    { value: "direction_provinciale", label: "Directions Provinciales" },
    { value: "agents", label: "Agents de contrôle" },
    { value: "pecheurs", label: "Pêcheurs artisans" },
    { value: "cooperatives", label: "Coopératives" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("notifications_nationales")
        .insert({
          titre: formData.titre,
          message: formData.message,
          audience: formData.audience,
          priorite: formData.priorite,
          url_ressource: formData.urlRessource || null,
        });

      if (error) throw error;

      // Log l'action
      await supabase.rpc("log_action_ministerielle", {
        _action_type: "ENVOI_NOTIFICATION",
        _description: `Notification: ${formData.titre}`,
        _metadata: { priorite: formData.priorite, audience: formData.audience },
      });

      toast({
        title: "Notification envoyée",
        description: "La notification a été envoyée à tous les destinataires concernés.",
      });

      setOpen(false);
      setFormData({
        titre: "",
        message: "",
        audience: [],
        priorite: "information",
        urlRessource: "",
      });
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la notification.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAudienceToggle = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      audience: prev.audience.includes(value)
        ? prev.audience.filter((a) => a !== value)
        : [...prev.audience, value],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-24 flex flex-col gap-2" variant="outline">
          <Bell className="h-6 w-6" />
          Envoyer une Notification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer une Notification Nationale</DialogTitle>
          <DialogDescription>
            Communiquer rapidement avec les acteurs du secteur
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="titre">Titre *</Label>
            <Input
              id="titre"
              value={formData.titre}
              onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
              placeholder="Ex: Alerte : marée rouge dans le Nord"
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Détails de l'information ou consignes..."
              rows={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="priorite">Priorité *</Label>
            <Select
              value={formData.priorite}
              onValueChange={(value) => setFormData({ ...formData, priorite: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner la priorité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="information">Information</SelectItem>
                <SelectItem value="alerte">Alerte</SelectItem>
                <SelectItem value="urgence">Urgence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Audience *</Label>
            <div className="space-y-2 mt-2">
              {audienceOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={formData.audience.includes(option.value)}
                    onCheckedChange={() => handleAudienceToggle(option.value)}
                  />
                  <Label htmlFor={option.value} className="font-normal cursor-pointer">
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="urlRessource">Lien vers une ressource (optionnel)</Label>
            <Input
              id="urlRessource"
              type="url"
              value={formData.urlRessource}
              onChange={(e) => setFormData({ ...formData, urlRessource: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading || formData.audience.length === 0}>
              {loading ? "Envoi..." : "Envoyer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendNotificationDialog;
