import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, Bell, MapPin, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MinisterHistory = () => {
  const [loading, setLoading] = useState(true);
  const [reglementations, setReglementations] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Charger les réglementations
      const { data: regData } = await supabase
        .from("reglementations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Charger les notifications
      const { data: notifData } = await supabase
        .from("notifications_nationales")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Charger les zones restreintes
      const { data: zonesData } = await supabase
        .from("zones_restreintes")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      // Charger les logs d'audit
      const { data: auditData } = await supabase
        .from("audit_ministeriel")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setReglementations(regData || []);
      setNotifications(notifData || []);
      setZones(zonesData || []);
      setAuditLogs(auditData || []);
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Tabs defaultValue="reglementations" className="space-y-6">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="reglementations">Réglementations</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="zones">Zones Restreintes</TabsTrigger>
        <TabsTrigger value="audit">Journal d'Audit</TabsTrigger>
      </TabsList>

      <TabsContent value="reglementations">
        <Card>
          <CardHeader>
            <CardTitle>Historique des Réglementations</CardTitle>
            <CardDescription>
              Toutes les réglementations publiées via l'application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {reglementations.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune réglementation publiée
                </p>
              ) : (
                reglementations.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <FileText className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{reg.titre}</h4>
                          <p className="text-sm text-muted-foreground">
                            {reg.type_document} - Entrée en vigueur:{" "}
                            {new Date(reg.date_effet).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {new Date(reg.created_at).toLocaleDateString("fr-FR")}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2">{reg.texte}</p>
                      <div className="flex flex-wrap gap-1">
                        {reg.destination.map((dest: string) => (
                          <Badge key={dest} variant="outline" className="text-xs">
                            {dest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Historique des Notifications</CardTitle>
            <CardDescription>
              Toutes les notifications nationales envoyées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune notification envoyée
                </p>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <Bell className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{notif.titre}</h4>
                          <p className="text-sm text-muted-foreground">
                            Priorité: {notif.priorite}
                          </p>
                        </div>
                        <Badge
                          variant={
                            notif.priorite === "urgence"
                              ? "destructive"
                              : notif.priorite === "alerte"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {new Date(notif.created_at).toLocaleDateString("fr-FR")}
                        </Badge>
                      </div>
                      <p className="text-sm">{notif.message}</p>
                      <div className="flex flex-wrap gap-1">
                        {notif.audience.map((aud: string) => (
                          <Badge key={aud} variant="outline" className="text-xs">
                            {aud}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="zones">
        <Card>
          <CardHeader>
            <CardTitle>Zones Restreintes</CardTitle>
            <CardDescription>
              Historique des zones de pêche verrouillées
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {zones.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune zone verrouillée
                </p>
              ) : (
                zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="flex items-start gap-4 p-4 rounded-lg border bg-card"
                  >
                    <MapPin className="h-5 w-5 text-primary mt-1" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{zone.nom}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            Du {new Date(zone.date_debut).toLocaleDateString("fr-FR")}
                            {zone.date_fin &&
                              ` au ${new Date(zone.date_fin).toLocaleDateString("fr-FR")}`}
                          </p>
                        </div>
                        <Badge
                          variant={zone.actif ? "default" : "secondary"}
                        >
                          {zone.actif ? "Active" : "Terminée"}
                        </Badge>
                      </div>
                      <p className="text-sm">{zone.raison}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="audit">
        <Card>
          <CardHeader>
            <CardTitle>Journal d'Audit</CardTitle>
            <CardDescription>
              Traçabilité de toutes les actions ministérielles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {auditLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Aucune action enregistrée
                </p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{log.action_type}</Badge>
                      <span className="text-sm">{log.description}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("fr-FR")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default MinisterHistory;
