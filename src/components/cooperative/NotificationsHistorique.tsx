import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Bell, Mail, MessageSquare, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
  id: string;
  type_notification: string;
  destinataire_nom: string;
  destinataire_email: string;
  type_taxe: string;
  montant: number;
  date_echeance: string;
  jours_restants: number;
  statut: string;
  created_at: string;
}

export const NotificationsHistorique = () => {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Utilisateur non connecté");
        return;
      }

      const { data, error } = await supabase
        .from('notifications_paiements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setLoading(false);
    }
  };

  const checkDeadlines = async () => {
    try {
      setChecking(true);
      toast.info("Vérification des échéances en cours...");

      const { data, error } = await supabase.functions.invoke('check-payment-deadlines');

      if (error) throw error;

      toast.success(`✅ Vérification terminée: ${data.processed} notification(s) traitée(s)`);
      
      // Recharger la liste
      await loadNotifications();
    } catch (error) {
      console.error('Erreur:', error);
      toast.error("Erreur lors de la vérification des échéances");
    } finally {
      setChecking(false);
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === 'email') return <Mail className="h-4 w-4" />;
    if (type === 'sms') return <MessageSquare className="h-4 w-4" />;
    return <Bell className="h-4 w-4" />;
  };

  const getStatutBadge = (statut: string) => {
    if (statut === 'envoye') {
      return <Badge variant="default">Envoyé</Badge>;
    }
    if (statut === 'simule') {
      return <Badge variant="secondary">Simulé (Démo)</Badge>;
    }
    return <Badge variant="destructive">Erreur</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Historique des Notifications
            </CardTitle>
            <CardDescription>
              Alertes d'échéances de paiement envoyées aux membres (J-5)
            </CardDescription>
          </div>
          <Button
            onClick={checkDeadlines}
            disabled={checking}
            variant="outline"
          >
            {checking ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Vérifier maintenant
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune notification envoyée pour le moment</p>
            <p className="text-sm mt-2">
              Cliquez sur "Vérifier maintenant" pour lancer une vérification
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Destinataire</TableHead>
                <TableHead>Taxe</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead>Envoyée le</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notif) => (
                <TableRow key={notif.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notif.type_notification)}
                      <span className="capitalize">{notif.type_notification}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{notif.destinataire_nom}</div>
                      <div className="text-sm text-muted-foreground">
                        {notif.destinataire_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{notif.type_taxe}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {notif.montant.toLocaleString()} FCFA
                  </TableCell>
                  <TableCell>
                    <div>
                      {format(new Date(notif.date_echeance), "dd/MM/yyyy", { locale: fr })}
                      <div className="text-xs text-muted-foreground">
                        J-{notif.jours_restants}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(notif.created_at), "dd/MM/yyyy HH:mm", { locale: fr })}
                  </TableCell>
                  <TableCell>{getStatutBadge(notif.statut)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
