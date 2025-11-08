import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Gavel, Bell, MapPin } from "lucide-react";
import { MinisterialDocumentsPanel } from "@/components/minister/MinisterialDocumentsPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import PublishRegulationDialog from "@/components/minister/PublishRegulationDialog";
import SendNotificationDialog from "@/components/minister/SendNotificationDialog";
import LockZoneDialog from "@/components/minister/LockZoneDialog";

export default function ActionsMinisterielles() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Actions Ministérielles</h2>
        <p className="text-sm text-muted-foreground">
          Génération de documents, réglementations et pouvoirs exécutifs
        </p>
      </div>

      <Tabs defaultValue="documents" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          <TabsTrigger value="reglementations" className="gap-2">
            <Gavel className="h-4 w-4" />
            <span className="hidden sm:inline">Réglementations</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="zones" className="gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Zones</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <MinisterialDocumentsPanel />
        </TabsContent>

        <TabsContent value="reglementations" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Publication de Réglementations</CardTitle>
              <CardDescription>
                Publier des arrêtés, décrets et circulaires officiels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PublishRegulationDialog />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Envoi de Notifications</CardTitle>
              <CardDescription>
                Diffuser des communications officielles aux institutions et acteurs du secteur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SendNotificationDialog />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Gestion des Zones de Pêche</CardTitle>
              <CardDescription>
                Verrouiller ou déverrouiller des zones de pêche pour des raisons réglementaires
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LockZoneDialog />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
