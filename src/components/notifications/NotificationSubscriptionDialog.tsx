import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Phone } from "lucide-react";

interface NotificationSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const documentTypes = [
  { value: "arrete", label: "Arrêtés ministériels" },
  { value: "circulaire", label: "Circulaires" },
  { value: "decision", label: "Décisions" },
  { value: "rapport", label: "Rapports" },
  { value: "communique", label: "Communiqués" },
];

export function NotificationSubscriptionDialog({ open, onOpenChange }: NotificationSubscriptionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [channels, setChannels] = useState<string[]>(["email"]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || interests.length === 0 || channels.length === 0) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("notification_subscriptions")
        .insert({
          email,
          phone: channels.includes("sms") ? phone : null,
          whatsapp_number: channels.includes("whatsapp") ? whatsapp : null,
          interests: interests.map(type => ({ type })),
          notification_channels: channels,
          active: true,
        });

      if (error) throw error;

      toast.success("Abonnement créé avec succès! Vous recevrez des notifications pour les nouveaux documents.");
      onOpenChange(false);
      
      // Reset form
      setEmail("");
      setPhone("");
      setWhatsapp("");
      setInterests([]);
      setChannels(["email"]);
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error("Erreur lors de la création de l'abonnement");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            S'abonner aux notifications
          </DialogTitle>
          <DialogDescription>
            Recevez des alertes automatiques par email, SMS ou WhatsApp pour les nouveaux documents publiés qui correspondent à vos centres d'intérêt.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Téléphone (pour SMS)</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+241 XX XX XX XX"
                disabled={!channels.includes("sms")}
              />
            </div>

            <div>
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+241 XX XX XX XX"
                disabled={!channels.includes("whatsapp")}
              />
            </div>
          </div>

          {/* Notification Channels */}
          <div className="space-y-3">
            <Label>
              Canaux de notification <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-email"
                  checked={channels.includes("email")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setChannels([...channels, "email"]);
                    } else {
                      setChannels(channels.filter(c => c !== "email"));
                    }
                  }}
                />
                <Label htmlFor="channel-email" className="flex items-center gap-2 cursor-pointer">
                  <Mail className="h-4 w-4" />
                  Email (démo)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-sms"
                  checked={channels.includes("sms")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setChannels([...channels, "sms"]);
                    } else {
                      setChannels(channels.filter(c => c !== "sms"));
                    }
                  }}
                />
                <Label htmlFor="channel-sms" className="flex items-center gap-2 cursor-pointer">
                  <Phone className="h-4 w-4" />
                  SMS (démo - simulation uniquement)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="channel-whatsapp"
                  checked={channels.includes("whatsapp")}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setChannels([...channels, "whatsapp"]);
                    } else {
                      setChannels(channels.filter(c => c !== "whatsapp"));
                    }
                  }}
                />
                <Label htmlFor="channel-whatsapp" className="flex items-center gap-2 cursor-pointer">
                  <MessageSquare className="h-4 w-4" />
                  WhatsApp (démo - simulation uniquement)
                </Label>
              </div>
            </div>
          </div>

          {/* Document Types */}
          <div className="space-y-3">
            <Label>
              Types de documents <span className="text-destructive">*</span>
            </Label>
            <div className="space-y-2">
              {documentTypes.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={interests.includes(type.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setInterests([...interests, type.value]);
                      } else {
                        setInterests(interests.filter(t => t !== type.value));
                      }
                    }}
                  />
                  <Label htmlFor={`type-${type.value}`} className="cursor-pointer">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Inscription..." : "S'abonner"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}